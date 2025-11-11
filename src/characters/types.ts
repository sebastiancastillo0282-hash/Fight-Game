import { Vector3 } from 'three';
import type { CharacterState } from '../systems/StateMachine';

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
