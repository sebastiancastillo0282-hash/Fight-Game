import {
  BoxGeometry,
  CylinderGeometry,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3
} from 'three';
import { Character, MoveDefinition } from './Character';

const jade = new MeshStandardMaterial({ color: 0x3bbf7c, emissive: 0x0f2f1f, emissiveIntensity: 0.3 });
const ceramic = new MeshStandardMaterial({ color: 0xf4f4f8, roughness: 0.3, metalness: 0.1 });
const scarf = new MeshStandardMaterial({ color: 0x0da672, emissive: 0x1fbf82, emissiveIntensity: 0.4 });

function createMeshes(): Mesh[] {
  const torso = new Mesh(new BoxGeometry(0.9, 1.2, 0.4), ceramic);
  torso.position.y = 1.6;

  const head = new Mesh(new SphereGeometry(0.35, 12, 8), ceramic);
  head.position.y = 2.4;

  const shoulder = new Mesh(new CylinderGeometry(0.12, 0.12, 1.1, 6), jade);
  shoulder.rotation.z = Math.PI / 2;
  shoulder.position.y = 1.9;

  const scarfMesh = new Mesh(new BoxGeometry(0.2, 1.0, 0.05), scarf);
  scarfMesh.position.set(0.1, 2.1, -0.15);

  const armL = new Mesh(new CylinderGeometry(0.12, 0.1, 0.8, 6), ceramic);
  armL.position.set(-0.55, 1.4, 0);
  armL.rotation.z = Math.PI / 6;

  const armR = armL.clone();
  armR.position.x *= -1;
  armR.material = ceramic.clone();
  (armR.material as MeshStandardMaterial).emissive = jade.color.clone();
  (armR.material as MeshStandardMaterial).emissiveIntensity = 0.6;

  const legL = new Mesh(new CylinderGeometry(0.15, 0.12, 1.0, 6), jade);
  legL.position.set(-0.25, 0.6, 0);

  const legR = legL.clone();
  legR.position.x *= -1;
  legR.material = ceramic;

  return [torso, head, shoulder, scarfMesh, armL, armR, legL, legR];
}

const PUNCH_WINDOW = {
  start: 0.12,
  end: 0.24,
  radius: 0.3,
  offsetStart: new Vector3(0.4, 1.5, 0),
  offsetEnd: new Vector3(1.1, 1.6, 0),
  damage: 8,
  knockback: 2.4,
  stun: 0.3
};

const KICK_WINDOW = {
  start: 0.2,
  end: 0.4,
  radius: 0.35,
  offsetStart: new Vector3(0.4, 1.0, 0),
  offsetEnd: new Vector3(1.3, 1.0, 0),
  damage: 12,
  knockback: 3.6,
  stun: 0.45
};

export class QuetzalKnight extends Character {
  private readonly moves: Record<'punch' | 'kick', MoveDefinition>;

  constructor() {
    super(
      'Quetzal Knight',
      { speed: 1.1, punchDamage: 8, kickDamage: 12, blockEfficiency: 0.7, mass: 0.9 },
      createMeshes()
    );

    this.moves = {
      punch: {
        state: 'punch',
        startup: 0.3,
        recovery: 0.35,
        windows: [PUNCH_WINDOW]
      },
      kick: {
        state: 'kick',
        startup: 0.45,
        recovery: 0.5,
        windows: [KICK_WINDOW]
      }
    };
  }

  getMoves(): Record<'punch' | 'kick', MoveDefinition> {
    return this.moves;
  }
}
