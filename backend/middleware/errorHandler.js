export const errorHandler = (err, req, res, next) => {
  const NODE_ENV = process.env.NODE_ENV || 'development';

  const statusCode = err.status || 500;
  console.error('[ERROR]', {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message: err.message,
    stack: NODE_ENV === 'development' ? err.stack : undefined
  });

  if (err.message && err.message.includes('CORS policy violation')) {
    return res.status(403).json({ message: 'Origin not allowed by CORS policy' });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ message: `${field} already exists` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  // Default error - don't expose stack traces in production
  const message = NODE_ENV === 'production' && statusCode === 500 
    ? 'Internal server error' 
    : err.message || 'Internal server error';

  res.status(statusCode).json({ message });
};
