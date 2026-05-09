const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST a new sale transaction
router.post('/checkout', async (req, res) => {
  try {
    const { customer_id, items, payment_method, discount = 0 } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Process transaction in a Prisma transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Calculate totals
      let total_amount = 0;
      for (const item of items) {
        total_amount += item.price * item.qty;
      }
      const net_amount = total_amount - discount;

      // 2. Create the main transaction record
      // Generating a simple receipt number (in production, use a more robust sequenced generator)
      const receipt_number = 'REC-' + Date.now().toString().slice(-6);

      const transaction = await tx.transaction.create({
        data: {
          receipt_number,
          customer_id: customer_id || null,
          total_amount,
          discount,
          net_amount,
          payment_method,
          status: 'COMPLETED'
        }
      });

      // 3. Create items and update inventory
      for (const item of items) {
        // Create line item
        await tx.transactionItem.create({
          data: {
            transaction_id: transaction.id,
            product_id: item.product_id,
            quantity: item.qty,
            unit_price: item.price,
            subtotal: item.price * item.qty
          }
        });

        // Deduct from inventory
        await tx.product.update({
          where: { id: item.product_id },
          data: { stock_quantity: { decrement: item.qty } }
        });
      }

      // 4. (Optional) If Credit, create an Invoice for Accounts Receivable
      if (payment_method === 'CREDIT' && customer_id) {
        await tx.invoice.create({
          data: {
            transaction_id: transaction.id,
            customer_id: customer_id,
            amount_due: net_amount,
            remaining_balance: net_amount,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default terms
          }
        });
        
        // Update customer outstanding balance
        await tx.customer.update({
          where: { id: customer_id },
          data: { outstanding_balance: { increment: net_amount } }
        });
      }

      // 5. Fetch full transaction with items for receipt
      return await tx.transaction.findUnique({
        where: { id: transaction.id },
        include: {
          customer: true,
          items: { include: { product: true } }
        }
      });
    });

    res.status(201).json({ message: 'Checkout successful', transaction: result });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Transaction failed' });
  }
});

// GET all sales transactions
router.get('/', async (req, res) => {
  try {
    const sales = await prisma.transaction.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

module.exports = router;
