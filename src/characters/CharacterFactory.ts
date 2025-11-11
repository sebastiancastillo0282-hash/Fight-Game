import { QuetzalKnight } from './QuetzalKnight';
import { JaguarBrawler } from './JaguarBrawler';
import type { Character } from './Character';

export function createCharacters(): [Character, Character] {
  const p1 = new QuetzalKnight();
  p1.position.set(-2, 0, 0);
  const p2 = new JaguarBrawler();
  p2.position.set(2, 0, 0);
  return [p1, p2];
}
