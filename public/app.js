if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(() => console.log('Service Worker registrado'))
        .catch((error) => console.error('Error al registrar el Service Worker:', error));
}

const dbPromise = indexedDB.open('imageDB', 1);

dbPromise.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
    }
};

async function saveImageToIndexedDB(image) {
    return new Promise((resolve, reject) => {
        const dbRequest = indexedDB.open('imageDB', 1);
        
        dbRequest.onerror = (event) => reject(event.target.error);
        
        dbRequest.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction('images', 'readwrite');
            const store = transaction.objectStore('images');
            
            const request = store.add({ image, timestamp: Date.now() });
            
            request.onsuccess = () => {
                console.log('Imagen guardada en IndexedDB');
                resolve();
            };
            
            request.onerror = (event) => reject(event.target.error);
        };
    });
}

async function uploadOfflineImages() {
    try {
        const db = await openDatabase();
        const transaction = db.transaction('images', 'readwrite');
        const store = transaction.objectStore('images');
        
        const images = await getAllImages(store);
        
        for (const entry of images) {
            try {
                await uploadImage(entry.image);
                await deleteImageFromDB(store, entry.id);
                console.log(`Imagen ${entry.id} subida y eliminada de IndexedDB`);
            } catch (uploadError) {
                console.error(`Error subiendo imagen ${entry.id}:`, uploadError);
            }
        }
    } catch (error) {
        console.error('Error al procesar imágenes offline:', error);
    }
}

function openDatabase() {
    return new Promise((resolve, reject) => {
        const dbRequest = indexedDB.open('imageDB', 1);
        dbRequest.onsuccess = (event) => resolve(event.target.result);
        dbRequest.onerror = (event) => reject(event.target.error);
    });
}

function getAllImages(store) {
    return new Promise((resolve, reject) => {
        const getAll = store.getAll();
        getAll.onsuccess = () => resolve(getAll.result);
        getAll.onerror = () => reject(getAll.error);
    });
}

function deleteImageFromDB(store, id) {
    return new Promise((resolve, reject) => {
        const deleteRequest = store.delete(id);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
    });
}

// Reemplaza el event listener 'online' existente
window.addEventListener('online', uploadOfflineImages);

// Código nuevo para mostrar las imágenes
const imageContainer = document.getElementById('image-container');

async function displayImages() {
    try {
        const db = await openDatabase();
        const transaction = db.transaction('images', 'readonly');
        const store = transaction.objectStore('images');
        const images = await getAllImages(store);

        imageContainer.innerHTML = '';
        images.forEach((image) => {
            const img = document.createElement('img');
            img.src = image.image;
            img.alt = 'Uploaded Image';
            imageContainer.appendChild(img);
        });
    } catch (error) {
        console.error('Error al mostrar las imágenes:', error);
    }
}

// Llama a la función para mostrar las imágenes al cargar la página
window.addEventListener('load', displayImages);