export class EMAFilter {
  private value: number | null = null;

  constructor(private readonly smoothing: number) {}

  next(sample: number): number {
    if (this.value === null) {
      this.value = sample;
      return sample;
    }
    this.value = this.value + this.smoothing * (sample - this.value);
    return this.value;
  }

  get current(): number | null {
    return this.value;
  }
}

export class Vec3EMA {
  private readonly filters: [EMAFilter, EMAFilter, EMAFilter];

  constructor(private readonly smoothing: number) {
    this.filters = [new EMAFilter(smoothing), new EMAFilter(smoothing), new EMAFilter(smoothing)];
  }

  next(x: number, y: number, z: number): [number, number, number] {
    return [this.filters[0].next(x), this.filters[1].next(y), this.filters[2].next(z)];
  }
}

export class Hysteresis {
  private active = false;

  constructor(private readonly onThreshold: number, private readonly offThreshold: number) {}

  update(value: number): boolean {
    if (!this.active && value >= this.onThreshold) {
      this.active = true;
    } else if (this.active && value <= this.offThreshold) {
      this.active = false;
    }
    return this.active;
  }

  reset(): void {
    this.active = false;
  }
}

export class Cooldown {
  private remaining = 0;

  constructor(private readonly duration: number) {}

  update(dt: number): void {
    this.remaining = Math.max(0, this.remaining - dt);
  }

  ready(): boolean {
    return this.remaining <= 0;
  }

  trigger(): void {
    this.remaining = this.duration;
  }
}
