const express = require('express');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Obtener todos los usuarios
router.get('/', auth, adminOnly, async (req, res) => { 
  try { 
    res.json(await User.find().sort({ createdAt: -1 })); 
  } catch { 
    res.status(500).json({ error: 'Error' }); 
  }
});

// Editar rol de usuario
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    
    // Validar que el rol sea válido
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    // Solo el súper admin puede asignar el rol 'admin'
    const SUPER_ADMIN_EMAIL = 'admin@reino.com';
    if (role === 'admin' && req.user.email !== SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Solo el administrador principal puede asignar el rol de administrador' });
    }

    // Evitar que el admin se quite su propio rol
    if (req.params.id === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ error: 'No puedes remover tu propio rol de administrador' });
    }

    // CAMBIO CLAVE: Buscamos, modificamos y guardamos (más seguro que findByIdAndUpdate)
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    user.role = role; // Cambiamos el rol
    await user.save(); // Forzamos el guardado en la base de datos

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
// Eliminar usuario
router.delete('/:id', auth, adminOnly, async (req, res) => { 
  try { 
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ error: 'No puedes eliminarte' }); 
    const u = await User.findByIdAndDelete(req.params.id); 
    if (!u) return res.status(404).json({ error: 'No encontrado' }); 
    res.json({ message: 'Eliminado' }); 
  } catch { 
    res.status(500).json({ error: 'Error' }); 
  }
});

module.exports = router;