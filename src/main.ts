import './style.css';
import { Vector3 } from 'three';
import { createWorld } from './world/Scene';
import { setupLighting } from './world/Lighting';
import { createCharacters } from './characters/CharacterFactory';
import { CameraRig } from './world/CameraRig';
import { InputBus } from './systems/InputBus';
import { KeyboardControls } from './systems/KeyboardControls';
import { PoseControls } from './systems/PoseControls';
import { GameLoop } from './systems/Loop';
import { HitDetection } from './systems/HitDetection';
import { HUD } from './ui/HUD';
import type { CharacterInput } from './characters/Character';
import type { PlayerId } from './types/Actions';

const app = document.getElementById('app')!;
const canvas = document.createElement('canvas');
app.appendChild(canvas);

const video = document.createElement('video');
video.autoplay = true;
video.muted = true;
video.playsInline = true;
video.style.transform = 'scaleX(-1)';

const hud = new HUD(app);
hud.attachVideo(video);

const { scene, renderer, camera } = createWorld(canvas);
setupLighting(scene);

const [player1, player2] = createCharacters();
scene.add(player1);
scene.add(player2);

const inputBus = new InputBus();
const keyboardP1 = new KeyboardControls(inputBus, 1);
const keyboardP2 = new KeyboardControls(inputBus, 2);
keyboardP1.attach();
keyboardP2.attach();
keyboardP1.setEnabled(false);

const poseControls = new PoseControls(inputBus);
poseControls.onStatusChange((status) => {
  hud.setPoseStatus(status);
  keyboardP1.setEnabled(status !== 'active');
});

poseControls
  .init(video)
  .catch(() => {
    hud.setPoseStatus('inactive');
    keyboardP1.setEnabled(true);
  });

const cameraRig = new CameraRig(camera);
const loop = new GameLoop({ fixedUpdate, render });
const hitDetection = new HitDetection();

const playerInputs: Record<PlayerId, {
  walkLeft: boolean;
  walkRight: boolean;
  block: boolean;
  punchQueued: boolean;
  kickQueued: boolean;
}> = {
  1: { walkLeft: false, walkRight: false, block: false, punchQueued: false, kickQueued: false },
  2: { walkLeft: false, walkRight: false, block: false, punchQueued: false, kickQueued: false }
};

let paused = false;
let timer = 99;
let rounds: Record<PlayerId, number> = { 1: 0, 2: 0 };
let lastFpsUpdate = performance.now();
let fps = 60;
let frameAccumulator = 0;
let frameCount = 0;

hud.updateRounds(0, 0);
hud.updateHealth(player1.health, player2.health);
hud.updateTimer(timer);

inputBus.onAny((event) => {
  const { type, pressed } = event;
  if (type.endsWith('WALK_LEFT')) {
    const player = type.startsWith('P1') ? 1 : 2;
    playerInputs[player].walkLeft = pressed;
  } else if (type.endsWith('WALK_RIGHT')) {
    const player = type.startsWith('P1') ? 1 : 2;
    playerInputs[player].walkRight = pressed;
  } else if (type.endsWith('BLOCK_DOWN')) {
    const player = type.startsWith('P1') ? 1 : 2;
    playerInputs[player].block = pressed;
  } else if (type.endsWith('BLOCK_UP')) {
    const player = type.startsWith('P1') ? 1 : 2;
    if (!pressed) playerInputs[player].block = false;
  } else if (type.endsWith('PUNCH')) {
    if (pressed) {
      const player = type.startsWith('P1') ? 1 : 2;
      playerInputs[player].punchQueued = true;
    }
  } else if (type.endsWith('KICK')) {
    if (pressed) {
      const player = type.startsWith('P1') ? 1 : 2;
      playerInputs[player].kickQueued = true;
    }
  } else if (type.endsWith('PAUSE_TOGGLE') && pressed) {
    paused = !paused;
    hud.setPaused(paused);
  }
});

function consumeInput(player: PlayerId): CharacterInput {
  const state = playerInputs[player];
  const walk = (state.walkRight ? 1 : 0) - (state.walkLeft ? 1 : 0);
  const input: CharacterInput = {
    walk: (walk < -1 ? -1 : walk > 1 ? 1 : (walk as -1 | 0 | 1)),
    block: state.block,
    punch: state.punchQueued,
    kick: state.kickQueued
  };
  state.punchQueued = false;
  state.kickQueued = false;
  return input;
}

function resetRound(winner: PlayerId | null): void {
  timer = 99;
  hitDetection.reset();
  player1.reset(new Vector3(-2, 0, 0));
  player2.reset(new Vector3(2, 0, 0));
  player1.face(1);
  player2.face(-1);
  if (winner) {
    rounds[winner] += 1;
    if (rounds[winner] >= 2) {
      rounds = { 1: 0, 2: 0 };
    }
    hud.updateRounds(rounds[1], rounds[2]);
  }
  hud.updateHealth(player1.health, player2.health);
  hud.updateTimer(timer);
}

function fixedUpdate(dt: number): void {
  poseControls.update(dt);

  if (!paused) {
    timer = Math.max(0, timer - dt);
    if (timer === 0) {
      const winner = player1.health > player2.health ? 1 : player2.health > player1.health ? 2 : null;
      resetRound(winner);
    }
  }

  const input1 = consumeInput(1);
  const input2 = consumeInput(2);
  player1.setInput(input1);
  player2.setInput(input2);

  player1.update(dt);
  player2.update(dt);

  const direction = Math.sign(player2.position.x - player1.position.x) || 1;
  player1.face(direction);
  player2.face(-direction);

  if (!paused) {
    hitDetection.resolve(player1, player2, () => {});
    hitDetection.resolve(player2, player1, () => {});
  }

  if (!paused && (player1.stateMachine.state === 'ko' || player2.stateMachine.state === 'ko')) {
    const winner = player1.stateMachine.state === 'ko' ? 2 : 1;
    resetRound(winner);
  }

  cameraRig.update(player1, player2, dt);
  hud.updateHealth(player1.health, player2.health);
  hud.updateTimer(Math.round(timer));
}

function render(_alpha: number): void {
  renderer.render(scene, camera);
  const now = performance.now();
  const delta = now - lastFpsUpdate;
  frameAccumulator += delta;
  frameCount++;
  if (frameAccumulator >= 500) {
    fps = 1000 / (frameAccumulator / frameCount);
    hud.setFPS(fps);
    frameAccumulator = 0;
    frameCount = 0;
  }
  lastFpsUpdate = now;
}

loop.start();
