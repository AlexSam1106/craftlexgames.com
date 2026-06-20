<?php
// --- CONFIGURACIÓN DE SEGURIDAD ---
$my_user = "0801200824069";
$my_hash = "6f9fedd21d5fb3ec4edc3ee5987fbe0d"; // Hash Moodle
$my_pass = "*Alex11062008"; // Tu contraseña real
$secret_pass = "1106";

// --- ENLACES DIRECTOS A ZOOM GATEWAY ---
$link_estadistica = "http://zoom.unicah.edu/api/zoom/zoom.php?usr=0801200824069&nom=ALEXANDER&data=eyJjdCI6ImZNZE92WExWcUNFYit4SDFpaUkvSHM0WDZZLzVKU0NwMUFqMkc0aTB0UDRTMzJHTUMvOHI4ZjhCQnY3U3I1am9wUmk1UTBQMW9wTTFnNkcwWWxURU5yd05pcjl6R3BseStWTzBRR0Z3M0RNOW5ZVU5RK0tXcUI3MEl4NkNhTHJ4dWNDeTRPZFYxc1pzK01MM1E2ZDN0dWZMWnN2OTN3RUhYZzdCM2ZLWjdGRms4bldwRjRsdGQ0T29OS2pFVTI0b0Q4Ty82bk9FNkhiL2hTYm1vTVI4S2sxL29Qdkl2Q0FSUm1iUGhZbFJOcnc4WVVrL3BBRDJEMWpQdEpSdCs5N2NRY3FBZHdFNW02aDFHQVRuMkhBWENsTi9rRFZCMjZkWGhCYk5PYmNEOFVTYU1NYVpBSU5wNU9UeUdYcElxTi9tR1pNaDZLK1lYaTdoTGpSQ1Y2MFVEdz09IiwiaXYiOiJlNDM3M2QwNGZiODRhYzE5Y2NkMDU4NmYwNzViMDg0NSIsInMiOiJjMmZhMDBlMjRiOTdjNjUzIn0=";

$link_precalculo = "http://zoom.unicah.edu/api/zoom/zoom.php?usr=0801200824069&nom=ALEXANDER&data=eyJjdCI6IkxJNzFNbTlUM3ViWGlJN2MvZGF3cmV6Ulg5aTNyOHk4OGlDOU9FSDdRTW95NXZ4WG9NMnVlVHgwM0JPT1hWMHkyRm5MaEM3MVFvOElvMEN2ZmRqZi9USmZZSmFpRkdsaDd2V2x6YXh2T0FSeVg4amZZNDhFVEFiVHoxSHlZNGppMHhDQU9jRlZVd0YrN1JWM3FpSVVIenNCLzJ0L2Myc0V1YTlUVktodllRTWZCNmo1dzhRcnN5QUJ2dWZYNXpCWEZvZ0lvcjVFOE1FTHZUenREeXhucDhuQ0RmTXpUd3BDek5qUUMrSDA1RkwxSHlhZjQzYlZ3NlhiVm5UM056VUZPZGZ5ait0N1lKZHpmbG9BSlNPRTJSTjUvQW1NRjk5RUFkVGJwY1BnU0xFcDVJTWxQSWNOMzZxNmcycXdUNDEyalhBSVJnOERTRkZWM0RoT3daL01rUT09IiwiaXYiOiJhZTIwMTQ2ODhkMjNjMDk0MmQ5OGUyNzUwYWI0N2E2ZiIsInMiOiJkNjUxN2RjMWJjZTMzZGFlIn0=";

$link_programacion = "http://zoom.unicah.edu/api/zoom/zoom.php?usr=0801200824069&nom=ALEXANDER&data=eyJjdCI6IlYxWnlZVjN1TXJEVWY3UzVxUzdKa0djMlJCY3MzN2tqQ3ZmZ0lPMkxWUTkwYWFtUnhsZjRFSGMvNDIyRTM4OS9GSVYzN1BtQ3lCa3dnNUJRQ3BXdndiWTJCS0RPS1Y0NVV6eGN5N2FoeUdMZjNwdmQ3V3hNbW5Id2ZxaGQ1Z1M1QWNrWlBGYmdJbGhiWnNEQXdyS2tnZ010SG9hdVdpbEt6TDhoVFNKU3VVOTg5TVFzZlg5RHdwQnFadnhjSlRmeFZRa3A5QmVWS2ZoTmJraDBCNUN1cEFNYVovWVB4SXdkcEJ3ZlpIUnBIWDA0VE84V2xTSXk5NmJodU5yM0xJV1lGRHlncmpmdWtjcWJPYjJYaXpZb2RjN3JPZXVDY2wxaTVOZElDcHlYU2lZUTk1Y2Uya2luWThwN1k4RUtHNmNQMU04d2UvMUp6OTZ4RlBXK01ldGw2TzZWZ3k1ZFVBb21ZRW9XTDkxa044RT0iLCJpdiI6ImM5Nzc5NmRlNTQwMGZmODk1MTEyOTU3MGYzZWNhYTE3IiwicyI6IjVjNzM4ZWE3Y2Y0OWM5ODMifQ==";

