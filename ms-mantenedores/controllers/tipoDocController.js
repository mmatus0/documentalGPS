const db = require('../config/db');

exports.getTiposDocumento = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.id, t.nombre, t.descripcion, t.estado_id,
              e.nombre AS estado
       FROM tipo_documento t
       JOIN estado e ON t.estado_id = e.id
       ORDER BY t.nombre`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearTipoDocumento = async (req, res) => {
  const { nombre, descripcion } = req.body;

  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre del tipo de documento es obligatorio' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO tipo_documento (nombre, descripcion, estado_id) VALUES (?, ?, 1)',
      [nombre.trim(), descripcion?.trim() || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Tipo de documento creado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.editarTipoDocumento = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;

  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre del tipo de documento es obligatorio' });
  }

  try {
    const [result] = await db.query(
      'UPDATE tipo_documento SET nombre = ?, descripcion = ? WHERE id = ?',
      [nombre.trim(), descripcion?.trim() || null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tipo de documento no encontrado' });
    }
    res.json({ message: 'Tipo de documento actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.desactivarTipoDocumento = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE tipo_documento SET estado_id = 2 WHERE id = ? AND estado_id = 1',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tipo de documento no encontrado o ya inactivo' });
    }
    res.json({ message: 'Tipo de documento desactivado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.reactivarTipoDocumento = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE tipo_documento SET estado_id = 1 WHERE id = ? AND estado_id = 2',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tipo de documento no encontrado o ya activo' });
    }
    res.json({ message: 'Tipo de documento reactivado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};