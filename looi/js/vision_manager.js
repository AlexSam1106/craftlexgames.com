// js/vision_manager.js

import { saveVisualObservation, getPastObservations, isAuthenticatedUser, currentUserId } from './firebase_init.js';
import { setEyePattern, eyePatterns } from './eye_manager.js';
import { playRobotSound, speakText } from './audio_manager.js';

// --- Configuración de Múltiples Claves API para Gemini ---
// ¡IMPORTANTE! Almacenar claves API directamente en el cliente no es seguro para producción.
// Para producción, considera un backend para gestionar tus claves de forma segura.
// Reemplaza las claves de ejemplo con tus claves API reales de Gemini.
const GEMINI_API_KEYS = [
    "AIzaSyASUsN4hOU_j3IGO07zEsJJdHzrNBuIyuY", // Tu clave API original
    "AIzaSyBbRfTNs9vufZFjGYnVJvBCTyzTBYMRL64", // Nueva clave API proporcionada por el usuario
    "AIzaSyCJQffxedBUfAIwysofFDbYXAGNXbf_Osg"  // Otra nueva clave API proporcionada por el usuario
];
let currentApiKeyIndex = 0;

/**
 * Obtiene la clave API actual y avanza al siguiente índice para el próximo uso.
 * Si se agotan las claves, vuelve al principio.
 * @returns {string} La clave API actual.
 */
function getApiKey() {
    const apiKey = GEMINI_API_KEYS[currentApiKeyIndex];
    currentApiKeyIndex = (currentApiKeyIndex + 1) % GEMINI_API_KEYS.length;
    return apiKey;
}

// Referencias a elementos DOM (se inicializarán en chatbot.js)
let settingsWebcamVideo, settingsWebcamCanvas, cameraSelect, continuousVisionToggle, visionInterval, visionIntervalValue;
let robotResponse; // Para mensajes de error
let visionToggleBtn; // Nuevo botón de toggle de visión en la pantalla principal

// Variables de estado de la cámara
let webcamStream = null;
let currentCameraDeviceId = null;
let continuousCaptureIntervalId = null;
let isContinuousVisionActive = false;

// ** Nuevo: Array para almacenar el historial de observaciones visuales CRUDAS con timestamp **
const MAX_VISUAL_HISTORY = 3; // Mantener las últimas 3 observaciones
let visualObservationsHistory = [];
const VISUAL_HISTORY_KEY = 'looi_visual_observations_history';

// Cargar el historial de observaciones visuales al inicio
function loadVisualHistory() {
    const storedHistory = localStorage.getItem(VISUAL_HISTORY_KEY);
    if (storedHistory) {
        visualObservationsHistory = JSON.parse(storedHistory);
        console.log('DEBUG (Vision): Historial visual cargado de localStorage:', visualObservationsHistory);
    } else {
        console.log('DEBUG (Vision): No se encontró historial visual en localStorage.');
    }
}
loadVisualHistory(); // Cargar al inicializar el módulo

// Asignar referencias DOM desde chatbot.js
export function setVisionVariables(vars) {
    ({
        settingsWebcamVideo, settingsWebcamCanvas, cameraSelect, continuousVisionToggle, visionInterval, visionIntervalValue,
        robotResponse, visionToggleBtn
    } = vars);
}

/**
 * Inicia la cámara web y muestra el feed en el elemento de video.
 * Se usa en los ajustes de cámara.
 * @param {string} [deviceId] - ID opcional del dispositivo de cámara a usar.
 */
