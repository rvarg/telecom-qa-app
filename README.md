# Telecom Q&A

Herramienta interactiva de práctica sobre telecomunicaciones organizada en
**10 sesiones de clase**, cada una con **hasta 10 preguntas de opción
múltiple** (con imágenes opcionales). Cliente para celular y servidor
desplegable en una intranet **o** en Vercel (plan Hobby).

Está pensada como **plantilla**: el contenido vive en archivos JSON
separados (uno por sesión) que puedes editar sin tocar el código — ver
[`server/data/README.md`](server/data/README.md).

```
telecom-qa-app/
├── public/         HTML/CSS/JS del cliente — fuente única, sirve tanto
│                   para Vercel (sitio estático) como para el APK
│   └── img/        Imágenes locales para usar en las preguntas
├── client/         Configuración de Capacitor que empaqueta public/ en un APK
├── server/
│   ├── app.js      La app Express (rutas de la API) — sin escuchar puerto
│   ├── server.js   Arranque para intranet: usa app.js y escucha en 0.0.0.0
│   ├── validate.js Revisa los archivos de sesiones (npm run validate)
│   ├── lib/        Carga y validación de sesiones
│   └── data/
│       ├── app.json            Textos del encabezado de la app
│       └── sessions/           sesion-01.json ... sesion-10.json (+ plantilla)
├── api/
│   └── index.js    Punto de entrada para Vercel: exporta la misma app.js
├── vercel.json     Enruta /api/* a la función, el resto a public/
├── package.json    Dependencias para el build de Vercel
└── .devcontainer/  Entorno Theia/Docker con JDK + Android SDK preinstalados
```

`server/app.js` es la única definición de la API — tanto `server/server.js`
(intranet) como `api/index.js` (Vercel) la reutilizan tal cual, así que el
contenido y la lógica de corrección son idénticos sin importar dónde corra.

## Cómo funciona

1. El **backend** expone las sesiones y corrige las respuestas por HTTP, en dos variantes
   posibles (elige una, o mantén ambas):
   - **Intranet**: `server/server.js` corriendo en una máquina de la red
     local (ver [`server/README.md`](server/README.md)).
   - **Vercel** (recomendado si quieres que funcione desde cualquier red,
     no solo dentro del campus): ver la sección de abajo.
2. El **cliente** es una app de Android instalada en los celulares de los
   estudiantes, que se conecta al backend elegido.
3. El estudiante elige una sesión, responde sus preguntas (cada una
   aparece una sola vez, en orden aleatorio por defecto), recibe
   corrección y explicación inmediatas, y al terminar ve su resultado y
   puede repetir la sesión o pasar a la siguiente. Solo hay preguntas de
   **opción múltiple**; algunas pueden llevar una imagen que se puede
   ampliar tocándola.

## Puesta en marcha rápida — intranet

1. **Servidor**: ver [`server/README.md`](server/README.md) — instalar
   dependencias, arrancar, anotar la IP de la máquina y abrir el puerto
   3000 en el firewall.
2. **Cliente**: ver [`client/README.md`](client/README.md) — apuntar
   `public/js/config.js` a esa IP, probar en el navegador, y luego
   compilar el APK con Android Studio (o con Theia IDE / línea de
   comandos usando el entorno preconfigurado en
   [`.devcontainer/`](.devcontainer/README.md)).

## Puesta en marcha rápida — Vercel (plan Hobby)

Desplegar en Vercel cambia el modelo: en vez de un servidor solo
alcanzable dentro de la red del campus, obtienes una URL pública
(`https://tu-proyecto.vercel.app`) con HTTPS automático, accesible desde
cualquier red (Wi-Fi de casa, datos móviles, etc.) — no solo la intranet.
A cambio, el plan Hobby está pensado para uso personal/no comercial y el
sistema de archivos del servidor pasa a ser de **solo lectura**: no hay
forma de editar los archivos de sesiones en caliente como con `/api/admin/reload`
en intranet — actualizar el contenido significa editar los archivos, hacer
commit y volver a desplegar (Vercel lo hace automático si conectas un
repo de Git).

### 1. Sube el proyecto a un repositorio Git

Vercel despliega desde GitHub, GitLab o Bitbucket. Si aún no es un repo:

```bash
cd telecom-qa-app
git init
git add .
git commit -m "Telecom Q&A"
```

y súbelo a GitHub (crea el repo vacío en GitHub primero, luego
`git remote add origin <url>` y `git push -u origin main`).

