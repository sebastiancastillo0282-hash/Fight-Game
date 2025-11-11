import {
  ACESFilmicToneMapping,
  Color,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  WebGLRenderer
} from 'three';

export interface WorldResources {
  scene: Scene;
  renderer: WebGLRenderer;
  camera: PerspectiveCamera;
  arena: Mesh;
}

export function createWorld(canvas: HTMLCanvasElement): WorldResources {
  const scene = new Scene();
  scene.background = new Color(0x06121f);

  const renderer = new WebGLRenderer({ antialias: true, canvas });
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const camera = new PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 3.5, 12);

  const arenaMaterial = new MeshStandardMaterial({ color: 0x1b2a38, roughness: 0.8, metalness: 0.05 });
  const arena = new Mesh(new PlaneGeometry(20, 10, 1, 1), arenaMaterial);
  arena.rotation.x = -Math.PI / 2;
  arena.receiveShadow = false;
  arena.position.y = 0;
  scene.add(arena);

  const boundsMaterial = new MeshStandardMaterial({ color: 0x101d28, transparent: true, opacity: 0.0 });
  const bounds = new Mesh(new PlaneGeometry(20, 5), boundsMaterial);
  bounds.position.set(0, 1.5, -2.5);
  scene.add(bounds);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, renderer, camera, arena };
}
