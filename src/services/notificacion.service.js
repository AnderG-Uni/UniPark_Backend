const pool = require('../config/db');
const ApiError = require('../utils/ApiError');
const { Expo } = require('expo-server-sdk');

// Inicializa el SDK de Expo (Usa el token de entorno si existe, si no, funciona gratis con límites estándar)
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

class NotificacionService {
  
  // ==========================================================
  // GUARDAR O ACTUALIZAR TOKEN PUSH DE UN USUARIO
  // ==========================================================
  async guardarPushToken(usuarioId, token) {
    if (!token) throw new ApiError(400, 'El token push es requerido');

    const query = `
      INSERT INTO dispositivos_push (usuario_id, token, activo, ultima_conexion)
      VALUES ($1, $2, true, CURRENT_TIMESTAMP)
      ON CONFLICT (token) 
      DO UPDATE SET 
        usuario_id = $1, 
        activo = true, 
        ultima_conexion = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [usuarioId, token]);
    return rows[0];
  }

  // ==========================================================
  // ENVIAR NOTIFICACIÓN PUSH A UNO O VARIOS USUARIOS (Tokens)
  // ==========================================================
  async enviarPush(tokens, titulo, cuerpo, datos = {}) {
    if (!tokens || tokens.length === 0) return;

    let messages = [];

    // 1. Construir los mensajes validando que el token sea de Expo
    for (let pushToken of tokens) {
      if (!Expo.isExpoPushToken(pushToken)) {
        console.warn(`[Push] Token inválido omitido: ${pushToken}`);
        continue;
      }
      messages.push({
        to: pushToken,
        sound: 'default',
        title: titulo,
        body: cuerpo,
        data: datos,
      });
    }

    

    // 2. Agrupar en Chunks (Expo exige enviar máximo 100 a la vez)
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];

    // 3. Enviar a los servidores de Expo
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('[Push] Error enviando lote de notificaciones:', error);
      }
    }
    return tickets;
  }

  // ==========================================================
  // NOTIFICAR AL DUEÑO DE UN VEHÍCULO (Ingresos/Salidas)
  // ==========================================================
  async notificarDuenioVehiculo(placa, sedeNombre, zonaNombre, tipoMovimiento) {
    try {
      console.log(`\n[Push] Iniciando proceso de notificación para vehículo: ${placa}`);
      
      const query = `
        SELECT dp.token, u.id AS usuario_id, p.nombres_completos 
        FROM dispositivos_push dp
        INNER JOIN usuarios u ON dp.usuario_id = u.id
        INNER JOIN personas p ON u.persona_id = p.id
        INNER JOIN vehiculos v ON v.persona_id = p.id
        WHERE v.placa = $1 AND dp.activo = true
      `;
      
      const { rows } = await pool.query(query, [placa]);
      
      if (rows.length === 0) {
        //console.log(`[Push] Abortado: No se encontró ningún Token Push activo para el dueño del vehículo ${placa}.`);
        //console.log(`[Push] Posible causa: El vehículo no pertenece a un usuario con sesión iniciada en la app.\n`);
        return;
      }

      const tokens = rows.map(r => r.token);
      //console.log(`[Push]  Se encontró el token del dueño (${rows[0].nombres_completos} - ID: ${rows[0].usuario_id}).`);

      const titulo = tipoMovimiento === 'ingreso' ? ' Ingreso Registrado' : ' Salida Registrada';
      const accion = tipoMovimiento === 'ingreso' ? 'ingresado a' : 'salido de';
      const cuerpo = `Tu vehículo de placa ${placa} ha ${accion} la sede ${sedeNombre} / (${zonaNombre}).`;

      //console.log(`[Push] Enviando mensaje a Expo: "${titulo}"...`);
      
      const tickets = await this.enviarPush(tokens, titulo, cuerpo, { placa, tipoMovimiento, sedeNombre });
      
      //console.log(`[Push] Resultado de Expo:`, tickets);
      
    } catch (error) {
      console.error(`[Push]  Error notificando movimiento del vehículo ${placa}:`, error);
    }
  }

  // ==========================================================
  // DESACTIVAR TOKEN PUSH (Cuando el usuario cierra sesión o [desinstala la app] - validar) 
  // ==========================================================
  async desactivarPushToken(token) {
    if (!token) return;
    const query = 'UPDATE dispositivos_push SET activo = false WHERE token = $1';
    await pool.query(query, [token]);
  }

}

module.exports = new NotificacionService();