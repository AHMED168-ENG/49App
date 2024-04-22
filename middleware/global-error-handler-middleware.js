const globalErrorHandlerMiddleware = (error, req, res, next) => {
  res.status(error.httpCode || 500);
  res.json({
    success: false,
    error: {
      name: error.name,
      httpCode: error.httpCode || 500,
      message: error.message,
      isOperational: error.isOperational,
      stack: error.stack,
    },
  });
};

export { globalErrorHandlerMiddleware };
