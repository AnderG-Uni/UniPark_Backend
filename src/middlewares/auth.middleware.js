const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

const verificarToken = (req, res, next) => {
  // El token debe venir en el header: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'No autorizado. Token no proporcionado.'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodificado = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.usuario = decodificado; // Guardamos los datos del usuario en la request
    next();
  } catch (error) {
    console.error({
      message: 'Error al verificar token de autenticación',
      error: error.message,
      stack: error.stack
    });
    return next(new ApiError(401, 'Token inválido o expirado.'));
  }
};

const verificarCreacionRolesInternos = (req, res, next) => {
  const { rol } = req.body;

  // 1. Roles que CUALQUIERA puede crear desde la página de inicio (Registro público)
  const rolesPublicos = ['Estudiante', 'Docente'];

  // Si intentan crear un Estudiante o Docente, los dejamos pasar sin Token
  if (rolesPublicos.includes(rol)) {
    return next();
  }

  // 2. Si intentan crear Admin, Guarda, Directivo, Personal, etc... EXIGIMOS TOKEN
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // ¡Aquí es donde validamos la palabra Bearer!
    return next(
      new ApiError(401, 'No autorizado. Se requiere token válido para crear personal interno.')
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodificado = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    //Guardamos el usuario decodificado para que la auditoría lo lea
    req.usuario = decodificado;

    // 3. Verificamos que el dueño del token sea un Administrador
    if (decodificado.rol !== 'Administrador') {
      return next(
        new ApiError(403, 'Acceso denegado. Solo un Administrador puede crear este tipo de roles.')
      );
    }

    // Si es un Administrador legítimo, lo dejamos crear al nuevo Guarda/Directivo/Admin
    next();
  } catch (error) {
    console.error({
      message: 'Error al verificar token para creación de roles internos',
      error: error.message,
      stack: error.stack
    });
    return next(new ApiError(401, 'Token inválido o expirado.'));
  }
};

module.exports = { verificarToken, verificarCreacionRolesInternos };
