const db = require('../config/db');

function decodeJwtPayload(token) {
  try {
    const base64Payload = token.split('.')[1];
    const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch { return null; }
}

function getUsuarioFromReq(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  return decodeJwtPayload(authHeader.split(' ')[1]);
}

// HU-14: Correlativo automatico
async function generarCorrelativo() {
  const anio = new Date().getFullYear();
  const prefijo = `EXP-${anio}-`;
  const [rows] = await db.query(
    `SELECT correlativo FROM expediente WHERE correlativo LIKE ? ORDER BY correlativo DESC LIMIT 1`,
    [`${prefijo}%`]
  );
  let siguiente = 1;
  if (rows.length > 0) {
    const partes = rows[0].correlativo.split('-');
    siguiente = parseInt(partes[partes.length - 1], 10) + 1;
  }
  return `${prefijo}${String(siguiente).padStart(4, '0')}`;
}

// HU-15: POST /api/expedientes
exports.crearExpediente = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });
  if (usuario.rol_id !== 2) {
    return res.status(403).json({ error: 'Solo los Colaboradores pueden crear expedientes' });
  }
  const {
    area_id, tipo_doc_id, categoria_id, subtipo_id, disciplina_id,
    n_documento, nombre, materia, emisor, origen, reservado,
    fecha_documento, fecha_ingreso, comentario,
  } = req.body;

  if (!area_id)        return res.status(400).json({ error: 'La unidad organizativa destino es obligatoria' });
  if (!tipo_doc_id)    return res.status(400).json({ error: 'El tipo de documento es obligatorio' });
  if (!categoria_id)   return res.status(400).json({ error: 'La categoria es obligatoria' });
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre del expediente es obligatorio' });
  if (!fecha_ingreso)  return res.status(400).json({ error: 'La fecha de ingreso es obligatoria' });
  if (!origen || !['Externo', 'Interno'].includes(origen)) {
    return res.status(400).json({ error: 'El origen debe ser Externo o Interno' });
  }

  try {
    const [area] = await db.query('SELECT id FROM area WHERE id = ? AND estado_id = 1', [area_id]);
    if (area.length === 0) return res.status(404).json({ error: 'El area seleccionada no existe o esta inactiva' });

    const [acceso] = await db.query(
      `SELECT id FROM area_usuario WHERE area_id = ? AND usuario_id = ? AND rol_en_area = 'Colaborador'`,
      [area_id, usuario.id]
    );
    if (acceso.length === 0) return res.status(403).json({ error: 'No tienes rol de Colaborador en esta unidad organizativa' });

    const correlativo = await generarCorrelativo();
    const [result] = await db.query(
      `INSERT INTO expediente
         (area_id, tipo_doc_id, categoria_id, subtipo_id, disciplina_id,
          creado_por, correlativo, nombre, materia, emisor, origen,
          reservado, n_documento, fecha_documento, fecha_ingreso, estado_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 3)`,
      [
        area_id, tipo_doc_id, categoria_id,
        subtipo_id || null, disciplina_id || null,
        usuario.id, correlativo, nombre.trim(),
        materia?.trim() || null, emisor?.trim() || null,
        origen, reservado ? 1 : 0, n_documento?.trim() || null,
        fecha_documento || null, fecha_ingreso,
      ]
    );

    await db.query(
      `INSERT INTO historial_expediente (expediente_id, usuario_id, estado_anterior, estado_nuevo, comentario)
       VALUES (?, ?, NULL, 'Borrador', ?)`,
      [result.insertId, usuario.id, comentario?.trim() || 'Expediente creado']
    );

    res.status(201).json({ id: result.insertId, correlativo, message: 'Expediente creado correctamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// GET /api/expedientes/area/:areaId
exports.getExpedientesPorArea = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });
  const { areaId } = req.params;
  try {
    if (usuario.rol_id !== 1) {
      const [acceso] = await db.query(
        'SELECT id FROM area_usuario WHERE area_id = ? AND usuario_id = ?',
        [areaId, usuario.id]
      );
      if (acceso.length === 0) return res.status(403).json({ error: 'No tienes acceso a esta area' });
    }
    const [rows] = await db.query(
      `SELECT e.id, e.correlativo, e.nombre, e.materia, e.emisor, e.origen,
              e.reservado, e.fecha_documento, e.fecha_ingreso, e.estado_id,
              td.nombre AS tipo_documento, cat.nombre AS categoria,
              est.nombre AS estado, u.nombre_completo AS creado_por
       FROM expediente e
       JOIN tipo_documento td ON e.tipo_doc_id  = td.id
       JOIN categoria cat     ON e.categoria_id = cat.id
       JOIN estado est        ON e.estado_id    = est.id
       JOIN usuario u         ON e.creado_por   = u.id
       WHERE e.area_id = ?
       ORDER BY e.fecha_ingreso DESC`,
      [areaId]
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// GET /api/expedientes — HU-17
exports.getExpedientesGlobal = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });

  const { tipo_doc_id, origen, estado_id, busqueda } = req.query;

  try {
    let whereExtra = '';
    const params = [];

    if (usuario.rol_id !== 1) {
      const [areas] = await db.query('SELECT area_id FROM area_usuario WHERE usuario_id = ?', [usuario.id]);
      if (areas.length === 0) return res.json([]);
      const ids = areas.map(a => a.area_id);
      whereExtra += ` AND e.area_id IN (${ids.map(() => '?').join(',')})`;
      params.push(...ids);
    }

    if (tipo_doc_id) { whereExtra += ' AND e.tipo_doc_id = ?'; params.push(tipo_doc_id); }
    if (origen)      { whereExtra += ' AND e.origen = ?';      params.push(origen); }
    if (estado_id)   { whereExtra += ' AND e.estado_id = ?';   params.push(estado_id); }
    if (busqueda) {
      whereExtra += ' AND (e.nombre LIKE ? OR e.correlativo LIKE ? OR e.emisor LIKE ?)';
      const q = `%${busqueda}%`;
      params.push(q, q, q);
    }

    const [rows] = await db.query(
      `SELECT e.id, e.correlativo, e.nombre, e.materia, e.emisor, e.origen,
              e.reservado, e.fecha_documento, e.fecha_ingreso, e.estado_id,
              td.nombre  AS tipo_documento,
              cat.nombre AS categoria,
              est.nombre AS estado,
              a.nombre   AS area_nombre,
              c.nombre   AS contratista_nombre,
              u.nombre_completo AS creado_por
       FROM expediente e
       JOIN tipo_documento td  ON e.tipo_doc_id    = td.id
       JOIN categoria cat      ON e.categoria_id   = cat.id
       JOIN estado est         ON e.estado_id      = est.id
       JOIN usuario u          ON e.creado_por     = u.id
       JOIN area a             ON e.area_id        = a.id
       JOIN contratista c      ON a.contratista_id = c.id
       WHERE 1=1 ${whereExtra}
       ORDER BY e.fecha_ingreso DESC`,
      params
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// GET /api/expedientes/:id
exports.getExpedienteDetalle = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });
  const { id } = req.params;
  try {
    const [exp] = await db.query(
      `SELECT e.*, td.nombre AS tipo_documento, cat.nombre AS categoria,
              est.nombre AS estado, u.nombre_completo AS creado_por_nombre,
              a.nombre AS area_nombre, c.nombre AS contratista_nombre
       FROM expediente e
       JOIN tipo_documento td  ON e.tipo_doc_id    = td.id
       JOIN categoria cat      ON e.categoria_id   = cat.id
       JOIN estado est         ON e.estado_id      = est.id
       JOIN usuario u          ON e.creado_por     = u.id
       JOIN area a             ON e.area_id        = a.id
       JOIN contratista c      ON a.contratista_id = c.id
       WHERE e.id = ?`,
      [id]
    );
    if (exp.length === 0) return res.status(404).json({ error: 'Expediente no encontrado' });
    const expediente = exp[0];

    if (usuario.rol_id !== 1) {
      const [acceso] = await db.query(
        'SELECT id FROM area_usuario WHERE area_id = ? AND usuario_id = ?',
        [expediente.area_id, usuario.id]
      );
      if (acceso.length === 0) return res.status(403).json({ error: 'No tienes acceso' });
    }

    const [docs] = await db.query(
      `SELECT d.id, d.nombre_archivo, d.tipo_archivo, d.fecha_carga,
              u.nombre_completo AS subido_por
       FROM documento_adjunto d
       JOIN usuario u ON d.subido_por = u.id
       WHERE d.expediente_id = ?
       ORDER BY d.fecha_carga DESC`,
      [id]
    );
    res.json({ ...expediente, documentos: docs });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// GET /api/expedientes/:id/historial — HU-19
exports.getHistorialExpediente = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });
  const { id } = req.params;
  try {
    const [exp] = await db.query('SELECT id, area_id FROM expediente WHERE id = ?', [id]);
    if (exp.length === 0) return res.status(404).json({ error: 'Expediente no encontrado' });

    if (usuario.rol_id !== 1) {
      const [acceso] = await db.query(
        'SELECT id FROM area_usuario WHERE area_id = ? AND usuario_id = ?',
        [exp[0].area_id, usuario.id]
      );
      if (acceso.length === 0) return res.status(403).json({ error: 'Sin acceso' });
    }
    const [rows] = await db.query(
      `SELECT h.id, h.estado_anterior, h.estado_nuevo, h.comentario, h.fecha,
              u.nombre_completo AS usuario
       FROM historial_expediente h
       JOIN usuario u ON h.usuario_id = u.id
       WHERE h.expediente_id = ?
       ORDER BY h.fecha ASC`,
      [id]
    );
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// GET /api/expedientes/filtros/opciones
exports.getFiltrosOpciones = async (req, res) => {
  try {
    const [tipos]   = await db.query('SELECT id, nombre FROM tipo_documento ORDER BY nombre');
    const [estados] = await db.query("SELECT id, nombre FROM estado WHERE id IN (3,4,5,6,7,8) ORDER BY id");
    res.json({ tipos_documento: tipos, estados });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ─── HU-20: POST /api/expedientes/:id/derivar ────────────────────────────────
exports.derivarExpediente = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });
  if (usuario.rol_id !== 2) return res.status(403).json({ error: 'Solo los Colaboradores pueden derivar expedientes' });

  const { id } = req.params;
  const { area_destino_id, comentario } = req.body;

  if (!area_destino_id) return res.status(400).json({ error: 'La unidad organizativa destino es obligatoria' });
  if (!comentario?.trim()) return res.status(400).json({ error: 'El comentario es obligatorio al derivar' });

  try {
    // Verificar expediente existe y está en Borrador (estado_id = 3)
    const [exp] = await db.query('SELECT id, estado_id, area_id FROM expediente WHERE id = ?', [id]);
    if (exp.length === 0) return res.status(404).json({ error: 'Expediente no encontrado' });
    if (exp[0].estado_id !== 3) return res.status(400).json({ error: 'Solo se puede derivar un expediente en estado Borrador' });

    // Verificar acceso del colaborador al área origen
    const [acceso] = await db.query(
      `SELECT id FROM area_usuario WHERE area_id = ? AND usuario_id = ? AND rol_en_area = 'Colaborador'`,
      [exp[0].area_id, usuario.id]
    );
    if (acceso.length === 0) return res.status(403).json({ error: 'No tienes rol de Colaborador en el área de este expediente' });

    // Verificar que el área destino existe y está activa
    const [areaDestino] = await db.query('SELECT id FROM area WHERE id = ? AND estado_id = 1', [area_destino_id]);
    if (areaDestino.length === 0) return res.status(404).json({ error: 'El área destino no existe o está inactiva' });

    // Buscar la primera etapa del proceso asignado al área destino
    const [etapas] = await db.query(
      `SELECT e.id AS etapa_id, e.revisor_id, e.dias_revision
       FROM etapa e
       JOIN area a ON a.proceso_id = e.proceso_id
       WHERE a.id = ?
       ORDER BY e.secuencia ASC
       LIMIT 1`,
      [area_destino_id]
    );

    // Cambiar estado expediente a Derivado (estado_id = 4) y actualizar área
    await db.query(
      'UPDATE expediente SET estado_id = 4, area_id = ? WHERE id = ?',
      [area_destino_id, id]
    );

    // Registrar en historial
    await db.query(
      `INSERT INTO historial_expediente (expediente_id, usuario_id, estado_anterior, estado_nuevo, comentario)
       VALUES (?, ?, 'Borrador', 'Derivado', ?)`,
      [id, usuario.id, comentario.trim()]
    );

    // Si hay etapas configuradas, generar tarea de revisión para el revisor de la primera etapa
    if (etapas.length > 0) {
      const etapa = etapas[0];
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + (etapa.dias_revision || 5));
      await db.query(
        `INSERT INTO tarea (expediente_id, etapa_id, asignado_a, tipo, estado_id, fecha_vencimiento)
         VALUES (?, ?, ?, 'Revision', 9, ?)`,
        [id, etapa.etapa_id, etapa.revisor_id, fechaVencimiento.toISOString().split('T')[0]]
      );
    }

    res.json({ message: 'Expediente derivado correctamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ─── HU-21: GET /api/expedientes/:id/exportar-pdf ────────────────────────────
exports.exportarPDF = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });
  if (![1, 2].includes(usuario.rol_id)) return res.status(403).json({ error: 'No autorizado para exportar PDF' });

  const { id } = req.params;
  try {
    const [exp] = await db.query(
      `SELECT e.*, td.nombre AS tipo_documento, cat.nombre AS categoria,
              est.nombre AS estado, u.nombre_completo AS creado_por_nombre,
              a.nombre AS area_nombre, c.nombre AS contratista_nombre
       FROM expediente e
       JOIN tipo_documento td  ON e.tipo_doc_id    = td.id
       JOIN categoria cat      ON e.categoria_id   = cat.id
       JOIN estado est         ON e.estado_id      = est.id
       JOIN usuario u          ON e.creado_por     = u.id
       JOIN area a             ON e.area_id        = a.id
       JOIN contratista c      ON a.contratista_id = c.id
       WHERE e.id = ?`,
      [id]
    );
    if (exp.length === 0) return res.status(404).json({ error: 'Expediente no encontrado' });
    const expediente = exp[0];

    if (usuario.rol_id !== 1) {
      const [acceso] = await db.query(
        'SELECT id FROM area_usuario WHERE area_id = ? AND usuario_id = ?',
        [expediente.area_id, usuario.id]
      );
      if (acceso.length === 0) return res.status(403).json({ error: 'Sin acceso al expediente' });
    }

    const [historial] = await db.query(
      `SELECT h.estado_anterior, h.estado_nuevo, h.comentario, h.fecha,
              u.nombre_completo AS usuario
       FROM historial_expediente h
       JOIN usuario u ON h.usuario_id = u.id
       WHERE h.expediente_id = ? ORDER BY h.fecha ASC`,
      [id]
    );

    const [documentos] = await db.query(
      `SELECT d.nombre_archivo, d.tipo_archivo, d.fecha_carga, u.nombre_completo AS subido_por
       FROM documento_adjunto d
       JOIN usuario u ON d.subido_por = u.id
       WHERE d.expediente_id = ? ORDER BY d.fecha_carga DESC`,
      [id]
    );

    const formatFecha = (f) => f ? new Date(f).toLocaleDateString('es-CL') : '—';
    const formatFechaHora = (f) => f ? new Date(f).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

    const historialHTML = historial.map(h => `
      <tr>
        <td>${h.estado_anterior || '—'}</td>
        <td><strong>${h.estado_nuevo}</strong></td>
        <td>${h.usuario}</td>
        <td>${formatFechaHora(h.fecha)}</td>
        <td style="font-style:italic; color:#555">${h.comentario || '—'}</td>
      </tr>`).join('');

    const documentosHTML = documentos.length === 0
      ? '<p style="color:#888; font-style:italic">Sin documentos adjuntos</p>'
      : documentos.map(d => `
        <tr>
          <td>${d.nombre_archivo}</td>
          <td>${(d.tipo_archivo || '').toUpperCase()}</td>
          <td>${d.subido_por}</td>
          <td>${formatFechaHora(d.fecha_carga)}</td>
        </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Expediente ${expediente.correlativo}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 32px; }
  .header { border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
  .header-title { font-size: 20px; font-weight: bold; color: #1e3a8a; }
  .header-correlativo { font-size: 14px; color: #64748b; margin-top: 4px; }
  .header-meta { text-align: right; color: #64748b; font-size: 11px; line-height: 1.6; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-weight: bold; font-size: 11px; background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; }
  section { margin-bottom: 24px; }
  section h2 { font-size: 13px; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .campo label { font-size: 10px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.04em; }
  .campo p { font-size: 12px; font-weight: 500; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #f1f5f9; color: #475569; font-weight: 600; text-align: left; padding: 7px 10px; border: 1px solid #e2e8f0; }
  td { padding: 7px 10px; border: 1px solid #e2e8f0; color: #334155; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 10px; text-align: center; }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="header-title">Expediente Documental</div>
    <div class="header-correlativo">${expediente.correlativo}</div>
    <div style="margin-top:8px"><span class="badge">${expediente.estado}</span></div>
  </div>
  <div class="header-meta">
    <div><strong>${expediente.contratista_nombre}</strong></div>
    <div>${expediente.area_nombre}</div>
    <div>Generado: ${new Date().toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })}</div>
  </div>
</div>

<section>
  <h2>Datos del Expediente</h2>
  <div class="grid">
    <div class="campo"><label>Nombre</label><p>${expediente.nombre}</p></div>
    <div class="campo"><label>Tipo Documento</label><p>${expediente.tipo_documento}</p></div>
    <div class="campo"><label>Categoría</label><p>${expediente.categoria}</p></div>
    <div class="campo"><label>Origen</label><p>${expediente.origen}</p></div>
    <div class="campo"><label>Emisor</label><p>${expediente.emisor || '—'}</p></div>
    <div class="campo"><label>Materia</label><p>${expediente.materia || '—'}</p></div>
    <div class="campo"><label>N° Documento</label><p>${expediente.n_documento || '—'}</p></div>
    <div class="campo"><label>Fecha Documento</label><p>${formatFecha(expediente.fecha_documento)}</p></div>
    <div class="campo"><label>Fecha Ingreso</label><p>${formatFecha(expediente.fecha_ingreso)}</p></div>
    <div class="campo"><label>Creado por</label><p>${expediente.creado_por_nombre}</p></div>
    <div class="campo"><label>Reservado</label><p>${expediente.reservado ? 'Sí' : 'No'}</p></div>
  </div>
</section>

<section>
  <h2>Historial de Estados</h2>
  ${historial.length === 0
    ? '<p style="color:#888; font-style:italic">Sin historial registrado</p>'
    : `<table>
        <thead><tr><th>Estado Anterior</th><th>Estado Nuevo</th><th>Usuario</th><th>Fecha</th><th>Comentario</th></tr></thead>
        <tbody>${historialHTML}</tbody>
      </table>`}
</section>

<section>
  <h2>Documentos Adjuntos</h2>
  ${documentos.length === 0
    ? '<p style="color:#888; font-style:italic">Sin documentos adjuntos</p>'
    : `<table>
        <thead><tr><th>Archivo</th><th>Tipo</th><th>Subido por</th><th>Fecha</th></tr></thead>
        <tbody>${documentosHTML}</tbody>
      </table>`}
</section>

<div class="footer">Documento generado automáticamente por DocumentalGPS · ${expediente.correlativo}</div>
</body>
</html>`;

    // Generar PDF usando puppeteer si disponible, si no devolver HTML para impresión
    try {
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }, printBackground: true });
      await browser.close();
      const filename = `${expediente.correlativo}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch {
      // Fallback: devolver HTML para que el navegador imprima a PDF
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="${expediente.correlativo}.html"`);
      res.send(html);
    }
  } catch (error) { res.status(500).json({ error: error.message }); }
};