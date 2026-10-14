const cron = require('node-cron');
const pool = require('../config/db');
const notificacionService = require('../services/notificacion.service');

// Tarea programada: Se ejecuta CADA HORA en punto (ej: 1:00, 2:00, 3:00)
// Patrón cron: '0 * * * *'
const iniciarCronJobs = () => {
  cron.schedule('14 * * * *', async () => {
    console.log('[CronJob] Iniciando verificación de vehículos en pernocta/abandono...');

    try {
      // Extraemos el límite del .env (Ej: 12 horas) o usamos 12 por defecto
      const horasLimite = parseFloat(process.env.PERNOCTA_HORAS_LIMITE || 12);
      
      // 1. BUSCAR VEHÍCULOS EN PERNOCTA (Alineado con el nuevo esquema de BD)
      // Relación: registros_parqueo -> vehiculos -> personas -> usuarios
      const query = `
        SELECT 
          r.id AS registro_id, 
          v.placa, 
          z.nombre AS zona_nombre, 
          s.nombre AS sede_nombre,
          u.id AS dueno_id 
        FROM registros_parqueo r
        INNER JOIN vehiculos v ON r.vehiculo_id = v.id
        INNER JOIN personas p ON v.persona_id = p.id
        INNER JOIN usuarios u ON u.persona_id = p.id
        INNER JOIN zonas_parqueo z ON r.zona_id = z.id
        INNER JOIN sedes s ON z.sede_id = s.id
        WHERE r.fecha_entrada <= NOW() - INTERVAL '${horasLimite} hours'
        AND r.fecha_salida IS NULL
      `;
      
      const { rows: pernoctas } = await pool.query(query);

      if (pernoctas.length === 0) {
        console.log('[CronJob] No se detectaron vehículos en olvido.');
        return;
      }

      console.log(`[CronJob] Se detectaron ${pernoctas.length} vehículos en olvido. Enviando alertas...`);

      // 2. PROCESAR CADA VEHÍCULO DETECTADO
      for (let vehiculo of pernoctas) {
        
        // A) Alertar al Dueño del vehículo
        const queryDueno = 'SELECT token FROM dispositivos_push WHERE usuario_id = $1 AND activo = true';
        const tokensDueno = await pool.query(queryDueno, [vehiculo.dueno_id]);
        
        if (tokensDueno.rows.length > 0) {
          await notificacionService.enviarPush(
            tokensDueno.rows.map(t => t.token), 
            '⚠️ Vehículo en olvido.', 
            `Tu vehículo con registro ${vehiculo.placa} lleva más de ${horasLimite} horas en ${vehiculo.sede_nombre} en la zona (${vehiculo.zona_nombre}).`,
            { placa: vehiculo.placa, tipo: 'alerta_pernocta' }
          );
        }

        // B) Alertar a los Guardas y Administradores
        const queryGuardas = `
          SELECT d.token 
          FROM dispositivos_push d 
          INNER JOIN usuarios u ON d.usuario_id = u.id 
          WHERE u.rol IN ('Guarda', 'Administrador') 
          AND d.activo = true
        `;
        const tokensGuardas = await pool.query(queryGuardas);
        
        if (tokensGuardas.rows.length > 0) {
          await notificacionService.enviarPush(
            tokensGuardas.rows.map(t => t.token), 
            '🚨 Alerta de Abandono', 
            `El vehículo ${vehiculo.placa} superó las ${horasLimite} horas en ${vehiculo.sede_nombre} (${vehiculo.zona_nombre}).`,
            { placa: vehiculo.placa, tipo: 'alerta_abandono_admin' }
          );
        }
      }

      console.log('[CronJob] Alertas de vehículos en olvido enviadas con éxito.');

    } catch (error) {
      console.error('[CronJob] Error verificando vehículos en olvido:', error);
    }
  });

  console.log('[Sistema] Módulo CronJobs:  (Tareas automatizadas) inicializado.');
};

module.exports = {
  iniciarCronJobs
};