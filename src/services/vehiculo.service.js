const pool = require('../config/db');
const ApiError = require('../utils/ApiError');

// Creamos la variable 'self' que la librería espera encontrar
if (typeof global.self === 'undefined') {
  global.self = global;
}
const QRCodeStyling = require('qr-code-styling-node');
const nodeCanvas = require('canvas');
const path = require('path');

class VehiculoService {

  async crear(personaId, datos) {
    // 1. Validar límite de 2 vehículos
    const { rows: conteo } = await pool.query(
      'SELECT COUNT(*) FROM vehiculos WHERE persona_id = $1',
      [personaId]
    );
    if (parseInt(conteo[0].count) >= 2) {
      throw new ApiError(403, 'Has alcanzado el límite máximo de 2 vehículos registrados.');
    }

    // 2. Insertar en la BD y obtener el UUID (qr_token) generado automáticamente
    // Quitamos la columna 'url_qr' ya que usaremos el nuevo endpoint dinámico.
    const queryInsert = `
      INSERT INTO vehiculos (persona_id, placa, tipo, marca, modelo, color, url_foto)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, qr_token, placa
    `;
    const valores = [
      personaId,
      datos.placa,
      datos.tipo,
      datos.marca,
      datos.modelo,
      datos.color,
      datos.url_foto
    ];

    try {
      const { rows } = await pool.query(queryInsert, valores);
      const vehiculoNuevo = rows[0];

      // Construimos la URL dinámica que el frontend usará para cargar la imagen
      const urlQrDinamica = `/api/v1/vehiculos/qr/${vehiculoNuevo.qr_token}.png`;

      return { ...vehiculoNuevo, url_qr: urlQrDinamica };
    } catch (error) {
      if (error.code === '23505')
        throw new ApiError(400, 'Esta placa ya está registrada en el sistema.');
      throw error;
    }
  }

  // ---  Genera la imagen QR con estilo predefinido---
  async generarBufferImagenQR(qrToken) {
    // 1. Verificar que el token exista y traer la PLACA
    // 🪄 Cambiamos "SELECT 1" por "SELECT placa"
    const query = 'SELECT placa FROM vehiculos WHERE qr_token = $1';
    const { rows } = await pool.query(query, [qrToken]);
    if (rows.length === 0) throw new ApiError(404, 'Token QR inválido.');
    
    const placa = rows[0].placa; // 🪄 Guardamos la placa

    // 2. Configuración de diseño del QR
    const logoPath = path.join(__dirname, '../assets/logo_unipark.png');

    const qrApi = new QRCodeStyling({
      nodeCanvas: nodeCanvas, 
      width: 400,
      height: 400,
      data: qrToken, 
      margin: 5,
      dotsOptions: { color: '#000000', type: 'square' }, // Optimizado (Negro/Cuadrado)
      backgroundOptions: { color: '#ffffff' },
      imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 5 },
      image: logoPath,
      cornersSquareOptions: { color: '#E4AB10', type: 'square' }, 
      cornersDotOptions: { color: '#E4AB10', type: 'square' } 
    });

    // 3. Generar el QR base como Buffer
    const qrBuffer = await qrApi.getRawData('png');

    // =========================================================
    // 🪄 4. MAGIA CON CANVAS: Juntar el QR y el texto (CORREGIDO)
    // =========================================================
    
    // Configuramos un lienzo más alto usando TU variable 'nodeCanvas'
    const canvasWidth = 400;
    const canvasHeight = 460;
    const canvas = nodeCanvas.createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // A) Pintar todo el fondo de blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // B) Cargar la imagen del QR y pegarla arriba usando TU variable 'nodeCanvas'
    const qrImage = await nodeCanvas.loadImage(qrBuffer);
    ctx.drawImage(qrImage, 0, 0, 400, 400);

    // C) Escribir la Placa en el espacio en blanco de abajo
    ctx.fillStyle = '#000000'; // Color del texto (Negro)
    ctx.font = 'bold 36px sans-serif'; // Tamaño y tipo de fuente
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Posicionamos el texto justo en el centro del ancho y en el espacio inferior
    ctx.fillText(`PLACA: ${placa.toUpperCase()}`, canvasWidth / 2, 430);

