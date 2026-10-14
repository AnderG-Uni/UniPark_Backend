const { Router } = require('express');
const { guardarPushToken, desactivarPushToken } = require('../controllers/notificacion.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

const router = Router();

// Todas las rutas de notificaciones requieren estar autenticado
router.use(verificarToken);


// POST: /api/v1/notificaciones/push-token
router.post('/push-token', guardarPushToken);
router.put('/desactivar', desactivarPushToken);

module.exports = router;