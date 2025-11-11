import { InputBus } from './InputBus';
import { PLAYER_ACTIONS } from '../types/Actions';
import { Cooldown, EMAFilter, Vec3EMA, Hysteresis } from '../utils/filters';

const RIGHT_WRIST = 16;
const RIGHT_SHOULDER = 12;
const RIGHT_HIP = 24;
const RIGHT_KNEE = 26;
const RIGHT_ANKLE = 28;
const LEFT_WRIST = 15;
const LEFT_SHOULDER = 11;
const LEFT_HIP = 23;
const LEFT_KNEE = 25;

const SAMPLE_INTERVAL = 1 / 30; // throttle mediapipe callbacks to ~30 fps

export type PoseStatus = 'inactive' | 'active' | 'camera-blocked';

export class PoseControls {
  private pose: any;
  private camera: any;
  private lastSampleTime = 0;
  private status: PoseStatus = 'inactive';
  private readonly leanFilter = new EMAFilter(0.5);
  private readonly wristVelocityFilter = new EMAFilter(0.4);
  private readonly kneeAngleFilter = new EMAFilter(0.4);
  private readonly hipAnchor = new Vec3EMA(0.4);
  private readonly punchCooldown = new Cooldown(0.6);
  private readonly kickCooldown = new Cooldown(0.9);
  private readonly blockHyst = new Hysteresis(0.12, 0.08);
  private readonly walkRightHyst = new Hysteresis(8, 4);
  private readonly walkLeftHyst = new Hysteresis(8, 4);
  private readonly listeners: Array<(status: PoseStatus) => void> = [];
  private lastPoseTimestamp = 0;
  private lastWristY = 0;

  constructor(private readonly bus: InputBus) {}

  async init(video: HTMLVideoElement): Promise<void> {
    try {
      const [{ Pose }, { Camera }] = await Promise.all([
        import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.mjs'),
        import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466861/camera_utils.mjs')
      ]);

      this.pose = new Pose({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`
      });

      this.pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
      });

      this.pose.onResults(this.onResults);

      this.camera = new Camera(video, {
        onFrame: async () => {
          await this.pose.send({ image: video });
        },
        width: 640,
        height: 480
      });

      await this.camera.start();
      this.status = 'active';
      this.emitStatus();
    } catch (error) {
      console.error('Failed to initialise MediaPipe Pose', error);
      this.setStatus('camera-blocked');
      throw error;
    }
  }

  update(dt: number): void {
    this.punchCooldown.update(dt);
    this.kickCooldown.update(dt);

    if (this.status === 'active' && performance.now() / 1000 - this.lastPoseTimestamp > 2) {
      this.setStatus('camera-blocked');
    }
  }

  onStatusChange(listener: (status: PoseStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.status);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) this.listeners.splice(index, 1);
    };
  }

  isActive(): boolean {
    return this.status === 'active';
  }

  private setStatus(status: PoseStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.emitStatus();
  }

  private emitStatus(): void {
    for (const listener of this.listeners) listener(this.status);
  }

  private onResults = (results: any) => {
    const now = performance.now() / 1000;
    if (now - this.lastSampleTime < SAMPLE_INTERVAL) return;
    this.lastSampleTime = now;

    const landmarks = results.poseWorldLandmarks ?? results.poseLandmarks;
    if (!landmarks) {
      this.setStatus('camera-blocked');
      return;
    }

    this.lastPoseTimestamp = now;
    this.setStatus('active');

    const rw = landmarks[RIGHT_WRIST];
    const rs = landmarks[RIGHT_SHOULDER];
    const rh = landmarks[RIGHT_HIP];
    const rk = landmarks[RIGHT_KNEE];
    const ra = landmarks[RIGHT_ANKLE];
    const lw = landmarks[LEFT_WRIST];
    const ls = landmarks[LEFT_SHOULDER];
    const lh = landmarks[LEFT_HIP];
    const lk = landmarks[LEFT_KNEE];

    if (!rw || !rs || !rh || !rk || !ra || !lw || !ls || !lh || !lk) return;

    const [hipX, hipY, hipZ] = this.hipAnchor.next((rh.x + lh.x) * 0.5, (rh.y + lh.y) * 0.5, (rh.z + lh.z) * 0.5);

    // Torso lean: project hip->shoulder onto horizontal plane and compare with world up
    const hipToShoulderX = ((rs.x + ls.x) * 0.5 - hipX);
    const hipToShoulderY = ((rs.y + ls.y) * 0.5 - hipY);
    const leanAngle = (Math.atan2(hipToShoulderX, hipToShoulderY) * 180) / Math.PI;
    const smoothedLean = this.leanFilter.next(leanAngle);

    const walkRight = this.walkRightHyst.update(smoothedLean - 6);
    const walkLeft = this.walkLeftHyst.update(-smoothedLean - 6);
    this.bus.emit(PLAYER_ACTIONS[1].WALK_RIGHT, walkRight);
    this.bus.emit(PLAYER_ACTIONS[1].WALK_LEFT, walkLeft);

    // Block detection using hysteresis on lateral wrist offset
    const blockOffset = ls.x - lw.x;
    const blocking = this.blockHyst.update(blockOffset - 0.1);
    this.bus.emit(PLAYER_ACTIONS[1].BLOCK_DOWN, blocking);
    if (!blocking) this.bus.emit(PLAYER_ACTIONS[1].BLOCK_UP, false);

    // Punch detection: wrist above shoulder with upward velocity
    const wristHeight = rw.y;
    const wristVelocity = this.wristVelocityFilter.next(this.lastWristY - wristHeight);
    this.lastWristY = wristHeight;
    const punchReady = wristHeight < rs.y - 0.12 && wristVelocity > 0.02;
    if (punchReady && this.punchCooldown.ready()) {
      this.bus.emit(PLAYER_ACTIONS[1].PUNCH, true);
      this.bus.emit(PLAYER_ACTIONS[1].PUNCH, false);
      this.punchCooldown.trigger();
    }

    // Kick detection: knee angle extends quickly
    const upper = [rh.x - rk.x, rh.y - rk.y, rh.z - rk.z];
    const lower = [ra.x - rk.x, ra.y - rk.y, ra.z - rk.z];
    const dot = (upper[0] * lower[0] + upper[1] * lower[1] + upper[2] * lower[2]) /
      (Math.hypot(...upper) * Math.hypot(...lower) || 1);
    const kneeAngle = (Math.acos(Math.min(Math.max(dot, -1), 1)) * 180) / Math.PI;
    const smoothedKnee = this.kneeAngleFilter.next(kneeAngle);
    const hipStability = Math.abs(rh.x - hipX) < 0.08;
    if (smoothedKnee > 165 && hipStability && this.kickCooldown.ready()) {
      this.bus.emit(PLAYER_ACTIONS[1].KICK, true);
      this.bus.emit(PLAYER_ACTIONS[1].KICK, false);
      this.kickCooldown.trigger();
    }
  };
}
