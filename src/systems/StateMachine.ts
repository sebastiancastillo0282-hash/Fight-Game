export type CharacterState = 'idle' | 'walk' | 'block' | 'punch' | 'kick' | 'stun' | 'ko';

export interface StateConfig {
  name: CharacterState;
  duration: number;
  canMove?: boolean;
  cancelWindow?: number;
}

export class StateMachine {
  private current: CharacterState = 'idle';
  private elapsed = 0;
  private duration = Infinity;

  enter(state: CharacterState, duration = Infinity): void {
    this.current = state;
    this.duration = duration;
    this.elapsed = 0;
  }

  update(dt: number): void {
    this.elapsed += dt;
  }

  get state(): CharacterState {
    return this.current;
  }

  get progress(): number {
    if (this.duration === Infinity) return 0;
    return Math.min(1, this.elapsed / this.duration);
  }

  get time(): number {
    return this.elapsed;
  }

  isFinished(): boolean {
    return this.elapsed >= this.duration;
  }
}
