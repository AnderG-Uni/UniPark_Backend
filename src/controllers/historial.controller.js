const historialService = require('../services/historial.service');
const ApiResponse = require('../utils/ApiResponse');

const obtenerHistorialGlobal = async (req, res, next) => {
  try {
    // Si la ruta llegó aquí, el middleware PBAC ya verificó el permiso
    const historial = await historialService.obtenerHistorialGlobal();
    res.status(200).json(new ApiResponse(200, historial, 'Historial global obtenido con éxito'));
  } catch (error) {
    next(error);
  }
};

const obtenerHistorialPorPersona = async (req, res, next) => {
  try {
    // 🪄 CORRECCIÓN AQUÍ: Usamos req.usuario tal como lo define tu auth.middleware.js
    if (!req.usuario || !req.usuario.persona_id) {
       return res.status(401).json(new ApiResponse(401, null, 'No autorizado. Faltan datos de usuario en la petición.'));
    }

    const historial = await historialService.obtenerHistorialPorPersona(req.usuario.persona_id);
    res.status(200).json(new ApiResponse(200, historial, 'Historial personal obtenido con éxito'));
  } catch (error) {
    next(error);
  }
};

const obtenerHistorialLogins = async (req, res, next) => {
  try {
    const logins = await historialService.obtenerHistorialLogins();
    res.status(200).json(new ApiResponse(200, logins, 'Historial de logins obtenido con éxito'));
  } catch (error) {
    next(error);
  }
};

module.exports = { obtenerHistorialGlobal, obtenerHistorialPorPersona, obtenerHistorialLogins };