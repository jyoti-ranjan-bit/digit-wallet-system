const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

const SALT_ROUNDS = 10;

// POST /register
router.post('/register', async (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await db.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
      [username, hashedPassword]
    );
    res.status(201).json({ message: 'User registered successfully', userId: result.rows[0].id });
  } catch (err) {
    if (err.code === '23505') { // unique_violation
      res.status(400).json({ error: 'Username already exists' });
    } else {
      next(err);
    }
  }
});

module.exports = router;
