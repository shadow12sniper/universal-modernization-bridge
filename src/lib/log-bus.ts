type LogListener = (entry: string) => void;

class LogBus {
  private listeners: Set<LogListener> = new Set();

  /** Subscribe to log events. Returns an unsubscribe function. */
  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Push a new log entry to all listeners. */
  publish(entry: string): void {
    for (const listener of this.listeners) {
      try { listener(entry); } catch {}
    }
  }
}

// Singleton instance
export const logBus = new LogBus();