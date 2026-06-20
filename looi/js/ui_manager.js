// js/ui_manager.js

// Referencias a elementos DOM (se inicializarán en app.js o chatbot.js)
let loadingScreen, loadingProgress, loadingPercentage, loadingStatus, startButton;
let introScreen, continueBtn, modeCards;
let bluetoothScreen, bluetoothConnectBtn, bluetoothScanBtn, bluetoothSkipBtn, bluetoothStatusText, bluetoothDot, deviceList, devicesContainer;
let warpEffect;
let mainScreen, statusDot, statusText, userIdDisplay; // mainScreen solo en chatbot.html
let settingsPanel, settingsBtn, voiceSelect, speechRateInput, volumeInput, personalitySelect, languageSelect; // Estos están en chatbot.html
let cameraSelect, settingsWebcamVideo, continuousVisionToggle, visionInterval, visionIntervalGroup, visionIntervalValue; // Estos están en chatbot.html
let micBtn, visionToggleBtn, robotResponse; // Estos están en chatbot.html
let logoutBtn; // Este está en chatbot.html

// Asignar referencias DOM desde el script principal (app.js o chatbot.js)
export function setUIVariables(vars) {
    // Asignación condicional basada en la existencia del elemento (para main.html vs chatbot.html)
    loadingScreen = vars.loadingScreen || loadingScreen;
    loadingProgress = vars.loadingProgress || loadingProgress;
    loadingPercentage = vars.loadingPercentage || loadingPercentage;
    loadingStatus = vars.loadingStatus || loadingStatus;
    startButton = vars.startButton || startButton;

    introScreen = vars.introScreen || introScreen;
    continueBtn = vars.continueBtn || continueBtn;
    modeCards = vars.modeCards || modeCards;

    bluetoothScreen = vars.bluetoothScreen || bluetoothScreen;
    bluetoothConnectBtn = vars.bluetoothConnectBtn || bluetoothConnectBtn;
    bluetoothScanBtn = vars.bluetoothScanBtn || bluetoothScanBtn;
    bluetoothSkipBtn = vars.bluetoothSkipBtn || bluetoothSkipBtn;
    bluetoothStatusText = vars.bluetoothStatusText || bluetoothStatusText;
    bluetoothDot = vars.bluetoothDot || bluetoothDot;
    deviceList = vars.deviceList || deviceList;
    devicesContainer = vars.devicesContainer || devicesContainer;

    warpEffect = vars.warpEffect || warpEffect;

    mainScreen = vars.mainScreen || mainScreen; // Solo existirá en chatbot.html
    statusDot = vars.statusDot || statusDot;
    statusText = vars.statusText || statusText;
    userIdDisplay = vars.userIdDisplay || userIdDisplay;

    settingsPanel = vars.settingsPanel || settingsPanel;
    settingsBtn = vars.settingsBtn || settingsBtn;
    voiceSelect = vars.voiceSelect || voiceSelect;
    speechRateInput = vars.speechRateInput || speechRateInput;
    volumeInput = vars.volumeInput || volumeInput;
    personalitySelect = vars.personalitySelect || personalitySelect;
    languageSelect = vars.languageSelect || languageSelect;

    cameraSelect = vars.cameraSelect || cameraSelect;
    settingsWebcamVideo = vars.settingsWebcamVideo || settingsWebcamVideo;
    continuousVisionToggle = vars.continuousVisionToggle || continuousVisionToggle;
    visionInterval = vars.visionInterval || visionInterval;
    visionIntervalGroup = vars.visionIntervalGroup || visionIntervalGroup;
    visionIntervalValue = vars.visionIntervalValue || visionIntervalValue;

    micBtn = vars.micBtn || micBtn;
    visionToggleBtn = vars.visionToggleBtn || visionToggleBtn;
    robotResponse = vars.robotResponse || robotResponse;
    logoutBtn = vars.logoutBtn || logoutBtn;
}

// --- Funciones de Transición de Pantalla y Efectos ---

