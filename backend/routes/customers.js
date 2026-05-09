const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all customers (Contractors and Retail)
router.get('/', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// POST add a new customer
router.post('/', async (req, res) => {
  try {
    const { name, contact_details, address, customer_type, credit_limit } = req.body;
    const customer = await prisma.customer.create({
      data: {
        name,
        contact_details,
        address,
        customer_type,
        credit_limit: credit_limit || 0
      }
    });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add customer' });
  }
});

// GET customer invoice history (Accounts Receivable)
router.get('/:id/invoices', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { customer_id: req.params.id },
      include: {
        payments: true,
        transaction: true
      },
      orderBy: { due_date: 'asc' }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// POST a payment towards an invoice
router.post('/invoices/:invoiceId/pay', async (req, res) => {
  try {
    const { amount_paid, payment_method } = req.body;
    const invoiceId = req.params.invoiceId;

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) throw new Error("Invoice not found");
      if (invoice.remaining_balance < amount_paid) throw new Error("Overpayment");

      // Record payment
      const payment = await tx.payment.create({
        data: {
          invoice_id: invoiceId,
          amount_paid,
          payment_method
        }
      });

      // Update invoice remaining balance and status
      const newBalance = invoice.remaining_balance - amount_paid;
      const status = newBalance <= 0 ? "PAID" : "PARTIAL";
      
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          remaining_balance: newBalance,
          status
        }
      });

      // Update overall customer outstanding balance
      await tx.customer.update({
        where: { id: invoice.customer_id },
        data: {
          outstanding_balance: { decrement: amount_paid }
        }
      });

      return updatedInvoice;
    });

    res.json({ message: 'Payment recorded', result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
