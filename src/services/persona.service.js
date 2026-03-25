const pool = require('../config/db');
const ApiError = require('../utils/ApiError');

class PersonaService {
  async crearPersona(datos) {
    const {
      nombres_completos,
      tipo_documento,
      numero_documento,
      telefono,
      codigo_universitario,
      carrera_dependencia,
      institucion_id
    } = datos;

    // Verificar si el documento ya existe
    const existe = await pool.query('SELECT id FROM personas WHERE numero_documento = $1', [
      numero_documento
    ]);
    if (existe.rows.length > 0)
      throw new ApiError(400, 'El número de documento ya está registrado');

    const query = `
      INSERT INTO personas (
        nombres_completos, tipo_documento, numero_documento, 
        telefono, codigo_universitario, carrera_dependencia, institucion_id
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *;
    `;
    const valores = [
      nombres_completos,
      tipo_documento,
      numero_documento,
      telefono,
      codigo_universitario,
      carrera_dependencia,
      institucion_id
    ];

    const { rows } = await pool.query(query, valores);
    return rows[0];
  }

  async obtenerPersonas() {
    const query = 'SELECT * FROM personas ORDER BY id DESC';
    const { rows } = await pool.query(query);
    return rows;
  }

  async obtenerPersonaPorId(id) {
    const query = 'SELECT * FROM personas WHERE id = $1';
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) throw new ApiError(404, 'Persona no encontrada');
    return rows[0];
  }

  async actualizarPersona(id, datos) {
    // Verificamos que exista primero
    await this.obtenerPersonaPorId(id);

    const {
      nombres_completos,
      tipo_documento,
      numero_documento,
      telefono,
      codigo_universitario,
      carrera_dependencia
    } = datos;

    const query = `
      UPDATE personas 
      SET nombres_completos = $1, tipo_documento = $2, numero_documento = $3, 
          telefono = $4, codigo_universitario = $5, carrera_dependencia = $6
      WHERE id = $7 
      RETURNING *;
    `;
    const valores = [
      nombres_completos,
      tipo_documento,
      numero_documento,
      telefono,
      codigo_universitario,
      carrera_dependencia,
      id
    ];

    const { rows } = await pool.query(query, valores);
    return rows[0];
  }

  async eliminarPersona(id) {
    // Si la persona tiene un usuario o vehículo asociado y pusiste ON DELETE CASCADE en SQL, se borrarán también.
    const query = 'DELETE FROM personas WHERE id = $1 RETURNING id';
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) throw new ApiError(404, 'Persona no encontrada');
    return true;
  }
}

module.exports = new PersonaService();
