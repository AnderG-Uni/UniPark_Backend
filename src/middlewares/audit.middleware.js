const { auditLogger } = require('../config/logger');
const fastRedact = require('fast-redact');

const redact = fastRedact({
  paths: ['clave', 'password', 'token', 'accessToken', 'refreshToken', '*.clave', '*.password'],
  censor: '***OCULTO-POR-SEGURIDAD***',
  serialize: false
});

const auditMiddleware = (req, res, next) => {
  // Función dinámica que evalúa al usuario al final de la petición
  const obtenerInfoUsuario = () => {
    // 1. Si pasó por un middleware de token (Rutas protegidas o creando Guardas)
    if (req.usuario) {
      return { id: req.usuario.id, rol: req.usuario.rol };
    }
    // 2. Si se están auto-registrando (Estudiantes/Docentes)
    if (req.method === 'POST' && req.originalUrl.includes('/api/v1/usuarios')) {
      return { id: 'Nuevo Registro', rol: req.body?.rol || 'Desconocido' };
    }
    // 3. Si están intentando hacer Login
    if (req.method === 'POST' && req.originalUrl.includes('/api/v1/auth/login')) {
      return { id: 'Intento de Login', rol: 'Validando...' };
    }
    // 4. Si es una ruta pública sin autenticación
    return { id: 'Invitado', rol: 'Sin Rol' };
  };

  if (req.method === 'GET' || req.method === 'OPTIONS') {
    res.on('finish', () => {
      // Llamamos a la función aquí, cuando la respuesta ya se armó
      auditLogger.info({
        usuario: obtenerInfoUsuario(),
        peticion: { metodo: req.method, ruta: req.originalUrl, ip: req.ip, query: req.query },
        respuesta: {
          statusCode: res.statusCode,
          body: '[Cuerpo de respuesta omitido por rendimiento en peticiones GET]'
        }
      });
    });
    return next();
  }

  const originalJson = res.json;

  let safeReqBody = {};
  if (req.body && Object.keys(req.body).length > 0) {
    try {
      safeReqBody = redact(JSON.parse(JSON.stringify(req.body)));
    } catch (e) {
      console.error({
        message: 'Error al procesar la solicitud',
        error: e.message,
        stack: e.stack
      });
      safeReqBody = '[Error al procesar body]';
    }
  }

  res.json = function (bodyResponse) {
    let safeResBody = {};
    if (bodyResponse) {
      try {
        safeResBody = redact(JSON.parse(JSON.stringify(bodyResponse)));
      } catch (e) {
        console.error({
          message: 'Error al procesar la respuesta',
          error: e.message,
          stack: e.stack
        });
        safeResBody = '[Error al procesar body]';
      }
    }

    setImmediate(() => {
      // Llamamos a la función aquí también
      auditLogger.info({
        usuario: obtenerInfoUsuario(),
        peticion: {
          metodo: req.method,
          ruta: req.originalUrl,
          ip: req.ip,
          params: req.params,
          query: req.query,
          body: safeReqBody
        },
        respuesta: {
          statusCode: res.statusCode,
          body: safeResBody
        }
      });
    });

    return originalJson.call(this, bodyResponse);
  };

  next();
};

module.exports = auditMiddleware;
