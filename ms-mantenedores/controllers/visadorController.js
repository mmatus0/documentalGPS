const db = require('../config/db');

// GET /api/visadores
exports.getVisadores = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT v.id, v.cargo, v.estado_id,
              u.id              AS usuario_id,
              u.nombre_completo AS usuario_nombre,
              u.correo          AS usuario_correo,
              a.id              AS area_id,
              a.nombre          AS area_nombre,
              c.nombre          AS contratista_nombre,
              e.nombre          AS estado
       FROM visador v
       JOIN usuario u      ON v.usuario_id = u.id
       JOIN area a         ON v.area_id    = a.id
       JOIN contratista c  ON a.contratista_id = c.id
       JOIN estado e       ON v.estado_id  = e.id
       ORDER BY u.nombre_completo`
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// GET /api/visadores/:id
exports.getVisadorById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT v.id, v.usuario_id, v.area_id, v.cargo, v.estado_id,
              u.nombre_completo AS usuario_nombre,
              a.nombre          AS area_nombre
       FROM visador v
       JOIN usuario u ON v.usuario_id = u.id
       JOIN area a    ON v.area_id    = a.id
       WHERE v.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Visador no encontrado' });
    res.json(rows[0]);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// POST /api/visadores
exports.crearVisador = async (req, res) => {
  const { usuario_id, area_id, cargo } = req.body;
  if (!usuario_id) return res.status(400).json({ error: 'El usuario es obligatorio' });
  if (!area_id)    return res.status(400).json({ error: 'El área es obligatoria' });

  try {
    // Verificar que no exista ya para ese usuario+área
    const [existe] = await db.query(
      'SELECT id FROM visador WHERE usuario_id = ? AND area_id = ? AND estado_id = 1',
      [usuario_id, area_id]
    );
    if (existe.length > 0) return res.status(409).json({ error: 'Este usuario ya es visador en esa área' });

    const [result] = await db.query(
      'INSERT INTO visador (usuario_id, area_id, cargo, estado_id) VALUES (?, ?, ?, 1)',
      [usuario_id, area_id, cargo?.trim() || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Visador registrado correctamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// PUT /api/visadores/:id
exports.editarVisador = async (req, res) => {
  const { cargo, area_id } = req.body;
  const { id } = req.params;

  try {
    const [existe] = await db.query('SELECT id FROM visador WHERE id = ?', [id]);
    if (existe.length === 0) return res.status(404).json({ error: 'Visador no encontrado' });

    await db.query(
      'UPDATE visador SET cargo = ?, area_id = ? WHERE id = ?',
      [cargo?.trim() || null, area_id, id]
    );
    res.json({ message: 'Visador actualizado correctamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// DELETE /api/visadores/:id  (borrado lógico)
exports.desactivarVisador = async (req, res) => {
  try {
    const [existe] = await db.query('SELECT id FROM visador WHERE id = ?', [req.params.id]);
    if (existe.length === 0) return res.status(404).json({ error: 'Visador no encontrado' });

    await db.query('UPDATE visador SET estado_id = 2 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Visador desactivado correctamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};