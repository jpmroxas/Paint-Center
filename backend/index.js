const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Paint Center API is running.' });
});

// Use routes
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/mixing', require('./routes/mixing'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/users', require('./routes/users'));

// SPA Routing: Handle direct URL access and refreshes (History API Fallback)
app.use((req, res, next) => {
  // If it's an API call or has a file extension (like .css, .js, .png), let it pass to other handlers
  if (req.url.startsWith('/api') || path.extname(req.url)) {
    return next();
  }
  // Otherwise, serve the React app's index.html
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/dist')));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
