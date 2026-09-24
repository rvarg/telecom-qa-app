(() => {
  'use strict';

  // ---------- Estado ----------
  const state = {
    topic: null,        // id del tema seleccionado, o null para "mixto"
    topicName: '',
    current: null,      // pregunta actual (sin respuesta)
    answered: false,
    correctCount: 0,
    totalCount: 0
  };

  // ---------- Referencias DOM ----------
  const screens = {
    topics: document.getElementById('screen-topics'),
    quiz: document.getElementById('screen-quiz'),
    error: document.getElementById('screen-error')
  };

  const topicListEl = document.getElementById('topic-list');
  const mixedBtn = document.getElementById('mixed-topics-btn');
  const btnChangeTopic = document.getElementById('btn-change-topic');
  const btnRetry = document.getElementById('btn-retry');
  const btnNext = document.getElementById('btn-next');
  const btnReveal = document.getElementById('btn-reveal');

  const scorePill = document.getElementById('score-pill');
  const qTypeTag = document.getElementById('q-type-tag');
  const qTopicTag = document.getElementById('q-topic-tag');
  const qPrompt = document.getElementById('q-prompt');
  const mcqOptionsEl = document.getElementById('mcq-options');
  const openAnswerEl = document.getElementById('open-answer');
  const openTextarea = document.getElementById('open-textarea');
  const feedbackEl = document.getElementById('feedback');

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
  function startQuiz(topicId) {
    state.topic = topicId;
    state.topicName = topicId ? topicName(topicId) : 'Repaso mixto';
    state.correctCount = 0;
    state.totalCount = 0;
    updateScorePill();
    showScreen('quiz');
    loadNextQuestion();
  }

  function updateScorePill() {
    scorePill.textContent = `${state.correctCount} / ${state.totalCount}`;
  }

  async function loadNextQuestion() {
    state.answered = false;
    feedbackEl.classList.add('hidden');
    feedbackEl.innerHTML = '';
    btnNext.classList.add('hidden');
    openAnswerEl.classList.add('hidden');
    mcqOptionsEl.classList.add('hidden');
    mcqOptionsEl.innerHTML = '';
    openTextarea.value = '';
    qPrompt.textContent = 'Cargando pregunta…';

    try {
      const qs = state.topic ? `?topic=${encodeURIComponent(state.topic)}` : '';
      const q = await api(`/questions/random${qs}`);
      state.current = q;
      renderQuestion(q);
    } catch (err) {
      showScreen('error');
    }
  }

  function renderQuestion(q) {
    qPrompt.textContent = q.prompt;
    qTypeTag.textContent = q.type === 'mcq' ? 'Opción múltiple' : 'Pregunta abierta';
    qTopicTag.textContent = topicName(q.topic);

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
    state.totalCount += 1;

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
    updateScorePill();

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
    state.totalCount += 1;
    updateScorePill();

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
  btnNext.addEventListener('click', () => {
    btnReveal.disabled = false;
    loadNextQuestion();
  });
  btnReveal.addEventListener('click', revealAnswer);

  // ---------- Arranque ----------
  loadTopics();
})();
