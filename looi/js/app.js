// js/app.js

// Importar módulos
import { auth, currentUserId, isAuthenticatedUser, isAuthReady, signOut } from './firebase_init.js';
import { setUIVariables, startLoadingSequence, createWarpEffect, proceedToMainSystem, proceedToIntroScreen, updateStatusDisplay, updateUserIdDisplay, adjustThemeByTime, toggleVisionControls, proceedToChatbotScreen } from './ui_manager.js';
import { setAudioVariables, playRobotSound, fadeOutAudio, loadVoices, speakText } from './audio_manager.js';
import { setEyeVariables, initializeEyes, setEyePattern, eyePatterns, startBlinking, breathingAnimation, trackMovement } from './eye_manager.js';
import { setVisionVariables, startWebcam, stopWebcam, listCameras, startContinuousVision, stopContinuousVision, getVisualContext, updateVisionIntervalDisplay } from './vision_manager.js';
import { setCommandVariables, handleSpecialCommands, handleRobotCommands } from './command_handler.js';

// --- 1. Variables Globales y Referencias DOM (para pasar a los módulos) ---
let selectedMode = null;
let isListening = false;
let currentPersonality = 'friendly';
let currentMood = 'happy'; // Para el estado de los ojos

// Referencias DOM (solo las que existen en main.html o chatbot.html)
const loadingScreen = document.getElementById('loadingScreen');
const loadingProgress = document.getElementById('loadingProgress');
const loadingPercentage = document.getElementById('loadingPercentage');
const loadingStatus = document.getElementById('loadingStatus');
const startButton = document.getElementById('startButton');

const introScreen = document.getElementById('introScreen');
const continueBtn = document.getElementById('continueBtn');
const modeCards = document.querySelectorAll('.mode-card');

const bluetoothScreen = document.getElementById('bluetoothScreen');
const bluetoothConnectBtn = document.getElementById('bluetoothConnectBtn');
const bluetoothScanBtn = document.getElementById('bluetoothScanBtn');
const bluetoothSkipBtn = document.getElementById('bluetoothSkipBtn');
const bluetoothStatusText = document.getElementById('bluetoothStatusText');
const bluetoothDot = document.getElementById('bluetoothDot');
const deviceList = document.getElementById('deviceList');
const devicesContainer = document.getElementById('devicesContainer');

const warpEffect = document.getElementById('warpEffect');

// Elementos que solo existen en chatbot.html (se inicializarán a null aquí si no están en la página actual)
const mainScreen = document.getElementById('mainScreen');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const userIdDisplay = document.getElementById('userIdDisplay');
const leftEye = document.getElementById('leftEye');
const rightEye = document.getElementById('rightEye');
const micBtn = document.getElementById('micBtn');
const settingsBtn = document.getElementById('settingsBtn');
const visionToggleBtn = document.getElementById('visionToggleBtn');
const robotResponse = document.getElementById('robotResponse');
const settingsPanel = document.getElementById('settingsPanel');
const voiceSelect = document.getElementById('voiceSelect');
const speechRateInput = document.getElementById('speechRate');
const volumeInput = document.getElementById('volume');
const personalitySelect = document.getElementById('personalitySelect');
const languageSelect = document.getElementById('languageSelect');
const cameraSelect = document.getElementById('cameraSelect');
const settingsWebcamVideo = document.getElementById('settingsWebcamVideo');
const settingsWebcamCanvas = document.getElementById('settingsWebcamCanvas');
const continuousVisionToggle = document.getElementById('continuousVisionToggle');
const visionInterval = document.getElementById('visionInterval');
const visionIntervalGroup = document.getElementById('visionIntervalGroup');
const visionIntervalValue = document.getElementById('visionIntervalValue');
const logoutBtn = document.getElementById('logoutBtn');


// Audio variables
const bgMusic = document.getElementById('bgMusic');
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const speechSynthesis = window.speechSynthesis;
let voices = [];

// Bluetooth variables (mantener aquí si son específicas de app.js o se pasan a command_handler)
let bluetoothDevice = null;
let bluetoothCharacteristic = null;
const BLUETOOTH_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const BLUETOOTH_CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

