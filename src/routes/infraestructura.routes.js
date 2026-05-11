const { Router } = require('express');
const infraController = require('../controllers/infraestructura.controller');
const { verificarToken } = require('../middlewares/auth.middleware');
const { validarEsquema } = require('../middlewares/validate.middleware');
const { institucionSchema, sedeSchema } = require('../utils/validators/infraestructura.schema');
const { requierePermiso } = require('../middlewares/pbac.middleware');
const { PERMISOS } = require('../config/roles');

const router = Router();

// 1. Solo verificamos que el usuario esté logueado globalmente
router.use(verificarToken);

// --- RUTAS DE INSTITUCIONES (Siguen siendo exclusivas del Admin) ---
router.post('/instituciones', requierePermiso(PERMISOS.GESTIONAR_INFRAESTRUCTURA), validarEsquema(institucionSchema), infraController.crearInstitucion);
router.get('/instituciones', requierePermiso(PERMISOS.GESTIONAR_INFRAESTRUCTURA), infraController.listarInstituciones);
router.put(
  '/instituciones/:id',
  requierePermiso(PERMISOS.GESTIONAR_INFRAESTRUCTURA),
  validarEsquema(institucionSchema),
  infraController.actualizarInstitucion
);

// --- RUTAS DE SEDES ---
// 🪄 2. APLICAMOS EL NUEVO PERMISO: Ahora estudiantes/docentes pueden ver las sedes para el filtro
router.get('/sedes', requierePermiso(PERMISOS.VER_SEDES), infraController.listarSedes);

// 3. El resto de la gestión de sedes se protege solo para el Administrador
router.post('/sedes', requierePermiso(PERMISOS.GESTIONAR_INFRAESTRUCTURA), validarEsquema(sedeSchema), infraController.crearSede);
router.put('/sedes/:id', requierePermiso(PERMISOS.GESTIONAR_INFRAESTRUCTURA), validarEsquema(sedeSchema), infraController.actualizarSede);
router.delete('/sedes/:id', requierePermiso(PERMISOS.GESTIONAR_INFRAESTRUCTURA), infraController.eliminarSede);

module.exports = router;