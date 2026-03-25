const { z } = require('zod');

const registrarUsuarioSchema = z.object({
  correo: z.string().email('El correo no es válido'),
  clave: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['Administrador', 'Guarda', 'Estudiante', 'Docente', 'Administrativo', 'Personal']),
  persona_id: z.number().positive('El ID de persona debe ser válido')
});

const loginSchema = z.object({
  correo: z.string().email('El correo no es válido'),
  clave: z.string().min(1, 'La contraseña es obligatoria')
});

module.exports = { registrarUsuarioSchema, loginSchema };
