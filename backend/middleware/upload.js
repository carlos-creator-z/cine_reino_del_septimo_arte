const multer = require('multer');
const path = require('path');

// Crea una configuración de almacenamiento en disco para una subcarpeta específica.
// Los archivos se guardan en /uploads/<subfolder>/ con un nombre único basado en timestamp.
const createStorage = (subfolder) => {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads', subfolder)),
    filename: (req, file, cb) => cb(null, `${subfolder}-${Date.now()}${path.extname(file.originalname)}`)
  });
};

// Valida que el archivo subido sea una imagen permitida (jpg, jpeg, png, webp, gif).
const fileFilter = (req, file, cb) => {
  if (/\.(jpg|jpeg|png|webp|gif)$/i.test(path.extname(file.originalname))) cb(null, true);
  else cb(new Error('Solo se permiten imágenes'), false);
};

// Instancia de multer para subir pósters de películas y próximos estrenos. Límite: 5MB.
const uploadPoster = multer({
  storage: createStorage('posters'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

// Instancia de multer para subir imágenes de productos de comida. Límite: 5MB.
const uploadFood = multer({
  storage: createStorage('foods'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

module.exports = { uploadPoster, uploadFood };