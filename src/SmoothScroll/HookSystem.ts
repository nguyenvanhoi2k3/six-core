export class HookSystem {
  private events: Record<string, Array<(...args: any[]) => void>> = {};

  on(event: string, callback: (...args: any[]) => void): () => void {
    if (typeof callback !== 'function') {
      throw new Error(`Callback for event "${event}" must be a function`);
    }
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events[event];
    if (callbacks) {
      [...callbacks].forEach(cb => cb(...args));
    }
  }

  destroy(): void {
    this.events = Object.create(null);
  }
}