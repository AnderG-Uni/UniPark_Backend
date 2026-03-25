const { Router } = require('express');
const {
  crear,
  listar,
  obtenerUno,
  actualizar,
  eliminar
} = require('../controllers/persona.controller');
const { verificarToken } = require('../middlewares/auth.middleware');
const { validarEsquema } = require('../middlewares/validate.middleware');
const { personaSchema } = require('../utils/validators/persona.schema');
const { requierePermiso } = require('../middlewares/pbac.middleware');
const { PERMISOS } = require('../config/roles');
const { verificarPropietarioOAdmin } = require('../middlewares/ownership.middleware');

const router = Router();

// RUTA PÚBLICA: Crear persona (Cualquier Estudiante puede registrarse como persona)
router.post('/', validarEsquema(personaSchema), crear);

// Rutas protegidas (Requieren Token) de aqui en adelante
router.use(verificarToken);

// Un estudiante puede crear su persona o actualizarla, pero no eliminarla ni ver otras personas
router.get('/:id', verificarPropietarioOAdmin('persona'), obtenerUno);
router.put(
  '/:id',
  validarEsquema(personaSchema),
  verificarPropietarioOAdmin('persona'),
  actualizar
);

// SOLO LOS ADMINS PUEDEN LISTAR TODOS O ELIMINAR PERSONAS
router.get('/', requierePermiso(PERMISOS.GESTIONAR_PERSONAS), listar);
router.delete('/:id', requierePermiso(PERMISOS.GESTIONAR_PERSONAS), eliminar);

module.exports = router;
