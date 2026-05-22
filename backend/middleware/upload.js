const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configurar Cloudinary con las variables de tu archivo .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar dónde se guardan los Pósters de las películas
const posterStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cine_posters', // Nombre de la carpeta que se creará en Cloudinary
    allowedFormats: ['jpg', 'png', 'jpeg', 'webp'],
  }
});

// Configurar dónde se guardan las fotos de las Comidas
const foodStorage = new CloudinaryStorage({
  cloudiny: cloudinary,
  params: {
    folder: 'cine_foods', // Nombre de la carpeta para comidas en Cloudinary
    allowedFormats: ['jpg', 'png', 'jpeg', 'webp'],
  }
});

// Crear los middlewares de subida
const uploadPoster = multer({ storage: posterStorage });
const uploadFood = multer({ storage: foodStorage });

module.exports = { uploadPoster, uploadFood };