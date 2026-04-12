const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.createUser = async (req, res) => {
  const { nombre, correo, contrasenia, rol_id } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(contrasenia, salt);

    await db.query(
      'INSERT INTO usuario (nombre, correo, contrasenia, estado_id, rol_id) VALUES (?, ?, ?, ?, ?)',
      [nombre, correo, hashPassword, 1, rol_id]
    );

    res.status(201).json({ message: "Usuario creado con éxito" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id_usuario, nombre, correo, estado_id, rol_id FROM usuario'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { nombre, correo, rol_id } = req.body;
  try {
    const sql = `UPDATE usuario SET nombre = '${nombre}', correo = '${correo}', rol_id = ${Number(rol_id)} WHERE id_usuario = ${Number(id)}`;
    await db.query(sql);
    res.json({ message: "Usuario actualizado con éxito" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    // Cambiamos el estado a 2 (Inactivo) en lugar de hacer DELETE
    await db.query('UPDATE usuario SET estado_id = 2 WHERE id_usuario = ?', [id]);
    res.json({ message: "Usuario desactivado con éxito" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.reactivarUser = async (req, res) => {
  const { id } = req.params;
  try {
    // Cambiamos el estado a 1 (Activo) para reactivar al usuario
    await db.query('UPDATE usuario SET estado_id = 1 WHERE id_usuario = ?', [id]);
    res.json({ message: "Usuario reactivado con éxito" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}