    // 5. Convertir nuestro nuevo lienzo a un Buffer y retornarlo
    return canvas.toBuffer('image/png');
  }

  // (manten listarMisVehiculos y actualizar igual que antes) ...
  async listarMisVehiculos(personaId) {
    const { rows } = await pool.query('SELECT * FROM vehiculos WHERE persona_id = $1', [personaId]);
    // Construimos la URL dinámica al listar
    return rows.map((v) => ({ ...v, url_qr: `/api/v1/vehiculos/qr/${v.qr_token}.png` }));
  }

  // 
  async actualizar(id, datos) {
    const query = `
      UPDATE vehiculos 
      SET placa = COALESCE($1, placa), tipo = COALESCE($2, tipo), marca = COALESCE($3, marca), 
          modelo = COALESCE($4, modelo), color = COALESCE($5, color), url_foto = COALESCE($6, url_foto)
      WHERE id = $7 RETURNING *
    `;
    const valores = [
      datos.placa,
      datos.tipo,
      datos.marca,
      datos.modelo,
      datos.color,
      datos.url_foto,
      id
    ];
    const { rows } = await pool.query(query, valores);

    //--- MAGIA APLICADA: Construimos la URL dinámica antes de responder ---
    const vehiculoActualizado = rows[0];
    vehiculoActualizado.url_qr = `/api/v1/vehiculos/qr/${vehiculoActualizado.qr_token}.png`;

    return vehiculoActualizado;
  }

  // 1. Para el Administrador: Ver todos los vehículos con los datos de su dueño
  async listarTodos() {
    const query = `
      SELECT v.*, p.nombres_completos, p.numero_documento, p.codigo_universitario 
      FROM vehiculos v
      JOIN personas p ON v.persona_id = p.id
      ORDER BY v.fecha_registro DESC
    `;
    const { rows } = await pool.query(query);
    // Agregamos la URL dinámica a todos
    return rows.map((v) => ({ ...v, url_qr: `/api/v1/vehiculos/qr/${v.qr_token}.png` }));
  }

  // 2. Para el Dueño o Admin: Ver el detalle de un solo vehículo
  async obtenerPorId(id) {
    
    const query = `
      SELECT 
        v.*, 
        p.nombres_completos AS propietario_nombre,
        p.numero_documento AS propietario_documento,
        p.codigo_universitario
      FROM vehiculos v
      JOIN personas p ON v.persona_id = p.id
      WHERE v.id = $1
    `;
    
    const { rows } = await pool.query(query, [id]);
    
    if (rows.length === 0) throw new ApiError(404, 'Vehículo no encontrado');

    const vehiculo = rows[0];
    vehiculo.url_qr = `/api/v1/vehiculos/qr/${vehiculo.qr_token}.png`;
    return vehiculo;
  }

  // 3. Para el Dueño o Admin: Eliminar un vehículo
  async eliminar(id) {
    const { rows } = await pool.query('DELETE FROM vehiculos WHERE id = $1 RETURNING *', [id]);
    if (rows.length === 0) throw new ApiError(404, 'Vehículo no encontrado');
    return rows[0];
  }

  // 4. Para el Dueño: Actualizar la foto del vehículo (y borrar la anterior si existía)
  async actualizarFoto(id, rutaFotoNueva) {
    // 1. Obtener la foto anterior para borrarla y no acumular basura en el servidor
    const { rows: resAnterior } = await pool.query('SELECT url_foto FROM vehiculos WHERE id = $1', [
      id
    ]);
    const fotoAnterior = resAnterior[0]?.url_foto;

    // 2. Actualizar el registro en la base de datos
    const query = 'UPDATE vehiculos SET url_foto = $1 WHERE id = $2 RETURNING *';
    const { rows } = await pool.query(query, [rutaFotoNueva, id]);

    const vehiculoActualizado = rows[0];
    // Inyectamos el QR dinámico que arreglamos en el paso anterior
    vehiculoActualizado.url_qr = `/api/v1/vehiculos/qr/${vehiculoActualizado.qr_token}.png`;

    // 3. Borrar el archivo físico anterior de forma segura
    if (fotoAnterior && fotoAnterior.startsWith('/assets/vehiculos/')) {
      const fs = require('fs');
      const path = require('path');
      const rutaFisicaAnterior = path.join(__dirname, '../', fotoAnterior);

      if (fs.existsSync(rutaFisicaAnterior)) {
        fs.unlinkSync(rutaFisicaAnterior); // Borra el archivo
      }
    }

    return vehiculoActualizado;
  }

}

module.exports = new VehiculoService();
