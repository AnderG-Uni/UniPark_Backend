/**
 * Clase para formatear todas las respuestas exitosas de la API.
 */
class ApiResponse {
  constructor(statusCode, data, message = 'Operación exitosa') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400; // Será true para 200, 201, etc.
  }
}

module.exports = ApiResponse;
