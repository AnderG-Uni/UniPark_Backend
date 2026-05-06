const { z } = require('zod');

const registroEstudianteSchema = z.object({
  
    // Datos de Persona
    nombres_completos: z.string().min(3, 'El nombre es muy corto'),
    tipo_documento: z.enum(['CC', 'TI', 'CE', 'Pasaporte']),
    numero_documento: z.string().min(5, 'Documento inválido'),
    telefono: z.string().optional(),
    codigo_universitario: z.string().min(3, 'Código inválido'),
    carrera_dependencia: z.string().min(3, 'Carrera inválida'),
    // Credenciales de Usuario
    correo: z.string().email('Debe ser un correo válido'),
    clave: z.string().min(6, 'La clave debe tener al menos 6 caracteres')

});

module.exports = {
  // exporta también el loginSchema si lo tienes aquí
  registroEstudianteSchema
};