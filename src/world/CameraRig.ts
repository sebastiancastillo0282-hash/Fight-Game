import { PerspectiveCamera, Vector3 } from 'three';
import type { Character } from '../characters/Character';
import { clamp, damp } from '../utils/math';

const targetVec = new Vector3();

export class CameraRig {
  private focus = new Vector3(0, 1.5, 0);
  private distance = 12;

  constructor(private readonly camera: PerspectiveCamera) {}

  update(p1: Character, p2: Character, dt: number): void {
    targetVec.addVectors(p1.position, p2.position).multiplyScalar(0.5);
    this.focus.x = damp(this.focus.x, targetVec.x, 4, dt);
    this.focus.y = 1.6;

    const separation = Math.abs(p1.position.x - p2.position.x);
    const desiredDistance = clamp(10 + separation * 0.6, 10, 16);
    this.distance = damp(this.distance, desiredDistance, 2, dt);

    this.camera.position.set(this.focus.x, 3.8, this.distance);
    this.camera.lookAt(this.focus.x, 1.6, 0);
  }
}
