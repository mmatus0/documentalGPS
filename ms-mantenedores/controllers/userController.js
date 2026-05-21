const db     = require('../config/db');
const bcrypt = require('bcryptjs');

// Mínimo 8 caracteres, al menos una letra y un número
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

exports.createUser = async (req, res) => {
  const { nombre, correo, contrasenia, rol_id } = req.body;

  if (!nombre?.trim() || !correo?.trim() || !contrasenia || !rol_id) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  if (!PASSWORD_REGEX.test(contrasenia)) {
    return res.status(400).json({
      error: 'La contraseña debe tener mínimo 8 caracteres combinando letras y números'
    });
  }

  try {
    const salt         = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(contrasenia, salt);

    await db.query(
      'INSERT INTO usuario (nombre_completo, correo, password_hash, estado_id, rol_id) VALUES (?, ?, ?, 1, ?)',
      [nombre.trim(), correo.trim(), hashPassword, Number(rol_id)]
    );

    res.status(201).json({ message: 'Usuario creado con éxito' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El correo ya está registrado en el sistema' });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, rol_id, nombre_completo, correo, estado_id FROM usuario'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  const { id }                          = req.params;
  const { nombre, correo, rol_id, contrasenia } = req.body;

  try {
    if (contrasenia && contrasenia.trim() !== '') {
      if (!PASSWORD_REGEX.test(contrasenia)) {
        return res.status(400).json({
          error: 'La contraseña debe tener mínimo 8 caracteres combinando letras y números'
        });
      }
      const salt         = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(contrasenia, salt);

      await db.query(
        'UPDATE usuario SET nombre_completo = ?, correo = ?, rol_id = ?, password_hash = ? WHERE id = ?',
        [nombre, correo, Number(rol_id), hashPassword, Number(id)]
      );
    } else {
      await db.query(
        'UPDATE usuario SET nombre_completo = ?, correo = ?, rol_id = ? WHERE id = ?',
        [nombre, correo, Number(rol_id), Number(id)]
      );
    }

    res.json({ message: 'Usuario actualizado con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE usuario SET estado_id = 2 WHERE id = ?', [id]);
    res.json({ message: 'Usuario desactivado con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.reactivarUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE usuario SET estado_id = 1 WHERE id = ?', [id]);
    res.json({ message: 'Usuario reactivado con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};