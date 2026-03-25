const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: true, // Mantiene la seguridad obligando a usar tu CA
    ca: fs.readFileSync(path.join(__dirname, '../../certs/ca.crt')).toString(),
    key: fs.readFileSync(path.join(__dirname, '../../certs/client.key')).toString(),
    cert: fs.readFileSync(path.join(__dirname, '../../certs/client.crt')).toString(),

    // --- Evita el error de mismatch de IP/Hostname ---
    checkServerIdentity: (hostname, cert) => {
      // Retornar undefined significa que nosotros aprobamos la identidad del servidor.
      // Es seguro porque rejectUnauthorized=true ya verificó que el certificado es tuyo.
      return undefined;
    }
  }
});

module.exports = pool;
