const pool = require('../config/db');
const bcrypt = require('bcrypt');
const ApiError = require('../utils/ApiError');

class UsuarioService {
  
  async crearUsuario(datos) {
    const { persona_id, correo, clave, rol } = datos;

    // Verificar si el correo ya existe
    const existe = await pool.query('SELECT id FROM usuarios WHERE correo = $1', [correo]);
    if (existe.rows.length > 0) throw new ApiError(400, 'El correo ya está registrado');

    // Encriptar contraseña (Costo 10 es el estándar recomendado)
    const salt = await bcrypt.genSalt(10);
    const claveHasheada = await bcrypt.hash(clave, salt);

    const query = `
      INSERT INTO usuarios (persona_id, correo, clave, rol) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, persona_id, correo, rol, ultimo_login;
    `;
    const { rows } = await pool.query(query, [persona_id, correo, claveHasheada, rol]);
    return rows[0];
  }

  async obtenerUsuarios() {
    // 🔥 AQUÍ ESTÁ LA MAGIA: Añadimos 'persona_id' al SELECT
    const query = 'SELECT id, persona_id, correo, rol, ultimo_login FROM usuarios';
    const { rows } = await pool.query(query);
    return rows;
  }

  async actualizarUsuario(id, datos) {
    const { correo, rol, clave } = datos;
    let query = '';
    let params = [];

    // Si el administrador envió una nueva clave, hay que encriptarla
    if (clave && clave.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      const claveHasheada = await bcrypt.hash(clave, salt);
      
      query = `
        UPDATE usuarios 
        SET correo = $1, rol = $2, clave = $3 
        WHERE id = $4 
        RETURNING id, correo, rol
      `;
      params = [correo, rol, claveHasheada, id];
    } else {
      // Si no envió clave, solo actualizamos correo y rol
      query = `
        UPDATE usuarios 
        SET correo = $1, rol = $2 
        WHERE id = $3 
        RETURNING id, correo, rol
      `;
      params = [correo, rol, id];
    }

    const { rows } = await pool.query(query, params);
    if (rows.length === 0) throw new ApiError(404, 'Usuario no encontrado');
    
    return rows[0];
  }

  async eliminarUsuario(id) {
    const query = 'DELETE FROM usuarios WHERE id = $1 RETURNING id';
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) throw new ApiError(404, 'Usuario no encontrado');
    return true;
  }
}

module.exports = new UsuarioService();