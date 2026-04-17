const modalOverlay = document.querySelector('.modal-overlay');
const openModalButtons = document.querySelectorAll('[data-modal-open]');
const closeModalButtons = document.querySelectorAll('[data-modal-close]');
const deckForm = document.getElementById('deck-form');
const deckNameInput = document.getElementById('deck-name');
const deckList = document.querySelector('.deck-list');
const cardForm = document.getElementById('card-form');
const cardQuestionInput = document.getElementById('card-question');
const cardAnswerInput = document.getElementById('card-answer');
const cardIdInput = document.getElementById('card-id');
const cardList = document.querySelector('.card-list');
const cardCancelButton = document.getElementById('card-cancel');
const cardSubmitButton = cardForm ? cardForm.querySelector('button[type="submit"]') : null;
const focusableSelector = 'a[href], button:not([disabled]):not([aria-hidden="true"]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
let lastFocusedElement = null;

// Study mode state
let studyState = null;
let studyKeydownHandler = null;

// Search state
let searchQuery = '';
let searchTimeoutId = null;

// Load initial state from storage
const initialState = loadState();
let decks = initialState.decks || [
  { id: 'deck-1', name: 'HTML Basics' },
  { id: 'deck-2', name: 'CSS Essentials' },
  { id: 'deck-3', name: 'JavaScript Fundamentals' },
  { id: 'deck-4', name: 'World Capitals' },
  { id: 'deck-5', name: 'Programming Languages' },
  { id: 'deck-6', name: 'Colors & Hex Codes' },
];

let cards = initialState.cards || [
  { id: 'card-1', question: 'What does HTML stand for?', answer: 'HyperText Markup Language' },
  { id: 'card-2', question: 'What is CSS used for?', answer: 'Styling web pages' },
  { id: 'card-3', question: 'What is JavaScript?', answer: 'A programming language for web development' },
  { id: 'card-4', question: 'What is a CSS selector?', answer: 'A pattern used to select HTML elements to style' },
  { id: 'card-5', question: 'What is the DOM?', answer: 'Document Object Model - a programming interface for HTML documents' },
  { id: 'card-6', question: 'What is the capital of France?', answer: 'Paris' },
  { id: 'card-7', question: 'What is the capital of Germany?', answer: 'Berlin' },
  { id: 'card-8', question: 'What is the capital of Japan?', answer: 'Tokyo' },
  { id: 'card-9', question: 'What is the capital of Brazil?', answer: 'Brasília' },
  { id: 'card-10', question: 'What is the capital of Australia?', answer: 'Canberra' },
  { id: 'card-11', question: 'What programming language is known for web development?', answer: 'JavaScript' },
  { id: 'card-12', question: 'What programming language is used for data science?', answer: 'Python' },
  { id: 'card-13', question: 'What programming language is used for Android apps?', answer: 'Java' },
  { id: 'card-14', question: 'What programming language is used for iOS apps?', answer: 'Swift' },
  { id: 'card-15', question: 'What programming language is used for system programming?', answer: 'C' },
  { id: 'card-16', question: 'What is the hex code for red?', answer: '#FF0000' },
  { id: 'card-17', question: 'What is the hex code for blue?', answer: '#0000FF' },
  { id: 'card-18', question: 'What is the hex code for green?', answer: '#00FF00' },
  { id: 'card-19', question: 'What is the hex code for yellow?', answer: '#FFFF00' },
  { id: 'card-20', question: 'What is the hex code for purple?', answer: '#800080' },
];

