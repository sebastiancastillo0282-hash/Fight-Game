const STEP = 1 / 60;
const MAX_ACCUM = STEP * 5;

export type LoopCallbacks = {
  fixedUpdate: (dt: number) => void;
  render: (alpha: number) => void;
};

export class GameLoop {
  private accumulator = 0;
  private lastTime = 0;
  private running = false;
  private paused = false;

  constructor(private readonly callbacks: LoopCallbacks) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    const tick = (time: number) => {
      if (!this.running) return;
      const frameTime = Math.min((time - this.lastTime) / 1000, MAX_ACCUM);
      this.lastTime = time;

      if (!this.paused) {
        this.accumulator += frameTime;
        while (this.accumulator >= STEP) {
          this.callbacks.fixedUpdate(STEP);
          this.accumulator -= STEP;
        }
      }

      this.callbacks.render(this.accumulator / STEP);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  togglePause(): void {
    this.paused = !this.paused;
  }

  isPaused(): boolean {
    return this.paused;
  }
}
