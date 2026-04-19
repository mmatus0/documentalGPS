const db     = require('../config/db');
const bcrypt = require('bcryptjs');

exports.createUser = async (req, res) => {
  const { nombre, correo, contrasenia, rol_id } = req.body;
  try {
    const salt         = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(contrasenia, salt);

    await db.query(
      'INSERT INTO usuario (nombre_completo, correo, contrasenia, estado_id, rol_id) VALUES (?, ?, ?, 1, ?)',
      [nombre, correo, hashPassword, Number(rol_id)]
    );

    res.status(201).json({ message: 'Usuario creado con éxito' });
  } catch (error) {
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
      // Actualizar también la contraseña
      const salt         = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(contrasenia, salt);

      await db.query(
        'UPDATE usuario SET nombre_completo = ?, correo = ?, rol_id = ?, contrasenia = ? WHERE id = ?',
        [nombre, correo, Number(rol_id), hashPassword, Number(id)]
      );
    } else {
      // Solo actualizar datos generales
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