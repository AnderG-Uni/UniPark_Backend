const accesoService = require('../services/acceso.service');

// Controlador para manejar el escaneo de QR, registro de visitantes y consulta de historial
const escanearQR = async (req, res, next) => {
  try {
    const { qr_token, zona_id, observacion } = req.body;

    // Extraemos el ID del usuario (Guarda) que hizo el escaneo desde el Token JWT
    const guarda_id = req.usuario.id;

    // Pasamos los nuevos parámetros al servicio
    const resultado = await accesoService.procesarEscaneoQR(
      qr_token,
      zona_id,
      guarda_id,
      observacion
    );

    res.status(200).json({
      success: true,
      accion: resultado.accion,
      message: resultado.mensaje
    });
  } catch (error) {
    next(error);
  }
};

// Controlador para registrar un visitante manualmente por parte del Guarda
const registrarVisitante = async (req, res, next) => {
  try {
    const { placa, zona_id, observacion } = req.body;
    const guarda_id = req.usuario.id; // Extraído del Token JWT del Guarda

    const resultado = await accesoService.procesarVisitante(placa, zona_id, guarda_id, observacion);

    res.status(200).json({
      success: true,
      accion: resultado.accion,
      message: resultado.mensaje
    });
  } catch (error) {
    next(error);
  }
};

// Controlador para que un usuario pueda consultar su propio historial de accesos
const miHistorial = async (req, res, next) => {
  try {
    // IDOR seguro: Extraemos el persona_id del token directamente
    const historial = await accesoService.obtenerMiHistorial(req.usuario.persona_id);
    res.json({ success: true, data: historial });
  } catch (error) {
    next(error);
  }
};

module.exports = { escanearQR, registrarVisitante, miHistorial };
