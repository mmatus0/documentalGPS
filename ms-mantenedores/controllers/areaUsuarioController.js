const db = require('../config/db');

exports.getUsuariosPorArea = async (req, res) => {
  const { areaId } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT
         au.id,
         au.usuario_id,
         au.rol_en_area,
         u.nombre_completo,
         u.correo,
         r.nombre AS rol_global
       FROM area_usuario au
       JOIN usuario u ON au.usuario_id = u.id
       JOIN rol     r ON u.rol_id      = r.id
       WHERE au.area_id = ?
       ORDER BY au.rol_en_area, u.nombre_completo`,
      [areaId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAreas = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.id, a.nombre, c.nombre AS contratista_nombre
       FROM area a
       JOIN contratista c ON a.contratista_id = c.id
       WHERE a.estado_id = 1
       ORDER BY c.nombre, a.nombre`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUsuariosDisponibles = async (req, res) => {
  const { areaId } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.nombre_completo, u.correo, r.nombre AS rol_global
       FROM usuario u
       JOIN rol r ON u.rol_id = r.id
       WHERE u.estado_id = 1
         AND u.id NOT IN (
           SELECT usuario_id FROM area_usuario WHERE area_id = ?
         )
       ORDER BY u.nombre_completo`,
      [areaId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.asignarUsuario = async (req, res) => {
  const { areaId } = req.params;
  const { usuario_id, rol_en_area } = req.body;

  if (!usuario_id || !rol_en_area) {
    return res.status(400).json({ error: 'usuario_id y rol_en_area son obligatorios' });
  }
  if (!['Colaborador', 'Lector'].includes(rol_en_area)) {
    return res.status(400).json({ error: 'rol_en_area debe ser Colaborador o Lector' });
  }

  try {
    await db.query(
      'INSERT INTO area_usuario (area_id, usuario_id, rol_en_area) VALUES (?, ?, ?)',
      [areaId, usuario_id, rol_en_area]
    );
    res.status(201).json({ message: 'Usuario asignado al área correctamente' });
  } catch (error) {
    // Clave duplicada → el usuario ya pertenece al área
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El usuario ya está asignado a esta área' });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.removerUsuario = async (req, res) => {
  const { areaId, asignacionId } = req.params;
  try {
    const [result] = await db.query(
      'DELETE FROM area_usuario WHERE id = ? AND area_id = ?',
      [asignacionId, areaId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }
    res.json({ message: 'Usuario removido del área correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};