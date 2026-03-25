const { z } = require('zod');

const escaneoSchema = z.object({
  qr_token: z.string().uuid('Token de QR inválido'),
  zona_id: z.number().int().positive('La zona es obligatoria'),
  observacion: z.string().optional()
});

const visitanteSchema = z.object({
  placa: z.string().min(5, 'La placa debe tener al menos 5 caracteres').max(15).toUpperCase(),
  zona_id: z.number().int().positive('La zona es obligatoria'),
  observacion: z.string().optional()
});

module.exports = { escaneoSchema, visitanteSchema };