// Pasar variables a los módulos
setUIVariables({
    loadingScreen, loadingProgress, loadingPercentage, loadingStatus, startButton,
    introScreen, continueBtn, modeCards,
    bluetoothScreen, bluetoothConnectBtn, bluetoothScanBtn, bluetoothSkipBtn, bluetoothStatusText, bluetoothDot, deviceList, devicesContainer,
    warpEffect,
    mainScreen, statusDot, statusText, userIdDisplay,
    settingsPanel, settingsBtn, voiceSelect, speechRateInput, volumeInput, personalitySelect, languageSelect,
    cameraSelect, settingsWebcamVideo, continuousVisionToggle, visionInterval, visionIntervalGroup, visionIntervalValue,
    micBtn, visionToggleBtn, robotResponse,
    logoutBtn
});
setAudioVariables({ bgMusic, audioContext, speechSynthesis, voices, voiceSelect, speechRateInput, volumeInput });
setEyeVariables({ leftEye, rightEye, eyesContainer, isListening, speechSynthesis });
setVisionVariables({
    settingsWebcamVideo, settingsWebcamCanvas, cameraSelect, continuousVisionToggle, visionInterval, visionIntervalValue,
    robotResponse, visionToggleBtn
});
setCommandVariables({
    settingsPanel, personalitySelect, languageSelect, robotResponse,
    // selectedMode, bluetoothDevice, bluetoothCharacteristic se obtendrán de localStorage/sessionStorage en command_handler
    visionToggleBtn
});


// --- Lógica Principal (Compartida o específica de la página actual) ---
const currentPage = window.location.pathname.split('/').pop();

// Inicializar reconocimiento de voz (solo si estamos en chatbot.html)
let recognition;
if (currentPage === 'chatbot.html' && 'webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'es-ES'; // Idioma por defecto
    
    recognition.onstart = () => {
        isListening = true;
        micBtn.classList.add('listening');
        setEyePattern(eyePatterns.thinking);
        playRobotSound('beep');
    };
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceInput(transcript);
    };
    recognition.onend = () => {
        isListening = false;
        micBtn.classList.remove('listening');
        if (!speechSynthesis.speaking) {
            setEyePattern(eyePatterns.happy);
        }
    };
    recognition.onerror = (event) => {
        console.error('Error de reconocimiento:', event.error);
        isListening = false;
        micBtn.classList.remove('listening');
        setEyePattern(eyePatterns.sad);
        speakText('Lo siento, no pude entenderte.', { setEyePattern, eyePatterns });
    };
} else if (currentPage === 'chatbot.html') {
    console.warn('Web Speech Recognition no soportado en este navegador.');
    if (micBtn) micBtn.disabled = true;
}

/**
 * Llama a la API de Gemini con la personalidad seleccionada.
 * @param {string} prompt - El prompt de texto para Gemini.
 * @param {string} [visualContext=''] - Contexto visual opcional para enriquecer la respuesta.
 * @returns {Promise<string>} - La respuesta textual de Gemini.
 */
