const { Router } = require('express');
const {
  crear,
  listar,
  obtenerUno,
  actualizar,
  eliminar,
  subirFoto
} = require('../controllers/zona.controller');
const { verificarToken } = require('../middlewares/auth.middleware');
const { validarEsquema } = require('../middlewares/validate.middleware');
const { uploadZona } = require('../middlewares/upload.middleware');
const { requierePermiso } = require('../middlewares/pbac.middleware');
const { zonaSchema } = require('../utils/validators/zona.schema');
const { PERMISOS } = require('../config/roles');

const router = Router();

router.use(verificarToken);

// Solo el Administrador gestiona
router.post('/', requierePermiso(PERMISOS.GESTIONAR_ZONAS), validarEsquema(zonaSchema), crear);
router.put(
  '/:id',
  requierePermiso(PERMISOS.GESTIONAR_ZONAS),
  validarEsquema(zonaSchema),
  actualizar
);
router.delete('/:id', requierePermiso(PERMISOS.GESTIONAR_ZONAS), eliminar);

// Requiere permisos de Admin para modificar la zona
router.post(
  '/:id/foto',
  requierePermiso(PERMISOS.GESTIONAR_ZONAS),
  uploadZona.single('foto'),
  subirFoto
);

// Todos los autenticados pueden ver la disponibilidad
router.get('/', requierePermiso(PERMISOS.VER_ZONAS), listar);
router.get('/:id', requierePermiso(PERMISOS.VER_ZONAS), obtenerUno);

module.exports = router;
