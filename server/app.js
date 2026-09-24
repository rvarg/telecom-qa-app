/**
 * Telecom Q&A — Express app
 * --------------------------
 * Define la API REST y el servido estático del cliente web. No arranca
 * un servidor por sí solo (no llama a app.listen) — eso lo hace quien
 * importe este módulo:
 *
 *  - server/server.js   lo usa para correr en un servidor de intranet
 *                        (npm start), escuchando en 0.0.0.0:PORT.
 *  - api/index.js        lo exporta tal cual para desplegarlo como
 *                        función serverless en Vercel.
 *
 * Mantener la app en un solo lugar evita mantener dos copias de las
 * rutas para los dos tipos de despliegue.
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data', 'questions.json');

const app = express();
app.use(cors());
app.use(express.json());

// Sirve el cliente web (carpeta public/ en la raíz del proyecto) desde
// este mismo servidor: abrir la URL del servidor en un navegador ya
// muestra la app, sin levantar un segundo proceso aparte. En Vercel,
// esta ruta normalmente ni se ejecuta porque vercel.json sirve public/
// directamente como sitio estático antes de invocar la función — pero
// queda como respaldo funcional (p. ej. corriendo `node server/server.js`
// localmente, o si algún día cambia el enrutamiento de Vercel).
const PUBLIC_PATH = path.join(__dirname, '..', 'public');
if (fs.existsSync(PUBLIC_PATH)) {
  app.use(express.static(PUBLIC_PATH));
} else {
  app.get('/', (req, res) => {
    res.type('text/plain').send(
      'Telecom Q&A server activo. No se encontró la carpeta public/ ' +
      'en la raíz del proyecto (se esperaba en ' + PUBLIC_PATH + '), así ' +
      'que no hay nada que mostrar en la raíz. La API sigue disponible en /api/*.'
    );
  });
}

// --- Carga del banco de preguntas en memoria ---
// En uso local/intranet, editar data/questions.json y llamar a
// POST /api/admin/reload (o reiniciar el proceso) recarga el contenido.
// En Vercel no existe esa posibilidad (sistema de archivos de solo
// lectura y cada invocación puede correr en una instancia distinta):
// ahí, actualizar el banco de preguntas significa editar el archivo,
// hacer commit y volver a desplegar.
function loadData() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

let db = loadData();

// Quita del payload los campos que revelarían la respuesta correcta
function stripAnswer(q) {
  const { correctOptionId, explanation, referenceAnswer, keyPoints, ...safe } = q;
  return safe;
}

// --- Rutas ---

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', questionCount: db.questions.length });
});

// Lista de temas con el número de preguntas disponibles en cada uno
app.get('/api/topics', (req, res) => {
  const counts = db.questions.reduce((acc, q) => {
    acc[q.topic] = (acc[q.topic] || 0) + 1;
    return acc;
  }, {});
  const topics = db.topics.map(t => ({ ...t, count: counts[t.id] || 0 }));
  res.json(topics);
});

// Lista de preguntas filtrable por tema y/o tipo (mcq | open)
// No incluye la respuesta correcta
app.get('/api/questions', (req, res) => {
  const { topic, type } = req.query;
  let results = db.questions;
  if (topic) results = results.filter(q => q.topic === topic);
  if (type) results = results.filter(q => q.type === type);
  res.json(results.map(stripAnswer));
});

// Una pregunta aleatoria, opcionalmente filtrada por tema y/o tipo
app.get('/api/questions/random', (req, res) => {
  const { topic, type } = req.query;
  let pool = db.questions;
  if (topic) pool = pool.filter(q => q.topic === topic);
  if (type) pool = pool.filter(q => q.type === type);
  if (pool.length === 0) {
    return res.status(404).json({ error: 'No hay preguntas para ese filtro' });
  }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  res.json(stripAnswer(pick));
});

// Verifica una respuesta y devuelve retroalimentación
// MCQ  -> body: { optionId }
// Open -> no requiere body; siempre devuelve la respuesta de referencia
// para autoevaluación del estudiante
app.post('/api/questions/:id/check', (req, res) => {
  const q = db.questions.find(q => q.id === req.params.id);
  if (!q) return res.status(404).json({ error: 'Pregunta no encontrada' });

  if (q.type === 'mcq') {
    const { optionId } = req.body || {};
    const correct = optionId === q.correctOptionId;
    return res.json({
      type: 'mcq',
      correct,
      correctOptionId: q.correctOptionId,
      explanation: q.explanation
    });
  }

  if (q.type === 'open') {
    return res.json({
      type: 'open',
      referenceAnswer: q.referenceAnswer,
      keyPoints: q.keyPoints || []
    });
  }

  res.status(400).json({ error: 'Tipo de pregunta desconocido' });
});

// Permite recargar el banco de preguntas sin reiniciar el proceso.
// Solo tiene efecto real en un despliegue de intranet de larga duración;
// en Vercel cada invocación puede arrancar desde cero de todos modos.
app.post('/api/admin/reload', (req, res) => {
  try {
    db = loadData();
    res.json({ status: 'reloaded', questionCount: db.questions.length });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo recargar el archivo de datos', detail: err.message });
  }
});

module.exports = app;
