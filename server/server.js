/**
 * Telecom Q&A — arranque para intranet/uso local
 * ------------------------------------------------
 * Usa la app definida en app.js y la pone a escuchar en 0.0.0.0, para
 * que sea accesible desde otros dispositivos de la misma red local.
 *
 * Arranque:
 *   npm install
 *   npm start
 *
 * (Para el despliegue en Vercel no se usa este archivo — Vercel invoca
 * directamente api/index.js, que exporta la misma app sin escuchar en
 * ningún puerto. Ver README.md en la raíz del proyecto.)
 */

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Telecom Q&A server escuchando en el puerto ${PORT}`);
});
