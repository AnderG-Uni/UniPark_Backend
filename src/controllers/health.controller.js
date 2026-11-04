const pool = require('../config/db');
const { logger } = require('../config/logger');

const checkHealth = async (req, res) => {
  try {
    // 1. Validar conexión a PostgreSQL con una consulta ultraligera
    await pool.query('SELECT 1');

    // 2. Cabeceras de seguridad para evitar caché en esta ruta sensible
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    // 3. Respuesta exitosa (200 OK)
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime() // Tiempo activo en segundos
    });

  } catch (error) {
    logger.error(`Health Check Fallido: ${error.message}`);
    
    // 4. Si la BD falla, respondemos 503 (Servicio no disponible)
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      message: 'Service Unavailable.'
    });
  }
};

module.exports = { checkHealth };