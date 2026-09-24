# Entorno de desarrollo (Theia / devcontainer)

Esta carpeta define una imagen Docker con Node.js, JDK 17 y el Android SDK
(command-line tools) ya instalados, para que puedas compilar el APK desde
Theia IDE sin instalar nada manualmente en tu máquina.

> **Nota**: este Dockerfile no se pudo construir ni probar en el entorno
> donde armé este proyecto (sin Docker ni acceso a los servidores de
> Google para descargar el SDK). La receta es correcta y estándar, pero
> pruébala tú antes de confiar en ella para una sesión de clase — si algo
> falla al construir la imagen, dímelo y lo ajustamos.

## Opción A — Theia IDE (recomendada)

[Theia IDE](https://theia-ide.org) tiene soporte para la especificación
`devcontainer.json`. Con Docker Desktop (o Docker Engine) corriendo:

1. Abre Theia IDE.
2. **File → Open Folder** y selecciona la carpeta raíz `telecom-qa-app/`.
3. Theia debería detectar `.devcontainer/devcontainer.json` y ofrecer
   reabrir el workspace dentro del contenedor. Acepta.
4. La primera vez tardará varios minutos (descarga el SDK de Android
   dentro de la imagen). Las siguientes veces reutiliza la imagen ya
   construida.
5. Con el workspace abierto dentro del contenedor, en la terminal
   integrada de Theia:

   ```bash
   cd client
   npx cap add android
   npx cap sync android
   cd android
   ./gradlew assembleDebug
   ```

   El APK queda en `client/android/app/build/outputs/apk/debug/`.

## Opción B — Docker manual (si Theia no detecta el devcontainer)

```bash
cd telecom-qa-app
docker build -t telecom-qa-dev -f .devcontainer/Dockerfile .
docker run -it --rm \
  -v "$(pwd)":/workspace \
  -p 3000:3000 -p 8080:8080 \
  telecom-qa-dev bash
```

Dentro del contenedor tienes Node, JDK y el Android SDK listos; corre los
mismos comandos del paso 5 de arriba.

## Recordatorio sobre el APK

Antes de compilar, configura la IP del servidor en
`public/js/config.js` (ver `client/README.md`) y agrega
`android:usesCleartextTraffic="true"` al `AndroidManifest.xml` generado,
ya que el servidor de intranet normalmente no tendrá HTTPS.
