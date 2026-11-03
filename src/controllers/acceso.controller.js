const accesoService = require('../services/acceso.service');
const ApiError = require('../utils/ApiError');

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
      message: resultado.mensaje,
      datos: resultado.datos
    });
  } catch (error) {
    next(error);
  }
};

// Controlador para registrar un visitante manualmente por parte del Guarda
const registrarVisitante = async (req, res, next) => {

try {
    // 1. Extraemos los campos de texto del FormData
    const { placa, zona_id, observacion, tipo_vehiculo } = req.body;

    if (!placa || !zona_id) {
      throw new ApiError(400, "Placa y zona son obligatorias para registrar un visitante.");
    }

    let urlPublicaFoto = null;

    // 2. Si el middleware capturó una foto, construimos la URL pública
    if (req.file) {
      urlPublicaFoto = `/assets/visitantes/${req.file.filename}`;
    }

    // 3. Pasamos todos los datos (incluyendo la foto opcional) al servicio
    const resultado = await accesoService.procesarVisitante({
      placa: placa.toUpperCase(),
      zona_id: parseInt(zona_id),
      observacion,
      tipo_vehiculo: tipo_vehiculo || 'Carro', // Por defecto Carro si no lo envían
      url_foto: urlPublicaFoto,                // URL estática para express
      guarda_id: req.usuario.id                // Obtenido del token JWT
    });

   // res.status(201).json({
    //  success: true,
    //  message: 'Acceso de visitante registrado exitosamente',
    //  data: resultado
    //});

    res.status(200).json({
      success: true,
      accion: resultado.accion,
      message: resultado.mensaje
    });

  } catch (error) {
    next(error);
  }




  //try {
  //  const { placa, zona_id, observacion } = req.body;
  //  const guarda_id = req.usuario.id; // Extraído del Token JWT del Guarda

  //  const resultado = await accesoService.procesarVisitante(placa, zona_id, guarda_id, observacion);

  //  res.status(200).json({
 //     success: true,
  //    accion: resultado.accion,
  //    message: resultado.mensaje
  //  });
  //} catch (error) {
  //  next(error);
  //}
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
