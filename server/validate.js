/**
 * Revisa los archivos de sesiones antes de publicarlos.
 *
 *   npm run validate
 *
 * Muestra cuántas sesiones y preguntas válidas hay, y cualquier problema
 * encontrado (JSON mal formado, respuesta correcta que no coincide con
 * ninguna opción, más de 10 preguntas, etc.). Termina con código 1 si hay
 * advertencias, para poder usarlo también en automatizaciones.
 */
const { loadSessions, LIMITS } = require('./lib/sessions');

const { sessions, warnings } = loadSessions();

console.log(`\nSesiones válidas: ${sessions.length} (máximo ${LIMITS.MAX_SESSIONS})\n`);
sessions.forEach(s => {
  const withImages = s.questions.filter(q => q.image).length;
  console.log(
    `  Sesión ${String(s.number).padStart(2, '0')}  ` +
    `${String(s.questions.length).padStart(2, ' ')}/${LIMITS.MAX_QUESTIONS_PER_SESSION} preguntas` +
    `${withImages ? `, ${withImages} con imagen` : ''}  —  ${s.title}`
  );
});

if (warnings.length) {
  console.log(`\n${warnings.length} advertencia(s):\n`);
  warnings.forEach(w => console.log(`  ! ${w}`));
  console.log('');
  process.exit(1);
}
console.log('\nTodo en orden: sin advertencias.\n');
