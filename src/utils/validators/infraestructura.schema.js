const { z } = require('zod');

const institucionSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
  nit: z.string().min(5, 'NIT inválido').max(20),
  direccion: z.string().optional()
});

const sedeSchema = z.object({
  institucion_id: z.number().int().positive('La institución es obligatoria'),
  nombre: z.string().min(3, 'El nombre de la sede es muy corto').max(100),
  ubicacion: z.string().optional()
});

module.exports = { institucionSchema, sedeSchema };
