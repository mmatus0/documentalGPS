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
router.get('/:expedienteId/documentos/:documentoId/descargar', limiter, documentoCtrl.descargarDocumento);
router.delete('/:expedienteId/documentos/:documentoId', limiter, documentoCtrl.eliminarDocumento);

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'El archivo supera el limite de 50MB' : err.message });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
});

module.exports = router;
