const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all dashboard report analytics
router.get('/dashboard', async (req, res) => {
  try {
    // 1. Total Accounts Receivable
    const activeInvoices = await prisma.invoice.findMany({
      where: { status: { not: 'PAID' } }
    });
    const totalAR = activeInvoices.reduce((sum, process) => sum + process.remaining_balance, 0);

    // 2. Low Stock Alerts
    const allProducts = await prisma.product.findMany();
    const lowStockItems = allProducts.filter(p => p.stock_quantity <= p.reorder_level);

    // 3. Sales Aggregation (Simplistic all-time aggregation for Demo MVP)
    const transactions = await prisma.transaction.findMany({
      where: { status: 'COMPLETED' },
      include: { items: true }
    });
    
    const totalSalesRevenue = transactions.reduce((sum, tx) => sum + tx.total_amount, 0);

    // 4. Top Selling Products
    const salesMap = {};
    transactions.forEach(tx => {
      tx.items.forEach(item => {
        if (!salesMap[item.product_id]) {
          salesMap[item.product_id] = { qty: 0, revenue: 0 };
        }
        salesMap[item.product_id].qty += item.quantity;
        salesMap[item.product_id].revenue += item.subtotal;
      });
    });

    const topProductsIds = Object.keys(salesMap)
      .sort((a, b) => salesMap[b].qty - salesMap[a].qty)
      .slice(0, 5);

    const topProducts = allProducts
      .filter(p => topProductsIds.includes(p.id))
      .map(p => ({
        name: p.name,
        qty_sold: salesMap[p.id].qty,
        revenue: salesMap[p.id].revenue
      }))
      .sort((a, b) => b.qty_sold - a.qty_sold);

    res.json({
      metrics: {
        totalAR,
        lowStockCount: lowStockItems.length,
        totalTransactions: transactions.length,
        totalSalesRevenue
      },
      lowStockItems: lowStockItems.map(p => ({ name: p.name, stock: p.stock_quantity, reorder_level: p.reorder_level })),
      topProducts
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
});

module.exports = router;
