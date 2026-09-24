# Telecom Q&A

Herramienta interactiva de preguntas y respuestas sobre telecomunicaciones
(fibra óptica/GPON, DSP, IoT y fundamentos), con cliente para celular y
servidor desplegable en una intranet **o** en Vercel (plan Hobby).

```
telecom-qa-app/
├── public/         HTML/CSS/JS del cliente — fuente única, sirve tanto
│                   para Vercel (sitio estático) como para el APK
├── client/         Configuración de Capacitor que empaqueta public/ en un APK
├── server/
│   ├── app.js      La app Express (rutas + banco de preguntas) — sin escuchar puerto
│   ├── server.js   Arranque para intranet: usa app.js y escucha en 0.0.0.0
│   └── data/questions.json
├── api/
│   └── index.js    Punto de entrada para Vercel: exporta la misma app.js
├── vercel.json     Enruta /api/* a la función, el resto a public/
├── package.json    Dependencias para el build de Vercel
└── .devcontainer/  Entorno Theia/Docker con JDK + Android SDK preinstalados
```

`server/app.js` es la única definición de la API — tanto `server/server.js`
(intranet) como `api/index.js` (Vercel) la reutilizan tal cual, así que las
preguntas y la lógica de corrección son idénticas sin importar dónde corra.

## Cómo funciona

1. El **backend** expone el banco de preguntas por HTTP, en dos variantes
   posibles (elige una, o mantén ambas):
   - **Intranet**: `server/server.js` corriendo en una máquina de la red
     local (ver [`server/README.md`](server/README.md)).
   - **Vercel** (recomendado si quieres que funcione desde cualquier red,
     no solo dentro del campus): ver la sección de abajo.
2. El **cliente** es una app de Android instalada en los celulares de los
   estudiantes, que se conecta al backend elegido.
3. Las preguntas combinan **opción múltiple** (con corrección automática y
   explicación) y **preguntas abiertas** (el estudiante escribe su
   respuesta y luego revela una respuesta de referencia con puntos clave,
   para autoevaluarse).

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
forma de editar `questions.json` en caliente como con `/api/admin/reload`
en intranet — actualizar preguntas significa editar el archivo, hacer
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

### 5. Actualizar preguntas después de desplegar

Edita `server/data/questions.json`, luego:

```bash
git add server/data/questions.json
git commit -m "Actualiza banco de preguntas"
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

## Alcance de esta primera versión

Conversamos el alcance antes de construirlo, así que esta versión
deliberadamente **no incluye todavía**:

- Panel de administración para cargar preguntas desde la app — por ahora
  el banco se edita directamente en `server/data/questions.json` (o desde
  un Excel que exportes a ese formato).
- Cuentas de estudiante ni seguimiento de calificaciones — el puntaje de
  la sesión se muestra solo mientras el estudiante usa la app, y no se
  guarda en el servidor.

Ambas cosas quedaron identificadas como próximos pasos naturales: un
panel admin web (para no depender de editar JSON a mano) y, si más
adelante quieres registrar desempeño por estudiante, una capa ligera de
login + base de datos (SQLite es suficiente para uso de un curso) en el
mismo servidor Express. Aviso si quieres que construya cualquiera de las
dos ahora.

## Banco de preguntas incluido

18 preguntas de muestra repartidas en 4 temas, alineadas con los cursos
existentes (fibra óptica/GPON, DSP, IoT/ODS, fundamentos). Es un punto de
partida — amplía `server/data/questions.json` con las preguntas propias
de cada curso siguiendo el mismo formato.
