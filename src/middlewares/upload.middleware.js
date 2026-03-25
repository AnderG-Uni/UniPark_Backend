const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

// 1. Filtro de seguridad (Solo aceptar imágenes)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'El archivo debe ser una imagen válida (JPG, PNG, etc).'), false);
  }
};

// 2. Configurar dónde y con qué nombre se guardan los archivos
const storageVehiculos = multer.diskStorage({
  destination: (req, file, cb) => {
    // Definimos la carpeta física
    const dir = path.join(__dirname, '../assets/vehiculos');
    // Si no existe, la creamos
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Generamos un nombre único: vehiculo-16789...-1234.jpg
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, 'vehiculo-' + uniqueSuffix + extension);
  }
});

// 3. Exportamos el middleware configurado (Límite de 5MB)
const uploadVehiculo = multer({
  storage: storageVehiculos,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// 4. Configuración para Zonas de Parqueo
const storageZonas = multer.diskStorage({
  destination: (req, file, cb) => {
    // Definimos la nueva carpeta física
    const dir = path.join(__dirname, '../assets/zonas');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, 'zona-' + uniqueSuffix + extension); // Prefijo 'zona-'
  }
});

//5. Exportamos el middleware configurado (Límite de 5MB)
const uploadZona = multer({
  storage: storageZonas,
  fileFilter: fileFilter, // Reutilizamos el mismo filtro de seguridad de imágenes
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = { uploadVehiculo, uploadZona };
