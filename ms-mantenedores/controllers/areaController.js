const db = require('../config/db');

// Devuelve todas las areas con la referencia del contratista

exports.getAreas = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.id, a.nombre, a.estado_id,
              a.contratista_id,
              a.proceso_id,
              c.nombre  AS contratista_nombre,
              p.nombre  AS proceso_nombre
       FROM area a
       JOIN contratista c ON a.contratista_id = c.id
       LEFT JOIN proceso p ON a.proceso_id = p.id
       ORDER BY c.nombre, a.nombre`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crearArea = async (req, res) => {
  const { nombre, contratista_id } = req.body;
 
  // Verifica los datos de entrada
  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre del área es obligatorio' });
  }

  if (!contratista_id) {
    return res.status(400).json({ error: 'El contratista es obligatorio' });
  }
 
  try {
    // Consulta para traer contratista
    const [contratista] = await db.query(
      'SELECT id FROM contratista WHERE id = ? AND estado_id = 1',
      [contratista_id]
    );

    if (contratista.length === 0) {
      return res.status(404).json({ error: 'Contratista no encontrado o inactivo' });
    }
    
    //Consulta para insertar nueva área
    const [result] = await db.query(
      'INSERT INTO area (nombre, contratista_id, estado_id) VALUES (?, ?, 1)',
      [nombre.trim(), contratista_id]
    );

    res.status(201).json({ id: result.insertId, message: 'Área creada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.editarArea = async (req, res) => {
  const { id } = req.params;
  const { nombre, contratista_id } = req.body;
 
  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre del área es obligatorio' });
  }
  if (!contratista_id) {
    return res.status(400).json({ error: 'El contratista es obligatorio' });
  }
 
  try {
    const [result] = await db.query(
      'UPDATE area SET nombre = ?, contratista_id = ? WHERE id = ?',
      [nombre.trim(), contratista_id, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Área no encontrada' });
    }
    res.json({ message: 'Área actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.desactivarArea = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE area SET estado_id = 2 WHERE id = ? AND estado_id = 1',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Área no encontrada o ya inactiva' });
    }
    res.json({ message: 'Área desactivada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.reactivarArea = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE area SET estado_id = 1 WHERE id = ? AND estado_id = 2',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Área no encontrada o ya activa' });
    }
    res.json({ message: 'Área reactivada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH asignar proceso activo a un área
exports.asignarProceso = async (req, res) => {
  const { id } = req.params;
  const { proceso_id } = req.body;

  try {
    // proceso_id puede ser null para desasignar
    if (proceso_id !== null && proceso_id !== undefined) {
      const [proc] = await db.query(
        'SELECT id FROM proceso WHERE id = ? AND estado_id = 1',
        [proceso_id]
      );
      if (proc.length === 0) {
        return res.status(404).json({ error: 'Proceso no encontrado o inactivo' });
      }
    }

    const [result] = await db.query(
      'UPDATE area SET proceso_id = ? WHERE id = ?',
      [proceso_id ?? null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Área no encontrada' });
    }
    res.json({ message: 'Proceso asignado al área correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};