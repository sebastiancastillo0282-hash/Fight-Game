import type { InputEvent, PlayerAction } from '../types/Actions';

type Listener = (event: InputEvent) => void;

export class InputBus {
  private listeners: Map<PlayerAction, Set<Listener>> = new Map();
  private anyListeners: Set<Listener> = new Set();

  on(action: PlayerAction, listener: Listener): () => void {
    if (!this.listeners.has(action)) {
      this.listeners.set(action, new Set());
    }
    const bucket = this.listeners.get(action)!;
    bucket.add(listener);
    return () => bucket.delete(listener);
  }

  onAny(listener: Listener): () => void {
    this.anyListeners.add(listener);
    return () => this.anyListeners.delete(listener);
  }

  emit(action: PlayerAction, pressed: boolean): void {
    const event: InputEvent = { type: action, pressed };
    const specific = this.listeners.get(action);
    if (specific) {
      for (const listener of specific) listener(event);
    }
    for (const listener of this.anyListeners) listener(event);
  }

  clear(): void {
    this.listeners.clear();
    this.anyListeners.clear();
  }
}