/**
 * Inicia la secuencia de carga de la aplicación.
 * Asume que esta función se llama en main.html.
 */
export function startLoadingSequence() {
    if (!loadingScreen) {
        console.error("Error: loadingScreen no encontrado. ¿Estás en la página correcta?");
        return;
    }
    loadingScreen.classList.add('active'); 
    // Asegurarse de que otras pantallas estén ocultas
    if (introScreen) { introScreen.classList.remove('active'); introScreen.classList.add('hidden'); }
    if (bluetoothScreen) { bluetoothScreen.classList.remove('active'); bluetoothScreen.classList.add('hidden'); }
    if (mainScreen) { mainScreen.classList.remove('active'); mainScreen.classList.add('hidden'); } // mainScreen no debería estar aquí, pero por seguridad

    const loadingSteps = [
        { percent: 15, status: "Inicializando módulos del sistema..." },
        { percent: 30, status: "Cargando componentes de IA..." },
        { percent: 45, status: "Configurando reconocimiento de voz..." },
        { percent: 60, status: "Estableciendo conexiones de red..." },
        { percent: 75, status: "Calibrando sensores visuales..." },
        { percent: 90, status: "Aplicando configuraciones finales..." },
        { percent: 100, status: "Sistema listo. Presiona 'Comenzar'." }
    ];
    
    let currentStep = 0;
    
    function updateLoading() {
        if (currentStep < loadingSteps.length) {
            const step = loadingSteps[currentStep];
            loadingProgress.style.width = step.percent + '%';
            loadingPercentage.textContent = step.percent + '%';
            loadingStatus.textContent = step.status;
            
            currentStep++;
            
            if (step.percent === 100) {
                startButton.classList.add('fade-in');
            } else {
                setTimeout(updateLoading, Math.random() * 800 + 400);
            }
        }
    }
    setTimeout(updateLoading, 500); // Iniciar la carga después de un breve retraso
}

/**
 * Crea el efecto de transición "velocidad de la luz".
 * Puede ser llamado desde cualquier página que tenga el elemento warp-effect.
 */
export function createWarpEffect() {
    if (!warpEffect) {
        console.warn("Elemento warp-effect no encontrado. La transición visual no se ejecutará.");
        return;
    }
    warpEffect.style.display = 'block';
    const lines = warpEffect.querySelector('.warp-lines');
    lines.innerHTML = '';
    
    for (let i = 0; i < 20; i++) {
        const line = document.createElement('div');
        line.className = 'warp-line';
        line.style.setProperty('--y', `${Math.random() * 100}%`);
        line.style.animationDelay = `${i * 0.05}s`;
        lines.appendChild(line);
    }
    
    setTimeout(() => {
        warpEffect.style.display = 'none';
    }, 1000);
}

/**
 * Transiciona a la pantalla de introducción.
 * Asume que esta función se llama en main.html.
 */
export function proceedToIntroScreen() {
    createWarpEffect();
    
    setTimeout(() => {
        if (loadingScreen) { loadingScreen.classList.remove('active'); loadingScreen.classList.add('hidden'); }
        if (bluetoothScreen) { bluetoothScreen.classList.remove('active'); bluetoothScreen.classList.add('hidden'); }
        if (mainScreen) { mainScreen.classList.remove('active'); mainScreen.classList.add('hidden'); } // mainScreen no debería estar aquí

        setTimeout(() => {
            if (introScreen) {
                introScreen.classList.remove('hidden'); // CORRECCIÓN CLAVE
                introScreen.classList.add('active');
                introScreen.classList.add('space-background');
            } else {
                console.error("Error: introScreen no encontrado para la transición.");
            }
        }, 500); // Pequeño retraso después de ocultar loading
    }, 800); // Duración del efecto warp
}


/**
 * Transiciona a la pantalla principal del chatbot.
 * Esto implica una redirección de página.
 * @param {string} mode - El modo seleccionado ('pc' o 'robot').
 * @param {boolean} [bluetoothConnected=false] - Si la conexión Bluetooth fue exitosa.
 * @param {string} [bluetoothDeviceName=''] - Nombre del dispositivo Bluetooth si está conectado.
 */
