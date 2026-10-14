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

// LISTAR USUARIOS (Con Paginación)
  // ==========================================
  async obtenerUsuarios(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      // 1. Contar el total de usuarios activos (cruzando con la tabla personas)
      const countQuery = `
        SELECT COUNT(*) 
        FROM usuarios u
        JOIN personas p ON u.persona_id = p.id
        WHERE p.estado = 'Activo'
      `;
      const countResult = await pool.query(countQuery);
      const totalRegistros = parseInt(countResult.rows[0].count);

      // 2. Consultar solo los usuarios de la página actual
      const query = `
        SELECT u.id, u.persona_id, u.correo, u.rol, u.ultimo_login 
        FROM usuarios u
        JOIN personas p ON u.persona_id = p.id
        WHERE p.estado = 'Activo'
        ORDER BY u.id DESC
        LIMIT $1 OFFSET $2
      `;
      const { rows } = await pool.query(query, [limit, offset]);

      // 3. Retornar el formato estructurado con metadatos
      return {
        data: rows,
        meta: {
          total: totalRegistros,
          paginaActual: page,
          totalPaginas: Math.ceil(totalRegistros / limit) || 1,
        }
      };
    } catch (error) {
      console.error('Error en obtenerUsuarios:', error.message);
      throw new ApiError(500, 'Error interno al consultar el listado de usuarios.');
    }
  }

  async actualizarUsuario(id, datos) {
    const { correo, rol, clave } = datos;
    let query = '';
    let params = [];

    // Si el administrador envió una nueva clave, hay que encriptarla
    if (clave && clave.trim() !== '') {
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

  // En caso de querer eliminar completamente un usuario de la base de datos por la ley de protección de datos, se puede usar este método:
  async eliminarUsuario(id) {
    const query = 'DELETE FROM usuarios WHERE id = $1 RETURNING id';
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) throw new ApiError(404, 'Usuario no encontrado');
    return true;
  }


  // ELIMINAR USUARIO (Borrado Lógico)
  async eliminarUsuario(id) {
    try {
      // Actualizamos 'estado' en 'personas' usando el ID que viene de 'usuarios'.
      const query = `
        UPDATE personas 
        SET estado = 'Inactivo' 
        FROM usuarios 
        WHERE personas.id = usuarios.persona_id 
          AND usuarios.id = $1 
        RETURNING usuarios.id
      `;
      
      const { rows } = await pool.query(query, [id]);
      
      // Si no retorna filas, significa que el ID no existe
      if (rows.length === 0) {
        throw new ApiError(404, 'Usuario no encontrado o ya fue inhabilitado');
      }
      
      return true;
    } catch (error) {
      console.error('Error en eliminarUsuario:', error.message);
      // Si es un error controlado (como el 404 de arriba), lo dejamos pasar
      if (error instanceof ApiError) throw error;
      // Si es un error de BD, lanzamos un 500 genérico por seguridad
      throw new ApiError(500, 'Error interno al intentar inhabilitar el usuario.');
    }
  }
}

module.exports = new UsuarioService();
