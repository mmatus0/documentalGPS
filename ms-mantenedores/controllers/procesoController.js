const db = require('../config/db');

exports.getProcesos = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.nombre, p.descripcion, p.estado_id,
              e.nombre AS estado,
              COUNT(DISTINCT a.id) AS total_areas
       FROM proceso p
       JOIN estado e ON p.estado_id = e.id
       LEFT JOIN area a ON a.proceso_id = p.id AND a.estado_id = 1
       GROUP BY p.id
       ORDER BY p.nombre`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearProceso = async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre del proceso es obligatorio' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO proceso (nombre, descripcion, estado_id) VALUES (?, ?, 1)`,
      [nombre.trim(), descripcion?.trim() || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Proceso creado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.editarProceso = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;
  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre del proceso es obligatorio' });
  }
  try {
    const [result] = await db.query(
      `UPDATE proceso SET nombre = ?, descripcion = ? WHERE id = ?`,
      [nombre.trim(), descripcion?.trim() || null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Proceso no encontrado' });
    }
    res.json({ message: 'Proceso actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.desactivarProceso = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      `UPDATE proceso SET estado_id = 2 WHERE id = ? AND estado_id = 1`,
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Proceso no encontrado o ya inactivo' });
    }
    res.json({ message: 'Proceso desactivado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.reactivarProceso = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      `UPDATE proceso SET estado_id = 1 WHERE id = ? AND estado_id = 2`,
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Proceso no encontrado o ya activo' });
    }
    res.json({ message: 'Proceso reactivado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};