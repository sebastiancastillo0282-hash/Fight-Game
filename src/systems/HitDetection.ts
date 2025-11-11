import type { Character } from '../characters/Character';
import { capsuleDistance } from '../utils/math';

export interface HitEvent {
  attacker: Character;
  defender: Character;
  damage: number;
}

export class HitDetection {
  private readonly lastHitSignature = new WeakMap<Character, Map<Character, string>>();

  resolve(attacker: Character, defender: Character, notify: (event: HitEvent) => void): void {
    const signature = attacker.getAttackSignature();
    if (!signature) return;

    let perTarget = this.lastHitSignature.get(attacker);
    if (!perTarget) {
      perTarget = new Map();
      this.lastHitSignature.set(attacker, perTarget);
    }
    if (perTarget.get(defender) === signature) return;

    const hitboxes = attacker.getHitboxes();
    if (!hitboxes.length) return;

    const hurt = defender.getHurtCapsule();
    for (const hitbox of hitboxes) {
      const distance = capsuleDistance(hitbox.start, hitbox.end, hitbox.radius, hurt.start, hurt.end, hurt.radius);
      if (distance <= 0) {
        const direction = Math.sign(defender.position.x - attacker.position.x) || 1;
        defender.receiveHit(hitbox, direction);
        perTarget.set(defender, signature);
        notify({ attacker, defender, damage: hitbox.damage });
        break;
      }
    }
  }

  reset(): void {
    this.lastHitSignature.clear();
  }
}
