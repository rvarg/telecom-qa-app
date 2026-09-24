# Cliente — Telecom Q&A

Aplicación web móvil (HTML/CSS/JS puro, sin frameworks pesados) empaquetada
con [Capacitor](https://capacitorjs.com) para generar un APK de Android
instalable directamente en los celulares, sin pasar por Play Store.

> Los archivos de la app (HTML/CSS/JS) viven en [`../public`](../public),
> no dentro de esta carpeta — esa es la misma carpeta que despliega
> Vercel como sitio estático (ver [`../README.md`](../README.md)) y la
> que el servidor de intranet sirve directamente. `client/` solo contiene
> la configuración de Capacitor para envolver ese contenido en un APK.

> **Nota sobre este entorno**: el código completo del cliente está listo
> y probado en navegador. Compilar el `.apk` final requiere el Android
> SDK y Android Studio, herramientas que no están disponibles en el
> entorno donde se generó este proyecto. Los pasos de abajo son el
> camino directo para compilarlo tú mismo — no hay nada más que escribir,
> solo ejecutar los comandos en tu máquina.

## 1. Probar en el navegador primero (recomendado)

El servidor (`server/`) sirve estos archivos directamente, así que para
probar todo el flujo antes de compilar el APK basta con arrancar el
servidor (ver `server/README.md`) y abrir en un navegador:

```
http://localhost:3000
```

o, desde el celular sin instalar nada aún, `http://<IP-del-servidor>:3000`.
La detección de la IP del servidor es automática en este caso — no hace
falta tocar `config.js`. Reduce el ancho de la ventana o usa las
herramientas de desarrollador en modo "dispositivo móvil" para ver el
diseño como se verá en el celular.

Si prefieres servir el cliente por separado de todos modos (por ejemplo,
para editar el diseño sin reiniciar el servidor Express), sigue estando
disponible:

```bash
cd client
npm install
npm run serve   # http://localhost:8080, sirviendo ../public directamente
```

## 2. Antes de compilar el APK: configura la URL de respaldo

Dentro del APK no hay un "servidor" que sirva la propia app (los archivos
viven localmente en el celular), así que ahí sí es necesario indicar la
dirección del backend manualmente. Edita `../public/js/config.js` y
cambia `FALLBACK_API_BASE_URL`:

- Si el servidor está desplegado en **Vercel**: usa la URL pública que
  Vercel te asigna, con `/api` al final — por ejemplo:
  ```js
  const FALLBACK_API_BASE_URL = "https://telecom-qa-tuusuario.vercel.app/api";
  ```
  Ver [`../README.md`](../README.md) para el despliegue en Vercel. Ventaja:
  esta URL es estable — una vez compilado el APK con ella, sigue
  funcionando aunque cambies de red Wi-Fi, y no hace falta recompilar
  cada vez que cambia una IP local.
- Si el servidor corre en la **intranet** (`server/server.js`): usa la IP
  fija de esa máquina, como antes:
  ```js
  const FALLBACK_API_BASE_URL = "http://192.168.1.50:3000/api";
  ```

## 3. Requisitos para compilar el APK

- [Android Studio](https://developer.android.com/studio) instalado (incluye el Android SDK).
- Node.js 18+.

## 4. Generar el proyecto Android

Desde la carpeta `client/`:

```bash
npm install
npx cap add android
npx cap sync android
```

Esto crea la carpeta `android/` con un proyecto nativo de Android que
envuelve el contenido de `../public/` (ver `capacitor.config.json` →
`webDir`) en un WebView.

## 5. Permitir tráfico HTTP (solo si usas el backend de intranet)

Si configuraste `FALLBACK_API_BASE_URL` con la URL de **Vercel**
(`https://...`), puedes saltarte este paso: Vercel sirve todo por HTTPS
por defecto, que Android permite sin configuración adicional.

Si en cambio apuntas al servidor de **intranet** por `http://IP:puerto`,
Android bloquea por defecto las conexiones HTTP sin cifrar para apps con
SDK objetivo reciente, así que hay que habilitarlo explícitamente:

Abre `android/app/src/main/AndroidManifest.xml` y agrega el atributo
`android:usesCleartextTraffic="true"` a la etiqueta `<application>`:

```xml
<application
    android:usesCleartextTraffic="true"
    ...>
```

(Para producción, una alternativa más segura es restringir el permiso solo
a la subred de tu intranet mediante un `network_security_config.xml` — te
puedo ayudar a definirlo si lo necesitas.)

## 6. Compilar el APK

```bash
npx cap open android
```

Esto abre el proyecto en Android Studio. Ahí:

1. Espera a que sincronice Gradle (primera vez puede tardar varios minutos).
2. Ve a **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
3. El archivo `.apk` queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

Copia ese archivo al celular (por USB, correo, o compartiéndolo en la
intranet) e instálalo habilitando "Instalar apps de orígenes desconocidos"
en el celular.

## 7. Firmar para distribución (opcional)

El APK generado en el paso anterior es una build de depuración, suficiente
para uso interno en un curso. Si vas a distribuirlo más ampliamente, Android
Studio también permite generar una build firmada de "release"
(**Build → Generate Signed Bundle / APK**), que requiere crear una clave de
firma una sola vez.

## Reconfigurar el backend más adelante

Si cambias de servidor (nueva IP de intranet, o un nuevo despliegue en
Vercel), edita `../public/js/config.js` y repite desde el paso 4
(`npx cap sync android` y recompilar). No es necesario reinstalar Android
Studio ni repetir la configuración del `AndroidManifest.xml` — salvo que
pases de una URL Vercel (HTTPS) a una de intranet (HTTP) por primera vez,
en cuyo caso sí aplica el paso 5.
