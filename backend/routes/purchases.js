const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all purchase orders
router.get('/', async (req, res) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        items: true
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(pos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// POST create PO
router.post('/', async (req, res) => {
  try {
    const { supplier_id, items } = req.body;
    const po_number = 'PO-' + Date.now().toString().slice(-6);

    let total_cost = 0;
    const po_items = items.map(item => {
      total_cost += item.qty * item.cost;
      return {
        product_id: item.product_id,
        ordered_qty: item.qty,
        cost: item.cost
      };
    });

    const po = await prisma.purchaseOrder.create({
      data: {
        supplier_id,
        po_number,
        total_cost,
        items: {
          create: po_items
        }
      },
      include: { items: true }
    });
    res.status(201).json(po);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// POST receive PO items (restocks inventory)
router.post('/:id/receive', async (req, res) => {
  try {
    const poId = req.params.id;
    
    const result = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true }
      });
      if (!po || po.status === 'RECEIVED') throw new Error("PO not found or already received");

      // Update PO Status
      const updatedPO = await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: 'RECEIVED' }
      });

      // Update Inventory
      for (const item of po.items) {
        await tx.poItem.update({
          where: { id: item.id },
          data: { received_qty: item.ordered_qty }
        });

        await tx.product.update({
          where: { id: item.product_id },
          data: { stock_quantity: { increment: item.ordered_qty } }
        });
      }
      return updatedPO;
    });

    res.json({ message: 'PO Received and inventory updated', result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
