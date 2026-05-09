const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer for temp storage
const upload = multer({ 
  dest: 'temp_uploads/',
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.db')) {
      cb(null, true);
    } else {
      cb(new Error('Only .db files are allowed'), false);
    }
  }
});

// GET all store settings
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.storeSetting.findMany({
      orderBy: { key: 'asc' }
    });
    // Convert array to a key-value object form for easy frontend consumption
    const configMap = {};
    settings.forEach(s => {
      configMap[s.key] = s.value;
    });
    res.json(configMap);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// POST update settings in bulk
router.post('/', async (req, res) => {
  try {
    const settings = req.body; // e.g. { STORE_NAME: "Paint Center Subic", TAX_RATE: "12" }
    
    // Upsert each setting
    for (const [key, value] of Object.entries(settings)) {
      await prisma.storeSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    }
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// GET download database backup
router.get('/backup', (req, res) => {
  try {
    const dbPath = path.join(__dirname, '../prisma/dev.db');
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Database file not found' });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `paint-center-backup-${timestamp}.db`;
    
    res.download(dbPath, filename);
  } catch (error) {
    res.status(500).json({ error: 'Backup failed' });
  }
});

// POST restore database
router.post('/restore', upload.single('backup'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No backup file provided' });
    }

    const tempPath = req.file.path;
    const dbPath = path.join(__dirname, '../prisma/dev.db');

    // Overwrite the dev.db with the uploaded file
    fs.copyFileSync(tempPath, dbPath);
    
    // Clean up temp file
    fs.unlinkSync(tempPath);

    res.json({ message: 'Database restored successfully! Please refresh your application.' });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: 'Failed to restore database.' });
  }
});

module.exports = router;
