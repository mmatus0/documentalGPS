const db = require('../config/db');

// GET /api/etapas?proceso_id=X
exports.getEtapas = async (req, res) => {
  const { proceso_id } = req.query;
  try {
    const where = proceso_id ? 'WHERE e.proceso_id = ?' : '';
    const params = proceso_id ? [proceso_id] : [];
    const [rows] = await db.query(
      `SELECT e.id, e.proceso_id, e.titulo, e.secuencia,
              e.dias_revision, e.dias_aprobacion, e.requiere_aprobador,
              e.revisor_id,   ur.nombre_completo AS revisor_nombre,
              e.aprobador_id, ua.nombre_completo AS aprobador_nombre,
              p.nombre AS proceso_nombre
       FROM etapa e
       JOIN proceso p  ON e.proceso_id   = p.id
       JOIN usuario ur ON e.revisor_id   = ur.id
       JOIN usuario ua ON e.aprobador_id = ua.id
       ${where}
       ORDER BY e.proceso_id, e.secuencia`,
      params
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/etapas
exports.crearEtapa = async (req, res) => {
  const { proceso_id, titulo, secuencia, revisor_id, aprobador_id,
          dias_revision, dias_aprobacion, requiere_aprobador } = req.body;

  if (!proceso_id)      return res.status(400).json({ error: 'El proceso es obligatorio' });
  if (!titulo?.trim())  return res.status(400).json({ error: 'El título es obligatorio' });
  if (!secuencia)       return res.status(400).json({ error: 'La secuencia es obligatoria' });
  if (!revisor_id)      return res.status(400).json({ error: 'El revisor es obligatorio' });
  if (requiere_aprobador && !aprobador_id)
    return res.status(400).json({ error: 'El aprobador es obligatorio cuando se requiere aprobación' });

  try {
    // Verificar que no haya duplicado de secuencia en el mismo proceso
    const [dup] = await db.query(
      'SELECT id FROM etapa WHERE proceso_id = ? AND secuencia = ?',
      [proceso_id, secuencia]
    );
    if (dup.length > 0) {
      return res.status(409).json({ error: `Ya existe una etapa con secuencia ${secuencia} en este proceso` });
    }

    const [result] = await db.query(
      `INSERT INTO etapa
         (proceso_id, titulo, secuencia, revisor_id, aprobador_id,
          dias_revision, dias_aprobacion, requiere_aprobador)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        proceso_id, titulo.trim(), secuencia,
        revisor_id, aprobador_id || revisor_id,
        dias_revision || 5, dias_aprobacion || 5,
        requiere_aprobador ? 1 : 0,
      ]
    );
    res.status(201).json({ id: result.insertId, message: 'Etapa creada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/etapas/:id
exports.editarEtapa = async (req, res) => {
  const { id } = req.params;
  const { titulo, secuencia, revisor_id, aprobador_id,
          dias_revision, dias_aprobacion, requiere_aprobador } = req.body;

  if (!titulo?.trim()) return res.status(400).json({ error: 'El título es obligatorio' });
  if (!secuencia)      return res.status(400).json({ error: 'La secuencia es obligatoria' });
  if (!revisor_id)     return res.status(400).json({ error: 'El revisor es obligatorio' });
  if (requiere_aprobador && !aprobador_id)
    return res.status(400).json({ error: 'El aprobador es obligatorio cuando se requiere aprobación' });

  try {
    // Verificar duplicado de secuencia excluyendo la etapa actual
    const [dup] = await db.query(
      `SELECT e.id FROM etapa e
       JOIN etapa e2 ON e.proceso_id = e2.proceso_id
       WHERE e2.id = ? AND e.secuencia = ? AND e.id != ?`,
      [id, secuencia, id]
    );
    if (dup.length > 0) {
      return res.status(409).json({ error: `Ya existe una etapa con secuencia ${secuencia} en este proceso` });
    }

    const [result] = await db.query(
      `UPDATE etapa SET titulo = ?, secuencia = ?, revisor_id = ?, aprobador_id = ?,
              dias_revision = ?, dias_aprobacion = ?, requiere_aprobador = ?
       WHERE id = ?`,
      [
        titulo.trim(), secuencia, revisor_id, aprobador_id || revisor_id,
        dias_revision || 5, dias_aprobacion || 5,
        requiere_aprobador ? 1 : 0, id,
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Etapa no encontrada' });
    }
    res.json({ message: 'Etapa actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/etapas/:id
exports.eliminarEtapa = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM etapa WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Etapa no encontrada' });
    }
    res.json({ message: 'Etapa eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};