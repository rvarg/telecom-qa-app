(() => {
  'use strict';

  // ---------- Estado ----------
  const state = {
    topic: null,        // id del tema seleccionado, o null para "mixto"
    topicName: '',
    queue: [],           // preguntas de la sesión, ya barajadas, sin repetir
    index: -1,            // posición actual dentro de queue
    current: null,        // queue[index]
    answered: false,
    correctCount: 0
  };

  // ---------- Referencias DOM ----------
  const screens = {
    topics: document.getElementById('screen-topics'),
    quiz: document.getElementById('screen-quiz'),
    complete: document.getElementById('screen-complete'),
    error: document.getElementById('screen-error')
  };

  const topicListEl = document.getElementById('topic-list');
  const mixedBtn = document.getElementById('mixed-topics-btn');
  const btnChangeTopic = document.getElementById('btn-change-topic');
  const btnRetry = document.getElementById('btn-retry');
  const btnNext = document.getElementById('btn-next');
  const btnReveal = document.getElementById('btn-reveal');
  const btnRetryTopic = document.getElementById('btn-retry-topic');
  const btnCompleteChangeTopic = document.getElementById('btn-complete-change-topic');

  const scorePill = document.getElementById('score-pill');
  const qTypeTag = document.getElementById('q-type-tag');
  const qTopicTag = document.getElementById('q-topic-tag');
  const qPrompt = document.getElementById('q-prompt');
  const mcqOptionsEl = document.getElementById('mcq-options');
  const openAnswerEl = document.getElementById('open-answer');
  const openTextarea = document.getElementById('open-textarea');
  const feedbackEl = document.getElementById('feedback');
  const completeScoreEl = document.getElementById('complete-score');
  const completeTopicEl = document.getElementById('complete-topic');

  let topicsCache = [];

  // ---------- Utilidades ----------
  function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => {
      el.classList.toggle('hidden', key !== name);
    });
  }

  async function api(path, options) {
    const res = await fetch(`${API_BASE_URL}${path}`, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function topicName(id) {
    const t = topicsCache.find(t => t.id === id);
    return t ? t.name : 'Repaso mixto';
  }

  // Fisher-Yates: baraja una copia del arreglo, no muta el original
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- Carga inicial: temas ----------
  async function loadTopics() {
    try {
      const topics = await api('/topics');
      topicsCache = topics;
      renderTopics(topics);
      showScreen('topics');
    } catch (err) {
      showScreen('error');
    }
  }

  function renderTopics(topics) {
    topicListEl.innerHTML = '';
    topics.forEach(t => {
      const row = document.createElement('div');
      row.className = 'topic-row';
      row.setAttribute('role', 'listitem');
      row.tabIndex = 0;
      row.innerHTML = `
        <span class="topic-row__bar"></span>
        <span class="topic-row__body">
          <p class="topic-row__name">${t.name}</p>
          <p class="topic-row__count">${t.count} pregunta${t.count === 1 ? '' : 's'}</p>
        </span>
        <span class="chevron" aria-hidden="true">›</span>
      `;
      row.addEventListener('click', () => startQuiz(t.id));
      row.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') startQuiz(t.id);
      });
      topicListEl.appendChild(row);
    });
  }

  // ---------- Flujo del quiz ----------
  // Trae TODAS las preguntas del tema (o de todos, en modo mixto) una sola
  // vez, las baraja, y las recorre sin repetir hasta agotarlas — así el
  // denominador del progreso es fijo y ninguna pregunta se repite dentro
  // de la misma sesión.
  async function startQuiz(topicId) {
    state.topic = topicId;
    state.topicName = topicId ? topicName(topicId) : 'Repaso mixto';
    showScreen('quiz');
    qPrompt.textContent = 'Cargando preguntas…';
    mcqOptionsEl.innerHTML = '';
    mcqOptionsEl.classList.add('hidden');
    openAnswerEl.classList.add('hidden');
    feedbackEl.classList.add('hidden');
    btnNext.classList.add('hidden');

    try {
      const qs = topicId ? `?topic=${encodeURIComponent(topicId)}` : '';
      const questions = await api(`/questions${qs}`);
      if (!questions.length) {
        showScreen('error');
        return;
      }
      state.queue = shuffle(questions);
      state.index = -1;
      state.correctCount = 0;
      goToNextQuestion();
    } catch (err) {
      showScreen('error');
    }
  }

  function updateProgress() {
    const total = state.queue.length;
    const current = Math.min(state.index + 1, total);
    scorePill.textContent = `Pregunta ${current} de ${total}`;
  }

  function goToNextQuestion() {
    state.index += 1;
    if (state.index >= state.queue.length) {
      showCompletion();
      return;
    }
    state.answered = false;
    state.current = state.queue[state.index];
    updateProgress();
    renderQuestion(state.current);

    feedbackEl.classList.add('hidden');
    feedbackEl.innerHTML = '';
    btnNext.classList.add('hidden');
    btnReveal.disabled = false;
    openTextarea.value = '';
  }

  function showCompletion() {
    const total = state.queue.length;
    completeScoreEl.textContent = `${state.correctCount} de ${total} correctas`;
    completeTopicEl.textContent = state.topicName;
    showScreen('complete');
  }

  function renderQuestion(q) {
    qPrompt.textContent = q.prompt;
    qTypeTag.textContent = q.type === 'mcq' ? 'Opción múltiple' : 'Pregunta abierta';
    qTopicTag.textContent = topicName(q.topic);

    mcqOptionsEl.innerHTML = '';
    if (q.type === 'mcq') {
      mcqOptionsEl.classList.remove('hidden');
      openAnswerEl.classList.add('hidden');
      q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `
          <span class="option-btn__marker">${opt.id.toUpperCase()}</span>
          <span>${opt.text}</span>
        `;
        btn.addEventListener('click', () => selectOption(opt.id, btn));
        mcqOptionsEl.appendChild(btn);
      });
    } else {
      openAnswerEl.classList.remove('hidden');
      mcqOptionsEl.classList.add('hidden');
    }
  }

  async function selectOption(optionId, btnEl) {
    if (state.answered) return;
    state.answered = true;

    let result;
    try {
      result = await api(`/questions/${state.current.id}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId })
      });
    } catch (err) {
      showScreen('error');
      return;
    }

    if (result.correct) state.correctCount += 1;

    // Marca visualmente todas las opciones
    Array.from(mcqOptionsEl.children).forEach(el => {
      el.disabled = true;
      const marker = el.querySelector('.option-btn__marker').textContent.toLowerCase();
      if (marker === result.correctOptionId) {
        el.classList.add('is-correct');
      } else if (el === btnEl) {
        el.classList.add('is-incorrect');
      } else {
        el.classList.add('is-faded');
      }
    });

    feedbackEl.className = `feedback ${result.correct ? 'is-correct' : 'is-incorrect'}`;
    feedbackEl.innerHTML = `
      <p class="feedback__verdict">${result.correct ? '¡Correcto!' : 'No es correcto'}</p>
      <p class="feedback__body">${result.explanation || ''}</p>
    `;
    feedbackEl.classList.remove('hidden');
    btnNext.classList.remove('hidden');
  }

  async function revealAnswer() {
    if (state.answered) return;
    state.answered = true;

    let result;
    try {
      result = await api(`/questions/${state.current.id}/check`, { method: 'POST' });
    } catch (err) {
      showScreen('error');
      return;
    }

    const points = (result.keyPoints || [])
      .map(p => `<li>${p}</li>`).join('');

    feedbackEl.className = 'feedback is-info';
    feedbackEl.innerHTML = `
      <p class="feedback__verdict">Respuesta de referencia</p>
      <p class="feedback__body">${result.referenceAnswer}</p>
      ${points ? `<ul class="feedback__points">${points}</ul>` : ''}
    `;
    feedbackEl.classList.remove('hidden');
    btnNext.classList.remove('hidden');
    btnReveal.disabled = true;
  }

  // ---------- Eventos ----------
  mixedBtn.addEventListener('click', () => startQuiz(null));
  mixedBtn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') startQuiz(null);
  });
  btnChangeTopic.addEventListener('click', () => showScreen('topics'));
  btnRetry.addEventListener('click', loadTopics);
  btnNext.addEventListener('click', goToNextQuestion);
  btnReveal.addEventListener('click', revealAnswer);
  btnRetryTopic.addEventListener('click', () => startQuiz(state.topic));
  btnCompleteChangeTopic.addEventListener('click', () => showScreen('topics'));

  // ---------- Arranque ----------
  loadTopics();
})();
