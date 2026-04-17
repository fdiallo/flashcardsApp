/**
 * Storage helpers for flashcards app
 * Includes versioning and safe parse fallback
 */

const STORAGE_KEY = 'flashcards-state';
const STORAGE_VERSION = 1;

/**
 * Load state from localStorage with versioning and fallback
 * @returns {Object} Parsed state or empty default
 */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultState();
    }

    const parsed = JSON.parse(raw);

    // Validate version
    if (parsed.version !== STORAGE_VERSION) {
      console.warn(`Storage version mismatch. Expected ${STORAGE_VERSION}, got ${parsed.version}`);
      return migrateState(parsed);
    }

    return parsed;
  } catch (error) {
    console.error('Failed to parse stored state:', error);
    return getDefaultState();
  }
}

/**
 * Save state to localStorage with version
 * @param {Object} state - The state to save
 * @returns {boolean} True if save succeeded
 */
function saveState(state) {
  try {
    const payload = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      ...state,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
    } else {
      console.error('Failed to save state:', error);
    }
    return false;
  }
}

/**
 * Migration function for handling version changes
 * @param {Object} oldState - The old state
 * @returns {Object} Migrated state
 */
function migrateState(oldState) {
  const newState = getDefaultState();

  // Version 0 -> Version 1: no changes yet, just return default
  if (!oldState.version || oldState.version < STORAGE_VERSION) {
    return newState;
  }

  return oldState;
}

/**
 * Get default state structure
 * @returns {Object} Default state
 */
function getDefaultState() {
  return {
    version: STORAGE_VERSION,
    decks: [],
    cards: [],
    timestamp: Date.now(),
  };
}

/**
 * Clear all stored state
 */
function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear state:', error);
    return false;
  }
}
