const vehiculoService = require('../services/vehiculo.service');
const ApiError = require('../utils/ApiError');

// Controlador para crear un nuevo vehículo asociado al usuario autenticado
const crear = async (req, res, next) => {
  try {
    const personaId = req.usuario.persona_id; // Viene del JWT
    const nuevoVehiculo = await vehiculoService.crear(personaId, req.body);
    res.status(201).json({ success: true, message: 'Vehículo registrado', data: nuevoVehiculo });
  } catch (error) {
    next(error);
  }
};

// Controlador Dinámico Seguro para servir la imagen QR
const servirImagenQR = async (req, res, next) => {
  try {
    const { qrTokenTokenExtendido } = req.params;
    // Quitamos el '.png' del final del parámetro
    const qrToken = qrTokenTokenExtendido.replace('.png', '');

    if (!qrToken) throw new ApiError(400, 'Falta el token QR.');

    // Solicitamos el Buffer al servicio (este ya validó que el token exista)
    const imageBuffer = await vehiculoService.generarBufferImagenQR(qrToken);

    // --- CRÍTICO: Le decimos al navegador que esto es una imagen PNG ---
    res.setHeader('Content-Type', 'image/png');
    // Enviamos los datos binarios directamente
    res.send(imageBuffer);
  } catch (error) {
    next(error);
  }
};

// Controlador para listar los vehículos del usuario autenticado
const listarMios = async (req, res, next) => {
  try {
    const vehiculos = await vehiculoService.listarMisVehiculos(req.usuario.persona_id);
    res.json({ success: true, data: vehiculos });
  } catch (error) {
    next(error);
  }
};

// Controlador para actualizar un vehículo (solo si pertenece al usuario autenticado)
const actualizar = async (req, res, next) => {
  try {
    const vehiculo = await vehiculoService.actualizar(req.params.id, req.body);
    res.json({ success: true, message: 'Vehículo actualizado', data: vehiculo });
  } catch (error) {
    next(error);
  }
};

// Controlador para listar todos los vehículos (solo para administradores)
const listarTodos = async (req, res, next) => {
  try {
    const vehiculos = await vehiculoService.listarTodos();
    res.json({ success: true, data: vehiculos });
  } catch (error) {
    next(error);
  }
};

// Controlador para obtener un vehículo por su ID (solo si pertenece al usuario autenticado o es admin)
const obtenerUno = async (req, res, next) => {
  try {
    const vehiculo = await vehiculoService.obtenerPorId(req.params.id);
    res.json({ success: true, data: vehiculo });
  } catch (error) {
    next(error);
  }
};

// Controlador para eliminar un vehículo (solo si pertenece al usuario autenticado o es admin)
const eliminar = async (req, res, next) => {
  try {
    await vehiculoService.eliminar(req.params.id);
    res.json({ success: true, message: 'Vehículo eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

// Controlador para subir la foto de un vehículo (solo si pertenece al usuario autenticado)
const subirFoto = async (req, res, next) => {
  try {
    // Multer inyecta el archivo procesado en 'req.file'
    if (!req.file) {
      throw new ApiError(400, 'No se adjuntó ninguna imagen en la petición.');
    }

    // Construimos la URL pública que el frontend podrá leer
    const urlPublicaFoto = `/assets/vehiculos/${req.file.filename}`;

    // Llamamos al servicio
    const vehiculo = await vehiculoService.actualizarFoto(req.params.id, urlPublicaFoto);

    res.json({ success: true, message: 'Foto de vehículo subida exitosamente', data: vehiculo });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crear,
  servirImagenQR,
  listarMios,
  actualizar,
  listarTodos,
  obtenerUno,
  eliminar,
  subirFoto
};
