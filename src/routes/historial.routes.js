const { Router } = require('express');
const { 
  obtenerHistorialGlobal, 
  obtenerHistorialPorPersona,
  obtenerHistorialLogins
} = require('../controllers/historial.controller');
const { verificarToken } = require('../middlewares/auth.middleware');
const { requierePermiso } = require('../middlewares/pbac.middleware');
const { PERMISOS } = require('../config/roles');

const router = Router();

// Rutas protegidas (Requieren Token) de aquí en adelante
router.use(verificarToken);

// 1. RUTA PERSONAL: Cualquier usuario autenticado puede consultar sus propios ingresos
router.get('/personal', obtenerHistorialPorPersona);

// 2. RUTA GLOBAL PROTEGIDA CON PBAC: Solo Admins/Guardas con permiso pueden ver todo
router.get('/global', requierePermiso(PERMISOS.GESTIONAR_HISTORIAL), obtenerHistorialGlobal);
router.get('/logins', requierePermiso(PERMISOS.GESTIONAR_HISTORIAL), obtenerHistorialLogins);
module.exports = router;