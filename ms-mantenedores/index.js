const app = require('./app');

const PORT = process.env.PORT || 3002;
const server = app.listen(PORT, () => {
  console.log(`ms-mantenedores corriendo en puerto ${PORT}`);
});

// La carga masiva de documentos (hasta 200 archivos por request) puede tardar más que el
// timeout por defecto de Node en un servidor compartido como Pacheco. Se sube a 10 minutos.
server.timeout = 10 * 60 * 1000;
server.headersTimeout = 10 * 60 * 1000 + 5000;