// js/audio_manager.js

// Referencias a elementos DOM (se inicializarán en app.js o chatbot.js)
let bgMusic;
let audioContext;
let speechSynthesis;
let voices = [];
let voiceSelect, speechRateInput, volumeInput; // Añadido para que speakText pueda acceder a ellos

// Asignar referencias DOM desde el script principal
export function setAudioVariables(vars) {
    ({ bgMusic, audioContext, speechSynthesis, voices, voiceSelect, speechRateInput, volumeInput } = vars);
}

/**
 * Genera sonidos de robot usando Web Audio API.
 * @param {string} type - Tipo de sonido ('beep', 'chirp', 'thinking').
 */
export function playRobotSound(type) {
    // Solo intentar reanudar AudioContext si no está ya en 'running'
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(e => console.error('Error al reanudar AudioContext:', e));
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
        case 'beep':
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            break;
        case 'chirp':
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.15);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            break;
        case 'thinking':
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            break;
    }
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

/**
 * Desvanece el volumen de un elemento de audio.
 * @param {HTMLAudioElement} audioElement - El elemento de audio a desvanecer.
 * @param {number} duration - Duración del desvanecimiento en milisegundos.
 */
export function fadeOutAudio(audioElement, duration) {
    const initialVolume = audioElement.volume;
    const steps = 50;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
        if (currentStep < steps) {
            audioElement.volume = initialVolume * (1 - currentStep / steps);
            currentStep++;
        } else {
            clearInterval(fadeInterval);
            audioElement.pause();
            audioElement.volume = initialVolume; // Restablecer volumen para la próxima vez
        }
    }, stepDuration);
}

/**
 * Carga y selecciona voces de Text-to-Speech.
 */
export function loadVoices() {
    if (!voiceSelect || !speechSynthesis) return; // Asegurarse de que los elementos existan
    voices = speechSynthesis.getVoices();
    voiceSelect.innerHTML = '';
    let defaultVoiceIndex = -1;

    for (let i = 0; i < voices.length; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${voices[i].name} (${voices[i].lang})`;
        if (voices[i].default) {
            option.textContent += ' — Predeterminada';
        }
        voiceSelect.appendChild(option);

        // Intentar seleccionar una voz en español por defecto
        if (voices[i].lang.startsWith('es') && defaultVoiceIndex === -1) {
            defaultVoiceIndex = i;
        }
    }
    // Si se encontró una voz en español, seleccionarla
    if (defaultVoiceIndex !== -1) {
        voiceSelect.selectedIndex = defaultVoiceIndex;
    } else if (voices.length > 0) {
        // Si no hay español, seleccionar la primera disponible
        voiceSelect.selectedIndex = 0;
    }
}

/**
 * Hace que el robot "hable" usando SpeechSynthesis.
 * @param {string} text - El texto que el robot debe decir.
 * @param {object} eyeManager - Instancia de eye_manager para actualizar la expresión de los ojos.
 * @returns {Promise<void>} - Una promesa que se resuelve cuando el habla ha terminado.
 */
export function speakText(text, eyeManager) {
    return new Promise((resolve, reject) => {
        if (!speechSynthesis || !voiceSelect || !speechRateInput || !volumeInput) {
            console.warn("SpeechSynthesis API no está completamente inicializada.");
            reject(new Error("SpeechSynthesis API no disponible."));
            return;
        }

        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configurar voz
        if (voiceSelect.selectedIndex >= 0) {
            utterance.voice = voices[voiceSelect.selectedIndex];
        }
        
        // Configurar parámetros
        utterance.rate = parseFloat(speechRateInput.value);
        utterance.volume = parseFloat(volumeInput.value);
        
        // Eventos
        utterance.onstart = () => {
            eyeManager.setEyePattern(eyeManager.eyePatterns.surprised); // Ojos sorprendidos al hablar
        };
        
        utterance.onend = () => {
            eyeManager.setEyePattern(eyeManager.eyePatterns.happy);
            resolve(); // Resuelve la promesa cuando el habla termina
        };
        
        utterance.onerror = (event) => {
            console.error('SpeechSynthesisUtterance.onerror:', event.error);
            eyeManager.setEyePattern(eyeManager.eyePatterns.sad); // Ojos tristes si hay error
            reject(new Error(`Error de síntesis de voz: ${event.error}`)); // Rechaza la promesa en caso de error
        };
        
        speechSynthesis.speak(utterance);
    });
}