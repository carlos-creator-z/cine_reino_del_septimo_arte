const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifica que la petición incluya un token JWT válido en el header Authorization.
// Si es válido, adjunta el usuario encontrado en req.user y continúa al siguiente middleware.
const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return res.status(401).json({ error: 'Token requerido' });

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Verifica que el usuario autenticado tenga rol de administrador.
// Debe usarse siempre después del middleware auth.
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });

  next();
};

module.exports = { auth, adminOnly };