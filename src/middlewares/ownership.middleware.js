const ApiError = require('../utils/ApiError');
const pool = require('../config/db');

const verificarPropietarioOAdmin = (tipoRecurso) => {
  return async (req, res, next) => {
    // 1. Validamos el ID *antes* del try, así está disponible globalmente en la función
    const idSolicitado = parseInt(req.params.id, 10);

    if (isNaN(idSolicitado)) {
      return next(new ApiError(400, 'ID inválido en la ruta.'));
    }

    try {
      // 2. Si es Administrador, tiene pase VIP
      if (req.usuario && req.usuario.rol === 'Administrador') {
        return next();
      }

      const miPersonaId = req.usuario.persona_id;

      // 3. Verificación para el CRUD de Personas
      if (tipoRecurso === 'persona' && miPersonaId !== idSolicitado) {
        return next(new ApiError(403, 'Acceso denegado a estos datos personales.'));
      }

      // 4. Verificación para el CRUD de Vehículos
      if (tipoRecurso === 'vehiculo') {
        const query = 'SELECT persona_id FROM vehiculos WHERE id = $1';
        const { rows } = await pool.query(query, [idSolicitado]);

        if (rows.length === 0) {
          return next(new ApiError(404, 'Vehículo no encontrado.'));
        }

        if (rows[0].persona_id !== miPersonaId) {
          return next(
            new ApiError(403, 'Acceso denegado. No eres el propietario de este vehículo.')
          );
        }
      }

      // Si todo está correcto, pasa al controlador
      next();
    } catch (error) {
      // Si hay un error de conexión o sintaxis SQL, ahora sí lo veremos claramente
      next(error);
    }
  };
};

module.exports = { verificarPropietarioOAdmin };
