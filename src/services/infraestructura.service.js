const pool = require('../config/db');
const ApiError = require('../utils/ApiError');

class InfraestructuraService {
  // ================= INSTITUCIONES =================
  async crearInstitucion(datos) {
    const { rows } = await pool.query(
      'INSERT INTO instituciones (nombre, nit, direccion) VALUES ($1, $2, $3) RETURNING *',
      [datos.nombre, datos.nit, datos.direccion]
    );
    return rows[0];
  }

  async listarInstituciones() {
    const { rows } = await pool.query('SELECT * FROM instituciones ORDER BY id ASC');
    return rows;
  }

  async actualizarInstitucion(id, datos) {
    const { rows } = await pool.query(
      'UPDATE instituciones SET nombre = COALESCE($1, nombre), nit = COALESCE($2, nit), direccion = COALESCE($3, direccion) WHERE id = $4 RETURNING *',
      [datos.nombre, datos.nit, datos.direccion, id]
    );
    if (rows.length === 0) throw new ApiError(404, 'Institución no encontrada');
    return rows[0];
  }

  // ================= SEDES =================
  async crearSede(datos) {
    // Validar que la institución exista
    const { rows: inst } = await pool.query('SELECT id FROM instituciones WHERE id = $1', [
      datos.institucion_id
    ]);
    if (inst.length === 0) throw new ApiError(404, 'La institución indicada no existe');

    const { rows } = await pool.query(
      'INSERT INTO sedes (institucion_id, nombre, ubicacion) VALUES ($1, $2, $3) RETURNING *',
      [datos.institucion_id, datos.nombre, datos.ubicacion]
    );
    return rows[0];
  }

  async listarSedes() {
    // Usamos un JOIN para traer el nombre de la institución y que el Frontend lo muestre bonito
    const query = `
      SELECT s.*, i.nombre as institucion_nombre 
      FROM sedes s 
      JOIN instituciones i ON s.institucion_id = i.id 
      ORDER BY s.id ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async actualizarSede(id, datos) {
    const { rows } = await pool.query(
      'UPDATE sedes SET institucion_id = COALESCE($1, institucion_id), nombre = COALESCE($2, nombre), ubicacion = COALESCE($3, ubicacion) WHERE id = $4 RETURNING *',
      [datos.institucion_id, datos.nombre, datos.ubicacion, id]
    );
    if (rows.length === 0) throw new ApiError(404, 'Sede no encontrada');
    return rows[0];
  }

  async eliminarSede(id) {
    // Protección de integridad: ¿Tiene zonas de parqueo?
    const { rows: zonas } = await pool.query(
      'SELECT count(*) FROM zonas_parqueo WHERE sede_id = $1',
      [id]
    );
    if (parseInt(zonas[0].count) > 0) {
      throw new ApiError(
        400,
        'No se puede eliminar la sede porque tiene zonas de parqueo asociadas.'
      );
    }

    await pool.query('DELETE FROM sedes WHERE id = $1', [id]);
    return { message: 'Sede eliminada correctamente' };
  }
}

module.exports = new InfraestructuraService();
