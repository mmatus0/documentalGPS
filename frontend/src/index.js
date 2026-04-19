require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const userRoutes      = require('./routes/userRoutes');
const authRoutes      = require('./routes/authRoutes');
const areaRoutes      = require('./routes/areaRoutes'); // ← HU-04

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/auth',  authRoutes);
app.use('/api/areas', areaRoutes); // ← HU-04

app.get('/', (req, res) => {
  res.send('API de Gestión Documental');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en puerto ${PORT}`);
});