const { Router } = require('express');
const { escanearQR, registrarVisitante, miHistorial } = require('../controllers/acceso.controller');
const { verificarToken } = require('../middlewares/auth.middleware');
const { validarEsquema } = require('../middlewares/validate.middleware');
const { escaneoSchema, visitanteSchema } = require('../utils/validators/acceso.schema');
const { requierePermiso } = require('../middlewares/pbac.middleware');
const { PERMISOS } = require('../config/roles');

const router = Router();
router.use(verificarToken);

// 1. Ruta del Guarda (Protegida, requiere Body con qr_token y zona_id)
router.post(
  '/escanear',
  requierePermiso(PERMISOS.ESCANEAR_QR),
  validarEsquema(escaneoSchema),
  escanearQR
);

// 3. Ruta para Visitantes (Requiere permiso específico y valida la placa)
router.post(
  '/visitante',
  requierePermiso(PERMISOS.REGISTRAR_VISITANTE),
  validarEsquema(visitanteSchema),
  registrarVisitante
);

// 2. Ruta del Estudiante/Docente (Solo pueden ver su propia info)
router.get('/mi-historial', miHistorial);

module.exports = router;
