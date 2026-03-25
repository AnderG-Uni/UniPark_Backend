const infraService = require('../services/infraestructura.service');

// Instituciones
const crearInstitucion = async (req, res, next) => {
  try {
    res.status(201).json({ success: true, data: await infraService.crearInstitucion(req.body) });
  } catch (error) {
    next(error);
  }
};
const listarInstituciones = async (req, res, next) => {
  try {
    res.json({ success: true, data: await infraService.listarInstituciones() });
  } catch (error) {
    next(error);
  }
};
const actualizarInstitucion = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: await infraService.actualizarInstitucion(req.params.id, req.body)
    });
  } catch (error) {
    next(error);
  }
};

// Sedes
const crearSede = async (req, res, next) => {
  try {
    res.status(201).json({ success: true, data: await infraService.crearSede(req.body) });
  } catch (error) {
    next(error);
  }
};
const listarSedes = async (req, res, next) => {
  try {
    res.json({ success: true, data: await infraService.listarSedes() });
  } catch (error) {
    next(error);
  }
};
const actualizarSede = async (req, res, next) => {
  try {
    res.json({ success: true, data: await infraService.actualizarSede(req.params.id, req.body) });
  } catch (error) {
    next(error);
  }
};
const eliminarSede = async (req, res, next) => {
  try {
    res.json({ success: true, data: await infraService.eliminarSede(req.params.id) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearInstitucion,
  listarInstituciones,
  actualizarInstitucion,
  crearSede,
  listarSedes,
  actualizarSede,
  eliminarSede
};
