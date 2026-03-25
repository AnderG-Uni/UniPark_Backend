const zonaService = require('../services/zona.service');
const ApiError = require('../utils/ApiError');

const crear = async (req, res, next) => {
  try {
    const zona = await zonaService.crear(req.body);
    res.status(201).json({ success: true, data: zona });
  } catch (error) {
    next(error);
  }
};

const listar = async (req, res, next) => {
  try {
    const zonas = await zonaService.listarConDisponibilidad();
    res.json({ success: true, data: zonas });
  } catch (error) {
    next(error);
  }
};

const obtenerUno = async (req, res, next) => {
  try {
    const zona = await zonaService.obtenerPorId(req.params.id);
    res.json({ success: true, data: zona });
  } catch (error) {
    next(error);
  }
};

const actualizar = async (req, res, next) => {
  try {
    const zona = await zonaService.actualizar(req.params.id, req.body);
    res.json({ success: true, data: zona });
  } catch (error) {
    next(error);
  }
};

const eliminar = async (req, res, next) => {
  try {
    await zonaService.eliminar(req.params.id);
    res.json({ success: true, message: 'Zona eliminada' });
  } catch (error) {
    next(error);
  }
};

// Función para subir la foto de la zona
const subirFoto = async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, 'No se adjuntó ninguna imagen en la petición.');

    // Construimos la ruta estática tal cual la servirá express.static
    const urlPublicaFoto = `/assets/zonas/${req.file.filename}`;

    const zona = await zonaService.actualizarFoto(req.params.id, urlPublicaFoto);

    res.json({ success: true, message: 'Foto de zona subida exitosamente', data: zona });
  } catch (error) {
    next(error);
  }
};

module.exports = { crear, listar, obtenerUno, actualizar, eliminar, subirFoto };
