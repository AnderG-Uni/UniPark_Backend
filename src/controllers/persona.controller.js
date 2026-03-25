const personaService = require('../services/persona.service');
const ApiResponse = require('../utils/ApiResponse');

const crear = async (req, res, next) => {
  try {
    const persona = await personaService.crearPersona(req.body);
    res.status(201).json(new ApiResponse(201, persona, 'Persona registrada con éxito'));
  } catch (error) {
    next(error);
  }
};

const listar = async (req, res, next) => {
  try {
    const personas = await personaService.obtenerPersonas();
    res.status(200).json(new ApiResponse(200, personas, 'Lista de personas obtenida'));
  } catch (error) {
    next(error);
  }
};

const obtenerUno = async (req, res, next) => {
  try {
    const persona = await personaService.obtenerPersonaPorId(req.params.id);
    res.status(200).json(new ApiResponse(200, persona, 'Detalle de la persona'));
  } catch (error) {
    next(error);
  }
};

const actualizar = async (req, res, next) => {
  try {
    const persona = await personaService.actualizarPersona(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, persona, 'Datos actualizados correctamente'));
  } catch (error) {
    next(error);
  }
};

const eliminar = async (req, res, next) => {
  try {
    await personaService.eliminarPersona(req.params.id);
    res.status(200).json(new ApiResponse(200, null, 'Persona eliminada del sistema'));
  } catch (error) {
    next(error);
  }
};

module.exports = { crear, listar, obtenerUno, actualizar, eliminar };