// Save initial state if not loaded from storage
if (!initialState.decks || !initialState.cards) {
  saveState({ decks, cards });
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

function getFocusableElements() {
  return modalOverlay ? Array.from(modalOverlay.querySelectorAll(focusableSelector)) : [];
}

function trapFocus(event) {
  if (event.key !== 'Tab') return;

  const focusableElements = getFocusableElements();
  if (!focusableElements.length) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey) {
    if (document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}

function openModal() {
  lastFocusedElement = document.activeElement;
  modalOverlay.classList.remove('hidden');
  modalOverlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  const focusableElements = getFocusableElements();
  if (focusableElements.length) {
    focusableElements[0].focus();
  }

  document.addEventListener('keydown', handleKeydown);
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  modalOverlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  document.removeEventListener('keydown', handleKeydown);

  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    closeModal();
    return;
  }

  trapFocus(event);
}

function handleOverlayClick(event) {
  if (event.target === modalOverlay) {
    closeModal();
  }
}

function renderDecks() {
  if (!deckList) return;

  if (decks.length === 0) {
    deckList.innerHTML = `
      <li role="status" aria-live="polite" class="empty-state">
        <div class="empty-state-icon">📚</div>
        <h3>No decks yet</h3>
        <p>Create your first deck using the form above to get started studying.</p>
      </li>
    `;
    return;
  }

  deckList.innerHTML = decks
    .map(
      (deck) => `
        <li class="deck-item" data-deck-id="${deck.id}" role="button" tabindex="0" aria-label="Study deck: ${deck.name}">
          <span>${deck.name}</span>
          <span class="deck-actions">
            <button type="button" class="deck-action deck-edit" aria-label="Edit ${deck.name}">✎</button>
            <button type="button" class="deck-action deck-delete" aria-label="Delete ${deck.name}">✕</button>
          </span>
        </li>`
    )
    .join('');
}

function renderCards() {
  if (!cardList) return;

  if (cards.length === 0) {
    cardList.innerHTML = `
      <li role="status" aria-live="polite" class="empty-state">
        <div class="empty-state-icon">🎴</div>
        <h3>No cards yet</h3>
        <p>Add your first flashcard using the form above to start studying.</p>
      </li>
    `;
    return;
  }

  cardList.innerHTML = cards
    .map(
      (card) => `
        <li class="card-item" data-card-id="${card.id}">
          <div class="card">
            <div class="flashcard-inner">
              <div class="flashcard-front flashcard-face">
                <div class="card-meta">
                  <span>${card.question}</span>
                </div>
                <p>${card.answer}</p>
              </div>
              <div class="flashcard-back flashcard-face">
                <div class="card-meta">
                  <span>Answer</span>
                </div>
                <p>${card.answer}</p>
              </div>
            </div>
          </div>
          <div class="card-actions">
            <button type="button" class="card-action card-toggle" aria-label="Flip card: ${card.question}">🔄 Flip</button>
            <button type="button" class="card-action card-edit" aria-label="Edit card: ${card.question}">✎ Edit</button>
            <button type="button" class="card-action card-delete" aria-label="Delete card: ${card.question}">✕ Delete</button>
          </div>
        </li>`
    )
    .join('');
}

function filterAndRenderCards(query) {
  if (!cardList) return;

  if (!query.trim()) {
    renderCards();
    document.getElementById('search-count').classList.add('hidden');
    return;
  }

  const query_lower = query.toLowerCase();
  const filtered = cards.filter(
    (card) =>
      card.question.toLowerCase().includes(query_lower) ||
      card.answer.toLowerCase().includes(query_lower)
  );

  if (filtered.length === 0) {
    cardList.innerHTML = `
      <li role="status" aria-live="polite" class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>No matches found</h3>
        <p>Try adjusting your search terms to find cards.</p>
      </li>
    `;
    document.getElementById('search-count').textContent = '0 matches';
    document.getElementById('search-count').classList.remove('hidden');
    return;
  }

  cardList.innerHTML = filtered
    .map(
      (card) => `
        <li class="card-item" data-card-id="${card.id}">
          <div class="card">
            <div class="flashcard-inner">
              <div class="flashcard-front flashcard-face">
                <div class="card-meta">
                  <span>${card.question}</span>
                </div>
                <p>${card.answer}</p>
              </div>
              <div class="flashcard-back flashcard-face">
                <div class="card-meta">
                  <span>Answer</span>
                </div>
                <p>${card.answer}</p>
              </div>
            </div>
          </div>
          <div class="card-actions">
            <button type="button" class="card-action card-toggle" aria-label="Flip card: ${card.question}">🔄 Flip</button>
            <button type="button" class="card-action card-edit" aria-label="Edit card: ${card.question}">✎ Edit</button>
            <button type="button" class="card-action card-delete" aria-label="Delete card: ${card.question}">✕ Delete</button>
          </div>
        </li>`
    )
    .join('');

  const plural = filtered.length === 1 ? 'match' : 'matches';
  document.getElementById('search-count').textContent = `${filtered.length} ${plural}`;
  document.getElementById('search-count').classList.remove('hidden');
}

function handleSearchInput(event) {
  searchQuery = event.target.value;

  if (searchTimeoutId) {
    clearTimeout(searchTimeoutId);
  }

  searchTimeoutId = setTimeout(() => {
    filterAndRenderCards(searchQuery);
    searchTimeoutId = null;
  }, 300);
}

function addDeck(name) {
  const trimmed = name.trim();
  if (!trimmed) return;

  decks.push({ id: generateId('deck'), name: trimmed });
  saveState({ decks, cards });
  renderDecks();
}

function updateDeck(id, newName) {
  const trimmed = newName.trim();
  if (!trimmed) return;

  const deck = decks.find((item) => item.id === id);
  if (deck) {
    deck.name = trimmed;
    saveState({ decks, cards });
    renderDecks();
  }
}

function deleteDeck(id) {
  const index = decks.findIndex((item) => item.id === id);
  if (index === -1) return;

  decks.splice(index, 1);
  saveState({ decks, cards });
  renderDecks();
}

function addCard(question, answer) {
  const trimmedQuestion = question.trim();
  const trimmedAnswer = answer.trim();
  if (!trimmedQuestion || !trimmedAnswer) return;

  cards.push({ id: generateId('card'), question: trimmedQuestion, answer: trimmedAnswer });
  saveState({ decks, cards });
  renderCards();
}

function updateCard(id, question, answer) {
  const trimmedQuestion = question.trim();
  const trimmedAnswer = answer.trim();
  if (!trimmedQuestion || !trimmedAnswer) return;

  const card = cards.find((item) => item.id === id);
  if (card) {
    card.question = trimmedQuestion;
    card.answer = trimmedAnswer;
    saveState({ decks, cards });
    renderCards();
  }
}

function deleteCard(id) {
  const index = cards.findIndex((item) => item.id === id);
  if (index === -1) return;

  cards.splice(index, 1);
  saveState({ decks, cards });
  renderCards();
}

function enterStudyMode(deckId) {
  const deckCards = cards;
  if (deckCards.length === 0) {
    alert('No cards in this deck yet!');
    return;
  }

  studyState = {
    deckId,
    cards: deckCards,
    currentIndex: 0,
    isFlipped: false,
  };

  const studyView = document.getElementById('study-view');
  const cardList = document.querySelector('.card-list');
  const cardForm = document.getElementById('card-form');
  const cardViewHeader = document.querySelector('.card-view-header');

  cardList.classList.add('hidden');
  cardForm.classList.add('hidden');
  cardViewHeader.classList.add('hidden');
  studyView.classList.remove('hidden');

  renderStudyCard();

  studyKeydownHandler = handleStudyKeydown;
  document.addEventListener('keydown', studyKeydownHandler);
}

function exitStudyMode() {
  if (!studyState) return;

  if (studyKeydownHandler) {
    document.removeEventListener('keydown', studyKeydownHandler);
    studyKeydownHandler = null;
  }

  const studyView = document.getElementById('study-view');
  const cardList = document.querySelector('.card-list');
  const cardForm = document.getElementById('card-form');
  const cardViewHeader = document.querySelector('.card-view-header');

  studyView.classList.add('hidden');
  cardViewHeader.classList.remove('hidden');
  cardForm.classList.remove('hidden');
  cardList.classList.remove('hidden');

  studyState = null;
}

function renderStudyCard() {
  if (!studyState) return;

  const card = studyState.cards[studyState.currentIndex];
  const studyCard = document.getElementById('study-card');
  const studyProgress = document.getElementById('study-progress');

  studyProgress.textContent = `Card ${studyState.currentIndex + 1} of ${studyState.cards.length}`;

  studyCard.innerHTML = `
    <div class="study-card-inner" role="status" aria-live="polite" aria-label="Flashcard: ${card.question}">
      <div class="study-card-face study-card-front">
        <div>
          <p class="study-card-label">Question</p>
          <p class="study-card-content">${card.question}</p>
        </div>
      </div>
      <div class="study-card-face study-card-back">
        <div>
          <p class="study-card-label">Answer</p>
          <p class="study-card-content">${card.answer}</p>
        </div>
      </div>
    </div>
  `;

  studyState.isFlipped = false;
  studyCard.classList.remove('is-flipped');
  studyCard.focus();
}

function flipStudyCard() {
  if (!studyState) return;

  const studyCard = document.getElementById('study-card');
  studyState.isFlipped = !studyState.isFlipped;
  studyCard.classList.toggle('is-flipped');
}

function nextStudyCard() {
  if (!studyState) return;

  if (studyState.currentIndex < studyState.cards.length - 1) {
    studyState.currentIndex++;
    renderStudyCard();
  }
}

function prevStudyCard() {
  if (!studyState) return;

  if (studyState.currentIndex > 0) {
    studyState.currentIndex--;
    renderStudyCard();
  }
}

function handleStudyKeydown(event) {
  if (event.key === 'Escape') {
    exitStudyMode();
    return;
  }

  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    flipStudyCard();
    return;
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    nextStudyCard();
    return;
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    prevStudyCard();
    return;
  }
}

