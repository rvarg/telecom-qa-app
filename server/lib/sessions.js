/**
 * Carga y validación de las sesiones de clase
 * --------------------------------------------
 * Cada sesión vive en su propio archivo:  server/data/sessions/sesion-NN.json
 * (NN = 01, 02, ... 10). Los archivos cuyo nombre no siga ese patrón se
 * ignoran — por ejemplo _plantilla-sesion.json.
 *
 * Este módulo nunca lanza errores por contenido inválido: descarta lo que
 * no sirve y devuelve una lista de advertencias, para que un error de
 * edición en un archivo no tumbe toda la aplicación (importante en Vercel,
 * donde no puedes mirar la consola del servidor fácilmente). Para revisar
 * tus archivos antes de publicar, corre:  npm run validate
 */

const fs = require('fs');
const path = require('path');

// ---- Límites del diseño (cámbialos aquí si algún día los necesitas) ----
const LIMITS = {
  MAX_SESSIONS: 10,
  MAX_QUESTIONS_PER_SESSION: 10,
  MIN_OPTIONS: 2,
  MAX_OPTIONS: 6
};

const SESSIONS_DIR = path.join(__dirname, '..', 'data', 'sessions');
const FILE_PATTERN = /^sesion-(\d{1,2})\.json$/i;

const isNonEmptyString = v => typeof v === 'string' && v.trim().length > 0;

// Solo se aceptan imágenes por http(s) o por ruta relativa/absoluta del
// propio sitio (p. ej. "img/figura.png"). Se descartan esquemas raros
// como javascript: o data:.
function isSafeImageUrl(url) {
  if (!isNonEmptyString(url)) return false;
  if (/^https?:\/\//i.test(url)) return true;
  return !/^[a-z][a-z0-9+.-]*:/i.test(url.trim());
}

function validateQuestion(raw, position, sessionId) {
  const label = `${sessionId}, pregunta ${position}`;
  const warnings = [];

  if (!raw || typeof raw !== 'object') {
    return { question: null, warnings: [`${label}: no es un objeto válido; se omite.`] };
  }
  if (raw.type !== undefined && raw.type !== 'mcq') {
    return {
      question: null,
      warnings: [`${label}: solo se admiten preguntas de opción múltiple (type "mcq"); se omite.`]
    };
  }
  if (!isNonEmptyString(raw.prompt)) {
    return { question: null, warnings: [`${label}: falta "prompt" (el enunciado); se omite.`] };
  }
  if (!Array.isArray(raw.options) ||
      raw.options.length < LIMITS.MIN_OPTIONS ||
      raw.options.length > LIMITS.MAX_OPTIONS) {
    return {
      question: null,
      warnings: [`${label}: "options" debe tener entre ${LIMITS.MIN_OPTIONS} y ${LIMITS.MAX_OPTIONS} opciones; se omite.`]
    };
  }

  const options = [];
  const seen = new Set();
  for (const opt of raw.options) {
    if (!opt || !isNonEmptyString(opt.id) || !isNonEmptyString(opt.text)) {
      return {
        question: null,
        warnings: [`${label}: cada opción necesita "id" y "text" no vacíos; se omite.`]
      };
    }
    if (seen.has(opt.id)) {
      return { question: null, warnings: [`${label}: id de opción repetido ("${opt.id}"); se omite.`] };
    }
    seen.add(opt.id);
    options.push({ id: opt.id, text: opt.text });
  }

  if (!seen.has(raw.correctOptionId)) {
    return {
      question: null,
      warnings: [`${label}: "correctOptionId" ("${raw.correctOptionId}") no coincide con ninguna opción; se omite.`]
    };
  }

  const question = {
    prompt: raw.prompt,
    options,
    correctOptionId: raw.correctOptionId,
    explanation: isNonEmptyString(raw.explanation) ? raw.explanation : ''
  };

  if (raw.id !== undefined) {
    if (isNonEmptyString(raw.id)) question.id = raw.id;
    else warnings.push(`${label}: "id" vacío; se asigna uno automático.`);
  }

  if (raw.image !== undefined) {
    if (raw.image && isSafeImageUrl(raw.image.url)) {
      question.image = {
        url: raw.image.url.trim(),
        alt: isNonEmptyString(raw.image.alt) ? raw.image.alt : '',
        caption: isNonEmptyString(raw.image.caption) ? raw.image.caption : ''
      };
      if (!question.image.alt) {
        warnings.push(`${label}: la imagen no tiene "alt" (texto alternativo); conviene agregarlo.`);
      }
    } else {
      warnings.push(`${label}: "image" necesita una "url" http(s) o ruta relativa válida; se ignora la imagen.`);
    }
  }

  return { question, warnings };
}

function validateSession(raw, fileName, number) {
  const id = fileName.replace(/\.json$/i, '').toLowerCase();
  const warnings = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { session: null, warnings: [`${fileName}: el contenido debe ser un objeto JSON; se omite.`] };
  }
  if (!isNonEmptyString(raw.title)) {
    return { session: null, warnings: [`${fileName}: falta "title"; se omite la sesión.`] };
  }
  if (!Array.isArray(raw.questions)) {
    return { session: null, warnings: [`${fileName}: falta "questions" (lista de preguntas); se omite la sesión.`] };
  }

  const questions = [];
  const usedIds = new Set();
  let warnedTruncate = false;
  raw.questions.forEach((rawQ, i) => {
    const position = i + 1;
    if (questions.length >= LIMITS.MAX_QUESTIONS_PER_SESSION) {
      if (!warnedTruncate) {
        warnedTruncate = true;
        warnings.push(
          `${fileName}: hay más de ${LIMITS.MAX_QUESTIONS_PER_SESSION} preguntas; ` +
          `solo se usan las primeras ${LIMITS.MAX_QUESTIONS_PER_SESSION} válidas.`
        );
      }
      return;
    }
    const result = validateQuestion(rawQ, position, fileName);
    warnings.push(...result.warnings);
    if (!result.question) return;

    const q = result.question;
    if (!q.id) q.id = `${id}-q${String(questions.length + 1).padStart(2, '0')}`;
    if (usedIds.has(q.id)) {
      warnings.push(`${fileName}, pregunta ${position}: id repetido ("${q.id}"); se omite.`);
      return;
    }
    usedIds.add(q.id);
    questions.push(q);
  });

  if (questions.length === 0) {
    warnings.push(`${fileName}: no tiene ninguna pregunta válida; la sesión se omite.`);
    return { session: null, warnings };
  }

  return {
    session: {
      id,
      number,
      title: raw.title.trim(),
      description: isNonEmptyString(raw.description) ? raw.description.trim() : '',
      shuffleQuestions: raw.shuffleQuestions !== false, // por defecto, sí se barajan
      questions
    },
    warnings
  };
}

