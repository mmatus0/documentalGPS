const db = require('../config/db');

// ──────────────────────────────────────────────
// PROYECTOS
// ──────────────────────────────────────────────

exports.getProyectos = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.nombre, p.descripcion, p.fecha_inicio, p.estado_id,
              p.contratista_id,
              c.nombre AS contratista_nombre,
              e.nombre AS estado,
              COUNT(DISTINCT pa.area_id) AS total_areas
       FROM proyecto p
       JOIN contratista c ON p.contratista_id = c.id
       JOIN estado      e ON p.estado_id      = e.id
       LEFT JOIN proyecto_area pa ON pa.proyecto_id = p.id
       GROUP BY p.id
       ORDER BY c.nombre, p.nombre`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearProyecto = async (req, res) => {
  const { nombre, descripcion, fecha_inicio, contratista_id } = req.body;

  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre del proyecto es obligatorio' });
  }
  if (!contratista_id) {
    return res.status(400).json({ error: 'El contratista es obligatorio' });
  }

  try {
    const [cont] = await db.query(
      'SELECT id FROM contratista WHERE id = ? AND estado_id = 1',
      [contratista_id]
    );
    if (cont.length === 0) {
      return res.status(404).json({ error: 'Contratista no encontrado o inactivo' });
    }

    const [result] = await db.query(
      `INSERT INTO proyecto (nombre, descripcion, fecha_inicio, contratista_id, estado_id)
       VALUES (?, ?, ?, ?, 1)`,
      [nombre.trim(), descripcion?.trim() || null, fecha_inicio || null, contratista_id]
    );
    res.status(201).json({ id: result.insertId, message: 'Proyecto creado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.editarProyecto = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, fecha_inicio, contratista_id } = req.body;

  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre del proyecto es obligatorio' });
  }
  if (!contratista_id) {
    return res.status(400).json({ error: 'El contratista es obligatorio' });
  }

  try {
    const [result] = await db.query(
      `UPDATE proyecto SET nombre = ?, descripcion = ?, fecha_inicio = ?, contratista_id = ?
       WHERE id = ?`,
      [nombre.trim(), descripcion?.trim() || null, fecha_inicio || null, contratista_id, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    res.json({ message: 'Proyecto actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.desactivarProyecto = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE proyecto SET estado_id = 2 WHERE id = ? AND estado_id = 1',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado o ya inactivo' });
    }
    res.json({ message: 'Proyecto desactivado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.reactivarProyecto = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE proyecto SET estado_id = 1 WHERE id = ? AND estado_id = 2',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado o ya activo' });
    }
    res.json({ message: 'Proyecto reactivado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────
// ÁREAS ASOCIADAS AL PROYECTO (tabla proyecto_area)
// ──────────────────────────────────────────────

exports.getAreasPorProyecto = async (req, res) => {
  const { proyectoId } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT pa.id AS asociacion_id, a.id AS area_id, a.nombre AS area_nombre,
              c.nombre AS contratista_nombre
       FROM proyecto_area pa
       JOIN area        a ON pa.area_id        = a.id
       JOIN contratista c ON a.contratista_id  = c.id
       WHERE pa.proyecto_id = ?
       ORDER BY a.nombre`,
      [proyectoId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAreasDisponibles = async (req, res) => {
  const { proyectoId } = req.params;
  try {
    // Primero obtenemos el contratista del proyecto
    const [proj] = await db.query(
      'SELECT contratista_id FROM proyecto WHERE id = ?',
      [proyectoId]
    );
    if (proj.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    const contratistaId = proj[0].contratista_id;

    // Áreas activas del mismo contratista que no estén ya asociadas
    const [rows] = await db.query(
      `SELECT a.id, a.nombre
       FROM area a
       WHERE a.contratista_id = ?
         AND a.estado_id = 1
         AND a.id NOT IN (
           SELECT area_id FROM proyecto_area WHERE proyecto_id = ?
         )
       ORDER BY a.nombre`,
      [contratistaId, proyectoId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.asociarArea = async (req, res) => {
  const { proyectoId } = req.params;
  const { area_id } = req.body;

  if (!area_id) {
    return res.status(400).json({ error: 'area_id es obligatorio' });
  }

  try {
    await db.query(
      'INSERT INTO proyecto_area (proyecto_id, area_id) VALUES (?, ?)',
      [proyectoId, area_id]
    );
    res.status(201).json({ message: 'Área asociada al proyecto correctamente' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El área ya está asociada a este proyecto' });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.desasociarArea = async (req, res) => {
  const { proyectoId, asociacionId } = req.params;
  try {
    const [result] = await db.query(
      'DELETE FROM proyecto_area WHERE id = ? AND proyecto_id = ?',
      [asociacionId, proyectoId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Asociación no encontrada' });
    }
    res.json({ message: 'Área desasociada del proyecto correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};