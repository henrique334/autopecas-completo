const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'autopecas_secret_2024';

function autenticar(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ erro: 'Não autorizado.' });
  try {
    req.usuario = jwt.verify(auth.split(' ')[1], SECRET);
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

module.exports = { autenticar, SECRET };
