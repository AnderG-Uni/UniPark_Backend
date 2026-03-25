const { z } = require('zod');

const vehiculoSchema = z.object({
  placa: z.string().min(5, 'La placa debe tener al menos 5 caracteres').max(15).toUpperCase(),
  tipo: z.enum(['Bicicleta', 'Moto', 'Carro'], {
    required_error: 'El tipo de vehículo es obligatorio'
  }),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  color: z.string().optional(),
  url_foto: z.string().optional()
});

module.exports = { vehiculoSchema };