async function callGeminiAPI(prompt, visualContext = '') {
    const personalityPrompts = {
        friendly: "Eres un robot amigable y servicial. Responde de manera cálida y empática.",
        professional: "Eres un asistente profesional y eficiente. Sé directo y preciso.",
        playful: "Eres un robot juguetón y divertido. Usa humor y emojis en tus respuestas.",
        sarcastic: "Eres un robot con sentido del humor sarcástico, pero siempre útil."
    };
    
    const systemPrompt = personalityPrompts[currentPersonality] + 
        " Eres LOOI, un robot de escritorio con personalidad única. Mantén tus respuestas concisas pero expresivas.";
    
    // Combina el prompt del usuario con el contexto visual si es relevante
    let combinedPrompt = systemPrompt + "\n\nUsuario: " + prompt;
    if (visualContext) {
        combinedPrompt += `\n\nContexto visual reciente: ${visualContext}`;
    }

    const apiKey = "AIzaSyASUsN4hOU_j3IGO07zEsJJdHzrNBuIyuY"; // Tu clave API
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: combinedPrompt }] }]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error HTTP: ${response.status} - ${errorData.error.message || response.statusText}`);
        }

        const result = await response.json();
        return result.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Error en callGeminiAPI:", error);
        throw error;
    }
}

/**
 * Procesa la entrada de voz del usuario.
 * @param {string} text - El texto transcrito de la voz.
 */
async function handleVoiceInput(text) {
    setEyePattern(eyePatterns.thinking);
    playRobotSound('thinking');
    
    if (robotResponse) robotResponse.innerHTML = `<p><strong>Tú:</strong> ${text}</p><p><em>Procesando...</em></p>`;
    
    // 1. Verificar comandos especiales (internos de la interfaz)
    const specialResponse = handleSpecialCommands(text);
    if (specialResponse) {
        if (robotResponse) robotResponse.innerHTML = `<p><strong>Tú:</strong> ${text}</p><p><strong>Robot:</strong> ${specialResponse}</p>`;
        setEyePattern(eyePatterns.happy);
        speakText(specialResponse, { setEyePattern, eyePatterns });
        return;
    }
    
    // 2. Verificar comandos físicos del robot (solo si está en modo robot y conectado)
    const storedSelectedMode = localStorage.getItem('looi_selected_mode');
    const storedBluetoothConnected = localStorage.getItem('looi_bluetooth_connected') === 'true';

    if (storedSelectedMode === 'robot' && storedBluetoothConnected) {
        // Asegurarse de que bluetoothDevice y bluetoothCharacteristic se reestablezcan si es necesario en chatbot.js
        // Para esta refactorización, asumimos que si se llega aquí, la conexión es "conceptual"
        // y handleRobotCommands se encarga de la parte técnica.
        const robotCommand = await handleRobotCommands(text);
        if (robotCommand) {
            if (robotResponse) robotResponse.innerHTML = `<p><strong>Tú:</strong> ${text}</p><p><strong>Robot:</strong> ${robotCommand.response}</p>`;
            setEyePattern(eyePatterns.happy);
            speakText(robotCommand.response, { setEyePattern, eyePatterns });
            return;
        }
    }
    
    // 3. Si no es un comando especial ni de robot, procesar con Gemini (texto + posible visión)
    try {
        let visualContext = '';
        if (isAuthenticatedUser && visionToggleBtn && visionToggleBtn.classList.contains('active')) { // Solo si el usuario está autenticado y la visión está activa
            visualContext = await getVisualContext(text); // Obtener contexto visual relevante
        }

        const response = await callGeminiAPI(text, visualContext);
        if (robotResponse) robotResponse.innerHTML = `<p><strong>Tú:</strong> ${text}</p><p><strong>Robot:</strong> ${response}</p>`;
        
        setEyePattern(eyePatterns.happy);
        speakText(response, { setEyePattern, eyePatterns });
    } catch (error) {
        console.error('Error:', error);
        setEyePattern(eyePatterns.sad);
        if (robotResponse) robotResponse.innerHTML = `<p><strong>Error:</strong> No pude procesar tu solicitud</p>`;
        speakText('Lo siento, tuve un problema procesando tu solicitud.', { setEyePattern, eyePatterns });
    }
}


// --- Event Listeners (Específicos de main.html) ---
if (currentPage === 'main.html') {
    // Botón "Comenzar" en la pantalla de carga
    startButton.addEventListener('click', () => {
        audioContext.resume().then(() => {
            bgMusic.play().catch(e => console.error('No se pudo reproducir la música de fondo:', e));
        });
        
        proceedToIntroScreen(); 
        
        playRobotSound('chirp');
    });

    // Selección de modo en la pantalla de introducción
    modeCards.forEach(card => {
        card.addEventListener('click', () => {
            modeCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedMode = card.dataset.mode;
            continueBtn.disabled = false;
            playRobotSound('beep');
            // Guardar selectedMode en localStorage para chatbot.html
            localStorage.setItem('looi_selected_mode', selectedMode);
        });
    });

    // Botón "Inicializar Sistema" en la pantalla de introducción
    continueBtn.addEventListener('click', () => {
        if (!selectedMode) return;
        
        fadeOutAudio(bgMusic, 800);
        createWarpEffect();
        
        setTimeout(() => {
            introScreen.classList.remove('active');
            introScreen.classList.add('hidden');
            
            setTimeout(() => {
                if (selectedMode === 'robot') {
                    bluetoothScreen.classList.add('active');
                    bluetoothScreen.classList.add('space-background');
                    updateBluetoothStatus('Desconectado', false);
                } else { // pc mode
                    // Redirigir directamente a chatbot.html
                    proceedToChatbotScreen('pc', false); // No hay conexión Bluetooth
                }
            }, 500);
        }, 800);
    });

    // Botones de la pantalla Bluetooth
    bluetoothConnectBtn.addEventListener('click', async () => {
        if (bluetoothDevice && bluetoothDevice.gatt.connected) {
            bluetoothDevice.gatt.disconnect();
            return;
        }

        updateBluetoothStatus('Conectando...', false);
        bluetoothConnectBtn.disabled = true;
        bluetoothConnectBtn.innerHTML = '<span class="btn-icon">⏳</span>Conectando...';
        
        try {
            if (!navigator.bluetooth) {
                throw new Error('Bluetooth no soportado en este navegador.');
            }
            
            bluetoothDevice = await navigator.bluetooth.requestDevice({
                filters: [{ services: [BLUETOOTH_SERVICE_UUID] }],
                optionalServices: [BLUETOOTH_SERVICE_UUID]
            });

            const server = await bluetoothDevice.gatt.connect();
            const service = await server.getPrimaryService(BLUETOOTH_SERVICE_UUID);
            bluetoothCharacteristic = await service.getCharacteristic(BLUETOOTH_CHARACTERISTIC_UUID);

            bluetoothDevice.addEventListener('gattserverdisconnected', onBluetoothDisconnected);

            updateBluetoothStatus('Conectado', true);
            playRobotSound('chirp');
            console.log('Conectado a:', bluetoothDevice.name);
            
            // Guardar estado de Bluetooth en localStorage para chatbot.html
            localStorage.setItem('looi_bluetooth_connected', 'true');
            localStorage.setItem('looi_bluetooth_device_name', bluetoothDevice.name);
            localStorage.setItem('looi_selected_mode', 'robot'); // Asegurarse de que el modo sea robot

            // Redirigir a chatbot.html
            proceedToChatbotScreen('robot', true, bluetoothDevice.name);
            
        } catch (error) {
            console.error('Error de conexión Bluetooth:', error);
            updateBluetoothStatus('Error: ' + error.message, false);
            playRobotSound('beep');
            bluetoothConnectBtn.innerHTML = '<span class="btn-icon">🔗</span>Reintentar Conexión';
        }
    });

    bluetoothScanBtn.addEventListener('click', () => {
        bluetoothScanBtn.disabled = true;
        bluetoothScanBtn.innerHTML = '<span class="btn-icon">⏳</span>Escaneando...';
        bluetoothStatusText.textContent = 'Escaneando dispositivos...';
        bluetoothDot.className = 'status-dot connecting';
        
        setTimeout(() => {
            deviceList.classList.add('visible');
            displayMockDevices(); // Muestra dispositivos de ejemplo
            bluetoothScanBtn.disabled = false;
            bluetoothScanBtn.innerHTML = '<span class="btn-icon">📡</span>Escanear Nuevamente';
            bluetoothStatusText.textContent = 'Dispositivos encontrados (selecciona uno)';
            bluetoothDot.className = 'status-dot connected';
        }, 2000);
    });

    bluetoothSkipBtn.addEventListener('click', () => {
        selectedMode = 'pc'; // Forzar modo PC si se salta la conexión
        localStorage.setItem('looi_selected_mode', 'pc');
        localStorage.setItem('looi_bluetooth_connected', 'false');
        localStorage.removeItem('looi_bluetooth_device_name');
        
        // Redirigir a chatbot.html
        proceedToChatbotScreen('pc', false);
    });

    function onBluetoothDisconnected() {
        console.log('Dispositivo Bluetooth desconectado');
        // Esto se manejaría en chatbot.html si la conexión se mantiene allí
        // Por ahora, solo loggear.
        localStorage.setItem('looi_bluetooth_connected', 'false');
        localStorage.removeItem('looi_bluetooth_device_name');
        // Si el usuario vuelve a main.html, se mostrará desconectado.
    }

    function displayMockDevices() {
        const mockDevices = [
            { name: 'LOOI Robot #1', id: 'AA:BB:CC:DD:EE:FF', signal: 'Fuerte' },
            { name: 'Arduino Robot', id: 'FF:EE:DD:CC:BB:AA', signal: 'Media' },
            { name: 'ESP32 Device', id: '11:22:33:44:55:66', signal: 'Débil' }
        ];
        
        devicesContainer.innerHTML = '';
        
        mockDevices.forEach(device => {
            const deviceElement = document.createElement('div');
            deviceElement.className = 'device-item';
            deviceElement.innerHTML = `
                <div class="device-info">
                    <div class="device-name">${device.name}</div>
                    <div class="device-id">${device.id}</div>
                </div>
                <div class="device-signal">📶 ${device.signal}</div>
            `;
            
            deviceElement.addEventListener('click', () => {
                // Simular conexión al hacer clic en un dispositivo mock
                // En un entorno real, esto iniciaría la conexión Web Bluetooth real
                console.log(`Simulando conexión a ${device.name}`);
                // Aquí podrías llamar a connectBluetooth() con el deviceId si tuvieras una forma de pasarlo
                // Por ahora, solo redirigimos como si se hubiera conectado.
                localStorage.setItem('looi_bluetooth_connected', 'true');
                localStorage.setItem('looi_bluetooth_device_name', device.name);
                localStorage.setItem('looi_selected_mode', 'robot');
                proceedToChatbotScreen('robot', true, device.name);
            });
            
            devicesContainer.appendChild(deviceElement);
        });
    }
}


// --- Event Listeners (Específicos de chatbot.html) ---
if (currentPage === 'chatbot.html') {
    // Inicializar ojos y animaciones
    initializeEyes();
    setEyePattern(eyePatterns.happy);
    startBlinking();
    breathingAnimation();
    adjustThemeByTime();
    setInterval(adjustThemeByTime, 3600000);

    // Recuperar estado de la sesión
    selectedMode = localStorage.getItem('looi_selected_mode') || 'pc';
    const bluetoothConnected = localStorage.getItem('looi_bluetooth_connected') === 'true';
    const bluetoothDeviceName = localStorage.getItem('looi_bluetooth_device_name') || '';

    // Actualizar UI inicial según el modo y conexión
    if (selectedMode === 'pc') {
        updateStatusDisplay('Sistema Activo (Modo PC)', true);
        micBtn.disabled = false;
    } else { // robot mode
        if (bluetoothConnected) {
            updateStatusDisplay(`Conectado a ${bluetoothDeviceName} (Modo Robot)`, true);
            micBtn.disabled = false;
        } else {
            updateStatusDisplay('Desconectado (Modo Robot)', false);
            micBtn.disabled = true;
            speakText('No estoy conectado a tu robot. Por favor, conecta el robot desde la pantalla de inicio si deseas controlarlo.', { setEyePattern, eyePatterns });
        }
    }
    updateUserIdDisplay(currentUserId || 'Anónimo');
    toggleVisionControls(isAuthenticatedUser); // Habilitar/deshabilitar controles de visión

    // Botón de micrófono
    micBtn.addEventListener('click', () => {
        // La lógica de Bluetooth para el micrófono está en handleVoiceInput
        if (!('webkitSpeechRecognition' in window) || !recognition) {
            robotResponse.innerHTML = `<p><strong>Error:</strong> El reconocimiento de voz no está disponible en este navegador.</p>`;
            speakText('El reconocimiento de voz no está disponible en este navegador.', { setEyePattern, eyePatterns });
            return;
        }
        
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });

    // Botón de Visión (toggle de visión continua)
    visionToggleBtn.addEventListener('click', () => {
        if (!isAuthenticatedUser) {
            speakText('Necesitas iniciar sesión para usar la función de visión.', { setEyePattern, eyePatterns });
            return;
        }
        if (visionToggleBtn.classList.contains('active')) {
            stopContinuousVision();
            speakText('Visión desactivada.', { setEyePattern, eyePatterns });
        } else {
            startContinuousVision();
            speakText('Visión activada. ¡Ahora puedo ver!', { setEyePattern, eyePatterns });
        }
    });

    // Panel de configuración
    settingsBtn.addEventListener('click', () => {
        settingsPanel.classList.toggle('open');
        playRobotSound('beep');
        if (settingsPanel.classList.contains('open')) {
            startWebcam(cameraSelect.value); // Iniciar la cámara en el preview de ajustes
            listCameras(); // Listar cámaras disponibles
            updateVisionIntervalDisplay(); // Actualizar el display del intervalo
        } else {
            stopWebcam(); // Detener la cámara del preview al cerrar ajustes
        }
    });

    // Cerrar panel al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (settingsPanel && !settingsPanel.contains(e.target) && settingsBtn && !settingsBtn.contains(e.target)) {
            settingsPanel.classList.remove('open');
            stopWebcam(); // Detener la cámara del preview al cerrar ajustes
        }
    });

    // Cambio de personalidad en la configuración
    personalitySelect.addEventListener('change', (e) => {
        currentPersonality = e.target.value;
        playRobotSound('chirp');
        switch(currentPersonality) {
            case 'friendly': setEyePattern(eyePatterns.happy); break;
            case 'professional': setEyePattern(eyePatterns.thinking); break;
            case 'playful': setEyePattern(eyePatterns.surprised); break;
            case 'sarcastic': setEyePattern(eyePatterns.thinking); break;
        }
    });

    // Cambio de idioma en la configuración
    languageSelect.addEventListener('change', (e) => {
        const lang = e.target.value;
        if (recognition) {
            recognition.lang = lang === 'es' ? 'es-ES' : 'en-US';
        }
        playRobotSound('beep');
    });

    // Configuración de cámara en ajustes
    cameraSelect.addEventListener('change', () => {
        startWebcam(cameraSelect.value); // Cambiar la cámara en el preview
    });

    continuousVisionToggle.addEventListener('change', () => {
        if (continuousVisionToggle.checked) {
            startContinuousVision();
        } else {
            stopContinuousVision();
        }
    });

    visionInterval.addEventListener('input', updateVisionIntervalDisplay);
    visionInterval.addEventListener('change', () => {
        if (continuousVisionToggle.checked) {
            startContinuousVision(); // Reiniciar la captura con el nuevo intervalo
        }
    });

    // Botón de cerrar sesión
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('looi_session_type');
            localStorage.removeItem('looi_user_id');
            localStorage.removeItem('looi_selected_mode');
            localStorage.removeItem('looi_bluetooth_connected');
            localStorage.removeItem('looi_bluetooth_device_name');
            window.location.href = 'index.html'; // Redirigir a la página de login
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            speakText('Lo siento, no pude cerrar sesión correctamente.', { setEyePattern, eyePatterns });
        }
    });

    // Gestos de touch para móviles (swipes y taps)
    let touchStartX, touchStartY;
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    document.addEventListener('touchend', (e) => {
        if (touchStartX === null || touchStartY === null) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        
        // Swipe horizontal para abrir/cerrar configuración
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) { // Swipe izquierda
                if (settingsPanel) settingsPanel.classList.add('open');
                startWebcam(cameraSelect.value);
                listCameras();
                updateVisionIntervalDisplay();
            } else { // Swipe derecha
                if (settingsPanel) settingsPanel.classList.remove('open');
                stopWebcam();
            }
            playRobotSound('beep');
        }
        
        // Tap en los ojos para cambiar expresión
        const eyesContainer = document.getElementById('eyesContainer');
        if (eyesContainer && eyesContainer.contains(e.target) && Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
            const expressions = Object.keys(eyePatterns);
            const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
            setEyePattern(eyePatterns[randomExpression]);
            playRobotSound('chirp');
        }
        touchStartX = null;
        touchStartY = null;
    });

    // Seguimiento del mouse para los ojos
    let mouseX = 0;
    let mouseY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        trackMovement(mouseX, mouseY);
    });
}


// --- Inicialización de la Aplicación ---

document.addEventListener('DOMContentLoaded', () => {
    // Cargar voces cuando estén disponibles
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices(); // Llamar una vez por si las voces ya están cargadas
    
    // Soporte para PWA (Progressive Web App)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => console.log('SW registrado'))
                .catch(error => console.log('SW error:', error));
        });
    }

    // Notificaciones push (opcional)
    function requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('LOOI Clone', {
                        body: '¡Listo para recibir notificaciones!',
                        icon: '/icon-192x192.png'
                    });
                }
            });
        }
    }
    setTimeout(requestNotificationPermission, 5000);
});

// Listener de Firebase Auth para actualizar la UI una vez que el estado de autenticación es conocido
// Esto se hace en app.js porque es el archivo principal que coordina la UI
auth.onAuthStateChanged(user => {
    if (isAuthReady) { // Asegurarse de que la verificación inicial ya haya ocurrido
        // Esto se ejecutará tanto en main.html como en chatbot.html
        // Solo actualizamos la UI si los elementos existen en la página actual.
        if (userIdDisplay) updateUserIdDisplay(currentUserId || 'Anónimo');
        if (mainScreen) toggleVisionControls(isAuthenticatedUser); // Solo en chatbot.html
    }
});
