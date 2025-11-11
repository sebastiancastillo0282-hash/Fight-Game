import { Group, Mesh, Vector3 } from 'three';
import { StateMachine, CharacterState } from '../systems/StateMachine';
import { clamp } from '../utils/math';

export type CharacterInput = {
  walk: -1 | 0 | 1;
  block: boolean;
  punch: boolean;
  kick: boolean;
};

export interface AttackWindow {
  start: number;
  end: number;
  radius: number;
  offsetStart: Vector3;
  offsetEnd: Vector3;
  damage: number;
  knockback: number;
  stun: number;
}

export interface MoveDefinition {
  state: Extract<CharacterState, 'punch' | 'kick'>;
  startup: number;
  recovery: number;
  windows: AttackWindow[];
}

export interface CharacterStats {
  speed: number;
  punchDamage: number;
  kickDamage: number;
  blockEfficiency: number;
  mass: number;
}

export interface HitCapsule {
  start: Vector3;
  end: Vector3;
  radius: number;
  damage: number;
  knockback: number;
  stun: number;
}

const WALK_ACCEL = 14;
const GROUND_FRICTION = 22;

export abstract class Character extends Group {
  readonly stateMachine = new StateMachine();
  readonly velocity = new Vector3();
  readonly facing = new Vector3(1, 0, 0);
  readonly hurtHeight = 1.7;
  health = 100;
  roundsWon = 0;
  invulnerable = false;

  protected input: CharacterInput = { walk: 0, block: false, punch: false, kick: false };
  protected blockActive = false;
  protected currentMove?: MoveDefinition;
  protected currentWindowIndex = -1;
  protected windowTimer = 0;

  constructor(public readonly name: string, public readonly stats: CharacterStats, protected readonly meshes: Mesh[]) {
    super();
    this.meshes.forEach((mesh) => this.add(mesh));
  }

  abstract getMoves(): Record<'punch' | 'kick', MoveDefinition>;

  setInput(input: CharacterInput): void {
    this.input = input;
  }

  reset(position: Vector3): void {
    this.position.copy(position);
    this.velocity.set(0, 0, 0);
    this.stateMachine.enter('idle');
    this.health = 100;
    this.blockActive = false;
    this.currentMove = undefined;
    this.currentWindowIndex = -1;
    this.windowTimer = 0;
  }

  update(dt: number): void {
    this.stateMachine.update(dt);

    switch (this.stateMachine.state) {
      case 'idle':
      case 'walk':
        this.handleLocomotion(dt);
        this.tryStartActions();
        break;
      case 'block':
        this.blockActive = true;
        if (!this.input.block) {
          this.stateMachine.enter('idle');
          this.blockActive = false;
        }
        break;
      case 'punch':
      case 'kick':
        this.updateAttack(dt);
        break;
      case 'stun':
        this.velocity.set(0, 0, 0);
        if (this.stateMachine.isFinished()) {
          this.stateMachine.enter('idle');
        }
        break;
      case 'ko':
        this.velocity.set(0, 0, 0);
        break;
    }

    this.position.addScaledVector(this.velocity, dt);
    this.position.x = clamp(this.position.x, -6.5, 6.5);
  }

  getHitboxes(): HitCapsule[] {
    if (!this.currentMove) return [];
    if (this.currentWindowIndex < 0 || this.currentWindowIndex >= this.currentMove.windows.length) return [];
    const window = this.currentMove.windows[this.currentWindowIndex];
    const dir = Math.sign(this.facing.x) || 1;
    return [
      {
        start: window.offsetStart.clone().multiplyScalar(dir).add(this.position),
        end: window.offsetEnd.clone().multiplyScalar(dir).add(this.position),
        radius: window.radius,
        damage: window.damage,
        knockback: window.knockback,
        stun: window.stun
      }
    ];
  }

  isBlocking(): boolean {
    return this.blockActive;
  }

  receiveHit(hit: HitCapsule, direction: number): void {
    let damage = hit.damage;
    let knockback = hit.knockback;
    if (this.blockActive) {
      damage *= 1 - this.stats.blockEfficiency;
      knockback *= 0.35;
    }
    this.health = clamp(this.health - damage, 0, 100);
    if (this.health <= 0) {
      this.stateMachine.enter('ko');
      this.velocity.set(0, 0, 0);
    } else {
      this.stateMachine.enter('stun', hit.stun);
      this.velocity.x = (knockback * direction) / this.stats.mass;
    }
  }

  getHurtCapsule(): HitCapsule {
    return {
      start: new Vector3(this.position.x, 0.2, this.position.z),
      end: new Vector3(this.position.x, this.hurtHeight, this.position.z),
      radius: 0.35,
      damage: 0,
      knockback: 0,
      stun: 0
    };
  }

  getAttackSignature(): string | null {
    if (!this.currentMove) return null;
    return `${this.currentMove.state}:${this.currentWindowIndex}`;
  }

  face(direction: number): void {
    const dir = Math.sign(direction) || 1;
    this.facing.x = dir;
    this.scale.x = dir;
  }

  private handleLocomotion(dt: number): void {
    const target = this.input.walk * this.stats.speed * 4;
    const accel = target - this.velocity.x;
    this.velocity.x += clamp(accel, -WALK_ACCEL, WALK_ACCEL) * dt;
    const friction = Math.sign(this.velocity.x) * Math.min(Math.abs(this.velocity.x), GROUND_FRICTION * dt);
    this.velocity.x -= friction;

    if (Math.abs(this.velocity.x) > 0.01) {
      if (this.stateMachine.state !== 'walk') {
        this.stateMachine.enter('walk');
      }
    } else {
      this.velocity.x = 0;
      if (this.stateMachine.state !== 'idle') {
        this.stateMachine.enter('idle');
      }
    }

    this.blockActive = false;
    if (this.input.block) {
      if (this.stateMachine.state !== 'block') {
        this.stateMachine.enter('block');
      }
      this.blockActive = true;
    }
  }

  private tryStartActions(): void {
    if (this.input.punch) {
      this.startMove('punch');
    } else if (this.input.kick) {
      this.startMove('kick');
    }
  }

  private startMove(type: 'punch' | 'kick'): void {
    this.currentMove = this.getMoves()[type];
    this.currentWindowIndex = -1;
    this.windowTimer = 0;
    this.stateMachine.enter(this.currentMove.state, this.currentMove.startup + this.currentMove.recovery);
  }

  private updateAttack(dt: number): void {
    if (!this.currentMove) return;
    this.windowTimer += dt;
    let newIndex = -1;
    for (let i = 0; i < this.currentMove.windows.length; i++) {
      const window = this.currentMove.windows[i];
      if (this.windowTimer >= window.start && this.windowTimer <= window.end) {
        newIndex = i;
        break;
      }
    }
    this.currentWindowIndex = newIndex;

    if (this.stateMachine.isFinished()) {
      this.stateMachine.enter('idle');
      this.currentMove = undefined;
      this.currentWindowIndex = -1;
      this.windowTimer = 0;
    }
  }
}
