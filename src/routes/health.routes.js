const { Router } = require('express');
const { checkHealth } = require('../controllers/health.controller');

const router = Router();

// Ruta desprotegida (sin JWT) para que los balanceadores de carga puedan consultarla
router.get('/', checkHealth);

module.exports = router;