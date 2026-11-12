class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Lets async route handlers pass errors to Express
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err && err.code === 11000) {
    return res.status(409).json({ error: 'That already exists' });
  }
  if (err && err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Some details are not valid' });
  }
  const status = (err && err.status) || 500;
  if (status === 500) console.error(err);
  return res.status(status).json({ error: status === 500 ? 'Something went wrong' : err.message });
}

module.exports = { HttpError, wrap, errorHandler };
