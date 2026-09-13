import type { AvatarStyle } from '../../domain/avatarStyle';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3 } from '../engine';
import { Avatar } from './avatar';
/** Render only when opened, resized or changed; no second animation loop. */
export class AvatarPreview {
  private engine: Engine;
  private scene: Scene;
  private avatar: Avatar;
  private resize: ResizeObserver;
  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false });
    this.scene = new Scene(this.engine);
    this.scene.clearColor.set(0.85, 0.89, 0.83, 1);
    const camera = new ArcRotateCamera('portrait-camera', Math.PI / 2 - .4, 1.35, 3, new Vector3(0,.85,0), this.scene);
    camera.minZ = .1;
    new HemisphericLight('portrait-light', new Vector3(0,1,1), this.scene);
    this.avatar = new Avatar(this.scene);
    this.resize = new ResizeObserver(() => this.draw()); this.resize.observe(canvas);
  }
  show(appearance: 'woman' | 'man', style?: AvatarStyle): void { this.avatar.setAppearance(appearance); if(style)this.avatar.setStyle(style); this.draw(); }
  turn(amount: number): void { this.avatar.root.rotation.y += amount; this.draw(); }
  private draw(): void { this.engine.resize(); this.scene.render(); }
  dispose(): void { this.resize.disconnect(); this.scene.dispose(); this.engine.dispose(); }
}
