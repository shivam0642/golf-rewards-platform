const jwt = require('jsonwebtoken');
const { selectOne, mapUser } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'digital-heroes-local-development-secret');

function getJwtSecret() {
  if (!JWT_SECRET) {
    const error = new Error('JWT_SECRET is not configured.');
    error.code = 'JWT_NOT_CONFIGURED';
    throw error;
  }
  return JWT_SECRET;
}

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, getJwtSecret(), { expiresIn: '7d' });
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    const user = await selectOne('users', 'id', payload.id, mapUser);

    if (!user) {
      return res.status(401).json({ message: 'User session no longer exists.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.code === 'SUPABASE_NOT_CONFIGURED') {
      return res.status(503).json({ message: 'Database is not configured.' });
    }
    if (error.code === 'JWT_NOT_CONFIGURED') {
      return res.status(503).json({ message: 'Authentication is not configured.' });
    }
    if (error.code && error.code !== 'JsonWebTokenError' && error.code !== 'TokenExpiredError') {
      return res.status(503).json({ message: 'Database is unavailable.' });
    }
    return res.status(401).json({ message: 'Session expired or invalid.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMINISTRATOR') {
    return res.status(403).json({ message: 'Admin authorization required.' });
  }

  return next();
}

function requireSubscriber(req, res, next) {
  if (!req.user || !['active'].includes(req.user.subscriptionStatus)) {
    return res.status(402).json({ message: 'An active subscription is required for this feature.' });
  }
  return next();
}

module.exports = {
  signToken,
  requireAuth,
  requireAdmin,
  requireSubscriber,
};