export async function startWebcam(deviceId) {
    if (webcamStream) {
        const currentVideoTrack = webcamStream.getVideoTracks()[0];
        // Check if stream is already active and from the desired device.
        // Also check if the track is still live.
        if (currentVideoTrack && currentVideoTrack.getSettings().deviceId === deviceId && currentVideoTrack.readyState === 'live') {
            console.log('Cámara ya iniciada con el mismo deviceId y stream activo.');
            if (settingsWebcamVideo) {
                settingsWebcamVideo.srcObject = webcamStream; // Re-attach if it was cleared
                settingsWebcamVideo.style.display = 'block'; // Make it visible for preview
                if (settingsWebcamVideo.paused) {
                    await settingsWebcamVideo.play().catch(e => console.error("Error al reproducir el video de la webcam:", e));
                }
            }
            currentCameraDeviceId = deviceId; // Ensure deviceId is up-to-date
            return;
        }
        // If it's a different device or not playing/live, stop current stream to restart
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null; // Reset the stream variable
    }
    try {
        const constraints = { video: { deviceId: deviceId ? { exact: deviceId } : undefined } };
        webcamStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (settingsWebcamVideo) {
            settingsWebcamVideo.srcObject = webcamStream;
            settingsWebcamVideo.style.display = 'block'; // Ensure it's visible for preview when started
            if (settingsWebcamVideo.paused) {
                await settingsWebcamVideo.play().catch(e => console.error("Error al reproducir el video de la webcam:", e));
            }
        }
        currentCameraDeviceId = deviceId; // Update the ID of the current device
        console.log('Cámara iniciada con deviceId:', deviceId || 'default');
    } catch (err) {
        console.error('Error al acceder a la cámara:', err);
        if (robotResponse) {
            robotResponse.innerHTML = `<p><strong>Error:</strong> No pude acceder a la cámara. Asegúrate de dar permiso y estar en un entorno seguro (HTTPS).</p>`;
            speakText('Lo siento, no pude acceder a tu cámara. Necesito permiso para ver.', { setEyePattern, eyePatterns });
        }
    }
}

/**
 * Detiene la cámara web.
 * Se usa al cerrar los ajustes de cámara o cuando la visión continua se desactiva y no hay otra necesidad.
 * IMPORTANTE: Solo detiene el stream si la visión continua NO está activa.
 */
export function stopWebcam() {
    // Si la visión continua está activa, solo ocultamos la vista previa, no detenemos el stream.
    if (isContinuousVisionActive) {
        if (settingsWebcamVideo) settingsWebcamVideo.style.display = 'none'; // Oculta el elemento de video
        console.log('Cámara de previsualización oculta, pero la visión continua sigue activa.');
    } else {
        // Si la visión continua NO está activa, entonces podemos detener completamente el stream.
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
            webcamStream = null;
            if (settingsWebcamVideo) {
                settingsWebcamVideo.srcObject = null; // Limpia la fuente
                settingsWebcamVideo.style.display = 'none'; // Asegura que esté oculto
            }
            console.log('Cámara detenida.');
        }
    }
}

/**
 * Lista los dispositivos de video disponibles y los añade al selector en ajustes.
 */
export async function listCameras() {
    if (!cameraSelect) return; // Asegurarse de que el elemento exista
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        cameraSelect.innerHTML = '';
        let defaultCameraSelected = false;
        devices.forEach(device => {
            if (device.kind === 'videoinput') {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label || `Cámara ${cameraSelect.options.length + 1}`;
                cameraSelect.appendChild(option);
                if (device.deviceId === currentCameraDeviceId) {
                    option.selected = true;
                    defaultCameraSelected = true;
                }
            }
        });
        // Si no se seleccionó la cámara actual, pero hay cámaras, selecciona la primera
        if (!defaultCameraSelected && cameraSelect.options.length > 0) {
            cameraSelect.selectedIndex = 0;
            currentCameraDeviceId = cameraSelect.value;
        }
    } catch (err) {
        console.error('Error al listar cámaras:', err);
    }
}

/**
 * Captura un fotograma de la cámara y lo convierte a Base64.
 * @returns {string|null} - Imagen en formato Base64 o null si la cámara no está lista.
 */
function captureFrameToBase64() {
    // Es crucial que settingsWebcamVideo esté reproduciendo activamente el stream.
    // readyState >= 2 significa que hay suficientes datos para el fotograma actual.
    if (!settingsWebcamVideo || settingsWebcamVideo.readyState < 2 || settingsWebcamVideo.paused || settingsWebcamVideo.ended) {
        console.warn('Cámara no lista para capturar. (Elemento de video no listo o pausado/finalizado)');
        return null;
    }
    
    if (!settingsWebcamCanvas) {
        console.error("Elemento settingsWebcamCanvas no encontrado. No se puede capturar el fotograma.");
        return null;
    }

    const context = settingsWebcamCanvas.getContext('2d');
    
    // Establecer las dimensiones del canvas para que coincidan con el video
    settingsWebcamCanvas.width = settingsWebcamVideo.videoWidth;
    settingsWebcamCanvas.height = settingsWebcamVideo.videoHeight;
    
    // Dibujar el fotograma actual del elemento de video
    context.drawImage(settingsWebcamVideo, 0, 0, settingsWebcamCanvas.width, settingsWebcamCanvas.height);
    
    return settingsWebcamCanvas.toDataURL('image/jpeg', 0.8); // 0.8 es la calidad
}

