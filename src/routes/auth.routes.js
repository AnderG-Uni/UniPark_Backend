const { Router } = require('express');
const { login, refresh, logout } = require('../controllers/auth.controller');
const { validarEsquema } = require('../middlewares/validate.middleware');
const { loginSchema } = require('../utils/validators/usuario.schema');

const router = Router();

router.post('/login', validarEsquema(loginSchema), login); // Endpoint: POST /api/v1/auth/login
router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;