### 2. Importa el proyecto en Vercel

1. Entra a [vercel.com](https://vercel.com) e inicia sesión (puedes usar
   tu cuenta de GitHub directamente).
2. **Add New → Project**, selecciona el repositorio.
3. Vercel detecta `vercel.json` automáticamente — no hace falta tocar la
   configuración de "Build & Output Settings" que propone por defecto.
4. **Deploy**. En un par de minutos tendrás la URL pública.

Alternativa por línea de comandos, si lo prefieres:

```bash
npm install -g vercel
cd telecom-qa-app
vercel        # sigue las preguntas; crea un preview
vercel --prod # despliega a producción
```

### 3. Verifica que la API responde

```bash
curl https://tu-proyecto.vercel.app/api/health
```

Debería devolver `{"status":"ok","questionCount":18}`. Abrir
`https://tu-proyecto.vercel.app` directamente en el navegador debería
mostrar la app funcionando igual que en intranet.

### 4. Apunta el cliente (y el APK) a esa URL

Edita `public/js/config.js` y cambia `FALLBACK_API_BASE_URL` por tu URL
de Vercel — esto afecta al APK, que no tiene forma de detectar la URL
automáticamente (ver [`client/README.md`](client/README.md)):

```js
const FALLBACK_API_BASE_URL = "https://tu-proyecto.vercel.app/api";
```

Como Vercel sirve todo por HTTPS, **puedes saltarte** el paso del
`AndroidManifest.xml` (`usesCleartextTraffic`) que sí hace falta para un
backend de intranet en HTTP plano.

### 5. Actualizar sesiones después de desplegar

Edita los archivos de `server/data/sessions/` (y, si agregaste imágenes
locales, súbelas a `public/img/`). Antes de publicar, revísalos:

```bash
npm install          # solo la primera vez
npm run validate
```

Luego:

```bash
git add server/data public/img
git commit -m "Actualiza sesiones"
git push
```

Vercel vuelve a desplegar automáticamente al detectar el push (o corre
`vercel --prod` de nuevo si desplegaste por CLI). No necesitas recompilar
el APK — solo el backend cambia.

### Límites a tener presentes en el plan Hobby

- Pensado para uso personal/no comercial (revisa los
  [términos de Vercel](https://vercel.com/docs/limits/overview) si el
  uso institucional te genera dudas).
- Los proyectos inactivos por un tiempo prolongado pueden "dormir" el
  primer request (cold start) — el siguiente ya responde rápido.
- Suficiente ancho de banda y ejecuciones de función para el tráfico de
  un curso; si el uso crece mucho (miles de estudiantes concurrentes),
  revisa los límites exactos en la documentación de Vercel.

## Alcance de esta versión

Esta versión deliberadamente **no incluye**:

- Panel de administración para cargar preguntas desde la app — el
  contenido se edita directamente en los archivos JSON de
  `server/data/sessions/` (ver [`server/data/README.md`](server/data/README.md)).
- Preguntas abiertas — se eliminaron; solo hay opción múltiple.
- Cuentas de estudiante ni seguimiento de calificaciones — el resultado
  se muestra solo mientras el estudiante usa la app y no se guarda en el
  servidor.
- Un repaso mixto con preguntas de todas las sesiones (existía en la
  versión anterior; el diseño actual es una sesión a la vez).

Son extensiones naturales si más adelante las necesitas: un panel admin
web, registro de desempeño por estudiante (login + una base de datos
ligera como SQLite) o un modo de repaso mixto.

## Contenido incluido

10 sesiones de ejemplo con 3 preguntas cada una, que cubren fundamentos de
telecomunicaciones, modulación y multiplexación, muestreo y cuantización,
análisis en frecuencia y filtros, fibra óptica, redes de acceso FTTx/PON,
diseño de enlaces FTTH, IoT/LPWAN, modelo OSI y regulación del espectro.
Los títulos y las preguntas son un punto de partida: reemplázalos con los
temas de tus clases siguiendo el mismo formato (hay una plantilla en
`server/data/sessions/_plantilla-sesion.json`).

Ejemplos de imágenes incluidos: la sesión 5 usa una imagen local
(`public/img/fibra-estructura.svg`, ilustración propia) y la sesión 6 una
imagen de la web (Wikimedia Commons). Las imágenes de la web requieren
que el dispositivo tenga acceso a internet; para uso solo en intranet o
sin conexión, usa imágenes locales.
