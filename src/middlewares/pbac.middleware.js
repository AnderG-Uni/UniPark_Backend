const { ROLES_PERMISOS } = require('../config/roles');
const ApiError = require('../utils/ApiError');

const requierePermiso = (permisoRequerido) => {
  return (req, res, next) => {
    // 1. Validar que el usuario esté autenticado (esto lo hace el auth.middleware antes)
    if (!req.usuario || !req.usuario.rol) {
      return next(new ApiError(401, 'Acceso denegado. Rol no identificado.'));
    }

    // 2. Extraer los permisos del rol actual
    const permisosDelRol = ROLES_PERMISOS[req.usuario.rol] || [];

    // 3. Verificar si tiene el permiso exacto
    if (!permisosDelRol.includes(permisoRequerido)) {
      return next(new ApiError(403, `Acceso denegado. Requiere el permiso: ${permisoRequerido}`));
    }

    // 4. Si todo está bien, pasa al controlador
    next();
  };
};

module.exports = { requierePermiso };
