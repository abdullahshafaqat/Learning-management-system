import { verifyToken } from '../utils/token.js';

const authMiddleware = (req, res, next) => {
  // Try to get token from cookie first, then from Authorization header
  const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

export default authMiddleware;
