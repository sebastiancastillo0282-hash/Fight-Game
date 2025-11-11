import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3
} from 'three';
import { Character, MoveDefinition } from './Character';

const obsidian = new MeshStandardMaterial({ color: 0x181818, roughness: 0.7, metalness: 0.2 });
const glyph = new MeshStandardMaterial({ color: 0xf4b93f, emissive: 0x3c2500, emissiveIntensity: 0.5 });

function createMeshes(): Mesh[] {
  const torso = new Mesh(new BoxGeometry(1.0, 1.3, 0.5), obsidian);
  torso.position.y = 1.6;

  const head = new Mesh(new SphereGeometry(0.4, 10, 6), obsidian);
  head.position.y = 2.5;

  const earL = new Mesh(new ConeGeometry(0.18, 0.4, 4), glyph);
  earL.rotation.z = Math.PI;
  earL.position.set(-0.25, 2.8, 0);
  const earR = earL.clone();
  earR.position.x *= -1;

  const armL = new Mesh(new CylinderGeometry(0.18, 0.14, 0.9, 5), obsidian);
  armL.position.set(-0.6, 1.3, 0);

  const armR = armL.clone();
  armR.position.x *= -1;
  armR.material = glyph;

  const legL = new Mesh(new CylinderGeometry(0.2, 0.18, 1.0, 5), obsidian);
  legL.position.set(-0.3, 0.6, 0);

  const legR = legL.clone();
  legR.position.x *= -1;

  const runes = new Mesh(new CylinderGeometry(0.4, 0.38, 0.2, 6), glyph);
  runes.position.y = 1.1;

  return [torso, head, earL, earR, armL, armR, legL, legR, runes];
}

const PUNCH_WINDOW = {
  start: 0.18,
  end: 0.32,
  radius: 0.35,
  offsetStart: new Vector3(0.35, 1.5, 0),
  offsetEnd: new Vector3(0.9, 1.45, 0),
  damage: 10,
  knockback: 3.2,
  stun: 0.4
};

const KICK_WINDOW = {
  start: 0.28,
  end: 0.52,
  radius: 0.4,
  offsetStart: new Vector3(0.3, 0.9, 0),
  offsetEnd: new Vector3(1.5, 0.9, 0),
  damage: 16,
  knockback: 4.0,
  stun: 0.55
};

export class JaguarBrawler extends Character {
  private readonly moves: Record<'punch' | 'kick', MoveDefinition>;

  constructor() {
    super(
      'Jaguar Brawler',
      { speed: 0.9, punchDamage: 10, kickDamage: 16, blockEfficiency: 0.6, mass: 1.1 },
      createMeshes()
    );

    this.moves = {
      punch: {
        state: 'punch',
        startup: 0.32,
        recovery: 0.4,
        windows: [PUNCH_WINDOW]
      },
      kick: {
        state: 'kick',
        startup: 0.5,
        recovery: 0.6,
        windows: [KICK_WINDOW]
      }
    };
  }

  getMoves(): Record<'punch' | 'kick', MoveDefinition> {
    return this.moves;
  }
}