export function proceedToChatbotScreen(mode, bluetoothConnected = false, bluetoothDeviceName = '') {
    createWarpEffect();
    
    // Guardar el estado en localStorage para que chatbot.html lo pueda leer
    localStorage.setItem('looi_selected_mode', mode);
    localStorage.setItem('looi_bluetooth_connected', bluetoothConnected);
    localStorage.setItem('looi_bluetooth_device_name', bluetoothDeviceName);

    setTimeout(() => {
        // Redirigir a la página del chatbot
        window.location.href = 'chatbot.html';
    }, 800); // Duración del efecto warp
}

/**
 * Actualiza el estado del robot en la pantalla principal (chatbot.html).
 * @param {string} message - Mensaje de estado.
 * @param {boolean} isConnected - Si el robot está conectado (para el color del punto).
 */
export function updateStatusDisplay(message, isConnected) {
    if (!statusText || !statusDot) return; // Asegurarse de que los elementos existan
    statusText.textContent = message;
    statusDot.classList.remove('connected', 'disconnected');
    statusDot.classList.add(isConnected ? 'connected' : 'disconnected');
}

/**
 * Actualiza el ID de usuario en la pantalla principal (chatbot.html).
 * @param {string} id - El ID de usuario a mostrar.
 */
export function updateUserIdDisplay(id) {
    if (userIdDisplay) { // Asegurarse de que el elemento exista
        userIdDisplay.textContent = `ID: ${id}`;
    }
}

/**
 * Ajusta el tema (colores) de la interfaz según la hora del día.
 * Se aplica a elementos presentes en main.html y chatbot.html.
 */
