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

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Asegurar que el directorio de uploads existe ───────────────────────────
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('No se pudo crear directorio uploads:', err.message);
}

// ── Configuración de Multer ─────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const expedienteId = req.params.expedienteId;
    const dir = path.join(UPLOAD_DIR, `expediente_${expedienteId}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext       = path.extname(file.originalname).toLowerCase();
    const basename  = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .substring(0, 80);
    cb(null, `${timestamp}_${basename}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (EXTENSIONES_PERMITIDAS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Extensión no permitida. Solo se aceptan: ${EXTENSIONES_PERMITIDAS.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: TAMANO_MAXIMO },
});

// ── Middleware para guardar registro en BD después de upload ───────────────
const guardarRegistroDocumento = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const expedienteId = req.params.expedienteId;
    const authHeader   = req.headers['authorization'];
    let usuarioId      = null;

    if (authHeader) {
      const token   = authHeader.split(' ')[1];
      const base64  = token.split('.')[1];
      const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
      usuarioId     = payload?.id;
    }

    const ext          = path.extname(req.file.originalname).toLowerCase();
    const rutaRelativa = `expediente_${expedienteId}/${req.file.filename}`;

    const [result] = await db.query(
      `INSERT INTO documento_adjunto
         (expediente_id, subido_por, nombre_archivo, tipo_archivo, ruta_volumen)
       VALUES (?, ?, ?, ?, ?)`,
      [expedienteId, usuarioId, req.file.originalname, ext, rutaRelativa]
    );

    req.fileRecord = { id: result.insertId };
    next();
  } catch (error) {
    next(error);
  }
};

// ── Rutas de Expedientes ────────────────────────────────────────────────────
router.post('/',             limiter, expedienteCtrl.crearExpediente);      // HU-15
router.get('/area/:areaId',  limiter, expedienteCtrl.getExpedientesPorArea);
router.get('/:id/historial', limiter, expedienteCtrl.getHistorialExpediente); // HU-19
router.get('/:id',           limiter, expedienteCtrl.getExpedienteDetalle);

// ── Rutas de Documentos ─────────────────────────────────────────────────────
router.post(
  '/:expedienteId/documentos',
  limiter,
  upload.single('archivo'),
  guardarRegistroDocumento,
  documentoCtrl.subirDocumento
);

router.get(
  '/:expedienteId/documentos/:documentoId/descargar',
  limiter,
  documentoCtrl.descargarDocumento
);

router.delete(
  '/:expedienteId/documentos/:documentoId',
  limiter,
  documentoCtrl.eliminarDocumento
);

// ── Manejo de errores de Multer ─────────────────────────────────────────────
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo supera el límite de 50MB' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;