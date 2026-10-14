const notificacionService = require('../services/notificacion.service');
const ApiResponse = require('../utils/ApiResponse');

const guardarPushToken = async (req, res, next) => {
  try {
    const { token_push } = req.body;
    
    // Tu auth.middleware.js inyecta los datos del token aquí:
    const usuarioId = req.usuario.id;

    // Guardamos o actualizamos el token en la base de datos
    const dispositivo = await notificacionService.guardarPushToken(usuarioId, token_push);

    // Retornamos el éxito usando tu estandarización
    res.status(200).json(
      new ApiResponse(200, dispositivo, 'Dispositivo registrado para notificaciones Push con éxito')
    );
  } catch (error) {
    next(error); // Pasamos cualquier fallo al middleware global de errores
  }
};

const desactivarPushToken = async (req, res, next) => {
  try {
    const { token_push } = req.body;
    await notificacionService.desactivarPushToken(token_push);
    
    res.status(200).json(
      new ApiResponse(200, null, 'Notificaciones en este dispositivo desactivadas-')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  guardarPushToken,
  desactivarPushToken
};