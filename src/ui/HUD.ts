import type { PoseStatus } from '../systems/PoseControls';

export class HUD {
  private readonly root: HTMLElement;
  private readonly healthFillP1: HTMLElement;
  private readonly healthFillP2: HTMLElement;
  private readonly timerLabel: HTMLElement;
  private readonly roundsP1: HTMLElement;
  private readonly roundsP2: HTMLElement;
  private readonly fpsLabel: HTMLElement;
  private readonly pauseOverlay: HTMLElement;
  private readonly statusLabel: HTMLElement;
  private readonly videoWrapper: HTMLElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'hud';
    parent.appendChild(this.root);

    const bars = document.createElement('div');
    bars.className = 'bars';
    this.root.appendChild(bars);

    const nameP1 = document.createElement('div');
    nameP1.className = 'name';
    nameP1.textContent = 'Quetzal Knight';

    const nameP2 = document.createElement('div');
    nameP2.className = 'name';
    nameP2.textContent = 'Jaguar Brawler';

    this.healthFillP1 = document.createElement('div');
    this.healthFillP1.className = 'health-fill';
    const healthP1 = document.createElement('div');
    healthP1.className = 'health';
    healthP1.appendChild(this.healthFillP1);

    this.healthFillP2 = document.createElement('div');
    this.healthFillP2.className = 'health-fill';
    const healthP2 = document.createElement('div');
    healthP2.className = 'health';
    healthP2.appendChild(this.healthFillP2);

    this.timerLabel = document.createElement('div');
    this.timerLabel.className = 'timer';
    this.timerLabel.textContent = '99';

    bars.appendChild(nameP1);
    bars.appendChild(healthP1);
    bars.appendChild(this.timerLabel);
    bars.appendChild(healthP2);
    bars.appendChild(nameP2);

    this.roundsP1 = document.createElement('div');
    this.roundsP1.className = 'rounds';
    this.roundsP2 = document.createElement('div');
    this.roundsP2.className = 'rounds';

    const roundsRow = document.createElement('div');
    roundsRow.className = 'bars';
    roundsRow.appendChild(this.roundsP1);
    const status = document.createElement('div');
    status.className = 'name';
    status.textContent = 'POSE: INIT';
    roundsRow.appendChild(status);
    this.statusLabel = status;
    roundsRow.appendChild(this.roundsP2);
    this.root.appendChild(roundsRow);

    this.fpsLabel = document.createElement('div');
    this.fpsLabel.className = 'fps';
    this.root.appendChild(this.fpsLabel);

    this.pauseOverlay = document.createElement('div');
    this.pauseOverlay.className = 'pause';
    this.pauseOverlay.textContent = 'PAUSED';
    this.pauseOverlay.style.display = 'none';
    this.root.appendChild(this.pauseOverlay);

    this.videoWrapper = document.createElement('div');
    this.videoWrapper.className = 'video-preview';
    this.videoWrapper.style.display = 'none';
    this.root.appendChild(this.videoWrapper);
  }

  attachVideo(video: HTMLVideoElement): void {
    this.videoWrapper.innerHTML = '';
    this.videoWrapper.appendChild(video);
    this.videoWrapper.style.display = 'block';
  }

  updateHealth(p1: number, p2: number): void {
    this.healthFillP1.style.width = `${p1}%`;
    this.healthFillP2.style.width = `${p2}%`;
  }

  updateTimer(time: number): void {
    this.timerLabel.textContent = time.toString().padStart(2, '0');
  }

  updateRounds(p1: number, p2: number): void {
    const updateDots = (container: HTMLElement, count: number) => {
      container.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'round-dot' + (i < count ? ' active' : '');
        container.appendChild(dot);
      }
    };
    updateDots(this.roundsP1, p1);
    updateDots(this.roundsP2, p2);
  }

  setPaused(paused: boolean): void {
    this.pauseOverlay.style.display = paused ? 'block' : 'none';
  }

  setPoseStatus(status: PoseStatus): void {
    const label = status === 'active' ? 'TRACKING' : status === 'camera-blocked' ? 'BLOCKED' : 'OFF';
    this.statusLabel.textContent = `POSE: ${label}`;
  }

  setFPS(fps: number): void {
    this.fpsLabel.textContent = `${fps.toFixed(0)} FPS`;
  }
}
