/**
 * Clase personalizada para manejar errores operativos de la API.
 * Extiende la clase Error nativa de Node.js.
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors; // Para enviar detalles (ej. errores de validación de campos)

    // Captura la traza del error para facilitar la depuración
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
