<?php
// --- CONFIGURACIÓN DE SEGURIDAD ---
$my_user = "0801200818761";
$my_hash = "fa1be269367c252c49b35bbd737a82d6"; // Hash Moodle
$my_pass = "Angeles.2008"; // Tu contraseña real
$secret_pass = "pato";

// --- ENLACES DIRECTOS A ZOOM GATEWAY ---
// Estos links cargan el código que me pasaste con el mensaje de espera.
$link_mate = "";

$link_intro = "";

// Verificación de acceso por URL (?pass=pato)
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
    <title>UNICAH Hub - Victoria</title>
    
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
        .btn-zoom { background-color: #2D8CFF; color: white; }
        .btn-portal { background-color: #F1F3F5; color: #495057; font-size: 13px; margin-top: 15px; }

        .class-time { font-size: 11px; font-weight: 400; display: block; opacity: 0.9; margin-top: 2px; }
    </style>
</head>
<body>

    <div class="container">
        <img src="https://login.sec.unicah.net/imgs/NewLogo.png" alt="Logo UNICAH" class="logo">
        <div class="welcome-text">¡Hola, Victoria!</div>
        <p class="instruction-text">Panel de Acceso Rápido UNICAH</p>
        
        <div class="section-label">Plataformas</div>
        <button class="btn btn-moodle" onclick="launchMoodle()">ENTRAR A MOODLE</button>
        
        <div class="section-label">Clases en Línea</div>
        <a href="<?php echo $link_mate; ?>" class="btn btn-zoom">
            UNDEFINED
            <span class="class-time">Error</span>
        </a>

        <a href="<?php echo $link_intro; ?>" class="btn btn-zoom">UNDEFINED
            <span class="class-time">Error</span>
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

    <script>
        function launchMoodle() { document.getElementById('formMoodle').submit(); }
        function launchPortal() { document.getElementById('formPortal').submit(); }

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js');
        }
    </script>
</body>
</html>