function resetCardForm() {
  if (!cardForm) return;
  cardForm.reset();
  cardIdInput.value = '';
  cardSubmitButton.textContent = 'Save Card';
  cardCancelButton.classList.add('hidden');
}

function startEditCard(card) {
  if (!cardForm || !card) return;
  cardQuestionInput.value = card.question;
  cardAnswerInput.value = card.answer;
  cardIdInput.value = card.id;
  cardSubmitButton.textContent = 'Update Card';
  cardCancelButton.classList.remove('hidden');
  cardQuestionInput.focus();
}

function handleDeckListClick(event) {
  const editButton = event.target.closest('.deck-edit');
  const deleteButton = event.target.closest('.deck-delete');
  const deckItem = event.target.closest('[data-deck-id]');
  if (!deckItem) return;

  const deckId = deckItem.dataset.deckId;
  const deck = decks.find((item) => item.id === deckId);
  if (!deck) return;

  if (editButton) {
    const newName = window.prompt('Rename deck', deck.name);
    if (newName !== null) {
      updateDeck(deckId, newName);
    }
  }

  if (deleteButton) {
    const confirmed = window.confirm(`Delete deck "${deck.name}"?`);
    if (confirmed) {
      deleteDeck(deckId);
    }
  }

  if (!editButton && !deleteButton) {
    enterStudyMode(deckId);
  }
}

