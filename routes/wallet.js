const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticate = require('../middleware/auth');
const axios = require('axios');

// POST /fund - Deposit money into wallet
router.post('/fund', authenticate, async (req, res, next) => {
  const { amt } = req.body;
  if (!amt || amt <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  try {
    const client = await db.query('BEGIN');
    // Update user balance
    const updateRes = await db.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance',
      [amt, req.user.id]
    );
    const newBalance = updateRes.rows[0].balance;

    // Insert transaction record
    await db.query(
      'INSERT INTO transactions (user_id, kind, amt, updated_bal) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'credit', amt, newBalance]
    );

    await db.query('COMMIT');
    res.json({ balance: parseFloat(newBalance) });
  } catch (err) {
    await db.query('ROLLBACK');
    next(err);
  }
});

// POST /pay - Transfer money to another user
router.post('/pay', authenticate, async (req, res, next) => {
  const { to, amt } = req.body;
  if (!to || !amt || amt <= 0) {
    return res.status(400).json({ error: 'Recipient and positive amount are required' });
  }
  if (to === req.user.username) {
    return res.status(400).json({ error: 'Cannot pay yourself' });
  }

  try {
    await db.query('BEGIN');

    // Check sender balance
    const senderRes = await db.query('SELECT balance FROM users WHERE id = $1', [req.user.id]);
    const senderBalance = parseFloat(senderRes.rows[0].balance);
    if (senderBalance < amt) {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Check recipient exists
    const recipientRes = await db.query('SELECT id, balance FROM users WHERE username = $1', [to]);
    if (recipientRes.rowCount === 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'Recipient does not exist' });
    }
    const recipient = recipientRes.rows[0];

    // Deduct from sender
    const newSenderBalanceRes = await db.query(
      'UPDATE users SET balance = balance - $1 WHERE id = $2 RETURNING balance',
      [amt, req.user.id]
    );
    const newSenderBalance = newSenderBalanceRes.rows[0].balance;

    // Add to recipient
    const newRecipientBalanceRes = await db.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance',
      [amt, recipient.id]
    );
    const newRecipientBalance = newRecipientBalanceRes.rows[0].balance;

    // Insert transactions
    await db.query(
      'INSERT INTO transactions (user_id, kind, amt, updated_bal) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'debit', amt, newSenderBalance]
    );
    await db.query(
      'INSERT INTO transactions (user_id, kind, amt, updated_bal) VALUES ($1, $2, $3, $4)',
      [recipient.id, 'credit', amt, newRecipientBalance]
    );

    await db.query('COMMIT');
    res.json({ balance: parseFloat(newSenderBalance) });
  } catch (err) {
    await db.query('ROLLBACK');
    next(err);
  }
});

// GET /bal - Check balance with optional currency conversion
router.get('/bal', authenticate, async (req, res, next) => {
  const currency = req.query.currency;

  try {
    const userRes = await db.query('SELECT balance FROM users WHERE id = $1', [req.user.id]);
    let balance = parseFloat(userRes.rows[0].balance);

    if (!currency || currency.toUpperCase() === 'INR') {
      return res.json({ balance, currency: 'INR' });
    }

    // Fetch conversion rate from currencyapi.com
    const apiKey = process.env.CURRENCY_API_KEY || ''; // User should set this in .env if needed
    if (!apiKey) {
      return res.status(500).json({ error: 'Currency API key not configured' });
    }

    const response = await axios.get(`https://currencyapi.com/api/v1/latest`, {
      params: {
        apikey: apiKey,
        base_currency: 'USD',
        currencies: currency.toUpperCase(),
      },
    });

    console.log('Currency API response:', response.data);

    // Check if data and currency rate exist
    if (!response.data || !response.data.data || !response.data.data[currency.toUpperCase()]) {
      console.error('Currency rate not found in API response');
      return res.status(400).json({ error: 'Invalid currency code or rate not found' });
    }

    const dateKey = Object.keys(response.data.data)[0];
    const rate = response.data.data[dateKey][currency.toUpperCase()];
    if (!rate) {
      return res.status(400).json({ error: 'Invalid currency code' });
    }

    const convertedBalance = balance * rate;
    res.json({ balance: parseFloat(convertedBalance.toFixed(2)), currency: currency.toUpperCase() });
  } catch (err) {
    next(err);
  }
});

// GET /stmt - Transaction history
router.get('/stmt', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT kind, amt, updated_bal, timestamp FROM transactions WHERE user_id = $1 ORDER BY timestamp DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /buy - Buy a product using wallet balance
router.post('/buy', authenticate, async (req, res, next) => {
  const { product_id } = req.body;
  if (!product_id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    await db.query('BEGIN');

    // Get product price
    const productRes = await db.query('SELECT price FROM products WHERE id = $1', [product_id]);
    if (productRes.rowCount === 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid product' });
    }
    const price = parseFloat(productRes.rows[0].price);

    // Get user balance
    const userRes = await db.query('SELECT balance FROM users WHERE id = $1', [req.user.id]);
    const balance = parseFloat(userRes.rows[0].balance);

    if (balance < price) {
      await db.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct price from user balance
    const newBalanceRes = await db.query(
      'UPDATE users SET balance = balance - $1 WHERE id = $2 RETURNING balance',
      [price, req.user.id]
    );
    const newBalance = newBalanceRes.rows[0].balance;

    // Insert transaction record
    await db.query(
      'INSERT INTO transactions (user_id, kind, amt, updated_bal) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'debit', price, newBalance]
    );

    await db.query('COMMIT');
    res.json({ message: 'Product purchased', balance: parseFloat(newBalance) });
  } catch (err) {
    await db.query('ROLLBACK');
    next(err);
  }
});

module.exports = router;
