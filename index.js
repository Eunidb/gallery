const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');


const upload = multer({ dest: 'uploads/' });

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.post('/images/single', upload.single('imagenes'), (req, res) => {
    console.log(req.file);
    saveImage(req.file);
    res.send('Final');
});

app.post('/images/multi', upload.array('fotos', 10), (req, res) => {
    req.files.map(saveImage);
    res.send('Termina multi');
});

function saveImage(file) {
    const newPath = `./uploads/${file.originalname}`; // Usa comillas invertidas para interpolación
    try {
        fs.renameSync(file.path, newPath); // Cambia el nombre del archivo y mueve la ubicación
        console.log(`Archivo guardado en: ${newPath}`);
        return newPath;
    } catch (error) {
        console.error('Error al guardar la imagen:', error);
        return null;
    }
}

app.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
});

app.get('/images', (req, res) => {
    const imagesDir = path.join(__dirname, 'uploads');
    fs.readdir(imagesDir, (err, files) => {
        if (err) {
            console.error('Error al leer el directorio de imágenes:', err);
            res.status(500).send('Error al obtener las imágenes');
        } else {
            const imageUrls = files.map((file) => `/images/${file}`);
            res.json(imageUrls);
        }
    });
});