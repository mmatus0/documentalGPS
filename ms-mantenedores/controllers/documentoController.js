const db   = require('../config/db');
const path = require('path');
const fs   = require('fs');

const EXTENSIONES_PERMITIDAS = ['.pdf', '.docx', '.xlsx', '.pbix', '.jpg', '.jpeg', '.png', '.txt', '.csv'];
const TAMANO_MAXIMO          = 50 * 1024 * 1024; // 50 MB
const UPLOAD_DIR             = process.env.UPLOAD_DIR || '/app/uploads';

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

// POST /api/expedientes/:expedienteId/documentos
exports.subirDocumento = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });

  // Solo Colaborador (rol 2) y Administrador (rol 1) pueden subir
  if (usuario.rol_id === 3) {
    return res.status(403).json({ error: 'Los lectores no pueden subir archivos' });
  }

  const { expedienteId } = req.params;

  try {
    // Verificar que el expediente existe y obtener su área
    const [exp] = await db.query(
      `SELECT e.id, e.area_id FROM expediente e WHERE e.id = ?`,
      [expedienteId]
    );
    if (exp.length === 0) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    // Verificar acceso al área
    if (usuario.rol_id !== 1) {
      const [acceso] = await db.query(
        `SELECT id, rol_en_area FROM area_usuario WHERE area_id = ? AND usuario_id = ?`,
        [exp[0].area_id, usuario.id]
      );
      if (acceso.length === 0 || acceso[0].rol_en_area !== 'Colaborador') {
        return res.status(403).json({ error: 'Solo los colaboradores pueden subir archivos' });
      }
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    res.status(201).json({
      mensaje: 'Documento subido correctamente',
      documento: {
        id:             req.fileRecord.id,
        nombre_archivo: req.file.originalname,
        tipo_archivo:   path.extname(req.file.originalname).toLowerCase(),
        fecha_carga:    new Date(),
        subido_por:     usuario.nombre_completo || usuario.correo,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/expedientes/:expedienteId/documentos/lote
// Carga masiva: recibe hasta LIMITE_LOTE archivos en un solo request (multipart, campo "archivos").
// El middleware guardarRegistrosDocumentoLote ya insertó los registros en documento_adjunto
// y dejó el resultado en req.fileRecords (array de { id, nombre_archivo, ok } por archivo).
exports.subirDocumentosLote = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });

  if (usuario.rol_id === 3) {
    return res.status(403).json({ error: 'Los lectores no pueden subir archivos' });
  }

  const { expedienteId } = req.params;

  try {
    const [exp] = await db.query(
      `SELECT e.id, e.area_id FROM expediente e WHERE e.id = ?`,
      [expedienteId]
    );
    if (exp.length === 0) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    if (usuario.rol_id !== 1) {
      const [acceso] = await db.query(
        `SELECT id, rol_en_area FROM area_usuario WHERE area_id = ? AND usuario_id = ?`,
        [exp[0].area_id, usuario.id]
      );
      if (acceso.length === 0 || acceso[0].rol_en_area !== 'Colaborador') {
        return res.status(403).json({ error: 'Solo los colaboradores pueden subir archivos' });
      }
    }

    const registros = req.fileRecords || [];
    if (registros.length === 0) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    const exitosos = registros.filter(r => r.ok);
    const fallidos  = registros.filter(r => !r.ok);

    res.status(201).json({
      mensaje: `${exitosos.length} de ${registros.length} archivos subidos correctamente`,
      total:      registros.length,
      exitosos:   exitosos.length,
      fallidos:   fallidos.length,
      documentos: exitosos.map(r => ({ id: r.id, nombre_archivo: r.nombre_archivo })),
      errores:    fallidos.map(r => ({ nombre_archivo: r.nombre_archivo, error: r.error })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/expedientes/:expedienteId/documentos/:documentoId/descargar
exports.descargarDocumento = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });

  const { expedienteId, documentoId } = req.params;

  try {
    const [docs] = await db.query(
      `SELECT d.*, e.area_id FROM documento_adjunto d
       JOIN expediente e ON d.expediente_id = e.id
       WHERE d.id = ? AND d.expediente_id = ?`,
      [documentoId, expedienteId]
    );

    if (docs.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    const doc = docs[0];

    // Verificar acceso
    if (usuario.rol_id !== 1) {
      const [acceso] = await db.query(
        `SELECT id FROM area_usuario WHERE area_id = ? AND usuario_id = ?`,
        [doc.area_id, usuario.id]
      );
      if (acceso.length === 0) {
        return res.status(403).json({ error: 'Sin acceso a este documento' });
      }
    }

    const filePath = path.join(UPLOAD_DIR, doc.ruta_volumen);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado en el servidor' });
    }

    res.download(filePath, doc.nombre_archivo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/expedientes/:expedienteId/documentos/:documentoId
// Solo se puede eliminar si el expediente está en estado Borrador (estado_id = 3)
exports.eliminarDocumento = async (req, res) => {
  const usuario = getUsuarioFromReq(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });

  if (usuario.rol_id === 3) {
    return res.status(403).json({ error: 'Los lectores no pueden eliminar archivos' });
  }

  const { expedienteId, documentoId } = req.params;

  try {
    const [docs] = await db.query(
      `SELECT d.*, e.area_id, e.estado_id AS exp_estado_id
       FROM documento_adjunto d
       JOIN expediente e ON d.expediente_id = e.id
       WHERE d.id = ? AND d.expediente_id = ?`,
      [documentoId, expedienteId]
    );

    if (docs.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    const doc = docs[0];

    // solo se puede eliminar si el expediente está en Borrador (estado_id = 3)
    if (doc.exp_estado_id !== 3) {
      return res.status(409).json({
        error: 'Solo se pueden eliminar documentos de expedientes en estado Borrador'
      });
    }

    // Verificar acceso (solo el que subió o admin puede eliminar)
    if (usuario.rol_id !== 1 && doc.subido_por !== usuario.id) {
      return res.status(403).json({ error: 'Solo puedes eliminar tus propios documentos' });
    }

    // Eliminar archivo físico
    const filePath = path.join(UPLOAD_DIR, doc.ruta_volumen);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Eliminar registro en BD
    await db.query(`DELETE FROM documento_adjunto WHERE id = ?`, [documentoId]);

    res.json({ mensaje: 'Documento eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.EXTENSIONES_PERMITIDAS = EXTENSIONES_PERMITIDAS;
module.exports.TAMANO_MAXIMO          = TAMANO_MAXIMO;
module.exports.UPLOAD_DIR             = UPLOAD_DIR;