require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 4000;

const db = require('./db');
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const productRoutes = require('./routes/product');

app.use(express.json());

// Routes
app.use('/', authRoutes);
app.use('/', walletRoutes);
app.use('/', productRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

db.query('SELECT 1')
  .then(() => {
    console.log('Database connected successfully');
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });
