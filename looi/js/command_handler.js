// js/command_handler.js

import { setEyePattern, eyePatterns } from './eye_manager.js';
import { playRobotSound, speakText } from './audio_manager.js';
import { currentUserId, isAuthenticatedUser } from './firebase_init.js'; // Importar estado de autenticación
import { isVisionActive, startContinuousVision, stopContinuousVision } from './vision_manager.js'; // Importar estado y control de visión

// Referencias a elementos DOM (se inicializarán en chatbot.js)
let settingsPanel, personalitySelect, languageSelect, robotResponse;
// selectedMode, bluetoothDevice, bluetoothCharacteristic se pasarán desde app.js (main.html)
// y se leerán desde localStorage en chatbot.js
let selectedMode; 
let bluetoothDevice; 
let bluetoothCharacteristic; 
let visionToggleBtn; // Botón de visión para actualizar su estado

// Asignar referencias DOM desde chatbot.js
export function setCommandVariables(vars) {
    ({
        settingsPanel, personalitySelect, languageSelect, robotResponse,
        visionToggleBtn
    } = vars);
    // selectedMode, bluetoothDevice, bluetoothCharacteristic se obtendrán de localStorage/sessionStorage
    selectedMode = localStorage.getItem('looi_selected_mode');
    // Para bluetoothDevice y bluetoothCharacteristic, necesitaríamos serializarlos/deserializarlos
    // o reestablecer la conexión en chatbot.html si es necesario.
    // Por ahora, asumimos que solo se usan para la lógica de comandos, no para reestablecer la conexión.
    // Si necesitas que la conexión Bluetooth persista entre main.html y chatbot.html,
    // la lógica de conexión deberá residir en chatbot.js y firebase_init.js.
    // Para simplificar, asumiremos que bluetoothDevice y bluetoothCharacteristic solo son válidos
    // en el contexto de main.html para la conexión inicial. En chatbot.html, solo se usará
    // el 'selectedMode' para determinar si los comandos de robot son relevantes.
}

/**
 * Maneja comandos internos de la interfaz.
 * @param {string} text - El texto del comando.
 * @returns {string|null} - La respuesta del robot o null si no es un comando especial.
 */
export function handleSpecialCommands(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('cambiar personalidad a ')) {
        const newPersonality = lowerText.replace('cambiar personalidad a ', '').trim();
        const availablePersonalities = ['amigable', 'profesional', 'juguetón', 'sarcástico'];
        const englishPersonalities = ['friendly', 'professional', 'playful', 'sarcastic'];
        const index = availablePersonalities.indexOf(newPersonality);
        if (index !== -1) {
            if (personalitySelect) { // Asegurarse de que el elemento exista
                personalitySelect.value = englishPersonalities[index];
                personalitySelect.dispatchEvent(new Event('change')); // Disparar cambio para actualizar la UI y lógica
            }
            return `Perfecto, ahora soy más ${newPersonality}.`;
        }
        return `Lo siento, no conozco esa personalidad. Prueba con: ${availablePersonalities.join(', ')}.`;
    }
    
    if (lowerText.includes('abrir configuración') || lowerText.includes('configuración')) {
        if (settingsPanel) settingsPanel.classList.add('open');
        return 'He abierto el panel de configuración para ti.';
    }
    
    if (lowerText.includes('cerrar configuración')) {
        if (settingsPanel) settingsPanel.classList.remove('open');
        return 'Panel de configuración cerrado.';
    }
    
    if (lowerText.includes('cambiar expresión') || lowerText.includes('cambiar cara')) {
        const expressions = Object.keys(eyePatterns);
        const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
        setEyePattern(eyePatterns[randomExpression]);
        return `¿Te gusta mi nueva expresión? Ahora me siento ${randomExpression}.`;
    }
    
    if (lowerText.includes('estado bluetooth') || lowerText.includes('conexión')) {
        // selectedMode se lee de localStorage
        const storedSelectedMode = localStorage.getItem('looi_selected_mode');
        const storedBluetoothConnected = localStorage.getItem('looi_bluetooth_connected') === 'true';
        const storedBluetoothDeviceName = localStorage.getItem('looi_bluetooth_device_name') || 'desconocido';

        if (storedSelectedMode === 'robot') {
            if (storedBluetoothConnected) {
                return `Estoy conectado al robot ${storedBluetoothDeviceName} vía Bluetooth.`;
            } else {
                return 'No estoy conectado a ningún robot físico.';
            }
        } else {
            return 'Estoy funcionando en modo PC, sin conexión física.';
        }
    }

    if (lowerText.includes('mi id de usuario') || lowerText.includes('mi id')) {
        if (currentUserId) {
            return `Tu ID de usuario es: ${currentUserId}.`;
        } else {
            return 'No he podido obtener tu ID de usuario en este momento.';
        }
    }

    if (lowerText.includes('activar visión') || lowerText.includes('encender cámara')) {
        if (!isAuthenticatedUser) {
            return 'Necesitas iniciar sesión para usar la función de visión.';
        }
        if (!isVisionActive()) {
            startContinuousVision();
            if (visionToggleBtn) visionToggleBtn.classList.add('active');
            return 'Visión activada. ¡Ahora puedo ver!';
        }
        return 'La visión ya está activa.';
    }

    if (lowerText.includes('desactivar visión') || lowerText.includes('apagar cámara')) {
        if (isVisionActive()) {
            stopContinuousVision();
            if (visionToggleBtn) visionToggleBtn.classList.remove('active');
            return 'Visión desactivada. Mis ojos están en modo de ahorro de energía.';
        }
        return 'La visión ya está inactiva.';
    }
    
    return null; // No es un comando especial
}

/**
 * Maneja comandos que se envían al robot físico (Arduino vía ESP32).
 * Asume que bluetoothCharacteristic y bluetoothDevice son válidos si la conexión se estableció.
 * @param {string} text - El texto del comando.
 * @returns {object|null} - Un objeto con { command, response } o null si no es un comando físico reconocido.
 */
export async function handleRobotCommands(text) {
    const lowerText = text.toLowerCase();
    
    // selectedMode se lee de localStorage
    const storedSelectedMode = localStorage.getItem('looi_selected_mode');
    const storedBluetoothConnected = localStorage.getItem('looi_bluetooth_connected') === 'true';

    if (storedSelectedMode !== 'robot' || !storedBluetoothConnected) {
        // No estamos en modo robot o no hay conexión Bluetooth activa desde la página anterior.
        return null; // No se pueden enviar comandos físicos.
    }

    // Aquí, para enviar comandos Bluetooth desde chatbot.html, necesitaríamos que bluetoothCharacteristic
    // se reestablezca o se pase de alguna manera. Dado que la conexión se inicia en main.html,
    // si queremos enviar comandos desde chatbot.html, la lógica de conexión Bluetooth
    // debería estar en chatbot.js o ser reestablecida aquí.
    // Por simplicidad en esta refactorización, si bluetoothCharacteristic no está disponible aquí,
    // no se enviará el comando.
    if (!bluetoothCharacteristic || !bluetoothDevice || !bluetoothDevice.gatt.connected) {
        console.warn('No hay conexión Bluetooth activa en chatbot.html para enviar comandos.');
        return { command: null, response: 'No estoy conectado a tu robot. Revisa la conexión Bluetooth.' };
    }


    let command = null;
    let response = null;

    if (lowerText.includes('adelante') || lowerText.includes('avanza')) {
        command = 'F'; response = 'Moviendo hacia adelante.';
    } else if (lowerText.includes('atrás') || lowerText.includes('retrocede')) {
        command = 'B'; response = 'Moviendo hacia atrás.';
    } else if (lowerText.includes('izquierda') || lowerText.includes('gira a la izquierda')) {
        command = 'L'; response = 'Girando a la izquierda.';
    } else if (lowerText.includes('derecha') || lowerText.includes('gira a la derecha')) {
        command = 'R'; response = 'Girando a la derecha.';
    } else if (lowerText.includes('detente') || lowerText.includes('para') || lowerText.includes('alto')) {
        command = 'S'; response = 'Deteniéndome.';
    } else if (lowerText.includes('saluda') || lowerText.includes('saludo')) {
        command = 'V'; response = '¡Hola! *saludando*.';
    } else if (lowerText.includes('pitido')) {
        command = 'Y'; response = 'Haciendo un pitido.';
    } else if (lowerText.includes('autonomo') || lowerText.includes('autónomo') || lowerText.includes('explora')) {
        command = 'Z'; response = 'Activando modo autónomo.';
    }
    
    if (command) {
        try {
            const encoder = new TextEncoder();
            await bluetoothCharacteristic.writeValue(encoder.encode(command));
            console.log('Comando Bluetooth enviado:', command);
            playRobotSound('beep');
            return { command: command, response: response };
        } catch (error) {
            console.error('Error enviando comando Bluetooth:', error);
            return { command: command, response: `Lo siento, no pude enviar el comando al robot: ${error.message}.` };
        }
    }
    
    return null; // No es un comando físico reconocido
}