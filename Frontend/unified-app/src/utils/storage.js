const memoryStore = new Map();
const sessionMemoryStore = new Map();

const canUseLocalStorage = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

const safeStorage = {
  getItem(key) {
    try {
      if (canUseLocalStorage()) {
        return window.localStorage.getItem(key);
      }
    } catch (error) {
      // Fall back to in-memory storage
    }
    return memoryStore.has(key) ? memoryStore.get(key) : null;
  },
  setItem(key, value) {
    try {
      if (canUseLocalStorage()) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (error) {
      // Fall back to in-memory storage
    }
    memoryStore.set(key, value);
  },
  removeItem(key) {
    try {
      if (canUseLocalStorage()) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (error) {
      // Fall back to in-memory storage
    }
    memoryStore.delete(key);
  },
  clear() {
    try {
      if (canUseLocalStorage()) {
        window.localStorage.clear();
        return;
      }
    } catch (error) {
      // Fall back to in-memory storage
    }
    memoryStore.clear();
  },
  isPersistent() {
    return canUseLocalStorage();
  }
};

const canUseSessionStorage = () => {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return false;
    }
    const testKey = '__session_storage_test__';
    window.sessionStorage.setItem(testKey, '1');
    window.sessionStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

export const safeSessionStorage = {
  getItem(key) {
    try {
      if (canUseSessionStorage()) {
        return window.sessionStorage.getItem(key);
      }
    } catch (error) {
      // Fall back to in-memory storage
    }
    return sessionMemoryStore.has(key) ? sessionMemoryStore.get(key) : null;
  },
  setItem(key, value) {
    try {
      if (canUseSessionStorage()) {
        window.sessionStorage.setItem(key, value);
        return;
      }
    } catch (error) {
      // Fall back to in-memory storage
    }
    sessionMemoryStore.set(key, value);
  },
  removeItem(key) {
    try {
      if (canUseSessionStorage()) {
        window.sessionStorage.removeItem(key);
        return;
      }
    } catch (error) {
      // Fall back to in-memory storage
    }
    sessionMemoryStore.delete(key);
  },
  clear() {
    try {
      if (canUseSessionStorage()) {
        window.sessionStorage.clear();
        return;
      }
    } catch (error) {
      // Fall back to in-memory storage
    }
    sessionMemoryStore.clear();
  },
  isPersistent() {
    return canUseSessionStorage();
  }
};

export default safeStorage;
