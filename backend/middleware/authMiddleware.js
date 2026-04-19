const jwt = require('jsonwebtoken');

exports.verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'El token no ha sido proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

exports.soloAdmin = (req, res, next) => {
  if (req.usuario.rol_id !== 1) {
    return res.status(403).json({ error: 'Acceso denegado. Solo puede ingresar Administrador.' });
  }
  next();
};