export function adjustThemeByTime() {
    const hour = new Date().getHours();
    let themeColor1, themeColor2;

    // Lógica original para cambiar colores según la hora del día
    if (hour >= 6 && hour < 12) { // Mañana
        themeColor1 = '#00f5ff'; // Azul claro
        themeColor2 = '#0099ff'; // Azul medio
    } else if (hour >= 12 && hour < 18) { // Tarde
        themeColor1 = '#00ccff'; // Azul cielo
        themeColor2 = '#0066ff'; // Azul oscuro
    } else if (hour >= 18 && hour < 22) { // Atardecer/Noche temprana
        themeColor1 = '#ff6600'; // Naranja
        themeColor2 = '#ff0066'; // Rosa
    } else { // Noche
        themeColor1 = '#9900ff'; // Morado
        themeColor2 = '#0000ff'; // Azul oscuro
    }

    // Aplicar a elementos que usan gradientes
    document.querySelectorAll('.loading-logo, .loading-progress, .logo, .start-button, .continue-btn, .connect-btn').forEach(el => {
        if (el.id === 'loadingProgress') {
            el.style.background = `linear-gradient(90deg, ${themeColor1}, ${themeColor2}, ${themeColor1})`;
        } else {
            el.style.background = `linear-gradient(45deg, ${themeColor1}, ${themeColor2})`;
        }
    });

    // Aplicar a elementos que usan bordes/sombras/texto de color
    document.querySelectorAll('.loading-text, .loading-percentage, .loading-status, .subtitle, .mode-card, .continue-btn, .bluetooth-icon, .bluetooth-title, .bluetooth-subtitle, .bluetooth-status, .bluetooth-btn, .device-list h3, .device-signal, .bluetooth-instructions h4, .bluetooth-instructions li::before, .settings-btn, .settings-title, .setting-input:focus, .robot-status, .status-dot.connected, .login-title, .login-subtitle, .vision-toggle-btn').forEach(el => {
        if (el.classList.contains('status-dot')) {
            el.style.backgroundColor = themeColor1; // Para los puntos de estado
        } else if (el.classList.contains('mode-card') || el.classList.contains('bluetooth-btn') || el.classList.contains('vision-toggle-btn')) {
            el.style.borderColor = `rgba(${parseInt(themeColor1.slice(1,3), 16)}, ${parseInt(themeColor1.slice(3,5), 16)}, ${parseInt(themeColor1.slice(5,7), 16)}, 0.8)`;
            el.style.boxShadow = `0 10px 30px rgba(${parseInt(themeColor1.slice(1,3), 16)}, ${parseInt(themeColor1.slice(3,5), 16)}, ${parseInt(themeColor1.slice(5,7), 16)}, 0.5)`;
            if (el.classList.contains('vision-toggle-btn') && el.classList.contains('active')) {
                 el.style.background = `linear-gradient(45deg, ${themeColor1}, ${themeColor2})`;
                 el.style.color = '#000';
            }
        } else {
            el.style.color = themeColor1;
        }
    });

    // Aplicar a fondos con transparencia
    document.querySelectorAll('.mode-card, .bluetooth-container, .bluetooth-status, .device-list, .bluetooth-instructions, .settings-panel, .robot-response').forEach(el => {
        if (el.classList.contains('bluetooth-container') || el.classList.contains('settings-panel')) {
            el.style.background = `rgba(${parseInt(themeColor1.slice(1,3), 16)}, ${parseInt(themeColor1.slice(3,5), 16)}, ${parseInt(themeColor1.slice(5,7), 16)}, 0.1)`;
        } else if (el.classList.contains('bluetooth-status') || el.classList.contains('device-list')) {
            el.style.borderColor = `rgba(${parseInt(themeColor1.slice(1,3), 16)}, ${parseInt(themeColor1.slice(3,5), 16)}, ${parseInt(themeColor1.slice(5,7), 16)}, 0.2)`;
        }
        else {
            el.style.background = `rgba(${parseInt(themeColor1.slice(1,3), 16)}, ${parseInt(themeColor1.slice(3,5), 16)}, ${parseInt(themeColor1.slice(5,7), 16)}, 0.1)`;
        }
    });

    // Ojos
    document.querySelectorAll('.eyes-container').forEach(el => {
        el.style.borderColor = themeColor1;
        el.style.boxShadow = `0 0 20px rgba(${parseInt(themeColor1.slice(1,3), 16)}, ${parseInt(themeColor1.slice(3,5), 16)}, ${parseInt(themeColor1.slice(5,7), 16)}, 0.5), inset 0 0 20px rgba(${parseInt(themeColor1.slice(1,3), 16)}, ${parseInt(themeColor1.slice(3,5), 16)}, ${parseInt(themeColor1.slice(5,7), 16)}, 0.1)`;
    });
    document.querySelectorAll('.eye .pixel.active').forEach(el => {
        el.style.background = themeColor1;
        el.style.boxShadow = `0 0 8px rgba(${parseInt(themeColor1.slice(1,3), 16)}, ${parseInt(themeColor1.slice(3,5), 16)}, ${parseInt(themeColor1.slice(5,7), 16)}, 0.8)`;
    });
}

/**
 * Habilita o deshabilita los controles de visión (botón de visión y ajustes de cámara).
 * Asume que estos elementos existen en la página actual (chatbot.html).
 * @param {boolean} enable - True para habilitar, false para deshabilitar.
 */
export function toggleVisionControls(enable) {
    if (visionToggleBtn) visionToggleBtn.disabled = !enable;
    if (continuousVisionToggle) continuousVisionToggle.disabled = !enable;
    if (cameraSelect) cameraSelect.disabled = !enable;
    if (visionInterval) visionInterval.disabled = !enable;
    
    if (visionIntervalGroup) {
        if (!enable) {
            visionIntervalGroup.style.opacity = '0.5';
        } else {
            visionIntervalGroup.style.opacity = '1';
        }
    }
    // Desactivar visualmente el botón de visión si se deshabilita
    if (!enable && visionToggleBtn) {
        visionToggleBtn.classList.remove('active');
    }
}
