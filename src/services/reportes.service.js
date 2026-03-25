const pool = require('../config/db');

class ReportesService {
  // 1. Horas Pico (Combina Oficiales y Visitantes)
  async reporteHorasPico() {
    const query = `
      WITH TodosLosAccesos AS (
        SELECT fecha_entrada FROM registros_parqueo
        UNION ALL
        SELECT fecha_entrada FROM visitantes_parqueo
      )
      SELECT 
        EXTRACT(HOUR FROM fecha_entrada) AS hora_del_dia,
        COUNT(*) AS total_ingresos
      FROM TodosLosAccesos
      GROUP BY hora_del_dia
      ORDER BY hora_del_dia ASC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  // 2. Distribución por Tipo de Vehículo (Oficiales vs Visitantes)
  async reporteDistribucion() {
    const query = `
      SELECT 'Oficial - ' || v.tipo AS categoria, COUNT(r.id) AS cantidad
      FROM registros_parqueo r
      JOIN vehiculos v ON r.vehiculo_id = v.id
      GROUP BY v.tipo
      UNION ALL
      SELECT 'Visitante', COUNT(id) AS cantidad
      FROM visitantes_parqueo
      GROUP BY 'Visitante'
      ORDER BY cantidad DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  // 3. Auditoría de Guardas (Productividad)
  async reporteAuditoriaGuardas() {
    const query = `
      SELECT 
        u.nombre,
        u.email,
        COUNT(rp.id) AS ingresos_oficiales,
        COUNT(vp.id) AS ingresos_visitantes,
        (COUNT(rp.id) + COUNT(vp.id)) AS total_gestionado
      FROM usuarios u
      LEFT JOIN registros_parqueo rp ON rp.usuario_admin_id = u.id
      LEFT JOIN visitantes_parqueo vp ON vp.usuario_admin_id = u.id
      WHERE u.rol = 'Guarda' OR u.rol = 'Administrador'
      GROUP BY u.id, u.nombre, u.email
      ORDER BY total_gestionado DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  // 4. Ocupación de Zonas en Tiempo Real
  async reporteOcupacionZonas() {
    const query = `
      SELECT 
        z.nombre AS zona,
        z.tipo_permitido,
        z.capacidad_total,
        z.cupos_ocupados,
        ROUND((z.cupos_ocupados::numeric / z.capacidad_total::numeric) * 100, 2) AS porcentaje_ocupacion
      FROM zonas_parqueo z
      ORDER BY porcentaje_ocupacion DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  // 5. Alerta de Pernoctas (Vehículos abandonados o que no registraron salida > 12 horas)
  async reportePernoctas() {
    const query = `
      SELECT 
        'Oficial' AS tipo, v.placa, r.fecha_entrada, 
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - r.fecha_entrada))/3600 AS horas_adentro
      FROM registros_parqueo r
      JOIN vehiculos v ON r.vehiculo_id = v.id
      WHERE r.fecha_salida IS NULL AND r.fecha_entrada < NOW() - INTERVAL '12 hours'
      
      UNION ALL
      
      SELECT 
        'Visitante' AS tipo, placa, fecha_entrada,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - fecha_entrada))/3600 AS horas_adentro
      FROM visitantes_parqueo
      WHERE fecha_salida IS NULL AND fecha_entrada < NOW() - INTERVAL '12 hours'
      ORDER BY horas_adentro DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
}

module.exports = new ReportesService();
