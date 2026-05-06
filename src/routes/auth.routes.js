const { Router } = require('express');
const { login, refresh, logout, registro } = require('../controllers/auth.controller');
const { validarEsquema } = require('../middlewares/validate.middleware');
const { loginSchema } = require('../utils/validators/usuario.schema');
const { registroEstudianteSchema } = require('../utils/validators/auth.schema');

const router = Router();

router.post('/login', validarEsquema(loginSchema), login); // Endpoint: POST /api/v1/auth/login
router.post('/registro', validarEsquema(registroEstudianteSchema), registro);  // Endpoint: POST /api/v1/auth/registro
router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;
