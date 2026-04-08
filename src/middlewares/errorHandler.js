const ApiError = require('../utils/ApiError');
const { logger } = require('../config/logger');

/**
 * Middleware global para el manejo de errores.
 * Debe ser el último middleware en app.js
 */
const errorHandler = (err, req, res) => {
  let error = err;

  // Si el error no es una instancia de nuestro ApiError, lo convertimos
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Error interno del servidor';
    error = new ApiError(statusCode, message, error?.errors || []);
  }

  // Guardar el error en los logs
  if (error.statusCode >= 500) {
    logger.error(
      `${error.statusCode} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip} - \n${err.stack}`
    );
  } else {
    logger.warn(
      `${error.statusCode} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  }

  // Respuesta final en formato JSON para el cliente
  res.status(error.statusCode).json({
    success: error.success,
    message: error.message,
    errors: error.errors
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined // Descomentar en desarrollo
  });
};

module.exports = errorHandler;