/**
 * Helper function to fetch with exponential backoff and API key cycling.
 * @param {string} baseUrl - The base URL for the API call (without key).
 * @param {object} options - Fetch options.
 * @param {number} retries - Max number of retries per API key.
 * @param {number} delay - Initial delay in ms.
 * @param {boolean} useApiKeyCycling - Whether to cycle through API keys on 429 errors.
 * @returns {Promise<Response>}
 */
async function fetchWithExponentialBackoffAndKeyCycling(baseUrl, options, retries = 5, delay = 1000, useApiKeyCycling = true) {
    let currentRetryCount = 0;
    let currentKeyAttempt = 0;
    const maxKeyAttempts = useApiKeyCycling ? GEMINI_API_KEYS.length : 1;

    while (currentKeyAttempt < maxKeyAttempts) {
        const apiKey = getApiKey(); // Get the next API key
        const url = `${baseUrl}?key=${apiKey}`;

        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, options);
                if (response.status === 429) { // Too Many Requests
                    console.warn(`API call failed with status 429 (Quota Exceeded) for key ending in ...${apiKey.slice(-5)}. Attempting next key.`);
                    break; // Break inner loop to try next API key
                } else if (response.status >= 500) { // Server Errors
                    if (i < retries - 1) {
                        const backoffTime = delay * Math.pow(2, i);
                        console.warn(`API call failed with status ${response.status}. Retrying with same key in ${backoffTime}ms...`);
                        await new Promise(resolve => setTimeout(resolve, backoffTime));
                        continue; // Retry with same key
                    }
                } else if (response.status === 403) { // Forbidden - often due to invalid API key or permissions
                    console.error(`API call failed with status 403 (Forbidden) for key ending in ...${apiKey.slice(-5)}. This key might be invalid or lack permissions. Trying next key if available.`);
                    break; // Break inner loop to try next API key
                }
                return response; // Success or non-retryable error
            } catch (error) {
                if (i < retries - 1) {
                    const backoffTime = delay * Math.pow(2, i);
                    console.error(`API call failed: ${error.message}. Retrying with same key in ${backoffTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, backoffTime));
                    continue; // Retry with same key
                }
                throw error; // Re-throw if max retries reached for this key
            }
        }
        currentKeyAttempt++; // Move to the next API key attempt
    }
    throw new Error('All API keys exhausted or max retries exceeded for all keys.');
}


/**
 * Llama a la API de Gemini con la personalidad seleccionada y la imagen.
 * @param {string} imageData - Imagen en formato Base64.
 * @returns {Promise<string>} - La descripción textual de la imagen por Gemini.
 */
async function callGeminiVisionAPI(imageData) {
    const model = "gemini-1.5-flash"; // Modelo multimodal de Gemini
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const prompt = `Describe esta imagen en detalle, mencionando los objetos principales y si hay rostros humanos presentes. Si hay rostros, ¿cuántos hay? Responde como LOOI, con tu personalidad actual. Mantén la respuesta concisa y expresiva.`;

    try {
        // Log de depuración: Muestra el prompt y el tamaño de la imagen que se enviará a Gemini Vision
        console.log('DEBUG (Vision): Prompt enviado a Gemini Vision:', prompt);
        console.log('DEBUG (Vision): Tamaño de la imagen Base64 para Gemini Vision (primeros 50 chars):', imageData.substring(0, 50) + '...');
        console.log('DEBUG (Vision): Estado de autenticación antes de callGeminiVisionAPI - isAuthenticatedUser:', isAuthenticatedUser, 'currentUserId:', currentUserId);

        const response = await fetchWithExponentialBackoffAndKeyCycling(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: 'image/jpeg', data: imageData.split(',')[1] } }
                    ]
                }]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error HTTP: ${response.status} - ${errorData.error.message || response.statusText}`);
        }

        const result = await response.json();
        return result.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Error en callGeminiVisionAPI:", error);
        throw error;
    }
}

/**
 * Utiliza el modelo de texto de Gemini para resumir y filtrar una observación visual.
 * Esto ayuda a mantener la memoria visual concisa y relevante.
 * @param {string} rawObservation - La descripción detallada de la imagen generada por Gemini Vision.
 * @returns {Promise<string>} - Una cadena concisa con la observación filtrada o una indicación de no cambio.
 */
