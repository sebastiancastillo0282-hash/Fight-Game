import { AmbientLight, Color, DirectionalLight, HemisphereLight, Scene } from 'three';

export function setupLighting(scene: Scene): void {
  const ambient = new AmbientLight(new Color(0x152235), 0.4);
  scene.add(ambient);

  const hemi = new HemisphereLight(0x82d4ff, 0x09131f, 0.6);
  hemi.position.set(0, 8, 0);
  scene.add(hemi);

  const key = new DirectionalLight(0xffffff, 1.2);
  key.position.set(6, 6, 6);
  key.castShadow = false;
  scene.add(key);

  const rim = new DirectionalLight(0x3fbf6a, 0.7);
  rim.position.set(-8, 5, -6);
  scene.add(rim);
}
