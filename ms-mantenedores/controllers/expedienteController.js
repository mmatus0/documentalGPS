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

// ─────────────────────────────────────────────────────────────────────────────
// HU-14 — Correlativo automático
// Genera el próximo correlativo del año en formato EXP-YYYY-NNNN
// ─────────────────────────────────────────────────────────────────────────────
async function generarCorrelativo() {
  const anio = new Date().getFullYear();
  const prefijo = `EXP-${anio}-`;

  const [rows] = await db.query(
    `SELECT correlativo FROM expediente
     WHERE correlativo LIKE ?
     ORDER BY correlativo DESC
     LIMIT 1`,
    [`${prefijo}%`]
  );

  let siguiente = 1;
  if (rows.length > 0) {
    const ultimo = rows[0].correlativo; // ej. EXP-2026-0042
    const partes = ultimo.split('-');
    siguiente = parseInt(partes[partes.length - 1], 10) + 1;
  }

  return `${prefijo}${String(siguiente).padStart(4, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// HU-15 — POST /api/expedientes
// Crea un expediente en estado Borrador con correlativo autogenerado
// Solo Colaboradores (rol_id = 2) pueden crear expedientes
// ─────────────────────────────────────────────────────────────────────────────
exports.crearExpediente = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });
  if (usuario.rol_id !== 2) {
    return res.status(403).json({ error: 'Solo los Colaboradores pueden crear expedientes' });
  }

  const {
    area_id,
    tipo_doc_id,
    categoria_id,
    subtipo_id,
    disciplina_id,
    n_documento,
    nombre,
    materia,
    emisor,
    origen,
    reservado,
    fecha_documento,
    fecha_ingreso,
    comentario,
  } = req.body;

  // Validaciones obligatorias (HU-15 criterios de aceptación)
  if (!area_id)       return res.status(400).json({ error: 'La unidad organizativa destino es obligatoria' });
  if (!tipo_doc_id)   return res.status(400).json({ error: 'El tipo de documento es obligatorio' });
  if (!categoria_id)  return res.status(400).json({ error: 'La categoría es obligatoria' });
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre del expediente es obligatorio' });
  if (!fecha_ingreso)  return res.status(400).json({ error: 'La fecha de ingreso es obligatoria' });
  if (!origen || !['Externo', 'Interno'].includes(origen)) {
    return res.status(400).json({ error: 'El origen debe ser Externo o Interno' });
  }

  try {
    // Verificar que el área existe y está activa
    const [area] = await db.query(
      'SELECT id FROM area WHERE id = ? AND estado_id = 1',
      [area_id]
    );
    if (area.length === 0) {
      return res.status(404).json({ error: 'El área seleccionada no existe o está inactiva' });
    }

    // Verificar que el colaborador pertenece al área con rol Colaborador
    const [acceso] = await db.query(
      `SELECT id FROM area_usuario
       WHERE area_id = ? AND usuario_id = ? AND rol_en_area = 'Colaborador'`,
      [area_id, usuario.id]
    );
    if (acceso.length === 0) {
      return res.status(403).json({ error: 'No tienes rol de Colaborador en esta unidad organizativa' });
    }

    // HU-14: generar correlativo automático
    const correlativo = await generarCorrelativo();

    const [result] = await db.query(
      `INSERT INTO expediente
         (area_id, tipo_doc_id, categoria_id, subtipo_id, disciplina_id,
          creado_por, correlativo, nombre, materia, emisor, origen,
          reservado, n_documento, fecha_documento, fecha_ingreso, estado_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 3)`,
      [
        area_id,
        tipo_doc_id,
        categoria_id,
        subtipo_id    || null,
        disciplina_id || null,
        usuario.id,
        correlativo,
        nombre.trim(),
        materia?.trim()   || null,
        emisor?.trim()    || null,
        origen,
        reservado ? 1 : 0,
        n_documento?.trim() || null,
        fecha_documento || null,
        fecha_ingreso,
      ]
    );

    // Registrar entrada inicial en el historial (HU-19 trazabilidad)
    await db.query(
      `INSERT INTO historial_expediente
         (expediente_id, usuario_id, estado_anterior, estado_nuevo, comentario)
       VALUES (?, ?, NULL, 'Borrador', ?)`,
      [result.insertId, usuario.id, comentario?.trim() || 'Expediente creado']
    );

    res.status(201).json({
      id: result.insertId,
      correlativo,
      message: 'Expediente creado correctamente',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/expedientes/area/:areaId
// Lista expedientes de un área (solo si el usuario tiene acceso a ella)
// ─────────────────────────────────────────────────────────────────────────────
exports.getExpedientesPorArea = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });

  const { areaId } = req.params;

  try {
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
         e.n_documento,
         e.fecha_documento,
         e.fecha_ingreso,
         e.estado_id,
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/expedientes/:id
// Detalle de un expediente con sus documentos adjuntos
// ─────────────────────────────────────────────────────────────────────────────
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

    if (usuario.rol_id !== 1) {
      const [acceso] = await db.query(
        `SELECT id FROM area_usuario WHERE area_id = ? AND usuario_id = ?`,
        [expediente.area_id, usuario.id]
      );
      if (acceso.length === 0) {
        return res.status(403).json({ error: 'No tienes acceso a este expediente' });
      }
    }

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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/expedientes/:id/historial — HU-19
// ─────────────────────────────────────────────────────────────────────────────
exports.getHistorialExpediente = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });

  const { id } = req.params;

  try {
    const [exp] = await db.query(
      'SELECT id, area_id FROM expediente WHERE id = ?',
      [id]
    );
    if (exp.length === 0) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    if (usuario.rol_id !== 1) {
      const [acceso] = await db.query(
        'SELECT id FROM area_usuario WHERE area_id = ? AND usuario_id = ?',
        [exp[0].area_id, usuario.id]
      );
      if (acceso.length === 0) {
        return res.status(403).json({ error: 'No tienes acceso a este expediente' });
      }
    }

    const [rows] = await db.query(
      `SELECT
         h.id,
         h.estado_anterior,
         h.estado_nuevo,
         h.comentario,
         h.fecha,
         u.nombre_completo AS usuario
       FROM historial_expediente h
       JOIN usuario u ON h.usuario_id = u.id
       WHERE h.expediente_id = ?
       ORDER BY h.fecha ASC`,
      [id]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};