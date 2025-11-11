import { InputBus } from './InputBus';
import { PLAYER_ACTIONS, PlayerId } from '../types/Actions';

export interface KeyBinding {
  code: string;
  action: keyof typeof PLAYER_ACTIONS[1];
  onRelease?: keyof typeof PLAYER_ACTIONS[1];
}

const DEFAULT_BINDINGS: Record<PlayerId, KeyBinding[]> = {
  1: [
    { code: 'ArrowLeft', action: 'WALK_LEFT' },
    { code: 'ArrowRight', action: 'WALK_RIGHT' },
    { code: 'Numpad1', action: 'PUNCH' },
    { code: 'Numpad2', action: 'KICK' },
    { code: 'Numpad3', action: 'BLOCK_DOWN', onRelease: 'BLOCK_UP' },
    { code: 'KeyP', action: 'PAUSE_TOGGLE' }
  ],
  2: [
    { code: 'KeyA', action: 'WALK_LEFT' },
    { code: 'KeyD', action: 'WALK_RIGHT' },
    { code: 'KeyJ', action: 'PUNCH' },
    { code: 'KeyK', action: 'KICK' },
    { code: 'KeyL', action: 'BLOCK_DOWN', onRelease: 'BLOCK_UP' },
    { code: 'KeyP', action: 'PAUSE_TOGGLE' }
  ]
};

export class KeyboardControls {
  private enabled = true;
  private readonly map = new Map<string, KeyBinding>();

  constructor(private readonly bus: InputBus, private readonly player: PlayerId, bindings?: KeyBinding[]) {
    for (const binding of bindings ?? DEFAULT_BINDINGS[player]) {
      this.map.set(binding.code, binding);
    }
  }

  attach(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  detach(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (!this.enabled) return;
    const binding = this.map.get(event.code);
    if (!binding) return;
    event.preventDefault();
    this.bus.emit(PLAYER_ACTIONS[this.player][binding.action], true);
  };

  private onKeyUp = (event: KeyboardEvent) => {
    if (!this.enabled) return;
    const binding = this.map.get(event.code);
    if (!binding) return;
    event.preventDefault();
    const releaseAction = binding.onRelease ?? binding.action;
    this.bus.emit(PLAYER_ACTIONS[this.player][releaseAction], false);
  };
}
