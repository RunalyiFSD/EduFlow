const errorHandler = (err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err.message);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'An unexpected server error occurred.'
  });
};

module.exports = errorHandler;
