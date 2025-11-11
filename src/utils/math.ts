import { Vector3 } from 'three';

export const tmp = {
  v1: new Vector3(),
  v2: new Vector3(),
  v3: new Vector3()
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

export function damp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export function angleBetween(a: Vector3, b: Vector3): number {
  const dot = clamp(a.dot(b) / (a.length() * b.length() || 1), -1, 1);
  return Math.acos(dot);
}

export function projectOnPlane(vector: Vector3, normal: Vector3, out: Vector3): Vector3 {
  out.copy(vector).add(tmp.v1.copy(normal).multiplyScalar(-vector.dot(normal)));
  return out;
}

export function signedAngleXZ(from: Vector3, to: Vector3): number {
  const angle = Math.atan2(to.z, to.x) - Math.atan2(from.z, from.x);
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export function capsuleDistance(
  aStart: Vector3,
  aEnd: Vector3,
  aRadius: number,
  bStart: Vector3,
  bEnd: Vector3,
  bRadius: number
): number {
  const p = closestSegmentPoints(aStart, aEnd, bStart, bEnd, tmp.v1, tmp.v2);
  return Math.max(0, p.distanceTo(tmp.v2) - (aRadius + bRadius));
}

function closestSegmentPoints(
  p1: Vector3,
  q1: Vector3,
  p2: Vector3,
  q2: Vector3,
  out1: Vector3,
  out2: Vector3
): Vector3 {
  const d1 = tmp.v3.copy(q1).sub(p1);
  const d2 = tmp.v1.copy(q2).sub(p2);
  const r = tmp.v2.copy(p1).sub(p2);
  const a = d1.dot(d1);
  const e = d2.dot(d2);
  const f = d2.dot(r);
  let s = 0;
  let t = 0;
  const c = d1.dot(r);
  const b = d1.dot(d2);
  const denom = a * e - b * b;
  if (denom !== 0) {
    s = clamp((b * f - c * e) / denom, 0, 1);
  }
  t = (b * s + f) / e;
  if (t < 0) {
    t = 0;
    s = clamp(-c / a, 0, 1);
  } else if (t > 1) {
    t = 1;
    s = clamp((b - c) / a, 0, 1);
  }
  out1.copy(d1).multiplyScalar(s).add(p1);
  out2.copy(d2).multiplyScalar(t).add(p2);
  return out1;
}
