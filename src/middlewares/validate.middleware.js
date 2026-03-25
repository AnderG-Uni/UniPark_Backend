const validarEsquema = (schema) => (req, res, next) => {
  // safeParse evalúa los datos sin lanzar excepciones (evita el crash)
  const validacion = schema.safeParse(req.body);

  if (!validacion.success) {
    // Extraemos los errores de forma 100% segura usando validacion.error.issues
    const mensajes = validacion.error.issues.map(
      (issue) => `${issue.path.join('.') || 'Campo'}: ${issue.message}`
    );

    return res.status(400).json({
      success: false,
      message: 'Error de validación en los datos enviados.',
      errors: mensajes
    });
  }

  // Si todo está bien, pasamos los datos limpios al controlador
  req.body = validacion.data;
  next();
};

module.exports = { validarEsquema };
