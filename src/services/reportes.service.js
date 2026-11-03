const pool = require('../config/db');
const ApiError = require('../utils/ApiError');

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
  try {
    const query = `
      WITH categorias AS (
        -- Todas las clasificaciones oficiales
        SELECT
            'Oficial - ' || t.tipo::TEXT AS categoria
        FROM unnest(enum_range(NULL::tipo_vehiculo)) AS t(tipo)

        UNION ALL

        SELECT 'Visitante'
      ),

      vehiculos_dentro AS (

          -- ==========================================
          -- VEHÍCULOS OFICIALES
          -- ==========================================

          SELECT
              'Oficial - ' || v.tipo::TEXT AS categoria,
              r.fecha_entrada AS fecha_ingreso,

              jsonb_build_object(
                  'registro_id', r.id,
                  'vehiculo_id', v.id,
                  'placa', v.placa,
                  'propietario', p.nombres_completos,
                  'marca', v.marca,
                  'modelo', v.modelo,
                  'color', v.color,
                  'tipo_vehiculo', v.tipo::TEXT,
                  'fecha_ingreso', r.fecha_entrada,
                  'qr_token', v.qr_token,
                  'url_foto', v.url_foto,
                  'codigo_zona', z.codigo_zona,
                  'zona', z.nombre
              ) AS detalle

          FROM registros_parqueo r

          INNER JOIN vehiculos v
              ON r.vehiculo_id = v.id

          LEFT JOIN personas p
              ON v.persona_id = p.id

          LEFT JOIN zonas_parqueo z
              ON r.zona_id = z.id

          WHERE r.fecha_salida IS NULL


          UNION ALL


          -- ==========================================
          -- VEHÍCULOS VISITANTES
          -- ==========================================

          SELECT
              'Visitante' AS categoria,
              vp.fecha_entrada AS fecha_ingreso,

              jsonb_build_object(
                  'registro_id', vp.id,
                  'vehiculo_id', NULL,
                  'placa', vp.placa,
                  'propietario', NULL,
                  'marca', NULL,
                  'modelo', NULL,
                  'color', NULL,
                  'tipo_vehiculo', vp.tipo_vehiculo::TEXT,
                  'fecha_ingreso', vp.fecha_entrada,
                  'qr_token', NULL,
                  'url_foto', vp.url_foto,
                  'observacion', vp.observacion,
                  'codigo_zona', z.codigo_zona,
                  'zona', z.nombre
              ) AS detalle

          FROM visitantes_parqueo vp

          LEFT JOIN zonas_parqueo z
              ON vp.zona_id = z.id

          WHERE vp.fecha_salida IS NULL
      )

      -- ==========================================
      -- RESULTADO AGRUPADO
      -- ==========================================

      SELECT
          c.categoria,

          COUNT(vd.detalle) AS cantidad,

          COALESCE(
              jsonb_agg(
                  vd.detalle
                  ORDER BY vd.fecha_ingreso DESC
              ) FILTER (
                  WHERE vd.detalle IS NOT NULL
              ),
              '[]'::JSONB
          ) AS vehiculos

      FROM categorias c

      LEFT JOIN vehiculos_dentro vd
          ON c.categoria = vd.categoria

      GROUP BY c.categoria

      ORDER BY cantidad DESC, c.categoria ASC;
    `;

    const { rows } = await pool.query(query);

    return rows;

  } catch (error) {
    console.error(
      'Error BD en reporteDistribucion:',
      error.message
    );

    throw new ApiError(
      500,
      'Error al obtener la distribución de vehículos dentro de la institución.'
    );
  }
}

  // 3. Auditoría de Guardas (Productividad)
  async reporteAuditoriaGuardas() {
    const query = `
      SELECT 
        
        u.correo,
        COUNT(rp.id) AS ingresos_oficiales,
        COUNT(vp.id) AS ingresos_visitantes,
        (COUNT(rp.id) + COUNT(vp.id)) AS total_gestionado
      FROM usuarios u
      LEFT JOIN registros_parqueo rp ON rp.usuario_admin_id = u.id
      LEFT JOIN visitantes_parqueo vp ON vp.usuario_admin_id = u.id
      WHERE u.rol = 'Guarda' OR u.rol = 'Administrador'
      GROUP BY u.id,  u.correo
      ORDER BY total_gestionado DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  // 4. Ocupación de Zonas en Tiempo Real
  async reporteOcupacionZonas() {
    const query = `
    SELECT 
      z.id,
      z.nombre AS zona,
      z.tipo_permitido,
      z.capacidad_total,
      z.cupos_ocupados,
      z.sede_id,
      s.nombre AS sede_nombre,
      ROUND((z.cupos_ocupados::numeric / z.capacidad_total::numeric) * 100, 2) AS porcentaje_ocupacion
    FROM zonas_parqueo z
    JOIN sedes s ON z.sede_id = s.id
    ORDER BY porcentaje_ocupacion DESC;
  `;

    const { rows } = await pool.query(query);
    return rows;
  }

// 5. Alerta de Pernoctas (Vehículos abandonados o que no registraron salida > 12 horas)
  async reportePernoctas() {
    try {
      const query = `
        SELECT 
          'Oficial' AS tipo, 
          v.id AS vehiculo_id, 
          v.placa, 
          v.url_foto, 
          s.nombre AS sede,
          z.nombre AS parqueadero,
          r.fecha_entrada, 
          EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - r.fecha_entrada))/3600 AS horas_adentro
        FROM registros_parqueo r
        JOIN vehiculos v ON r.vehiculo_id = v.id
        LEFT JOIN zonas_parqueo z ON r.zona_id = z.id
        LEFT JOIN sedes s ON z.sede_id = s.id
        WHERE r.fecha_salida IS NULL AND r.fecha_entrada < NOW() - INTERVAL '12 hours'
        
        UNION ALL
        
        SELECT 
          'Visitante' AS tipo, 
          NULL AS vehiculo_id, 
          vp.placa, 
          NULL AS url_foto, 
          s.nombre AS sede,
          z.nombre AS parqueadero,
          vp.fecha_entrada,
          EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - vp.fecha_entrada))/3600 AS horas_adentro
        FROM visitantes_parqueo vp
        LEFT JOIN zonas_parqueo z ON vp.zona_id = z.id
        LEFT JOIN sedes s ON z.sede_id = s.id
        WHERE vp.fecha_salida IS NULL AND vp.fecha_entrada < NOW() - INTERVAL '12 hours'
        ORDER BY horas_adentro DESC;
      `;
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error en reportePernoctas:', error.message);
      throw new Error('Error al generar el reporte de pernoctas');
    }
  }
}

module.exports = new ReportesService();
