function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== 'production';

  console.error('Error:', {
    message: err.message,
    ...(isDev && { stack: err.stack })
  });

  const statusCode = err.statusCode || err.status || 500;

  if (isDev) {
    return res.status(statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code || 'SERVER_ERROR',
        stack: err.stack
      }
    });
  }

  // Production: never expose internals
  return res.status(statusCode).json({
    success: false,
    error: {
      message: statusCode === 500 ? 'Internal server error' : err.message,
      code: err.code || 'SERVER_ERROR'
    }
  });
}

module.exports = errorHandler;
