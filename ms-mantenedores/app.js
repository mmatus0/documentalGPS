require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const userRoutes        = require('./routes/userRoutes');
const contratistaRoutes = require('./routes/contratistaRoutes');
const areaRoutes        = require('./routes/areaRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users',        userRoutes);
app.use('/api/contratistas', contratistaRoutes);
app.use('/api/areas',        areaRoutes);

module.exports = app;