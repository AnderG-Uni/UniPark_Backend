const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');

// Controlador para manejar el login, renovación de token
const login = async (req, res, next) => {
  try {
    const { correo, clave } = req.body;
    const { usuario, accessToken, refreshToken } = await authService.login(correo, clave);

    // Guardamos el Refresh Token en una Cookie Segura
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, // Inaccesible para JavaScript (Previene XSS)
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'strict', // Previene ataques CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días en milisegundos
    });

    res.status(200).json(new ApiResponse(200, { usuario, accessToken }, 'Login exitoso'));
  } catch (error) {
    next(error);
  }
};

// Controlador para renovar el Access Token usando el Refresh Token
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies; // Lo lee automáticamente gracias a cookie-parser
    const accessToken = await authService.renovarToken(refreshToken);

    res.status(200).json(new ApiResponse(200, { accessToken }, 'Token renovado'));
  } catch (error) {
    next(error);
  }
};

// Controlador para cerrar sesión (Logout)
const logout = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken'); // Destruye la sesión
    res.status(200).json(new ApiResponse(200, null, 'Sesión cerrada correctamente'));
  } catch (error) {
    next(error);
  }
};

module.exports = { login, refresh, logout };
