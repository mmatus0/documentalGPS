const app = require('./app');

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Gateway corriendo en puerto ${PORT}`);
});

// El gateway hace de proxy hacia ms-mantenedores; debe tolerar el mismo timeout largo
// que la carga masiva de documentos necesita, o cortará la conexión antes que el microservicio.
server.timeout = 10 * 60 * 1000;
server.headersTimeout = 10 * 60 * 1000 + 5000;