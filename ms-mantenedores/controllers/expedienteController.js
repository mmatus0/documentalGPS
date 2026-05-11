const db = require('../config/db');

function decodeJwtPayload(token) {
  try {
    const base64Payload = token.split('.')[1];
    const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function getUsuarioFromReq(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  return decodeJwtPayload(token);
}

// GET /api/expedientes/area/:areaId
// Lista expedientes de un área (solo si el usuario tiene acceso a ella)
exports.getExpedientesPorArea = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });

  const { areaId } = req.params;

  try {
    // Verificar que el usuario tiene acceso al área (roles 2 y 3)
    // Los administradores (rol 1) tienen acceso sin restricción
    if (usuario.rol_id !== 1) {
      const [acceso] = await db.query(
        `SELECT id FROM area_usuario WHERE area_id = ? AND usuario_id = ?`,
        [areaId, usuario.id]
      );
      if (acceso.length === 0) {
        return res.status(403).json({ error: 'No tienes acceso a esta área' });
      }
    }

    const [rows] = await db.query(
      `SELECT
         e.id,
         e.correlativo,
         e.nombre,
         e.materia,
         e.emisor,
         e.origen,
         e.reservado,
         e.fecha_documento,
         e.fecha_ingreso,
         td.nombre  AS tipo_documento,
         cat.nombre AS categoria,
         est.nombre AS estado,
         u.nombre_completo AS creado_por
       FROM expediente e
       JOIN tipo_documento td  ON e.tipo_doc_id   = td.id
       JOIN categoria cat      ON e.categoria_id  = cat.id
       JOIN estado est         ON e.estado_id     = est.id
       JOIN usuario u          ON e.creado_por    = u.id
       WHERE e.area_id = ?
       ORDER BY e.fecha_ingreso DESC`,
      [areaId]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/expedientes/:id
// Detalle de un expediente con sus documentos adjuntos
exports.getExpedienteDetalle = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });

  const { id } = req.params;

  try {
    const [exp] = await db.query(
      `SELECT
         e.*,
         td.nombre  AS tipo_documento,
         cat.nombre AS categoria,
         est.nombre AS estado,
         u.nombre_completo AS creado_por_nombre,
         a.nombre   AS area_nombre,
         c.nombre   AS contratista_nombre
       FROM expediente e
       JOIN tipo_documento td  ON e.tipo_doc_id   = td.id
       JOIN categoria cat      ON e.categoria_id  = cat.id
       JOIN estado est         ON e.estado_id     = est.id
       JOIN usuario u          ON e.creado_por    = u.id
       JOIN area a             ON e.area_id       = a.id
       JOIN contratista c      ON a.contratista_id = c.id
       WHERE e.id = ?`,
      [id]
    );

    if (exp.length === 0) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    const expediente = exp[0];

    // Verificar acceso al área del expediente
    if (usuario.rol_id !== 1) {
      const [acceso] = await db.query(
        `SELECT id FROM area_usuario WHERE area_id = ? AND usuario_id = ?`,
        [expediente.area_id, usuario.id]
      );
      if (acceso.length === 0) {
        return res.status(403).json({ error: 'No tienes acceso a este expediente' });
      }
    }

    // Traer documentos adjuntos
    const [docs] = await db.query(
      `SELECT
         d.id,
         d.nombre_archivo,
         d.tipo_archivo,
         d.fecha_carga,
         u.nombre_completo AS subido_por
       FROM documento_adjunto d
       JOIN usuario u ON d.subido_por = u.id
       WHERE d.expediente_id = ?
       ORDER BY d.fecha_carga DESC`,
      [id]
    );

    res.json({ ...expediente, documentos: docs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
