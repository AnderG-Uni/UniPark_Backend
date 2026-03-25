const { Router } = require('express');
const reportesController = require('../controllers/reportes.controller');
const { verificarToken } = require('../middlewares/auth.middleware');
const { requierePermiso } = require('../middlewares/pbac.middleware');
const { PERMISOS } = require('../config/roles');

const router = Router();

// Todas las rutas de reportes están fuertemente protegidas
router.use(verificarToken);
router.use(requierePermiso(PERMISOS.VER_REPORTES));

// Endpoints de Inteligencia de Negocios
router.get('/horas-pico', reportesController.obtenerHorasPico);
router.get('/distribucion', reportesController.obtenerDistribucion);
router.get('/auditoria-guardas', reportesController.obtenerAuditoriaGuardas);
router.get('/ocupacion', reportesController.obtenerOcupacionZonas);
router.get('/pernoctas', reportesController.obtenerPernoctas);

module.exports = router;
