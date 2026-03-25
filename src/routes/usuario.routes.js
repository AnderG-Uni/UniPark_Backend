const { Router } = require('express');
const { crear, listar, eliminar } = require('../controllers/usuario.controller');
const {
  verificarToken,
  verificarCreacionRolesInternos
} = require('../middlewares/auth.middleware');
const { validarEsquema } = require('../middlewares/validate.middleware');
const { registrarUsuarioSchema } = require('../utils/validators/usuario.schema');
const { requierePermiso } = require('../middlewares/pbac.middleware');
const { PERMISOS } = require('../config/roles');

const router = Router();

// 1. RUTA PÚBLICA: Crear usuario (Cualquier Estudiante puede registrarse)
// Pasará por Zod -> Luego por el Guardián de Admin -> Finalmente al Controlador
router.post('/', validarEsquema(registrarUsuarioSchema), verificarCreacionRolesInternos, crear);

// Rutas protegidas (Requieren Token) de aqui en adelante
router.use(verificarToken);

// 3. RUTAS PROTEGIDAS CON PBAC
router.get('/', requierePermiso(PERMISOS.GESTIONAR_USUARIOS), listar);
router.delete('/:id', requierePermiso(PERMISOS.GESTIONAR_USUARIOS), eliminar);

module.exports = router;
