// Configuración de conexión al servidor de intranet.
//
// El servidor (server/) ahora también sirve estos mismos archivos
// estáticos, así que si abres la app en un navegador apuntando al
// servidor (p. ej. http://192.168.1.50:3000), no hace falta tocar nada:
// se detecta automáticamente y usa ese mismo origen para las llamadas
// a /api.
//
// Eso NO aplica dentro del APK compilado: ahí los archivos se cargan
// localmente en el celular (no hay "origen" de servidor que detectar),
// así que se usa la URL de respaldo de abajo. Edítala con la IP fija
// del servidor en tu intranet ANTES de compilar el APK:
//
//   const FALLBACK_API_BASE_URL = "http://192.168.1.50:3000/api";

const FALLBACK_API_BASE_URL = "http://192.168.1.50:3000/api";

const API_BASE_URL = (function () {
  const isNativeApp = !!(
    window.Capacitor &&
    typeof window.Capacitor.isNativePlatform === 'function' &&
    window.Capacitor.isNativePlatform()
  );

  if (!isNativeApp && window.location.protocol.startsWith('http')) {
    // Servido por el propio servidor Express (navegador de escritorio o
    // del celular apuntando directamente a http://IP-del-servidor:3000)
    return `${window.location.origin}/api`;
  }

  // Empaquetado dentro del APK: usa la IP configurada arriba
  return FALLBACK_API_BASE_URL;
})();
