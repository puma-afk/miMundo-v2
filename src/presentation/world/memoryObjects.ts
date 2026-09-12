import { Mesh, MeshBuilder, Scene, TransformNode, Vector3 } from '../engine';
import { groundHeight, material, merge, orb } from './materials';
import { stories } from '../../content/stories';

/** Five small props, shared materials and emissive accents; no additional lights. */
export class MemoryObjects {
  private animated: { mesh: Mesh; y: number; phase: number; spin: boolean }[] = [];
  constructor(scene: Scene) {
    const gold = material(scene, 'story-brass', '#c8a568');
    const stone = material(scene, 'story-stone', '#c9c2b0');
    const paper = material(scene, 'story-paper', '#fff0cb');
    const wood = material(scene, 'story-wood', '#735c5b');
    const green = material(scene, 'story-sage', '#679584');
    const rose = material(scene, 'story-rose', '#e1a4b7', 0.12);
    const light = material(scene, 'story-lantern-light', '#ffe1a1', 0.75);
    const glass = material(scene, 'story-bottle-glass', '#91c9d1', 0.15); glass.alpha = 0.62;
    for (const [index, story] of stories.entries()) {
      if (story.id === 'welcome') continue;
      const root = new TransformNode(`story-object-${story.id}`, scene);
      root.position.set(story.position.x, groundHeight(story.position.x, story.position.z), story.position.z);
      const parts: Mesh[] = [];
      const ball = (name: string, x: number, y: number, z: number, sx: number, sy: number, sz: number, mat = gold) => {
        const m = orb(scene, name, new Vector3(x, y, z), new Vector3(sx, sy, sz), mat, 12); parts.push(m); return m;
      };
      const tube = (name: string, path: Vector3[], radius: number, mat = gold) => {
        const m = MeshBuilder.CreateTube(name, { path, radius, tessellation: 10, cap: Mesh.CAP_ALL }, scene); m.material = mat; parts.push(m); return m;
      };
      if (story.theme === 'letter') {
        tube('mailbox-post', [new Vector3(0, 0, 0), new Vector3(0, 1.1, 0)], 0.09, wood);
        ball('mailbox-body', 0, 1.23, 0, 0.43, 0.34, 0.32, green);
        const slot = MeshBuilder.CreateBox('mailbox-slot', { width: 0.38, height: 0.06, depth: 0.015 }, scene); slot.position.set(0, 1.32, 0.31); slot.material = wood; parts.push(slot);
        const envelope = MeshBuilder.CreateBox('letter', { width: 0.36, height: 0.25, depth: 0.04 }, scene); envelope.position.set(0, 1.1, 0.33); envelope.rotation.z = -0.12; envelope.material = paper; parts.push(envelope);
        ball('letter-seal', 0, 1.12, 0.365, 0.05, 0.05, 0.02, rose);
        tube('mailbox-flag-post', [new Vector3(-0.4, 1.2, 0), new Vector3(-0.4, 1.7, 0)], 0.025);
        ball('mailbox-flag', -0.28, 1.64, 0, 0.15, 0.09, 0.025, rose);
      } else if (story.theme === 'lantern') {
        tube('lantern-hook', [new Vector3(-0.25, 0, 0), new Vector3(-0.25, 1.9, 0), new Vector3(-0.15, 2.15, 0), new Vector3(0.15, 2.18, 0), new Vector3(0.33, 1.95, 0)], 0.04);
        ball('lantern-base', 0.3, 1.03, 0, 0.28, 0.08, 0.25);
        ball('lantern-roof', 0.3, 1.7, 0, 0.29, 0.13, 0.26);
        for (const dx of [-0.2, 0.2]) for (const dz of [-0.16, 0.16]) tube('lantern-frame', [new Vector3(0.3 + dx, 1.06, dz), new Vector3(0.3 + dx, 1.68, dz)], 0.018);
        ball('lantern-flame', 0.3, 1.35, 0, 0.12, 0.23, 0.12, light);
      } else if (story.theme === 'bottle') {
        ball('bottle-rock', 0, 0.12, 0, 0.6, 0.2, 0.45, stone);
        ball('glass-bottle', 0, 0.6, 0, 0.23, 0.44, 0.23, glass);
        tube('bottle-neck', [new Vector3(0, 0.89, 0), new Vector3(0, 1.21, 0)], 0.085, glass);
        ball('bottle-cork', 0, 1.25, 0, 0.1, 0.09, 0.1, wood);
        const letter = MeshBuilder.CreateCylinder('rolled-message', { height: 0.47, diameter: 0.1, tessellation: 12 }, scene); letter.position.set(0, 0.64, 0); letter.rotation.z = 0.22; letter.material = paper; parts.push(letter);
        tube('bottle-ribbon', [new Vector3(-0.12, 1.02, 0), new Vector3(0.14, 1.02, 0), new Vector3(0.29, 0.82, 0)], 0.025, rose);
      } else if (story.theme === 'flower') {
        ball('flower-stone', 0, 0.06, 0, 0.65, 0.13, 0.6, stone);
        tube('special-flower-stem', [Vector3.Zero(), new Vector3(-0.15, 0.55, 0), new Vector3(0.08, 1.15, 0), new Vector3(0, 1.6, 0)], 0.045, green);
        for (const side of [-1, 1]) { const leaf = ball('special-leaf', side * 0.23, 0.75, 0, 0.35, 0.07, 0.14, green); leaf.rotation.z = side * 0.4; }
        for (let i = 0; i < 8; i++) {
          const angle = i / 8 * Math.PI * 2;
          const petal = ball('special-petal', Math.cos(angle) * 0.24, 1.6, Math.sin(angle) * 0.24, 0.27, 0.1, 0.18, rose); petal.rotation.y = -angle;
        }
        ball('flower-heart', 0, 1.68, 0, 0.12, 0.08, 0.12, light);
      } else if (story.theme === 'star') {
        ball('star-pedestal', 0, 0.12, 0, 0.55, 0.18, 0.5, stone);
        tube('star-stand', [new Vector3(0, 0.1, 0), new Vector3(0, 0.85, 0)], 0.075, stone);
        ball('star-bowl', 0, 0.9, 0, 0.33, 0.07, 0.3);
        const star = MeshBuilder.CreatePolyhedron('star-fragment', { type: 1, size: 0.23 }, scene); star.position.set(0, 1.4, 0); star.material = light; star.parent = root; star.isPickable = false;
        this.animated.push({ mesh: star, y: 1.4, phase: index, spin: true });
        const halo = MeshBuilder.CreateTorus('star-orbit', { diameter: 0.85, thickness: 0.015, tessellation: 32 }, scene); halo.position.set(0, 1.4, 0); halo.rotation.z = 0.55; halo.material = gold; parts.push(halo);
      }
      const joined = merge(parts, `prop-${story.id}`);
      if (joined) { joined.unfreezeWorldMatrix(); joined.parent = root; joined.isPickable = true; joined.metadata = { targetId: story.id }; }
      // A tiny hovering sign unifies which objects contain stories.
      const sign = MeshBuilder.CreatePolyhedron(`story-sign-${story.id}`, { type: 1, size: 0.095 }, scene);
      sign.parent = root; sign.position.set(0, story.theme === 'lantern' ? 2.5 : 2.0, 0); sign.material = light;
      sign.metadata = { targetId: story.id };
      this.animated.push({ mesh: sign, y: sign.position.y, phase: index * 1.7, spin: true });
    }
  }
  update(time: number, reducedMotion: boolean): void {
    for (const item of this.animated) {
      item.mesh.position.y = item.y + (reducedMotion ? 0 : Math.sin(time * 1.25 + item.phase) * 0.08);
      if (!reducedMotion && item.spin) item.mesh.rotation.y = time * 0.45 + item.phase;
    }
  }
}
