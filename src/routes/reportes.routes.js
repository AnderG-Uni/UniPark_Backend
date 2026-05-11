const { Router } = require('express');
const reportesController = require('../controllers/reportes.controller');
const { verificarToken } = require('../middlewares/auth.middleware');
const { requierePermiso } = require('../middlewares/pbac.middleware');
const { PERMISOS } = require('../config/roles');

const router = Router();

// 1. Validamos que el usuario esté autenticado para TODAS las rutas
router.use(verificarToken);

// 2. RUTA PÚBLICA (Para usuarios con el permiso básico de ver disponibilidad)
router.get('/ocupacion', requierePermiso(PERMISOS.VER_REPORTE_OCUPACION), reportesController.obtenerOcupacionZonas);

// 3. RUTAS ESTRICTAS (Solo para Administradores / Guardas / Directivos)
router.get('/horas-pico', requierePermiso(PERMISOS.VER_REPORTES), reportesController.obtenerHorasPico);
router.get('/distribucion', requierePermiso(PERMISOS.VER_REPORTES), reportesController.obtenerDistribucion);
router.get('/auditoria-guardas', requierePermiso(PERMISOS.VER_REPORTES), reportesController.obtenerAuditoriaGuardas);
router.get('/pernoctas', requierePermiso(PERMISOS.VER_REPORTES), reportesController.obtenerPernoctas);

module.exports = router;