function loadSessions() {
  const warnings = [];
  const sessions = [];

  let files;
  try {
    files = fs.readdirSync(SESSIONS_DIR);
  } catch (err) {
    return {
      sessions,
      warnings: [`No se pudo leer la carpeta de sesiones (${SESSIONS_DIR}): ${err.message}`]
    };
  }

  const candidates = files
    .map(f => ({ file: f, match: FILE_PATTERN.exec(f) }))
    .filter(c => c.match)
    .map(c => ({ file: c.file, number: parseInt(c.match[1], 10) }))
    .sort((a, b) => a.number - b.number || a.file.localeCompare(b.file));

  const usedNumbers = new Set();
  for (const { file, number } of candidates) {
    if (number < 1 || number > LIMITS.MAX_SESSIONS) {
      warnings.push(
        `${file}: el número de sesión debe estar entre 1 y ${LIMITS.MAX_SESSIONS} ` +
        `(sesion-01.json ... sesion-${String(LIMITS.MAX_SESSIONS).padStart(2, '0')}.json); se ignora.`
      );
      continue;
    }
    if (usedNumbers.has(number)) {
      warnings.push(`${file}: el número de sesión ${number} ya está en uso por otro archivo; se omite.`);
      continue;
    }

    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, file), 'utf-8'));
    } catch (err) {
      warnings.push(`${file}: JSON inválido (${err.message}); se omite.`);
      continue;
    }

    const result = validateSession(raw, file, number);
    warnings.push(...result.warnings);
    if (result.session) {
      usedNumbers.add(number);
      sessions.push(result.session);
    }
  }

  return { sessions, warnings };
}

module.exports = { loadSessions, LIMITS, SESSIONS_DIR };
