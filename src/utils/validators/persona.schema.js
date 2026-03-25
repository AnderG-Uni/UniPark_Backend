const { z } = require('zod');

const personaSchema = z.object({
  nombres_completos: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  tipo_documento: z.enum(['CC', 'TI', 'CE', 'Pasaporte'], {
    errorMap: () => ({ message: 'Tipo de documento inválido (CC, TI, CE, Pasaporte)' })
  }),
  numero_documento: z.string().min(5, 'El número de documento es muy corto'),
  telefono: z.string().optional(),
  codigo_universitario: z.string().optional(),
  carrera_dependencia: z.string().optional(),
  institucion_id: z.number().int().positive().optional() // Es opcional mientras creas el CRUD de instituciones
});

module.exports = { personaSchema };
