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

## 5. Editar el banco de preguntas

Las preguntas están en `data/questions.json`. Cada pregunta tiene:

- `type`: `"mcq"` (opción múltiple) u `"open"` (pregunta abierta)
- `topic`: debe coincidir con un `id` listado en `topics` al inicio del archivo
- Para `mcq`: `options` (lista de `{id, text}`), `correctOptionId`, `explanation`
- Para `open`: `referenceAnswer` y opcionalmente `keyPoints` (lista de puntos clave)

Si prefieres mantener las preguntas en Excel, arma una hoja con esas mismas
columnas y luego expórtala a este formato JSON (puedo ayudarte a generar
un script de conversión si lo necesitas).

Después de editar el archivo, reinicia el proceso (`Ctrl+C` y `npm start`
de nuevo), o llama a `POST /api/admin/reload` para recargarlo sin reiniciar:

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
| GET | `/api/health` | Estado del servidor |
| GET | `/api/topics` | Lista de temas con conteo de preguntas |
| GET | `/api/questions?topic=&type=` | Lista de preguntas (sin revelar respuesta) |
| GET | `/api/questions/random?topic=&type=` | Una pregunta aleatoria |
| POST | `/api/questions/:id/check` | Verifica respuesta y da retroalimentación |
| POST | `/api/admin/reload` | Recarga `questions.json` sin reiniciar |
