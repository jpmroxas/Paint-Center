const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all products
router.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET a single product
router.get('/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST add a new product
router.post('/products', async (req, res) => {
  try {
    const { name, category, brand, base_type, unit, cost_price, selling_price, stock_quantity, reorder_level, barcode } = req.body;
    
    const newProduct = await prisma.product.create({
      data: {
        name,
        category,
        brand,
        base_type,
        unit,
        cost_price,
        selling_price,
        stock_quantity,
        reorder_level,
        barcode
      }
    });
    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT adjust stock manually
router.put('/products/:id/adjust', async (req, res) => {
  try {
    const { stock_quantity } = req.body;
    
    if (stock_quantity === undefined) {
      return res.status(400).json({ error: 'Stock quantity is required' });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: req.params.id },
      data: { stock_quantity }
    });
    
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// PUT update product details
router.put('/products/:id', async (req, res) => {
  try {
    const { name, category, brand, base_type, unit, cost_price, selling_price, stock_quantity, reorder_level, barcode } = req.body;
    
    const updatedProduct = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name,
        category,
        brand,
        base_type,
        unit,
        cost_price,
        selling_price,
        stock_quantity,
        reorder_level,
        barcode
      }
    });
    
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product details' });
  }
});

// DELETE a product
router.delete('/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
