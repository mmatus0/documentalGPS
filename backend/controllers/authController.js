require('dotenv').config();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { correo, contrasenia } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT * FROM usuario WHERE correo = ? AND estado_id = 1',
      [correo]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const usuario = rows[0];
    const passwordValida = await bcrypt.compare(contrasenia, usuario.password_hash);

    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: usuario.id_usuario, rol_id: usuario.rol_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id_usuario,
        nombre: usuario.nombre_completo,
        correo: usuario.correo,
        rol_id: usuario.rol_id
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};