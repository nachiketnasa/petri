import '@testing-library/jest-dom/vitest';

// jsdom doesn't reliably provide `window.localStorage` under every Node
// version (it can come back `undefined` depending on how Node's own
// experimental Web Storage global interacts with jsdom's). The app code
// already treats a missing/throwing localStorage as a soft failure, but
// tests that actually exercise persistence need a real implementation —
// so install a minimal in-memory one when jsdom hasn't provided its own.
if (typeof window !== 'undefined' && !window.localStorage) {
  class MemoryStorage implements Storage {
    private store = new Map<string, string>();
    get length() {
      return this.store.size;
    }
    clear() {
      this.store.clear();
    }
    getItem(key: string) {
      return this.store.has(key) ? this.store.get(key)! : null;
    }
    key(index: number) {
      return Array.from(this.store.keys())[index] ?? null;
    }
    removeItem(key: string) {
      this.store.delete(key);
    }
    setItem(key: string, value: string) {
      this.store.set(key, String(value));
    }
  }

  Object.defineProperty(window, 'localStorage', { value: new MemoryStorage(), configurable: true });
}
