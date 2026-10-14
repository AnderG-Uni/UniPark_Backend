const usuarioService = require('../services/usuario.service');
const ApiResponse = require('../utils/ApiResponse');

// Controlador para crear los usuarios
const crear = async (req, res, next) => {
  try {
    const usuario = await usuarioService.crearUsuario(req.body);
    res.status(201).json(new ApiResponse(201, usuario, 'Usuario creado con éxito'));
  } catch (error) {
    next(error);
  }
};

// Controlador para listar los usuarios
const listar = async (req, res, next) => {
  try {
    // 1. Extraer los parámetros de la URL con valores por defecto
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // 2. Llamar al servicio pasando la paginación
    const resultado = await usuarioService.obtenerUsuarios(page, limit);
    
    // 3. Responder con la estructura paginada { data, meta }
    res.status(200).json(new ApiResponse(200, resultado, 'Lista de usuarios paginada'));
  } catch (error) {
    next(error);
  }
};

// Controlador para actualizar datos del usuario (Email, Rol, Clave)
const actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Llamamos al servicio con el ID y todo el cuerpo de la petición (correo, rol, clave)
    const usuarioActualizado = await usuarioService.actualizarUsuario(id, req.body);

    res
      .status(200)
      .json(
        new ApiResponse(200, usuarioActualizado, 'Datos de usuario actualizados correctamente')
      );
  } catch (error) {
    next(error);
  }
};

// Controlador para eliminar un usuario
const eliminar = async (req, res, next) => {
  try {
    await usuarioService.eliminarUsuario(req.params.id);
    res.status(200).json(new ApiResponse(200, null, 'Usuario eliminado'));
  } catch (error) {
    next(error);
  }
};

// No olvides añadir 'actualizar' al export
module.exports = { crear, listar, actualizar, eliminar };
