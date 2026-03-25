const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

class AuthService {
  async login(correo, clavePlana) {
    const query = 'SELECT id, persona_id, correo, clave, rol FROM usuarios WHERE correo = $1';
    const { rows } = await pool.query(query, [correo]);
    const usuario = rows[0];

    if (!usuario) throw new ApiError(401, 'Credenciales incorrectas');

    const claveValida = await bcrypt.compare(clavePlana, usuario.clave);
    if (!claveValida) throw new ApiError(401, 'Credenciales incorrectas');

    // 2. A Metemos los datos dentro del payload del Token
    const accessToken = jwt.sign(
      { id: usuario.id, persona_id: usuario.persona_id, rol: usuario.rol },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRATION }
    );

    const refreshToken = jwt.sign({ id: usuario.id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION
    });

    delete usuario.clave;
    return { usuario, accessToken, refreshToken };
  }

  async renovarToken(refreshToken) {
    if (!refreshToken) throw new ApiError(401, 'Refresh Token no proporcionado');

    try {
      const decodificado = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Opcional: Verificar si el usuario aún existe en la BD
      const { rows } = await pool.query('SELECT id, rol FROM usuarios WHERE id = $1', [
        decodificado.id
      ]);
      if (rows.length === 0) throw new ApiError(401, 'El usuario ya no existe');

      const nuevoAccessToken = jwt.sign(
        { id: rows[0].id, rol: rows[0].rol },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRATION }
      );

      return nuevoAccessToken;
    } catch (error) {
      throw new ApiError(403, 'Refresh Token inválido o expirado');
    }
  }
}
module.exports = new AuthService();
