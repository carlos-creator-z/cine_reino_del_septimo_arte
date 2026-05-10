const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Genera un JWT firmado con los datos básicos del usuario.
const generateToken = (user) => jwt.sign(
  { id: user._id, name: user.name, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

// Registra un nuevo usuario. Valida campos requeridos, longitud de contraseña
// y que el correo no esté en uso. Devuelve token y datos del usuario creado.
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    if (password.length < 6)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Este correo ya está registrado' });

    const user = await User.create({ name, email, password });
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, points: user.points, membership: user.membership }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor: ' + error.message });
  }
});

// Autentica un usuario existente. Verifica que el correo exista y que la contraseña
// sea correcta. Devuelve token y datos del usuario.
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Correo y contraseña requeridos' });

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' });
    if (!(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = generateToken(user);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, points: user.points, membership: user.membership }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor: ' + error.message });
  }
});

// Devuelve los datos del usuario actualmente autenticado según el token.
router.get('/me', auth, async (req, res) => {
  try {
    res.json(req.user);
  } catch {
    res.status(500).json({ error: 'Error' });
  }
});

module.exports = router;