# Servidor — Telecom Q&A

API REST en Node.js/Express que sirve el banco de preguntas. Este archivo
cubre el despliegue **en una intranet** (una máquina propia, sin depender
de un proveedor externo). Si en cambio quieres desplegarlo en **Vercel**
(plan Hobby), sáltate esta guía y ve a [`../README.md`](../README.md) —
la lógica de la API es la misma (`app.js`), solo cambia cómo se arranca.

## 1. Requisitos

- Node.js 18 o superior instalado en el servidor.

## 2. Instalación y arranque

```bash
cd server
npm install
npm start
```

Verás en consola:

```
Telecom Q&A server escuchando en el puerto 3000
Preguntas cargadas: 18
```

El servidor escucha en `0.0.0.0:3000`, es decir, en todas las interfaces
de red de la máquina — accesible desde cualquier dispositivo de la misma
red local, no solo desde `localhost`.

Además de la API, este servidor sirve directamente los archivos del
cliente web (carpeta `public/` en la raíz del proyecto, si existe junto a
`server/` como en este repositorio). Es decir, abrir `http://localhost:3000`
— o `http://<IP-del-servidor>:3000` desde cualquier dispositivo de la
intranet, incluido el navegador de un celular — ya muestra la app
funcionando, sin necesidad de instalar el APK ni levantar un segundo
proceso. Es la forma más rápida de probar todo el flujo antes de
compilar el APK.

## 3. Encontrar la IP del servidor en la intranet

- Windows: `ipconfig` (busca "Dirección IPv4")
- Linux/macOS: `ip addr` o `ifconfig`

Ejemplo: si la IP es `192.168.1.50`, el cliente móvil debe apuntar a
`http://192.168.1.50:3000/api` (ver `FALLBACK_API_BASE_URL` en
`public/js/config.js`).

Recomendado: asigna una **IP fija** (reserva DHCP o configuración estática)
a esta máquina para que la dirección no cambie y no tengas que reconfigurar
el cliente cada vez.

## 4. Abrir el puerto en el firewall

Si el sistema operativo tiene firewall activo, habilita el puerto 3000
para conexiones entrantes desde la red local (por ejemplo, en Windows:
Firewall de Windows Defender → Regla de entrada → puerto TCP 3000).

## 5. Editar las sesiones

El contenido vive en `data/sessions/`, un archivo por sesión
(`sesion-01.json` ... `sesion-10.json`; máximo 10 sesiones y 10 preguntas
de opción múltiple por sesión). El formato completo, con ejemplos de
imágenes, está en [`data/README.md`](data/README.md), y hay una plantilla
lista para copiar en `data/sessions/_plantilla-sesion.json`. Los textos
del encabezado de la app se cambian en `data/app.json`.

Después de editar, revisa los archivos:

```bash
npm run validate
```

y recarga el contenido: reinicia el proceso (`Ctrl+C` y `npm start` de
nuevo), o llama a `POST /api/admin/reload` para recargarlo sin reiniciar:

```bash
curl -X POST http://localhost:3000/api/admin/reload
```

## 6. Mantener el servidor corriendo (opcional)

Para que el servidor siga activo tras cerrar la terminal o reiniciar la
máquina, usa un gestor de procesos como [PM2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
pm2 start server.js --name telecom-qa
pm2 save
pm2 startup   # sigue las instrucciones que imprime para autoarranque
```

## 7. Endpoints disponibles

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servidor, nº de sesiones y de advertencias de carga |
| GET | `/api/config` | Textos del encabezado (`data/app.json`) |
| GET | `/api/sessions` | Lista de sesiones con su número de preguntas |
| GET | `/api/sessions/:sessionId` | Una sesión con sus preguntas (sin revelar las respuestas) |
| POST | `/api/sessions/:sessionId/questions/:questionId/check` | Body `{ "optionId": "b" }`; devuelve si es correcta y la explicación |
| POST | `/api/admin/reload` | Recarga los archivos de `data/` sin reiniciar |
