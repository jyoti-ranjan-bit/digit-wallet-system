const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticate = require('../middleware/auth');

// POST /product - Add a product (requires authentication)
router.post('/product', authenticate, async (req, res, next) => {
  const { name, price, description } = req.body;
  if (!name || !price || price <= 0) {
    return res.status(400).json({ error: 'Name and positive price are required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO products (name, price, description) VALUES ($1, $2, $3) RETURNING id',
      [name, price, description || '']
    );
    res.status(201).json({ id: result.rows[0].id, message: 'Product added' });
  } catch (err) {
    next(err);
  }
});

// GET /product - List all products (no authentication required)
router.get('/product', async (req, res, next) => {
  try {
    const result = await db.query('SELECT id, name, price, description FROM products ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
