const pool = require('../config/db');
const ApiError = require('../utils/ApiError');

class AccesoService {
  // LÓGICA DE VISITANTES (ESCANEO CON PLACA)
  async procesarEscaneoQR(qr_token, zona_id, guarda_id, observacion) {
    const cliente = await pool.connect();

    try {
      await cliente.query('BEGIN');

      const { rows: vehiculos } = await cliente.query(
        'SELECT id, tipo FROM vehiculos WHERE qr_token = $1',
        [qr_token]
      );
      if (vehiculos.length === 0) throw new ApiError(404, 'Vehículo no encontrado o QR inválido.');
      const vehiculo = vehiculos[0];

      const { rows: registrosActivos } = await cliente.query(
        'SELECT id, zona_id FROM registros_parqueo WHERE vehiculo_id = $1 AND fecha_salida IS NULL FOR UPDATE',
        [vehiculo.id]
      );

      // --- SALIDA ---
      if (registrosActivos.length > 0) {
        const registro = registrosActivos[0];

        // Actualizamos la fecha_salida
        await cliente.query(
          'UPDATE registros_parqueo SET fecha_salida = CURRENT_TIMESTAMP WHERE id = $1',
          [registro.id]
        );
        await cliente.query(
          'UPDATE zonas_parqueo SET cupos_ocupados = cupos_ocupados - 1 WHERE id = $1',
          [registro.zona_id]
        );

        await cliente.query('COMMIT');
        return { accion: 'SALIDA', mensaje: 'Salida registrada exitosamente.' };
      }

      // --- INGRESO ---
      const { rows: zonas } = await cliente.query(
        'SELECT capacidad_total, cupos_ocupados, tipo_permitido FROM zonas_parqueo WHERE id = $1 FOR UPDATE',
        [zona_id]
      );
      if (zonas.length === 0) throw new ApiError(404, 'La zona de parqueo indicada no existe.');
      const zona = zonas[0];

      if (zona.tipo_permitido !== vehiculo.tipo) {
        throw new ApiError(
          400,
          `Esta zona es exclusiva para ${zona.tipo_permitido}s. Vehículo detectado: ${vehiculo.tipo}`
        );
      }
      if (zona.cupos_ocupados >= zona.capacidad_total) {
        throw new ApiError(400, 'Acceso Denegado: La zona de parqueo está llena.');
      }

      // --- EL NUEVO INSERT CON TODOS LOS CAMPOS REQUERIDOS ---
      await cliente.query(
        `INSERT INTO registros_parqueo (vehiculo_id, zona_id, usuario_admin_id, fecha_entrada, observacion) 
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)`,
        [vehiculo.id, zona_id, guarda_id, observacion || null]
      );

      await cliente.query(
        'UPDATE zonas_parqueo SET cupos_ocupados = cupos_ocupados + 1 WHERE id = $1',
        [zona_id]
      );

      await cliente.query('COMMIT');
      return { accion: 'INGRESO', mensaje: 'Ingreso autorizado.' };
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw error;
    } finally {
      cliente.release(); // Siempre liberamos la conexión
    }
  }

  // LÓGICA DE VISITANTES (CON PLACA)
  async procesarVisitante(placa, zona_id, guarda_id, observacion) {
    const cliente = await pool.connect();

    try {
      await cliente.query('BEGIN');

      // 1. Verificar si la placa YA ESTÁ ADENTRO como visitante
      const { rows: visitantesActivos } = await cliente.query(
        'SELECT id, zona_id FROM visitantes_parqueo WHERE placa = $1 AND fecha_salida IS NULL FOR UPDATE',
        [placa]
      );

      // --- ESCENARIO A: EL VISITANTE VA A SALIR ---
      if (visitantesActivos.length > 0) {
        const registro = visitantesActivos[0];

        // Marcamos la salida
        await cliente.query(
          'UPDATE visitantes_parqueo SET fecha_salida = CURRENT_TIMESTAMP WHERE id = $1',
          [registro.id]
        );

        // Liberamos el cupo en la zona
        await cliente.query(
          'UPDATE zonas_parqueo SET cupos_ocupados = cupos_ocupados - 1 WHERE id = $1',
          [registro.zona_id]
        );

        await cliente.query('COMMIT');
        return {
          accion: 'SALIDA',
          mensaje: `Salida del visitante con placa ${placa} registrada exitosamente.`
        };
      }

      // --- ESCENARIO B: EL VISITANTE VA A ENTRAR ---
      // Bloqueamos la zona para asegurar el cupo
      const { rows: zonas } = await cliente.query(
        'SELECT capacidad_total, cupos_ocupados FROM zonas_parqueo WHERE id = $1 FOR UPDATE',
        [zona_id]
      );

      if (zonas.length === 0) throw new ApiError(404, 'La zona de parqueo indicada no existe.');
      const zona = zonas[0];

      // Validar si hay cupo
      if (zona.cupos_ocupados >= zona.capacidad_total) {
        throw new ApiError(400, 'Acceso Denegado: La zona de parqueo está llena.');
      }

      // Insertar el nuevo visitante
      await cliente.query(
        `INSERT INTO visitantes_parqueo (placa, zona_id, usuario_admin_id, fecha_entrada, observacion) 
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)`,
        [placa, zona_id, guarda_id, observacion || null]
      );

      // Ocupar el cupo restando a la disponibilidad de la zona
      await cliente.query(
        'UPDATE zonas_parqueo SET cupos_ocupados = cupos_ocupados + 1 WHERE id = $1',
        [zona_id]
      );

      await cliente.query('COMMIT');
      return {
        accion: 'INGRESO',
        mensaje: `Ingreso autorizado para visitante con placa ${placa}.`
      };
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw error;
    } finally {
      cliente.release(); // Siempre liberamos la conexión
    }
  }

  // HISTORIAL DE ACCESOS (ESTUDIANTES/DOCENTES)
  async obtenerMiHistorial(persona_id) {
    const query = `
      SELECT r.id, r.fecha_entrada, r.fecha_salida, z.nombre AS zona, v.placa, v.tipo 
      FROM registros_parqueo r
      INNER JOIN vehiculos v ON r.vehiculo_id = v.id
      INNER JOIN zonas_parqueo z ON r.zona_id = z.id
      WHERE v.persona_id = $1
      ORDER BY r.fecha_entrada DESC
      LIMIT 50
    `;
    const { rows } = await pool.query(query, [persona_id]);
    return rows;
  }
}

module.exports = new AccesoService();
