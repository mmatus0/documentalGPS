require('dotenv').config();

const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const contratistaRoutes = require('./routes/contratistaRoutes');
const areaRoutes = require('./routes/areaRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/contratistas', contratistaRoutes);
app.use('/api/areas', areaRoutes);

app.get('/', (req, res) => {
  res.send('API de Gestión Documental');
});

module.exports = app;