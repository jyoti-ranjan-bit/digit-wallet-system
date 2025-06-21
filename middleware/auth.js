const basicAuth = require('basic-auth');
const bcrypt = require('bcrypt');
const db = require('../db');

async function authenticate(req, res, next) {
  const credentials = basicAuth(req);
  if (!credentials || !credentials.name || !credentials.pass) {
    res.set('WWW-Authenticate', 'Basic realm="User Visible Realm"');
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE username = $1', [credentials.name]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(credentials.pass, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.user = user; // attach user info to request
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;
