const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { expense_date: 'desc' }
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST new expense
router.post('/', async (req, res) => {
  try {
    const { description, category, amount, expense_date } = req.body;
    const expense = await prisma.expense.create({
      data: {
        description,
        category,
        amount: parseFloat(amount),
        expense_date: expense_date ? new Date(expense_date) : new Date()
      }
    });
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// DELETE expense
router.delete('/:id', async (req, res) => {
  try {
    await prisma.expense.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

module.exports = router;
