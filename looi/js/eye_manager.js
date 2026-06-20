// js/eye_manager.js

// Referencias a elementos DOM (se inicializarán en app.js o chatbot.js)
let leftEye, rightEye, eyesContainer;
let isListening = false; // Estado de escucha para controlar el parpadeo
let speechSynthesis; // Para verificar si está hablando

// Asignar referencias DOM desde el script principal
export function setEyeVariables(vars) {
    ({ leftEye, rightEye, eyesContainer, isListening, speechSynthesis } = vars);
}

// Patrones de ojos (para LCD pixelado)
export const eyePatterns = {
    happy: [
        [0,1,1,1,1,1,1,0,
         1,1,1,1,1,1,1,1,
         1,1,0,1,1,0,1,1,
         1,1,1,1,1,1,1,1,
         1,0,1,1,1,1,0,1,
         1,1,0,1,1,0,1,1,
         1,1,1,0,0,1,1,1,
         0,1,1,1,1,1,1,0]
    ],
    sad: [
        [0,1,1,1,1,1,1,0,
         1,1,1,1,1,1,1,1,
         1,1,0,1,1,0,1,1,
         1,1,1,1,1,1,1,1,
         1,1,1,0,0,1,1,1,
         1,1,0,1,1,0,1,1,
         1,0,1,1,1,1,0,1,
         0,1,1,1,1,1,1,0]
    ],
    thinking: [
        [0,1,1,1,1,1,1,0,
         1,1,1,1,1,1,1,1,
         1,1,0,1,1,0,1,1,
         1,1,1,1,1,1,1,1,
         1,1,1,1,1,1,1,1,
         1,1,1,0,0,1,1,1,
         1,1,1,1,1,1,1,1,
         0,1,1,1,1,1,1,0]
    ],
    surprised: [
        [0,1,1,1,1,1,1,0,
         1,1,1,1,1,1,1,1,
         1,0,0,1,1,0,0,1,
         1,0,0,1,1,0,0,1,
         1,1,1,1,1,1,1,1,
         1,1,1,0,0,1,1,1,
         1,1,0,1,1,0,1,1,
         0,1,1,1,1,1,1,0]
    ],
    // Nuevo patrón para indicar que LOOI está escuchando activamente
    listeningActive: [
        [0,0,1,1,1,1,0,0, // Onda 1
         0,1,1,0,0,1,1,0, // Onda 2
         1,1,0,0,0,0,1,1, // Onda 3
         1,0,0,0,0,0,0,1, // Onda 4
         1,1,0,0,0,0,1,1, // Onda 3 (invertida)
         0,1,1,0,0,1,1,0, // Onda 2 (invertida)
         0,0,1,1,1,1,0,0, // Onda 1 (invertida)
         0,0,0,0,0,0,0,0] // Base
    ]
};

/**
 * Inicializa los píxeles de los ojos en el DOM.
 */
export function initializeEyes() {
    if (!leftEye || !rightEye) return; // Asegurarse de que los elementos existan
    [leftEye, rightEye].forEach(eye => {
        eye.innerHTML = '';
        for (let i = 0; i < 64; i++) {
            const pixel = document.createElement('div');
            pixel.className = 'pixel';
            eye.appendChild(pixel);
        }
    });
}

/**
 * Establece el patrón de píxeles para los ojos.
 * @param {Array<Array<number>>} pattern - El patrón de píxeles a aplicar.
 */
export function setEyePattern(pattern) {
    if (!leftEye || !rightEye) return; // Asegurarse de que los elementos existan
    [leftEye, rightEye].forEach(eye => {
        const pixels = eye.querySelectorAll('.pixel');
        pixels.forEach((pixel, index) => {
            if (pattern[0][index]) {
                pixel.classList.add('active');
            } else {
                pixel.classList.remove('active');
            }
        });
    });
}

/**
 * Inicia la animación de parpadeo automático para los ojos.
 */
export function startBlinking() {
    setInterval(() => {
        // isListening y speechSynthesis se pasan desde app.js/chatbot.js
        // Solo parpadear si no está escuchando activamente (después de activación) o hablando
        if (!isListening && !speechSynthesis.speaking) {
            if (!leftEye || !rightEye) return; // Asegurarse de que los elementos existan
            [leftEye, rightEye].forEach(eye => {
                eye.style.transform = 'scaleY(0.1)';
            });
            setTimeout(() => {
                [leftEye, rightEye].forEach(eye => {
                    eye.style.transform = 'scaleY(1)';
                });
            }, 150);
        }
    }, Math.random() * 4000 + 2000); // Parpadeo aleatorio entre 2-6 segundos
}

/**
 * Inicia la animación de "respiración" (movimiento sutil) para los ojos.
 */
export function breathingAnimation() {
    if (!eyesContainer) return; // Asegurarse de que el elemento exista
    function animateBreathing() {
        // isListening y speechSynthesis se pasan desde app.js/chatbot.js
        // Solo animar la respiración si no está escuchando activamente o hablando
        if (!isListening && !speechSynthesis.speaking) {
            const scale = 1 + Math.sin(Date.now() * 0.002) * 0.02;
            eyesContainer.style.transform = `scale(${scale})`;
        } else {
            eyesContainer.style.transform = `scale(1)`; // Resetear si está escuchando o hablando
        }
        requestAnimationFrame(animateBreathing);
    }
    animateBreathing();
}

/**
 * Rastrea el movimiento del mouse/dedo para el movimiento de los ojos.
 * @param {number} x - Coordenada X del puntero.
 * @param {number} y - Coordenada Y del puntero.
 */
export function trackMovement(x, y) {
    if (!eyesContainer) return; // Asegurarse de que el elemento exista
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const offsetX = Math.max(-2, Math.min(2, (x - centerX) / 100));
    const offsetY = Math.max(-2, Math.min(2, (y - centerY) / 100));
    
    eyesContainer.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
}

/**
 * Establece el estado de escucha activa de LOOI, actualizando el patrón de ojos.
 * @param {boolean} active - true para activar la señal de escucha, false para desactivar.
 */
export function setListeningState(active) {
    isListening = active; // Actualiza el estado global de escucha
    if (active) {
        setEyePattern(eyePatterns.listeningActive); // Ojos con patrón de ondas
    } else {
        setEyePattern(eyePatterns.happy); // Ojos vuelven a estado normal
    }
}
