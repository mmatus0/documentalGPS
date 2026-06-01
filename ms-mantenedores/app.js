require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const multer  = require('multer');

const userRoutes        = require('./routes/userRoutes');
const contratistaRoutes = require('./routes/contratistaRoutes');
const areaRoutes        = require('./routes/areaRoutes');
const expedienteRoutes  = require('./routes/expedienteRoutes');
const proyectoRoutes    = require('./routes/proyectoRoutes');
const categoriaRoutes   = require('./routes/categoriaRoutes');  
const tipoDocRoutes     = require('./routes/tipoDocRoutes');  
const tipoColabRoutes   = require('./routes/tipoColabRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users',        userRoutes);
app.use('/api/proyectos', proyectoRoutes);
app.use('/api/contratistas', contratistaRoutes);
app.use('/api/areas',        areaRoutes);
app.use('/api/expedientes',  expedienteRoutes);
app.use('/api/categorias',   categoriaRoutes);
app.use('/api/tipos-doc',    tipoDocRoutes);    
app.use('/api/tipos-colab',  tipoColabRoutes);               

// ── Manejo de errores de Multer (tamaño, tipo) ─────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo supera el límite de 50MB' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err?.message?.includes('Extensión no permitida')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = app;