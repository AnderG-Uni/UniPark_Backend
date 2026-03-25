const reportesService = require('../services/reportes.service');

const obtenerHorasPico = async (req, res, next) => {
  try {
    res.json({ success: true, data: await reportesService.reporteHorasPico() });
  } catch (error) {
    next(error);
  }
};

const obtenerDistribucion = async (req, res, next) => {
  try {
    res.json({ success: true, data: await reportesService.reporteDistribucion() });
  } catch (error) {
    next(error);
  }
};

const obtenerAuditoriaGuardas = async (req, res, next) => {
  try {
    res.json({ success: true, data: await reportesService.reporteAuditoriaGuardas() });
  } catch (error) {
    next(error);
  }
};

const obtenerOcupacionZonas = async (req, res, next) => {
  try {
    res.json({ success: true, data: await reportesService.reporteOcupacionZonas() });
  } catch (error) {
    next(error);
  }
};

const obtenerPernoctas = async (req, res, next) => {
  try {
    res.json({ success: true, data: await reportesService.reportePernoctas() });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerHorasPico,
  obtenerDistribucion,
  obtenerAuditoriaGuardas,
  obtenerOcupacionZonas,
  obtenerPernoctas
};
