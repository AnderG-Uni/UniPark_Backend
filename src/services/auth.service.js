const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

class AuthService {

  async login(correo, clavePlana) {
    const query = 'SELECT id, persona_id, correo, clave, rol FROM usuarios WHERE correo = $1';
    const { rows } = await pool.query(query, [correo]);
    const usuario = rows[0];

    if (!usuario) throw new ApiError(401, 'Credenciales incorrectas');

    const claveValida = await bcrypt.compare(clavePlana, usuario.clave);
    if (!claveValida) throw new ApiError(401, 'Credenciales incorrectas');

    await pool.query(
      'UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = $1', 
      [usuario.id]
    );

    // 2. A Metemos los datos dentro del payload del Token
    const accessToken = jwt.sign(
      { id: usuario.id, persona_id: usuario.persona_id, rol: usuario.rol },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRATION }
    );

    const refreshToken = jwt.sign({ id: usuario.id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION
    });

    delete usuario.clave;
    return { usuario, accessToken, refreshToken };
  }

  async renovarToken(refreshToken) {
    if (!refreshToken) throw new ApiError(401, 'Refresh Token no proporcionado');

    try {
      const decodificado = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Opcional: Verificar si el usuario aún existe en la BD
      const { rows } = await pool.query('SELECT id, rol FROM usuarios WHERE id = $1', [
        decodificado.id
      ]);
      if (rows.length === 0) throw new ApiError(401, 'El usuario ya no existe');

      const nuevoAccessToken = jwt.sign(
        { id: rows[0].id, rol: rows[0].rol },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRATION }
      );

      return nuevoAccessToken;
    } catch (error) {
      console.error({
        message: 'Error al renovar token',
        error: error.message,
        stack: error.stack
      });
      throw new ApiError(403, 'Refresh: Token inválido o expirado');
    }
  }

  async registroEstudiante(datos) {
    
    // 0. Validar si el correo ya existe ANTES de procesar lo demás
    const existe = await pool.query('SELECT id FROM usuarios WHERE correo = $1', [datos.correo]);
    if (existe.rows.length > 0) {
      throw new ApiError(400, 'El correo ya está registrado en el sistema.');
    }

    // 1. Encriptar la contraseña antes de abrir la transacción
    const salt = await bcrypt.genSalt(10);
    const claveHasheada = await bcrypt.hash(datos.clave, salt);

    // 2. Solicitar un cliente dedicado para la transacción
    const client = await pool.connect();

    try {
      await client.query('BEGIN'); // INICIA LA TRANSACCIÓN ACID

      // PASO A: Insertar la Persona y recuperar su ID
      const queryPersona = `
        INSERT INTO personas (
          nombres_completos, tipo_documento, numero_documento, 
          telefono, codigo_universitario, carrera_dependencia
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      const valoresPersona = [
        datos.nombres_completos, datos.tipo_documento, datos.numero_documento,
        datos.telefono, datos.codigo_universitario, datos.carrera_dependencia
      ];
      
      const resPersona = await client.query(queryPersona, valoresPersona);
      const nuevaPersonaId = resPersona.rows[0].id;

      // PASO B: Insertar el Usuario forzando el rol a 'Estudiante'
      const queryUsuario = `
        INSERT INTO usuarios (correo, clave, rol, persona_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, correo, rol
      `;
      const valoresUsuario = [datos.correo, claveHasheada, 'Estudiante', nuevaPersonaId];
      
      const resUsuario = await client.query(queryUsuario, valoresUsuario);

      await client.query('COMMIT'); // GUARDA TODO SI NO HUBO ERRORES

      return resUsuario.rows[0];

    } catch (error) {
      await client.query('ROLLBACK'); // DESHACE TODO SI ALGO FALLÓ
      
      // Validamos también si la base de datos se queja del número de documento duplicado
      if (error.code === '23505') {
        throw new ApiError(400, 'El documento de identidad o correo ya se encuentran registrados.');
      }
      throw error;
    } finally {
      client.release(); // Libera la conexión de vuelta al pool
    }
  }

}
module.exports = new AuthService();
