const { z } = require('zod');

const zonaSchema = z.object({
  sede_id: z.number().int().positive('La sede es obligatoria'),
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(50),
  codigo_zona: z.string().min(2, 'El código es obligatorio').max(10).toUpperCase(),
  capacidad_total: z.number().int().min(1, 'La capacidad debe ser al menos 1'),
  tipo_permitido: z.enum(['Carro', 'Moto', 'Bicicleta'], {
    required_error: 'El tipo de vehículo permitido es obligatorio'
  }),
  descripcion: z.string().optional(),
  url_foto: z.string().optional()
});

module.exports = { zonaSchema };
