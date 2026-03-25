const pool = require('../config/db');
const ApiError = require('../utils/ApiError');

class ZonaService {
  async crear(datos) {
    const query = `
      INSERT INTO zonas_parqueo (sede_id, nombre, codigo_zona, capacidad_total, tipo_permitido, descripcion, url_foto)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `;
    const valores = [
      datos.sede_id,
      datos.nombre,
      datos.codigo_zona,
      datos.capacidad_total,
      datos.tipo_permitido,
      datos.descripcion,
      datos.url_foto
    ];

    const { rows } = await pool.query(query, valores);
    return rows[0];
  }

  // LÓGICA CRÍTICA: Lista zonas y calcula cuántos cupos quedan libres
  async listarConDisponibilidad() {
    const query = `
      SELECT z.*, 
        (SELECT COUNT(*) FROM registros_parqueo r 
         WHERE r.zona_id = z.id AND r.fecha_salida IS NULL) as ocupados,
        z.capacidad_total - (SELECT COUNT(*) FROM registros_parqueo r 
                             WHERE r.zona_id = z.id AND r.fecha_salida IS NULL) as disponibles
      FROM zonas_parqueo z
      ORDER BY z.nombre ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async obtenerPorId(id) {
    const query = 'SELECT * FROM zonas_parqueo WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) throw new ApiError(404, 'Zona de parqueo no encontrada');
    return rows[0];
  }

  async actualizar(id, datos) {
    const query = `
      UPDATE zonas_parqueo 
      SET sede_id = COALESCE($1, sede_id), nombre = COALESCE($2, nombre), 
          codigo_zona = COALESCE($3, codigo_zona), capacidad_total = COALESCE($4, capacidad_total), 
          tipo_permitido = COALESCE($5, tipo_permitido), descripcion = COALESCE($6, descripcion)
      WHERE id = $7 RETURNING *
    `;
    const valores = [
      datos.sede_id,
      datos.nombre,
      datos.codigo_zona,
      datos.capacidad_total,
      datos.tipo_permitido,
      datos.descripcion,
      id
    ];
    const { rows } = await pool.query(query, valores);
    if (rows.length === 0) throw new ApiError(404, 'Zona no encontrada');
    return rows[0];
  }

  async eliminar(id) {
    // Antes de eliminar, verificar si hay vehículos adentro
    const { rows: ocupados } = await pool.query(
      'SELECT COUNT(*) FROM registros_parqueo WHERE zona_id = $1 AND fecha_salida IS NULL',
      [id]
    );
    if (parseInt(ocupados[0].count) > 0) {
      throw new ApiError(400, 'No se puede eliminar la zona porque aún tiene vehículos parqueados');
    }
    await pool.query('DELETE FROM zonas_parqueo WHERE id = $1', [id]);
    return true;
  }

  async actualizarFoto(id, rutaFotoNueva) {
    // 1. Buscar si ya tenía foto
    const { rows: resAnterior } = await pool.query(
      'SELECT url_foto FROM zonas_parqueo WHERE id = $1',
      [id]
    );
    const fotoAnterior = resAnterior[0]?.url_foto;

    // 2. Guardar la nueva ruta directamente en la BD
    const query = 'UPDATE zonas_parqueo SET url_foto = $1 WHERE id = $2 RETURNING *';
    const { rows } = await pool.query(query, [rutaFotoNueva, id]);

    // 3. Borrar la foto vieja del disco duro para no ocupar espacio
    if (fotoAnterior && fotoAnterior.startsWith('/assets/zonas/')) {
      const fs = require('fs');
      const path = require('path');
      const rutaFisicaAnterior = path.join(__dirname, '../', fotoAnterior);

      if (fs.existsSync(rutaFisicaAnterior)) fs.unlinkSync(rutaFisicaAnterior);
    }

    return rows[0];
  }
}

module.exports = new ZonaService();
