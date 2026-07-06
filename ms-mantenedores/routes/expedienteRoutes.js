const express    = require('express');
const rateLimit  = require('express-rate-limit');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const db         = require('../config/db');
const router     = express.Router();

const expedienteCtrl = require('../controllers/expedienteController');
const documentoCtrl  = require('../controllers/documentoController');
const { EXTENSIONES_PERMITIDAS, TAMANO_MAXIMO, UPLOAD_DIR } = require('../controllers/documentoController');

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });


const LIMITE_LOTE = 200;
const loteLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false });

try {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (err) { console.warn('No se pudo crear directorio uploads:', err.message); }

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_DIR, `expediente_${req.params.expedienteId}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext      = path.extname(file.originalname).toLowerCase();
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 80);
    cb(null, `${Date.now()}_${basename}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  EXTENSIONES_PERMITIDAS.includes(ext)
    ? cb(null, true)
    : cb(new Error(`Extension no permitida. Solo: ${EXTENSIONES_PERMITIDAS.join(', ')}`), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: TAMANO_MAXIMO } });

// Misma storage/fileFilter/tamaño máximo por archivo (50MB), pero acepta un arreglo de archivos
// en el campo "archivos" en vez de uno solo en "archivo".
const uploadLote = multer({ storage, fileFilter, limits: { fileSize: TAMANO_MAXIMO, files: LIMITE_LOTE } });

const guardarRegistroDocumento = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const authHeader = req.headers['authorization'];
    let usuarioId = null;
    if (authHeader) {
      const payload = JSON.parse(Buffer.from(authHeader.split(' ')[1].split('.')[1], 'base64').toString('utf-8'));
      usuarioId = payload?.id;
    }
    const ext = path.extname(req.file.originalname).toLowerCase();
    const [result] = await db.query(
      'INSERT INTO documento_adjunto (expediente_id, subido_por, nombre_archivo, tipo_archivo, ruta_volumen) VALUES (?, ?, ?, ?, ?)',
      [req.params.expedienteId, usuarioId, req.file.originalname, ext, `expediente_${req.params.expedienteId}/${req.file.filename}`]
    );
    req.fileRecord = { id: result.insertId };
    next();
  } catch (error) { next(error); }
};

// Inserta en documento_adjunto cada archivo del lote. Si uno falla (ej. error de BD puntual),
// no aborta el resto: cada archivo queda registrado en req.fileRecords con { ok: true/false }.
const guardarRegistrosDocumentoLote = async (req, res, next) => {
  const files = req.files || [];
  if (files.length === 0) return next();

  let usuarioId = null;
  try {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const payload = JSON.parse(Buffer.from(authHeader.split(' ')[1].split('.')[1], 'base64').toString('utf-8'));
      usuarioId = payload?.id;
    }
  } catch { /* se valida usuario en el controller */ }

  const resultados = [];
  for (const file of files) {
    try {
      const ext = path.extname(file.originalname).toLowerCase();
      const [result] = await db.query(
        'INSERT INTO documento_adjunto (expediente_id, subido_por, nombre_archivo, tipo_archivo, ruta_volumen) VALUES (?, ?, ?, ?, ?)',
        [req.params.expedienteId, usuarioId, file.originalname, ext, `expediente_${req.params.expedienteId}/${file.filename}`]
      );
      resultados.push({ ok: true, id: result.insertId, nombre_archivo: file.originalname });
    } catch (error) {
      resultados.push({ ok: false, nombre_archivo: file.originalname, error: error.message });
    }
  }
  req.fileRecords = resultados;
  next();
};

// Rutas especificas ANTES de las parametricas
router.get('/filtros/opciones',  limiter, expedienteCtrl.getFiltrosOpciones);
router.get('/',                  limiter, expedienteCtrl.getExpedientesGlobal);     // HU-17
router.post('/',                 limiter, expedienteCtrl.crearExpediente);           // HU-15
router.get('/area/:areaId',      limiter, expedienteCtrl.getExpedientesPorArea);
router.get('/:id/historial',     limiter, expedienteCtrl.getHistorialExpediente);   // HU-19
router.get('/:id',               limiter, expedienteCtrl.getExpedienteDetalle);
router.post('/:id/derivar',       limiter, expedienteCtrl.derivarExpediente);      // HU-20
router.get('/:id/exportar-pdf',   limiter, expedienteCtrl.exportarPDF);            // HU-21

router.post('/:expedienteId/documentos', limiter, upload.single('archivo'), guardarRegistroDocumento, documentoCtrl.subirDocumento);
router.post('/:expedienteId/documentos/lote', loteLimiter, uploadLote.array('archivos', LIMITE_LOTE), guardarRegistrosDocumentoLote, documentoCtrl.subirDocumentosLote); // Carga masiva
router.get('/:expedienteId/documentos/:documentoId/descargar', limiter, documentoCtrl.descargarDocumento);
router.delete('/:expedienteId/documentos/:documentoId', limiter, documentoCtrl.eliminarDocumento);

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const mensajes = {
      LIMIT_FILE_SIZE:  'Un archivo supera el limite de 50MB',
      LIMIT_FILE_COUNT: `El lote supera el maximo de ${LIMITE_LOTE} archivos por request`,
      LIMIT_UNEXPECTED_FILE: `El lote supera el maximo de ${LIMITE_LOTE} archivos por request`,
    };
    return res.status(400).json({ error: mensajes[err.code] || err.message });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
});

module.exports = router;