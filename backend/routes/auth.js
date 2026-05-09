const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Return user info (excluding password)
    const { password: _, ...userInfo } = user;
    res.json({ 
      user: userInfo,
      token: 'mock-jwt-token-' + Date.now() // SIMULATED JWT token for this prototype
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
