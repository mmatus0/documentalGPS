const db = require('../config/db');

// ──────────────────────────────────────────────
// CATEGORÍAS
// ──────────────────────────────────────────────

exports.getCategorias = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.nombre, c.descripcion, c.estado_id,
              e.nombre AS estado,
              COUNT(s.id) AS total_subtipos
       FROM categoria c
       JOIN estado e ON c.estado_id = e.id
       LEFT JOIN subtipo s ON s.categoria_id = c.id AND s.estado_id = 1
       GROUP BY c.id
       ORDER BY c.nombre`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearCategoria = async (req, res) => {
  const { nombre, descripcion } = req.body;

  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO categoria (nombre, descripcion, estado_id) VALUES (?, ?, 1)',
      [nombre.trim(), descripcion?.trim() || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Categoría creada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.editarCategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;

  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
  }

  try {
    const [result] = await db.query(
      'UPDATE categoria SET nombre = ?, descripcion = ? WHERE id = ?',
      [nombre.trim(), descripcion?.trim() || null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    res.json({ message: 'Categoría actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.desactivarCategoria = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE categoria SET estado_id = 2 WHERE id = ? AND estado_id = 1',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada o ya inactiva' });
    }
    res.json({ message: 'Categoría desactivada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.reactivarCategoria = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE categoria SET estado_id = 1 WHERE id = ? AND estado_id = 2',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada o ya activa' });
    }
    res.json({ message: 'Categoría reactivada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────
// SUBTIPOS
// ──────────────────────────────────────────────

exports.getSubtiposPorCategoria = async (req, res) => {
  const { categoriaId } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT s.id, s.nombre, s.estado_id, e.nombre AS estado
       FROM subtipo s
       JOIN estado e ON s.estado_id = e.id
       WHERE s.categoria_id = ?
       ORDER BY s.nombre`,
      [categoriaId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearSubtipo = async (req, res) => {
  const { categoriaId } = req.params;
  const { nombre } = req.body;

  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre del subtipo es obligatorio' });
  }

  try {
    // Verificar que la categoría existe y está activa
    const [cat] = await db.query(
      'SELECT id FROM categoria WHERE id = ? AND estado_id = 1',
      [categoriaId]
    );
    if (cat.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada o inactiva' });
    }

    const [result] = await db.query(
      'INSERT INTO subtipo (categoria_id, nombre, estado_id) VALUES (?, ?, 1)',
      [categoriaId, nombre.trim()]
    );
    res.status(201).json({ id: result.insertId, message: 'Subtipo creado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.editarSubtipo = async (req, res) => {
  const { categoriaId, subtipoId } = req.params;
  const { nombre } = req.body;

  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre del subtipo es obligatorio' });
  }

  try {
    const [result] = await db.query(
      'UPDATE subtipo SET nombre = ? WHERE id = ? AND categoria_id = ?',
      [nombre.trim(), subtipoId, categoriaId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Subtipo no encontrado' });
    }
    res.json({ message: 'Subtipo actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.desactivarSubtipo = async (req, res) => {
  const { categoriaId, subtipoId } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE subtipo SET estado_id = 2 WHERE id = ? AND categoria_id = ? AND estado_id = 1',
      [subtipoId, categoriaId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Subtipo no encontrado o ya inactivo' });
    }
    res.json({ message: 'Subtipo desactivado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.reactivarSubtipo = async (req, res) => {
  const { categoriaId, subtipoId } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE subtipo SET estado_id = 1 WHERE id = ? AND categoria_id = ? AND estado_id = 2',
      [subtipoId, categoriaId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Subtipo no encontrado o ya activo' });
    }
    res.json({ message: 'Subtipo reactivado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};