const express = require('express');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, adminOnly, async (req, res) => { try { res.json(await User.find().sort({ createdAt: -1 })); } catch { res.status(500).json({ error: 'Error' }); }});
router.delete('/:id', auth, adminOnly, async (req, res) => { try { if (req.params.id === req.user._id.toString()) return res.status(400).json({ error: 'No puedes eliminarte' }); const u = await User.findByIdAndDelete(req.params.id); if (!u) return res.status(404).json({ error: 'No encontrado' }); res.json({ message: 'Eliminado' }); } catch { res.status(500).json({ error: 'Error' }); }});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // ... validaciones ...
    const user = await User.create({ name, email, password });
    // ... generar token y responder ...
  } catch (error) {
    // SI HAY UN ERROR AQUÍ, EL USUARIO NO SE GUARDA
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;