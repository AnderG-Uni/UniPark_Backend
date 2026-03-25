const { Router } = require('express');
const {
  crear,
  servirImagenQR,
  listarMios,
  actualizar,
  listarTodos,
  obtenerUno,
  eliminar,
  subirFoto
} = require('../controllers/vehiculo.controller');
const { verificarToken } = require('../middlewares/auth.middleware');
const { validarEsquema } = require('../middlewares/validate.middleware');
const { vehiculoSchema } = require('../utils/validators/vehiculo.schema');
const { uploadVehiculo } = require('../middlewares/upload.middleware');
const { requierePermiso } = require('../middlewares/pbac.middleware');
const { verificarPropietarioOAdmin } = require('../middlewares/ownership.middleware');
const { PERMISOS } = require('../config/roles');

const router = Router();

// Todas requieren estar logueado
router.use(verificarToken);

// Ruta dinámica segura (Requiere Token JWT y permiso)
router.get('/qr/:qrTokenTokenExtendido', requierePermiso(PERMISOS.VER_IMAGEN_QR), servirImagenQR);

// Crear (Límite máximo evaluado en el servicio)
router.post('/', requierePermiso(PERMISOS.CREAR_VEHICULO), validarEsquema(vehiculoSchema), crear);

// Listar los propios
router.get('/mis-vehiculos', requierePermiso(PERMISOS.VER_MIS_VEHICULOS), listarMios);

// 2. RUTA EXCLUSIVA DEL ADMINISTRADOR (Listar todos)
router.get('/', requierePermiso(PERMISOS.GESTIONAR_VEHICULOS), listarTodos);

// El middleware verificará que el req.params.id le pertenezca al usuario logueado
router.get('/:id', verificarPropietarioOAdmin('vehiculo'), obtenerUno);
router.put(
  '/:id',
  requierePermiso(PERMISOS.ACTUALIZAR_VEHICULO),
  verificarPropietarioOAdmin('vehiculo'),
  validarEsquema(vehiculoSchema),
  actualizar
);
router.delete(
  '/:id',
  requierePermiso(PERMISOS.ACTUALIZAR_VEHICULO),
  verificarPropietarioOAdmin('vehiculo'),
  eliminar
);

// RUTA PARA SUBIR FOTO (Solo el dueño o admin pueden subir la foto)
router.post(
  '/:id/foto',
  requierePermiso(PERMISOS.ACTUALIZAR_VEHICULO),
  verificarPropietarioOAdmin('vehiculo'),
  uploadVehiculo.single('foto'),
  subirFoto
);

module.exports = router;
