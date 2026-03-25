const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(
    ({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`
  )
);

// 1. Logger de Sistema (Conexiones y Errores generales)
const transportCombined = new DailyRotateFile({
  filename: path.join(logDir, 'sistema-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

const logger = createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    transportCombined,
    new transports.Console({ format: format.combine(format.colorize(), logFormat) })
  ]
});

// 2. NUEVO: Logger Exclusivo de Auditoría (Formato JSON puro)
const transportAudit = new DailyRotateFile({
  filename: path.join(logDir, 'auditoria-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d'
});

const auditLogger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    //format.json()
    format.printf((info) => JSON.stringify(info, null, 2))
  ),
  transports: [transportAudit]
});

// Exportamos ambos loggers como un objeto
module.exports = { logger, auditLogger };
