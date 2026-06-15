const db = require('../config/db');

function getUsuarioFromReq(req) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return null;
    const base64Payload = authHeader.split(' ')[1].split('.')[1];
    return JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf-8'));
  } catch { return null; }
}

// ─── HU-22: GET /api/tareas  (Admin: todas las tareas del sistema) ────────────
// ─── HU-23: GET /api/tareas  (Colaborador: solo sus tareas) ──────────────────
exports.getTareas = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });

  const { estado_id, tipo, etapa_id } = req.query;

  try {
    let whereExtra = '';
    const params = [];

    // Colaborador solo ve sus propias tareas
    if (usuario.rol_id !== 1) {
      whereExtra += ' AND t.asignado_a = ?';
      params.push(usuario.id);
    }

    if (estado_id) { whereExtra += ' AND t.estado_id = ?'; params.push(estado_id); }
    if (tipo)      { whereExtra += ' AND t.tipo = ?';      params.push(tipo); }
    if (etapa_id)  { whereExtra += ' AND t.etapa_id = ?';  params.push(etapa_id); }

    const [rows] = await db.query(
      `SELECT
         t.id,
         t.tipo,
         t.estado_id,
         t.fecha_vencimiento,
         t.tarea_padre_id,
         t.tipo_colab_id,
         est.nombre            AS estado,
         e.id                  AS expediente_id,
         e.correlativo,
         e.nombre              AS expediente_nombre,
         e.estado_id           AS expediente_estado_id,
         ee.nombre             AS expediente_estado,
         et.titulo             AS etapa_titulo,
         et.secuencia,
         u.id                  AS asignado_a_id,
         u.nombre_completo     AS asignado_a_nombre,
         tc.nombre             AS tipo_colaboracion,
         a.nombre              AS area_nombre
       FROM tarea t
       JOIN estado est          ON t.estado_id      = est.id
       JOIN expediente e        ON t.expediente_id  = e.id
       JOIN estado ee           ON e.estado_id      = ee.id
       JOIN etapa et            ON t.etapa_id       = et.id
       JOIN usuario u           ON t.asignado_a     = u.id
       JOIN area a              ON e.area_id        = a.id
       LEFT JOIN tipo_colaboracion tc ON t.tipo_colab_id = tc.id
       WHERE t.tarea_padre_id IS NULL ${whereExtra}
       ORDER BY
         CASE t.estado_id WHEN 9 THEN 0 WHEN 10 THEN 1 ELSE 2 END,
         t.fecha_vencimiento ASC`,
      params
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ─── GET /api/tareas/:id  (detalle de una tarea con sub-tareas) ───────────────
exports.getTareaDetalle = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT
         t.id, t.tipo, t.estado_id, t.fecha_vencimiento, t.tarea_padre_id, t.tipo_colab_id,
         est.nombre        AS estado,
         e.id              AS expediente_id,
         e.correlativo,
         e.nombre          AS expediente_nombre,
         e.estado_id       AS expediente_estado_id,
         ee.nombre         AS expediente_estado,
         e.area_id,
         et.id             AS etapa_id,
         et.titulo         AS etapa_titulo,
         et.secuencia,
         et.proceso_id,
         et.revisor_id,
         et.aprobador_id,
         et.dias_aprobacion,
         et.requiere_aprobador,
         u.id              AS asignado_a_id,
         u.nombre_completo AS asignado_a_nombre,
         tc.nombre         AS tipo_colaboracion,
         a.nombre          AS area_nombre
       FROM tarea t
       JOIN estado est          ON t.estado_id     = est.id
       JOIN expediente e        ON t.expediente_id = e.id
       JOIN estado ee           ON e.estado_id     = ee.id
       JOIN etapa et            ON t.etapa_id      = et.id
       JOIN usuario u           ON t.asignado_a    = u.id
       JOIN area a              ON e.area_id       = a.id
       LEFT JOIN tipo_colaboracion tc ON t.tipo_colab_id = tc.id
       WHERE t.id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
    const tarea = rows[0];

    // Verificar acceso: admin ve todo; colaborador solo sus tareas
    if (usuario.rol_id !== 1 && tarea.asignado_a_id !== usuario.id) {
      return res.status(403).json({ error: 'No tienes acceso a esta tarea' });
    }

    // Sub-tareas de colaboración
    const [subTareas] = await db.query(
      `SELECT t.id, t.tipo, t.estado_id, t.fecha_vencimiento,
              est.nombre        AS estado,
              u.nombre_completo AS asignado_a_nombre,
              tc.nombre         AS tipo_colaboracion
       FROM tarea t
       JOIN estado est               ON t.estado_id      = est.id
       JOIN usuario u                ON t.asignado_a     = u.id
       LEFT JOIN tipo_colaboracion tc ON t.tipo_colab_id = tc.id
       WHERE t.tarea_padre_id = ?
       ORDER BY t.id ASC`,
      [id]
    );

    // Historial del expediente
    const [historial] = await db.query(
      `SELECT h.estado_anterior, h.estado_nuevo, h.comentario, h.fecha,
              u.nombre_completo AS usuario
       FROM historial_expediente h
       JOIN usuario u ON h.usuario_id = u.id
       WHERE h.expediente_id = ?
       ORDER BY h.fecha ASC`,
      [tarea.expediente_id]
    );

    // Documentos adjuntos
    const [documentos] = await db.query(
      `SELECT d.id, d.nombre_archivo, d.tipo_archivo, d.fecha_carga,
              u.nombre_completo AS subido_por
       FROM documento_adjunto d
       JOIN usuario u ON d.subido_por = u.id
       WHERE d.expediente_id = ?
       ORDER BY d.fecha_carga DESC`,
      [tarea.expediente_id]
    );

    res.json({ ...tarea, sub_tareas: subTareas, historial, documentos });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ─── HU-24: POST /api/tareas/:id/aceptar (Revisor acepta) ────────────────────
exports.aceptarRevision = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });

  const { id } = req.params;
  const { comentario } = req.body;
  if (!comentario?.trim()) return res.status(400).json({ error: 'El comentario es obligatorio' });

  try {
    // Verificar tarea
    const [rows] = await db.query(
      `SELECT t.*, et.proceso_id, et.secuencia, et.aprobador_id,
              et.dias_aprobacion, et.requiere_aprobador
       FROM tarea t
       JOIN etapa et ON t.etapa_id = et.id
       WHERE t.id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
    const tarea = rows[0];

    if (tarea.tipo !== 'Revision') return res.status(400).json({ error: 'Esta acción solo aplica a tareas de Revisión' });
    if (tarea.asignado_a !== usuario.id && usuario.rol_id !== 1)
      return res.status(403).json({ error: 'No eres el revisor asignado a esta tarea' });
    if (![9, 10].includes(tarea.estado_id)) return res.status(400).json({ error: 'La tarea ya fue completada o rechazada' });

    // Marcar tarea como Completada (estado_id = 11)
    await db.query('UPDATE tarea SET estado_id = 11 WHERE id = ?', [id]);

    // Registrar en historial del expediente
    await db.query(
      `INSERT INTO historial_expediente (expediente_id, usuario_id, estado_anterior, estado_nuevo, comentario)
       VALUES (?, ?, 'En Revisión', 'En Revisión', ?)`,
      [tarea.expediente_id, usuario.id, `Revisión aceptada: ${comentario.trim()}`]
    );

    if (tarea.requiere_aprobador) {
      // Generar tarea de Aprobación para el aprobador de la misma etapa
      const fechaVenc = new Date();
      fechaVenc.setDate(fechaVenc.getDate() + (tarea.dias_aprobacion || 5));

      await db.query(
        `INSERT INTO tarea (expediente_id, etapa_id, asignado_a, tipo, estado_id, fecha_vencimiento)
         VALUES (?, ?, ?, 'Aprobacion', 9, ?)`,
        [tarea.expediente_id, tarea.etapa_id, tarea.aprobador_id, fechaVenc.toISOString().split('T')[0]]
      );

      // Cambiar estado expediente a En Aprobación (7)
      await db.query('UPDATE expediente SET estado_id = 7 WHERE id = ?', [tarea.expediente_id]);
      await db.query(
        `INSERT INTO historial_expediente (expediente_id, usuario_id, estado_anterior, estado_nuevo, comentario)
         VALUES (?, ?, 'En Revisión', 'En Aprobación', ?)`,
        [tarea.expediente_id, usuario.id, 'Revisión completada. Enviado a aprobación.']
      );
    } else {
      // Sin aprobador: avanzar a la siguiente etapa directamente
      await avanzarSiguienteEtapa(tarea, usuario.id, comentario);
    }

    res.json({ message: 'Revisión aceptada correctamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ─── HU-24: POST /api/tareas/:id/rechazar (Revisor rechaza) ──────────────────
exports.rechazarRevision = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });

  const { id } = req.params;
  const { comentario } = req.body;
  if (!comentario?.trim()) return res.status(400).json({ error: 'El comentario es obligatorio' });

  try {
    const [rows] = await db.query('SELECT * FROM tarea WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
    const tarea = rows[0];

    if (tarea.tipo !== 'Revision') return res.status(400).json({ error: 'Esta acción solo aplica a tareas de Revisión' });
    if (tarea.asignado_a !== usuario.id && usuario.rol_id !== 1)
      return res.status(403).json({ error: 'No eres el revisor asignado a esta tarea' });
    if (![9, 10].includes(tarea.estado_id)) return res.status(400).json({ error: 'La tarea ya fue completada o rechazada' });

    // Marcar tarea como Rechazada (12) y expediente vuelve a Borrador (3)
    await db.query('UPDATE tarea SET estado_id = 12 WHERE id = ?', [id]);
    await db.query('UPDATE expediente SET estado_id = 3 WHERE id = ?', [tarea.expediente_id]);
    await db.query(
      `INSERT INTO historial_expediente (expediente_id, usuario_id, estado_anterior, estado_nuevo, comentario)
       VALUES (?, ?, 'En Revisión', 'Borrador', ?)`,
      [tarea.expediente_id, usuario.id, `Revisión rechazada: ${comentario.trim()}`]
    );

    res.json({ message: 'Revisión rechazada. El expediente volvió a Borrador.' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ─── HU-25: POST /api/tareas/:id/aprobar (Aprobador aprueba) ─────────────────
exports.aprobarAprobacion = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });

  const { id } = req.params;
  const { comentario } = req.body;
  if (!comentario?.trim()) return res.status(400).json({ error: 'El comentario es obligatorio' });

  try {
    const [rows] = await db.query(
      `SELECT t.*, et.proceso_id, et.secuencia
       FROM tarea t
       JOIN etapa et ON t.etapa_id = et.id
       WHERE t.id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
    const tarea = rows[0];

    if (tarea.tipo !== 'Aprobacion') return res.status(400).json({ error: 'Esta acción solo aplica a tareas de Aprobación' });
    if (tarea.asignado_a !== usuario.id && usuario.rol_id !== 1)
      return res.status(403).json({ error: 'No eres el aprobador asignado a esta tarea' });
    if (![9, 10].includes(tarea.estado_id)) return res.status(400).json({ error: 'La tarea ya fue completada o rechazada' });

    // Marcar tarea como Completada
    await db.query('UPDATE tarea SET estado_id = 11 WHERE id = ?', [id]);

    await avanzarSiguienteEtapa(tarea, usuario.id, comentario.trim());

    res.json({ message: 'Aprobación registrada correctamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ─── HU-25: POST /api/tareas/:id/rechazar-aprobacion ─────────────────────────
exports.rechazarAprobacion = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });

  const { id } = req.params;
  const { comentario } = req.body;
  if (!comentario?.trim()) return res.status(400).json({ error: 'El comentario es obligatorio' });

  try {
    const [rows] = await db.query('SELECT * FROM tarea WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
    const tarea = rows[0];

    if (tarea.tipo !== 'Aprobacion') return res.status(400).json({ error: 'Esta acción solo aplica a tareas de Aprobación' });
    if (tarea.asignado_a !== usuario.id && usuario.rol_id !== 1)
      return res.status(403).json({ error: 'No eres el aprobador asignado a esta tarea' });
    if (![9, 10].includes(tarea.estado_id)) return res.status(400).json({ error: 'La tarea ya fue completada o rechazada' });

    await db.query('UPDATE tarea SET estado_id = 12 WHERE id = ?', [id]);
    await db.query('UPDATE expediente SET estado_id = 3 WHERE id = ?', [tarea.expediente_id]);
    await db.query(
      `INSERT INTO historial_expediente (expediente_id, usuario_id, estado_anterior, estado_nuevo, comentario)
       VALUES (?, ?, 'En Aprobación', 'Borrador', ?)`,
      [tarea.expediente_id, usuario.id, `Aprobación rechazada: ${comentario.trim()}`]
    );

    res.json({ message: 'Aprobación rechazada. El expediente volvió a Borrador.' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ─── HU-26: POST /api/tareas/:id/solicitar-colaboracion ──────────────────────
exports.solicitarColaboracion = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });

  const { id } = req.params;
  const { colaborador_id, tipo_colab_id, fecha_limite, comentario } = req.body;

  if (!colaborador_id)   return res.status(400).json({ error: 'Debes seleccionar un colaborador' });
  if (!tipo_colab_id)    return res.status(400).json({ error: 'Debes seleccionar el tipo de colaboración' });
  if (!fecha_limite)     return res.status(400).json({ error: 'La fecha límite es obligatoria' });
  if (!comentario?.trim()) return res.status(400).json({ error: 'El comentario es obligatorio' });

  try {
    // Verificar tarea padre
    const [rows] = await db.query('SELECT * FROM tarea WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
    const tareaPadre = rows[0];

    if (!['Revision', 'Aprobacion'].includes(tareaPadre.tipo))
      return res.status(400).json({ error: 'Solo puedes solicitar colaboración desde tareas de Revisión o Aprobación' });
    if (tareaPadre.asignado_a !== usuario.id && usuario.rol_id !== 1)
      return res.status(403).json({ error: 'No eres el responsable de esta tarea' });
    if (![9, 10].includes(tareaPadre.estado_id))
      return res.status(400).json({ error: 'La tarea no está activa' });

    // Verificar que el colaborador pertenece al área del expediente
    const [expRows] = await db.query('SELECT area_id FROM expediente WHERE id = ?', [tareaPadre.expediente_id]);
    const areaId = expRows[0]?.area_id;
    const [acceso] = await db.query(
      `SELECT id FROM area_usuario WHERE area_id = ? AND usuario_id = ?`,
      [areaId, colaborador_id]
    );
    if (acceso.length === 0)
      return res.status(400).json({ error: 'El colaborador no pertenece al área de este expediente' });

    // Crear sub-tarea de colaboración
    await db.query(
      `INSERT INTO tarea (expediente_id, etapa_id, asignado_a, tarea_padre_id, tipo_colab_id, tipo, estado_id, fecha_vencimiento)
       VALUES (?, ?, ?, ?, ?, 'Colaboracion', 9, ?)`,
      [tareaPadre.expediente_id, tareaPadre.etapa_id, colaborador_id, id, tipo_colab_id, fecha_limite]
    );

    // Expediente pasa a En Colaboración (6)
    const [expEstado] = await db.query('SELECT estado_id FROM expediente WHERE id = ?', [tareaPadre.expediente_id]);
    const estadoAnterior = expEstado[0]?.estado_id;
    await db.query('UPDATE expediente SET estado_id = 6 WHERE id = ?', [tareaPadre.expediente_id]);

    const estadoNombres = { 5: 'En Revisión', 7: 'En Aprobación' };
    await db.query(
      `INSERT INTO historial_expediente (expediente_id, usuario_id, estado_anterior, estado_nuevo, comentario)
       VALUES (?, ?, ?, 'En Colaboración', ?)`,
      [tareaPadre.expediente_id, usuario.id, estadoNombres[estadoAnterior] || 'En Revisión',
       `Colaboración solicitada: ${comentario.trim()}`]
    );

    res.status(201).json({ message: 'Colaboración solicitada correctamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ─── HU-26: POST /api/tareas/:id/cerrar-colaboracion ─────────────────────────
exports.cerrarColaboracion = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });

  const { id } = req.params;
  const { comentario } = req.body;
  if (!comentario?.trim()) return res.status(400).json({ error: 'El comentario es obligatorio' });

  try {
    const [rows] = await db.query('SELECT * FROM tarea WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
    const tarea = rows[0];

    if (tarea.tipo !== 'Colaboracion') return res.status(400).json({ error: 'Esta acción solo aplica a tareas de Colaboración' });
    if (tarea.asignado_a !== usuario.id && usuario.rol_id !== 1)
      return res.status(403).json({ error: 'No eres el colaborador asignado a esta tarea' });
    if (![9, 10].includes(tarea.estado_id)) return res.status(400).json({ error: 'La tarea ya fue cerrada' });

    // Marcar sub-tarea como Completada
    await db.query('UPDATE tarea SET estado_id = 11 WHERE id = ?', [id]);

    // Obtener tarea padre para saber a qué estado volver
    const [padre] = await db.query('SELECT tipo FROM tarea WHERE id = ?', [tarea.tarea_padre_id]);
    const estadoVuelta = padre[0]?.tipo === 'Aprobacion' ? 7 : 5;
    const nombreEstado = padre[0]?.tipo === 'Aprobacion' ? 'En Aprobación' : 'En Revisión';

    // Restaurar estado del expediente
    await db.query('UPDATE expediente SET estado_id = ? WHERE id = ?', [estadoVuelta, tarea.expediente_id]);
    await db.query(
      `INSERT INTO historial_expediente (expediente_id, usuario_id, estado_anterior, estado_nuevo, comentario)
       VALUES (?, ?, 'En Colaboración', ?, ?)`,
      [tarea.expediente_id, usuario.id, nombreEstado, `Colaboración cerrada: ${comentario.trim()}`]
    );

    res.json({ message: 'Colaboración cerrada. La tarea volvió al responsable original.' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ─── PATCH /api/tareas/:id/abrir  (marcar En Progreso al abrir) ──────────────
exports.abrirTarea = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT * FROM tarea WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
    const tarea = rows[0];

    if (tarea.asignado_a !== usuario.id && usuario.rol_id !== 1)
      return res.status(403).json({ error: 'No eres el responsable de esta tarea' });
    if (tarea.estado_id !== 9) return res.json({ message: 'Sin cambios' }); // ya abierta

    await db.query('UPDATE tarea SET estado_id = 10 WHERE id = ?', [id]);

    // Si es la primera acción sobre el expediente en esta etapa, actualizar estado
    const estadosMap = { Revision: 5, Aprobacion: 7, Colaboracion: 6 };
    const nuevoEstadoExp = estadosMap[tarea.tipo];
    if (nuevoEstadoExp) {
      const [exp] = await db.query('SELECT estado_id FROM expediente WHERE id = ?', [tarea.expediente_id]);
      // Solo actualizar si el expediente aún está en Derivado (4)
      if (exp[0]?.estado_id === 4) {
        await db.query('UPDATE expediente SET estado_id = ? WHERE id = ?', [nuevoEstadoExp, tarea.expediente_id]);
        const nombres = { 5: 'En Revisión', 7: 'En Aprobación', 6: 'En Colaboración' };
        await db.query(
          `INSERT INTO historial_expediente (expediente_id, usuario_id, estado_anterior, estado_nuevo, comentario)
           VALUES (?, ?, 'Derivado', ?, 'Tarea iniciada por el responsable')`,
          [tarea.expediente_id, usuario.id, nombres[nuevoEstadoExp]]
        );
      }
    }

    res.json({ message: 'Tarea marcada como En Progreso' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ─── Función interna: avanzar a la siguiente etapa o terminar expediente ──────
async function avanzarSiguienteEtapa(tarea, usuarioId, comentario) {
  // Buscar siguiente etapa del mismo proceso
  const [siguientes] = await db.query(
    `SELECT e.id AS etapa_id, e.revisor_id, e.dias_revision, e.secuencia
     FROM etapa e
     WHERE e.proceso_id = ? AND e.secuencia > ?
     ORDER BY e.secuencia ASC
     LIMIT 1`,
    [tarea.proceso_id, tarea.secuencia]
  );

  if (siguientes.length > 0) {
    // Hay más etapas: generar tarea de Revisión para la siguiente
    const sig = siguientes[0];
    const fechaVenc = new Date();
    fechaVenc.setDate(fechaVenc.getDate() + (sig.dias_revision || 5));

    await db.query(
      `INSERT INTO tarea (expediente_id, etapa_id, asignado_a, tipo, estado_id, fecha_vencimiento)
       VALUES (?, ?, ?, 'Revision', 9, ?)`,
      [tarea.expediente_id, sig.etapa_id, sig.revisor_id, fechaVenc.toISOString().split('T')[0]]
    );

    const [expEstado] = await db.query('SELECT estado_id FROM expediente WHERE id = ?', [tarea.expediente_id]);
    const estadoAnteriorNombre = expEstado[0]?.estado_id === 7 ? 'En Aprobación' : 'En Revisión';
    await db.query('UPDATE expediente SET estado_id = 5 WHERE id = ?', [tarea.expediente_id]);
    await db.query(
      `INSERT INTO historial_expediente (expediente_id, usuario_id, estado_anterior, estado_nuevo, comentario)
       VALUES (?, ?, ?, 'En Revisión', ?)`,
      [tarea.expediente_id, usuarioId, estadoAnteriorNombre,
       `${tarea.tipo === 'Aprobacion' ? 'Aprobado' : 'Revisión aceptada'} — avanzando a etapa ${sig.secuencia}. ${comentario}`]
    );
  } else {
    // Última etapa: expediente Terminado (8)
    const [expEstado] = await db.query('SELECT estado_id FROM expediente WHERE id = ?', [tarea.expediente_id]);
    const estadoAnteriorNombre = expEstado[0]?.estado_id === 7 ? 'En Aprobación' : 'En Revisión';
    await db.query('UPDATE expediente SET estado_id = 8 WHERE id = ?', [tarea.expediente_id]);
    await db.query(
      `INSERT INTO historial_expediente (expediente_id, usuario_id, estado_anterior, estado_nuevo, comentario)
       VALUES (?, ?, ?, 'Terminado', ?)`,
      [tarea.expediente_id, usuarioId, estadoAnteriorNombre,
       `Proceso completado. ${comentario}`]
    );
  }
}