function handleDeckListKeydown(event) {
  const deckItem = event.target.closest('[data-deck-id]');
  if (!deckItem) return;

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    const deckId = deckItem.dataset.deckId;
    enterStudyMode(deckId);
  }
}

function handleCardListClick(event) {
  const cardToggle = event.target.closest('.card-toggle');
  const cardEdit = event.target.closest('.card-edit');
  const cardDelete = event.target.closest('.card-delete');
  const cardItem = event.target.closest('[data-card-id]');
  if (!cardItem) return;

  const cardId = cardItem.dataset.cardId;
  const card = cards.find((item) => item.id === cardId);
  if (!card) return;

  if (cardToggle) {
    const cardElement = cardItem.querySelector('.card');
    cardElement.classList.toggle('is-flipped');
    return;
  }

  if (cardEdit) {
    startEditCard(card);
    return;
  }

  if (cardDelete) {
    const confirmed = window.confirm(`Delete card "${card.question}"?`);
    if (confirmed) {
      deleteCard(cardId);
    }
  }
}

if (modalOverlay) {
  openModalButtons.forEach((button) => button.addEventListener('click', openModal));
  closeModalButtons.forEach((button) => button.addEventListener('click', closeModal));
  modalOverlay.addEventListener('click', handleOverlayClick);
}

if (deckForm) {
  deckForm.addEventListener('submit', (event) => {
    event.preventDefault();
    addDeck(deckNameInput.value);
    deckForm.reset();
    deckNameInput.focus();
  });
}

if (deckList) {
  deckList.addEventListener('click', handleDeckListClick);
  deckList.addEventListener('keydown', handleDeckListKeydown);
}

if (cardForm) {
  cardForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (cardIdInput.value) {
      updateCard(cardIdInput.value, cardQuestionInput.value, cardAnswerInput.value);
    } else {
      addCard(cardQuestionInput.value, cardAnswerInput.value);
    }

    resetCardForm();
  });
}

if (cardCancelButton) {
  cardCancelButton.addEventListener('click', resetCardForm);
}

if (cardList) {
  cardList.addEventListener('click', handleCardListClick);
}

const studyExitButton = document.getElementById('study-exit');
const studyNextButton = document.getElementById('study-next');
const studyPrevButton = document.getElementById('study-prev');
const studyCardElement = document.getElementById('study-card');
const cardSearchInput = document.getElementById('card-search');

if (studyExitButton) {
  studyExitButton.addEventListener('click', exitStudyMode);
}

if (studyNextButton) {
  studyNextButton.addEventListener('click', nextStudyCard);
}

if (studyPrevButton) {
  studyPrevButton.addEventListener('click', prevStudyCard);
}

if (studyCardElement) {
  studyCardElement.addEventListener('click', flipStudyCard);
}

if (cardSearchInput) {
  cardSearchInput.addEventListener('input', handleSearchInput);
}

renderDecks();
renderCards();
