const app = require('./app');

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`ms-mantenedores corriendo en puerto ${PORT}`);
});