export class Storage {
  private storage: typeof localStorage | typeof sessionStorage;

  constructor(type: 'local' | 'session' = 'local') {
    this.storage = type === 'local' ? localStorage : sessionStorage;
  }

  get<T>(key: string): T | null {
    const item = this.storage.getItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    this.storage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    this.storage.removeItem(key);
  }

  clear(): void {
    this.storage.clear();
  }
} 