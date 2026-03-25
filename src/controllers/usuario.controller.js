const usuarioService = require('../services/usuario.service');
const ApiResponse = require('../utils/ApiResponse');

const crear = async (req, res, next) => {
  try {
    const usuario = await usuarioService.crearUsuario(req.body);
    res.status(201).json(new ApiResponse(201, usuario, 'Usuario creado con éxito'));
  } catch (error) {
    next(error);
  }
};

const listar = async (req, res, next) => {
  try {
    const usuarios = await usuarioService.obtenerUsuarios();
    res.status(200).json(new ApiResponse(200, usuarios, 'Lista de usuarios'));
  } catch (error) {
    next(error);
  }
};

const eliminar = async (req, res, next) => {
  try {
    await usuarioService.eliminarUsuario(req.params.id);
    res.status(200).json(new ApiResponse(200, null, 'Usuario eliminado'));
  } catch (error) {
    next(error);
  }
};

module.exports = { crear, listar, eliminar };
