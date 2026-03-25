require('dotenv').config(); // Carga las variables de .env
const app = require('./src/app');
const { logger } = require('./src/config/logger');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(` Servidor: corriendo en el puerto ${PORT}`);
  logger.info(` Entorno: ${process.env.NODE_ENV || 'development'}`);
  logger.info(` Base de Datos: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
});


// 1. Manejo de errores no capturados (Ej: un error de sintaxis que se escapó)
process.on('uncaughtException', (err) => {
  logger.error(' UNCAUGHT EXCEPTION! Apagando el servidor...');
  logger.error(`${err.name}: ${err.message}`);
  process.exit(1); 
});

// 2. Manejo de promesas rechazadas (Ej: la BD se cae de repente)
process.on('unhandledRejection', (err) => {
  logger.error(' UNHANDLED REJECTION! Apagando de forma segura...');
  logger.error(`${err.name}: ${err.message}`);
  // Cerramos el servidor suavemente antes de salir
  server.close(() => {
    process.exit(1);
  });
});