const pool = require('../config/db');
const ApiError = require('../utils/ApiError');

class HistorialService {
  
  // 1. Obtiene TODOS los registros (Para Admin y Guarda)
  async obtenerHistorialGlobal() {
    try {
      // 🪄 Hacemos JOIN con zonas, sedes y la persona/usuario (Guarda)
      const query = `
        SELECT 
            r.id, 
            v.placa as vehiculo, 
            s.nombre as sede, 
            z.nombre as zona,
            p_guarda.nombres_completos as guarda,
            r.fecha_entrada as fecha_ingreso, 
            r.fecha_salida, 
            'Usuario' as tipo
        FROM registros_parqueo r
        JOIN vehiculos v ON r.vehiculo_id = v.id
        JOIN zonas_parqueo z ON r.zona_id = z.id
        JOIN sedes s ON z.sede_id = s.id
        LEFT JOIN usuarios u_guarda ON r.usuario_admin_id = u_guarda.id
        LEFT JOIN personas p_guarda ON u_guarda.persona_id = p_guarda.id
        
        UNION ALL
        
        SELECT 
            vp.id, 
            vp.placa as vehiculo, 
            s.nombre as sede, 
            z.nombre as zona,
            p_guarda.nombres_completos as guarda,
            vp.fecha_entrada as fecha_ingreso, 
            vp.fecha_salida, 
            'Visitante' as tipo
        FROM visitantes_parqueo vp
        JOIN zonas_parqueo z ON vp.zona_id = z.id
        JOIN sedes s ON z.sede_id = s.id
        LEFT JOIN usuarios u_guarda ON vp.usuario_admin_id = u_guarda.id
        LEFT JOIN personas p_guarda ON u_guarda.persona_id = p_guarda.id
        
        ORDER BY fecha_ingreso DESC
      `;
      const { rows } = await pool.query(query);
      return rows;
      
    } catch (error) {
      console.error(' Error BD en obtenerHistorialGlobal:', error.message);
      throw new ApiError(500, 'Error interno al intentar obtener el historial global de parqueaderos.');
    }
  }

  // 2. Obtiene SOLO los registros propios (Para Estudiantes y Docentes)
  async obtenerHistorialPorPersona(persona_id) {
    // Protección Nivel 1: Evitar consultas inválidas a la BD
    if (!persona_id) {
      throw new ApiError(400, 'No se pudo identificar la persona asociada a la cuenta para cargar el historial.');
    }

    try {
      // 🪄 Agregamos los JOINs para Sede, Zona y Guarda
      const query = `
        SELECT 
            r.id, 
            v.placa as vehiculo, 
            s.nombre as sede, 
            z.nombre as zona,
            p_guarda.nombres_completos as guarda,
            r.fecha_entrada as fecha_ingreso, 
            r.fecha_salida, 
            'Usuario' as tipo
        FROM registros_parqueo r
        JOIN vehiculos v ON r.vehiculo_id = v.id
        JOIN zonas_parqueo z ON r.zona_id = z.id
        JOIN sedes s ON z.sede_id = s.id
        LEFT JOIN usuarios u_guarda ON r.usuario_admin_id = u_guarda.id
        LEFT JOIN personas p_guarda ON u_guarda.persona_id = p_guarda.id
        WHERE v.persona_id = $1
        ORDER BY fecha_ingreso DESC
      `;
      const { rows } = await pool.query(query, [persona_id]);
      return rows;

    } catch (error) {
      // Dejamos rastro en consola para debug interno
      console.error(` Error BD en obtenerHistorialPorPersona [ID: ${persona_id}]:`, error.message);
      // Lanzamos un error controlado hacia el controlador
      throw new ApiError(500, 'Error interno al intentar cargar tu historial personal.');
    }
  }

  // 3. Obtiene los últimos 50 inicios de sesión (Solo Administrador)
  async obtenerHistorialLogins() {
    try {
      const query = `
        SELECT id, correo, rol, ultimo_login 
        FROM usuarios 
        WHERE ultimo_login IS NOT NULL 
        ORDER BY ultimo_login DESC 
        LIMIT 50
      `;
      const { rows } = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error BD en obtenerHistorialLogins:', error.message);
      throw new ApiError(500, 'Error interno al intentar obtener el historial de accesos al sistema.');
    }
  }

}

module.exports = new HistorialService();