// Verificación de acceso por URL (?pass=1106)
if (!isset($_GET['pass']) || $_GET['pass'] !== $secret_pass) {
    header('HTTP/1.0 403 Forbidden');
    die("Acceso no autorizado.");
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="referrer" content="no-referrer">
    <title>UNICAH Hub - Alexander</title>
    
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#FFFFFF">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <link rel="apple-touch-icon" href="moodle-icon.png">

    <style>
        body { 
            background-color: #F4F7F9; 
            display: flex; justify-content: center; align-items: center; 
            min-height: 100vh; margin: 0; font-family: 'Segoe UI', sans-serif; 
        }
        .container { 
            text-align: center; padding: 30px; width: 90%; max-width: 400px; 
            background: white; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.06); 
            margin: 20px 0;
        }
        .logo { max-width: 190px; height: auto; margin-bottom: 20px; }
        
        .welcome-text { color: #003366; font-size: 22px; font-weight: 700; margin-bottom: 5px; }
        .instruction-text { color: #7F8C8D; font-size: 14px; margin-bottom: 30px; }

        .section-label { 
            text-align: left; color: #003366; font-size: 11px; font-weight: 800; 
            text-transform: uppercase; letter-spacing: 1.2px; margin: 20px 0 10px 5px; 
        }

        .btn {
            display: block; width: 100%; padding: 16px; border: none; border-radius: 14px;
            font-size: 15px; font-weight: 600; cursor: pointer; transition: 0.2s;
            margin-bottom: 12px; text-decoration: none; box-sizing: border-box;
            text-align: center;
        }
        .btn:active { transform: scale(0.97); opacity: 0.9; }

        .btn-moodle { background-color: #004CBE; color: white; }
        .btn-calificaciones { background-color: #10B981; color: white; } /* Color esmeralda para notas */
        .btn-zoom { background-color: #2D8CFF; color: white; }
        .btn-portal { background-color: #F1F3F5; color: #495057; font-size: 13px; margin-top: 15px; }

        .class-time { font-size: 11px; font-weight: 400; display: block; opacity: 0.9; margin-top: 2px; }

        /* Estilos del Modal (Pop-up) */
        .modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px);
            display: none; justify-content: center; align-items: center; z-index: 1000;
            opacity: 0; transition: opacity 0.3s ease;
        }
        .modal-overlay.active { display: flex; opacity: 1; }
        .modal-content {
            background: white; padding: 25px; border-radius: 20px; width: 85%; max-width: 320px;
            text-align: center; box-shadow: 0 15px 50px rgba(0,0,0,0.1);
            transform: translateY(20px); transition: transform 0.3s ease;
        }
        .modal-overlay.active .modal-content { transform: translateY(0); }
        .modal-title { color: #003366; font-size: 18px; font-weight: 700; margin-bottom: 20px; }
        .btn-modal-close { background: transparent; color: #7F8C8D; margin-top: 5px; padding: 10px; font-size: 14px; border: none; width: 100%; cursor: pointer; font-weight: 600; }
    </style>
</head>
<body>

    <div class="container">
        <img src="https://login.sec.unicah.net/imgs/NewLogo.png" alt="Logo UNICAH" class="logo">
        <div class="welcome-text">¡Hola, Alexander!</div>
        <p class="instruction-text">Panel de Acceso Rápido UNICAH</p>
        
        <div class="section-label">Plataformas</div>
        <button class="btn btn-moodle" onclick="launchMoodle()">ENTRAR A MOODLE</button>
        <button class="btn btn-calificaciones" onclick="openModal()">VER CALIFICACIONES</button>
        
        <div class="section-label">Clases en Línea</div>
        <a href="<?php echo $link_estadistica; ?>" class="btn btn-zoom">
            ESTADÍSTICA 1
            <span class="class-time">16:00 - 16:50 (LUN-VIE)</span>
        </a>

        <a href="<?php echo $link_precalculo; ?>" class="btn btn-zoom">
            PRE-CÁLCULO
            <span class="class-time">17:00 - 17:50 (LUN-VIE)</span>
        </a>

        <a href="<?php echo $link_programacion; ?>" class="btn btn-zoom">
            FUNDAMENTOS DE PROGRAMACIÓN
            <span class="class-time">18:00 - 18:50 (LUN-VIE)</span>
        </a>
        
        <button class="btn btn-portal" onclick="launchPortal()">Acceder al Portal SEC</button>
    </div>
    
    <form id="formMoodle" action="https://registro.cp.unicah.net/testloginmoodle/autologin.php" method="post" style="display:none;">
        <input type="hidden" name="username" value="<?php echo $my_user; ?>">
        <input type="hidden" name="password" value="<?php echo $my_hash; ?>">
        <input type="hidden" name="logintoken" value="unicahprivatetokentest">
    </form>

    <form id="formPortal" action="https://login.sec.unicah.net/ctrl/login.php" method="post" style="display:none;">
        <input type="hidden" name="UsrUsr" value="<?php echo $my_user; ?>">
        <input type="hidden" name="UsrPwd" value="<?php echo $my_pass; ?>">
    </form>

    <!-- Modal Calificaciones -->
    <div class="modal-overlay" id="calificacionesModal" onclick="closeModal(event)">
        <div class="modal-content" onclick="event.stopPropagation()">
            <div class="modal-title">¿Qué historial deseas ver?</div>
            <a href="https://registro.app.unicah.net/#/misclases" class="btn btn-calificaciones">PERIODO ACTUAL</a>
            <a href="https://registro.app.unicah.net/#/historialgrafico" class="btn btn-calificaciones">HISTORIAL GRÁFICO</a>
            <a href="https://registro.app.unicah.net/#/registrohistorial" class="btn btn-calificaciones">HISTORIAL DE CLASES</a>
            <button class="btn-modal-close" onclick="closeModal(event)">Cancelar</button>
        </div>
    </div>

    <script>
        function launchMoodle() { document.getElementById('formMoodle').submit(); }
        function launchPortal() { document.getElementById('formPortal').submit(); }

        // Funciones para manejar el pop-up
        function openModal() {
            const modal = document.getElementById('calificacionesModal');
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10); // Animación suave
        }

        function closeModal(e) {
            if(e) e.preventDefault();
            const modal = document.getElementById('calificacionesModal');
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300); // Esperar fin de animación
        }

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js');
        }
    </script>
</body>
</html>