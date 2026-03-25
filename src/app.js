const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { logger } = require('./config/logger');
const errorHandler = require('./middlewares/errorHandler');
const auditMiddleware = require('./middlewares/audit.middleware');

const authRoutes = require('./routes/auth.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const personaRoutes = require('./routes/persona.routes');
const vehiculoRoutes = require('./routes/vehiculo.routes');
const zonaRoutes = require('./routes/zona.routes');
const accesoRoutes = require('./routes/acceso.routes');
const infraestructuraRoutes = require('./routes/infraestructura.routes');
const reportesRoutes = require('./routes/reportes.routes');

const app = express();

// Middlewares Globales
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true // para que el frontend pueda enviar y recibir cookies
  })
);
app.use(helmet()); // Protege cabeceras HTTP
app.use(express.json()); // Parsea el body como JSON
app.use(cookieParser()); // Parsea las cookies

// Configuración de Morgan para loguear peticiones
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      // Redirigimos la salida de Morgan hacia nuestro logger de Winston
      write: (message) => logger.info(message.trim())
    }
  })
);

// MIDDLEWARE DE AUDITORÍA
app.use(auditMiddleware);

// Rutas para servir archivos estáticos (como imágenes de vehículos)
app.use('/assets', vehiculoRoutes, express.static(path.join(__dirname, 'assets')));

// Rutas :  de cada modulo (Autenticación, Usuarios, Personas, Vehículos, Zonas, Accesos, Infraestructura)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/usuarios', usuarioRoutes);
app.use('/api/v1/personas', personaRoutes);
app.use('/api/v1/vehiculos', vehiculoRoutes);
app.use('/api/v1/zonas', zonaRoutes);
app.use('/api/v1/acceso', accesoRoutes);
app.use('/api/v1/admin', infraestructuraRoutes);
app.use('/api/v1/reportes', reportesRoutes);

// Middleware de Manejo de Errores (Debe ir al final, después de todas las rutas)
app.use(errorHandler);

module.exports = app;
