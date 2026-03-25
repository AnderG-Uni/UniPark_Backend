const { Router } = require('express');
const infraController = require('../controllers/infraestructura.controller');
const { verificarToken } = require('../middlewares/auth.middleware');
const { validarEsquema } = require('../middlewares/validate.middleware');
const { institucionSchema, sedeSchema } = require('../utils/validators/infraestructura.schema');
const { requierePermiso } = require('../middlewares/pbac.middleware');
const { PERMISOS } = require('../config/roles');

const router = Router();

// Todas las rutas requieren estar autenticado y ser Administrador
router.use(verificarToken);
router.use(requierePermiso(PERMISOS.GESTIONAR_INFRAESTRUCTURA));

// --- RUTAS DE INSTITUCIONES ---
router.post('/instituciones', validarEsquema(institucionSchema), infraController.crearInstitucion);
router.get('/instituciones', infraController.listarInstituciones);
router.put(
  '/instituciones/:id',
  validarEsquema(institucionSchema),
  infraController.actualizarInstitucion
);

// --- RUTAS DE SEDES ---
router.post('/sedes', validarEsquema(sedeSchema), infraController.crearSede);
router.get('/sedes', infraController.listarSedes);
router.put('/sedes/:id', validarEsquema(sedeSchema), infraController.actualizarSede);
router.delete('/sedes/:id', infraController.eliminarSede);

module.exports = router;
