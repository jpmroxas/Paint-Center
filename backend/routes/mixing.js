const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all color formulas
router.get('/formulas', async (req, res) => {
  try {
    const formulas = await prisma.colorFormula.findMany({
      include: {
        tints: { include: { tintProduct: true } },
        baseProduct: true
      }
    });
    res.json(formulas);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch color formulas' });
  }
});

// POST a new color formula — deducts base paint and tint stock
router.post('/formulas', async (req, res) => {
  try {
    const { customer_id, color_name, color_code, brand, base_product_id, total_amount, unit, tints } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // Create the formula
      const newFormula = await tx.colorFormula.create({
        data: {
          customer_id,
          color_name,
          color_code,
          brand,
          base_product_id,
          total_amount: Number(total_amount),
          total_volume_ml: unit === 'ML' ? Number(total_amount) : 0, // Legacy support
          unit: unit || 'ML',
          tints: { 
            create: tints.map(t => ({
              tint_product_id: t.tint_product_id,
              amount: Number(t.amount),
              volume_ml: t.unit === 'ML' ? Number(t.amount) : 0, // Legacy
              unit: t.unit || 'ML'
            }))
          }
        },
        include: { tints: true }
      });

      // Deduct base product stock
      if (total_amount > 0 && base_product_id) {
        const baseProduct = await tx.product.findUnique({ where: { id: base_product_id } });
        if (baseProduct) {
          let deduction = Number(total_amount);
          
          // Conversion logic if needed
          if (baseProduct.unit === 'GALLON' && unit === 'ML') {
            deduction = Number(total_amount) / 3785;
          } else if (baseProduct.unit === 'KG' && unit === 'G') {
            deduction = Number(total_amount) / 1000;
          }
          
          await tx.product.update({
            where: { id: base_product_id },
            data: { stock_quantity: { decrement: deduction } }
          });
        }
      }

      // Deduct each tint stock
      for (const tint of tints) {
        if (tint.tint_product_id && tint.amount > 0) {
          const tintProduct = await tx.product.findUnique({ where: { id: tint.tint_product_id } });
          if (tintProduct) {
            let tintDeduction = Number(tint.amount);
            
            // Handle Grams to KG conversion for tints if necessary
            if (tintProduct.unit === 'KG' && tint.unit === 'G') {
              tintDeduction = Number(tint.amount) / 1000;
            }

            await tx.product.update({
              where: { id: tint.tint_product_id },
              data: { stock_quantity: { decrement: tintDeduction } }
            });
          }
        }
      }

      return newFormula;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create color formula' });
  }
});

// POST create a tinting job
router.post('/jobs', async (req, res) => {
  try {
    const { transaction_id, formula_id, quantity_produced } = req.body;
    const newJob = await prisma.tintingJob.create({
      data: { transaction_id, formula_id, quantity_produced }
    });
    res.status(201).json(newJob);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create tinting job' });
  }
});

// DELETE a formula log
router.delete('/formulas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First delete associated tints due to foreign key constraints
    await prisma.formulaTint.deleteMany({
      where: { formula_id: id }
    });

    await prisma.colorFormula.delete({
      where: { id: id }
    });

    res.json({ message: 'Log deleted successfully' });
  } catch (error) {
    console.error('Delete formula error:', error);
    res.status(500).json({ error: 'Failed to delete formula log' });
  }
});

module.exports = router;