async function summarizeVisualObservation(rawObservation) {
    const model = "gemini-2.5-flash-preview-05-20"; // Usar el modelo de texto para el resumen
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    // Prompt para el modelo de texto para resumir la observación
    // Instruye al modelo a ser conciso y a identificar si no hay nada nuevo o distintivo.
    const prompt = `Analiza la siguiente descripción visual: "${rawObservation}". 
    Extrae los 2-3 objetos o características más relevantes o novedosas. 
    Si la descripción es muy similar a algo genérico o ya descrito ('una persona', 'una mesa', 'una habitación'), resúmela concisamente o indica 'similar'. 
    Si no hay objetos o detalles claros, indica 'nada distintivo'. 
    Si hay un rostro, menciona 'un rostro' sin detalles adicionales. 
    Mantén la respuesta muy breve, de no más de 15 palabras. 
    Si no hay cambios significativos o es demasiado genérico, responde simplemente 'sin cambios significativos'.`;

    try {
        // Log de depuración: Muestra la observación cruda que se enviará al modelo de resumen
        console.log('DEBUG (Vision Summarizer): Observación cruda enviada al modelo de resumen:', rawObservation);

        const response = await fetchWithExponentialBackoffAndKeyCycling(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error HTTP al resumir visión: ${response.status} - ${errorData.error.message || response.statusText}`);
        }

        const result = await response.json();
        const summary = result.candidates[0].content.parts[0].text.trim();
        
        // Log de depuración: Muestra el resumen generado por el modelo de texto
        console.log('DEBUG (Vision Summarizer): Resumen generado por el modelo de texto:', summary);

        // Filtra respuestas genéricas o de no cambio para evitar guardar ruido
        if (summary.toLowerCase().includes('sin cambios significativos') || 
            summary.toLowerCase().includes('nada distintivo') || 
            summary.toLowerCase().includes('similar')) {
            return ''; // No guardar si el resumen es irrelevante
        }
        return summary;

    } catch (error) {
        console.error("Error al resumir la observación visual:", error);
        return ''; // Retornar vacío en caso de error para no añadir ruido
    }
}


/**
 * Inicia la captura continua de imágenes y el procesamiento.
 */
export async function startContinuousVision() { 
    if (!isAuthenticatedUser) {
        console.warn("La visión continua solo está disponible para usuarios autenticados.");
        speakText('La visión continua solo está disponible si inicias sesión con tu cuenta.', { setEyePattern, eyePatterns });
        if (continuousVisionToggle) continuousVisionToggle.checked = false; 
        if (visionToggleBtn) visionToggleBtn.classList.remove('active');
        return;
    }

    if (continuousCaptureIntervalId) {
        stopContinuousVision(); // Asegurarse de que no haya múltiples intervalos
    }

    // Asegurarse de que la webcam esté activa y adjunta al elemento de video
    await startWebcam(currentCameraDeviceId); // Esto asegura que webcamStream esté activo y adjunto a settingsWebcamVideo

    // Si después de intentar iniciar la webcam, el elemento de video no está listo, no continuar
    if (!settingsWebcamVideo || settingsWebcamVideo.readyState < 2) {
        console.error("No se pudo iniciar el stream de la webcam para la visión continua (elemento de video no listo).");
        speakText('No pude iniciar la cámara para la visión continua.', { setEyePattern, eyePatterns });
        if (continuousVisionToggle) continuousVisionToggle.checked = false;
        if (visionToggleBtn) visionToggleBtn.classList.remove('active');
        return;
    }

    const interval = parseInt(visionInterval.value) * 1000; // Convertir segundos a milisegundos

    isContinuousVisionActive = true;
    if (visionToggleBtn) visionToggleBtn.classList.add('active'); // Activar visualmente el botón de visión
    if (continuousVisionToggle) continuousVisionToggle.checked = true; // Asegurar que el toggle esté marcado
    console.log(`Visión continua iniciada. Capturando cada ${interval / 1000} segundos.`);

    // Ocultar el video de previsualización si no es el panel de ajustes
    if (settingsWebcamVideo && !settingsWebcamVideo.closest('#settingsPanel').classList.contains('open')) {
        settingsWebcamVideo.style.display = 'none';
    }

    // Capturar inmediatamente al inicio y luego en el intervalo
    processCurrentFrame(); 
    continuousCaptureIntervalId = setInterval(processCurrentFrame, interval);
}

/**
 * Detiene la captura continua de imágenes.
 */
export function stopContinuousVision() {
    if (continuousCaptureIntervalId) {
        clearInterval(continuousCaptureIntervalId);
        continuousCaptureIntervalId = null;
        isContinuousVisionActive = false;
        if (visionToggleBtn) visionToggleBtn.classList.remove('active'); // Desactivar visualmente el botón de visión
        if (continuousVisionToggle) continuousVisionToggle.checked = false; // Asegurar que el toggle esté desmarcado
        console.log('Visión continua detenida.');
        // Cuando la visión continua se detiene, también debemos detener completamente el stream de la webcam
        // a menos que el panel de ajustes esté actualmente abierto (y por lo tanto mostrando la vista previa).
        // Para simplificar y asegurar que el stream se detenga realmente si la visión está desactivada,
        // llamamos a stopWebcam aquí, que maneja la lógica de visualización.
        stopWebcam(); // Esto detendrá completamente el stream ya que isContinuousVisionActive ahora es falso.
    }
}

/**
 * Procesa el fotograma actual de la cámara: captura, envía a Gemini y guarda en memoria.
 * También actualiza la última observación visual en localStorage.
 */
export async function processCurrentFrame() { // Exportamos para que chatbot.html pueda llamarlo si es necesario
    if (!isContinuousVisionActive) return; // Asegurarse de que la visión continua esté activa

    const imageData = captureFrameToBase64();
    if (!imageData) {
        console.warn("No se pudo capturar el fotograma para el procesamiento continuo.");
        return;
    }

    console.log("Procesando fotograma con Gemini Vision...");
    setEyePattern(eyePatterns.thinking);
    playRobotSound('thinking');

    try {
        const geminiResponseText = await callGeminiVisionAPI(imageData);
        console.log("DEBUG (Vision): Análisis de visión (raw):", geminiResponseText);

        // Almacenar la descripción CRUDA en el historial visual con timestamp
        const newObservation = {
            timestamp: Date.now(),
            observation: geminiResponseText
        };
        visualObservationsHistory.unshift(newObservation); // Añadir al principio para que lo más reciente esté primero
        if (visualObservationsHistory.length > MAX_VISUAL_HISTORY) {
            visualObservationsHistory.pop(); // Eliminar el más antiguo si excede el límite
        }
        localStorage.setItem(VISUAL_HISTORY_KEY, JSON.stringify(visualObservationsHistory));
        console.log('DEBUG (Vision): Historial visual actualizado en localStorage:', visualObservationsHistory);

        // Generar un resumen para la memoria a largo plazo (Firebase), si es necesario.
        const summarizedObservation = await summarizeVisualObservation(geminiResponseText);
        
        if (summarizedObservation) { // Solo guardar en Firebase si el resumen no está vacío/irrelevante
            await saveVisualObservation(summarizedObservation);
            console.log("DEBUG (Vision): Observación visual resumida y guardada en Firebase:", summarizedObservation);
        } else {
            console.log("DEBUG (Vision): Observación visual filtrada como no significativa para Firebase, no guardada.");
        }

        setEyePattern(eyePatterns.happy);

    } catch (error) {
        console.error('Error al analizar o resumir la imagen con Gemini en visión continua:', error);
        setEyePattern(eyePatterns.sad);
        // No hablar el error en bucle, solo loggear
    }
}

/**
 * Formatea un historial de observaciones visuales con su tiempo relativo.
 * @returns {string} Una cadena con las últimas observaciones visuales formateadas, o vacía si no hay.
 */
export function getFormattedVisualHistory() {
    if (visualObservationsHistory.length === 0) {
        return '';
    }

    const now = Date.now();
    let formattedHistory = '';

    visualObservationsHistory.forEach((entry, index) => {
        const timeDiff = now - entry.timestamp; // Diferencia en milisegundos
        let timeAgo = '';

        if (timeDiff < 60000) { // Menos de 1 minuto
            timeAgo = `${Math.floor(timeDiff / 1000)} segundos`;
        } else if (timeDiff < 3600000) { // Menos de 1 hora
            timeAgo = `${Math.floor(timeDiff / 60000)} minutos`;
        } else { // Más de 1 hora
            timeAgo = `${Math.floor(timeDiff / 3600000)} horas`;
        }

        // Formato: "Hace X tiempo, LOOI observó: [descripción]"
        formattedHistory += `(Hace ${timeAgo}, LOOI observó: ${entry.observation})\n`;
    });

    return formattedHistory.trim(); // Eliminar cualquier espacio en blanco extra al final
}

/**
 * Retorna el estado actual de la visión continua.
 * @returns {boolean}
 */
export function isVisionActive() {
    return isContinuousVisionActive;
}

/**
 * Actualiza el valor del intervalo de visión en la interfaz.
 */
export function updateVisionIntervalDisplay() {
    if (visionIntervalValue && visionInterval) {
        visionIntervalValue.textContent = `${visionInterval.value} segundos`;
    }
}