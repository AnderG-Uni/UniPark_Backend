const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// Formato de logs personalizado para el logger de sistema
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(
    ({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`
  )
);

//  Formato de logger del Sistema (Conexiones y Errores generales)
const transportCombined = new DailyRotateFile({
  filename: path.join(logDir, 'sistema-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

// Logger principal del Sistema y su nivel de alertamiento
const logger = createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    transportCombined,
    new transports.Console({ format: format.combine(format.colorize(), logFormat) })
  ]
});

// Logger exclusivo de auditoría (Formato JSON puro)
const transportAudit = new DailyRotateFile({
  filename: path.join(logDir, 'auditoria-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d'
});

// Se crea el logger de auditoría con formato JSON puro para facilitar su análisis posterior,
// se almacena en un archivo separado para mantener la claridad entre los logs de sistema y los de auditoría. 
// Este logger se utilizará exclusivamente para registrar eventos de auditoría, como accesos, 
// cambios críticos y otras acciones relevantes para la seguridad y el cumplimiento normativo.
const auditLogger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),  // Agrega una marca de tiempo a cada entrada de log
    format.printf((info) => JSON.stringify(info, null, 2))  //formato json identado para facilitar su lectura y análisis posterior
  ),
  transports: [transportAudit]
});

// Exportamos ambos loggers como un objeto
module.exports = { logger, auditLogger };
