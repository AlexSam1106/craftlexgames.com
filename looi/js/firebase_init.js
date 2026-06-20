// js/firebase_init.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, addDoc, collection, query, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Tu configuración de Firebase (asegúrate de que sea la correcta para tu proyecto)
const firebaseConfig = {
    apiKey: "AIzaSyCfHtxrEyTd5swf-B-2EuhgeCOvqTpXQiE",
    authDomain: "looibot.firebaseapp.com",
    projectId: "looibot",
    storageBucket: "looibot.firebasestorage.app",
    messagingSenderId: "386952285153",
    appId: "1:386952285153:web:a7cb3c183c36845f2420a0",
    measurementId: "G-P3XM5K8R5H"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Variables globales para el estado de autenticación y usuario
let currentUserId = null;
let isAuthenticatedUser = false; // true si es Google/Email, false si es anónimo
let isAuthReady = false; // Indica si la verificación inicial de auth ha terminado

// Exportar instancias de Firebase y variables de estado
export { app, auth, db, googleProvider, currentUserId, isAuthenticatedUser, isAuthReady, onAuthStateChanged, signInAnonymously, signInWithPopup, signOut, saveVisualObservation, getPastObservations };

// --- FIREBASE MEMORY FUNCTIONS ---

/**
 * Guarda una observación visual en Firestore para el usuario actual.
 * Los datos se almacenan en /artifacts/{projectId}/users/{userId}/visualObservations.
 * @param {string} description - La descripción textual de la observación.
 */
async function saveVisualObservation(description) {
    if (!isAuthReady || !currentUserId || !isAuthenticatedUser) {
        console.warn("Firestore no está listo o el usuario no está autenticado (o es anónimo). No se puede guardar la observación.");
        return;
    }
    try {
        const observationsCollection = collection(db, `artifacts/${firebaseConfig.projectId}/users/${currentUserId}/visualObservations`);
        await addDoc(observationsCollection, {
            description: description,
            timestamp: new Date(),
        });
        console.log("Observación guardada en Firestore.");
    } catch (error) {
        console.error("Error al guardar la observación visual:", error);
    }
}

/**
 * Recupera observaciones visuales pasadas relevantes de Firestore para el usuario actual.
 * @param {string} queryText - Texto para buscar en las descripciones de las observaciones.
 * @param {number} limitCount - Número máximo de observaciones a recuperar.
 * @returns {Promise<Array<string>>} - Un array de descripciones de observaciones pasadas.
 */
async function getPastObservations(queryText, limitCount = 3) {
    if (!isAuthReady || !currentUserId || !isAuthenticatedUser) {
        console.warn("Firestore no está listo o el usuario no está autenticado (o es anónimo). No se pueden recuperar las observaciones.");
        return [];
    }
    try {
        const observationsCollection = collection(db, `artifacts/${firebaseConfig.projectId}/users/${currentUserId}/visualObservations`);
        // Nota: Firestore no soporta búsqueda de texto completo ni 'LIKE' directamente.
        // Esta es una simulación que recupera los últimos 'limitCount' documentos
        // y luego filtra en el cliente. Para una solución robusta, se necesitaría
        // un servicio de búsqueda externo (ej. Algolia, o usar embeddings de texto).
        const q = query(observationsCollection, limit(limitCount)); // No usar orderBy para evitar errores de índice si no hay un índice compuesto
        const querySnapshot = await getDocs(q);
        
        const relevantObservations = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Filtrado simple en el cliente
            if (data.description && data.description.toLowerCase().includes(queryText.toLowerCase())) {
                relevantObservations.push(data.description);
            }
        });
        return relevantObservations;

    } catch (error) {
        console.error("Error al recuperar observaciones pasadas:", error);
        return [];
    }
}

// Listener de estado de autenticación
onAuthStateChanged(auth, (user) => {
    currentUserId = user ? user.uid : null;
    isAuthenticatedUser = user ? !user.isAnonymous : false;
    isAuthReady = true; // La verificación inicial ha terminado

    console.log("Firebase Auth State Changed: User ID:", currentUserId, "Authenticated:", isAuthenticatedUser);

    // Lógica de redirección basada en el estado de autenticación y la página actual
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'index.html') {
        if (user) { // Si hay un usuario logueado, redirigir a main.html
            // Usar localStorage para persistir el tipo de sesión
            localStorage.setItem('looi_session_type', user.isAnonymous ? 'anonymous' : 'authenticated');
            localStorage.setItem('looi_user_id', user.uid);
            window.location.href = 'main.html';
        }
    } else if (currentPage === 'main.html' || currentPage === 'chatbot.html') {
        if (!user) { // Si no hay usuario logueado, redirigir a index.html
            window.location.href = 'index.html';
        }
        // Si hay un usuario, la aplicación principal continuará su carga normal.
        // Las variables currentUserId, isAuthenticatedUser ya están actualizadas.
    }
});
