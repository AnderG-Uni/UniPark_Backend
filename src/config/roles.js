// Definimos las acciones exactas que se pueden hacer en el sistema
const PERMISOS = {
  // Módulo Personas y Usuarios
  GESTIONAR_PERSONAS: 'GESTIONAR_PERSONAS', // Crear, editar, borrar personas (sin crear usuarios)
  GESTIONAR_USUARIOS: 'GESTIONAR_USUARIOS', // Crear, editar, borrar usuarios (asociados a personas), exclusivo del Admin

  // Módulo Parqueo
  ESCANEAR_QR: 'ESCANEAR_QR', // Escanear el QR para registrar entradas/salidas, exclusivo de los guardas
  REGISTRAR_VISITANTE: 'REGISTRAR_VISITANTE', // Registrar un visitante sin necesidad de crear un usuario
  VER_REPORTES: 'VER_REPORTES', // Exclusivo del Admin
  GESTIONAR_INFRAESTRUCTURA: 'GESTIONAR_INFRAESTRUCTURA', // Exclusivo del Admin

  // Módulo Vehículos
  VER_MIS_VEHICULOS: 'VER_MIS_VEHICULOS', // Ver solo los vehículos propios, no de otros usuarios
  CREAR_VEHICULO: 'CREAR_VEHICULO', // Crear solo vehículos propios, no de otros usuarios
  ACTUALIZAR_VEHICULO: 'ACTUALIZAR_VEHICULO', // Actualizar solo los vehículos propios, no de otros usuarios
  GESTIONAR_VEHICULOS: 'GESTIONAR_VEHICULOS', // Exclusivo del Admin
  VER_IMAGEN_QR: 'VER_IMAGEN_QR', // para servir la imagen dinámica

  // Módulo Zonas
  VER_ZONAS: 'VER_ZONAS', // Todos pueden ver las zonas, pero solo algunos roles pueden gestionarlas
  GESTIONAR_ZONAS: 'GESTIONAR_ZONAS' // Crear, editar, borrar
};

// Asignamos los permisos a cada rol de tu base de datos
const ROLES_PERMISOS = {
  Estudiante: [
    PERMISOS.CREAR_VEHICULO,
    PERMISOS.ACTUALIZAR_VEHICULO,
    PERMISOS.VER_MIS_VEHICULOS,
    PERMISOS.VER_IMAGEN_QR,
    PERMISOS.VER_ZONAS
  ],
  Docente: [
    PERMISOS.CREAR_VEHICULO,
    PERMISOS.ACTUALIZAR_VEHICULO,
    PERMISOS.VER_MIS_VEHICULOS,
    PERMISOS.VER_IMAGEN_QR,
    PERMISOS.VER_ZONAS
  ],
  Personal: [
    PERMISOS.CREAR_VEHICULO,
    PERMISOS.ACTUALIZAR_VEHICULO,
    PERMISOS.VER_MIS_VEHICULOS,
    PERMISOS.VER_IMAGEN_QR,
    PERMISOS.VER_ZONAS
  ],
  Guarda: [
    PERMISOS.ESCANEAR_QR,
    PERMISOS.REGISTRAR_VISITANTE,
    PERMISOS.VER_MIS_VEHICULOS,
    PERMISOS.VER_REPORTES,
    PERMISOS.VER_IMAGEN_QR,
    PERMISOS.VER_ZONAS
  ],
  Administrativo: [
    PERMISOS.CREAR_VEHICULO,
    PERMISOS.ACTUALIZAR_VEHICULO,
    PERMISOS.VER_MIS_VEHICULOS,
    PERMISOS.VER_IMAGEN_QR,
    PERMISOS.VER_ZONAS,
    PERMISOS.GESTIONAR_ZONAS,
    PERMISOS.GESTIONAR_INFRAESTRUCTURA
  ],
  Directivo: [
    PERMISOS.CREAR_VEHICULO,
    PERMISOS.VER_MIS_VEHICULOS,
    PERMISOS.VER_REPORTES,
    PERMISOS.VER_IMAGEN_QR,
    PERMISOS.VER_ZONAS,
    PERMISOS.GESTIONAR_ZONAS
  ],
  Administrador: Object.values(PERMISOS) // El administrador tiene acceso a TODO dinámicamente
};

module.exports = { PERMISOS, ROLES_PERMISOS };
