import { forestPlots } from '../../content/islands';
import { createForest } from './forestLandscape';
import { GardenLife } from './gardenLife';
import { Matrix } from '../engine';
import { ArcRotateCamera, Color3, Engine, Mesh, MeshBuilder, Scene, TransformNode, Vector3 } from '../engine';
import { FantasySky } from './sky';
import { createLandscape } from './landscape';
import type { Landscape } from './landscape';
import { groundHeight, material, orb } from './materials';
import { Avatar } from '../player/avatar';
import { PlayerInput } from '../player/input';
import { plots, assetCatalog } from '../../content/garden';
import type { GardenGame } from '../../application/gardenGame';
import type { ModelLibrary } from '../../infrastructure/assets/modelLibrary';
import { stories } from '../../content/stories';
import { MemoryObjects } from './memoryObjects';

export type Target = { id: string; kind: 'plot' | 'memory' | 'bench' | 'travel' | 'refuge' | 'lore'; position: Vector3 };
export class GardenWorld {
  private giftId: string | null = null;
  configureGift(id: string): void { this.giftId = id; this.refreshGiftObjects(); }
  private giftVisible(id: string): boolean {
    const stops = ['letter-home', 'little-light', 'your-pace', 'tomorrow-door'];
    const step = stops.indexOf(id);
    const completed = this.game.save.giftProgress?.id === this.giftId ? this.game.save.giftProgress.completed : 0;
    return !this.giftId || step < 0 || step <= completed;
  }
  private refreshGiftObjects(): void {
    if (!this.giftId) return;
    for (const id of ['letter-home', 'little-light', 'your-pace', 'tomorrow-door']) this.scene.getTransformNodeByName(`story-object-${id}`)?.setEnabled(this.giftVisible(id));
  }
  readonly forest: boolean;
  get activePlots(): readonly {id:string;x:number;z:number}[] { return this.forest ? forestPlots : plots; }
  readonly engine: Engine;
  readonly scene: Scene;
  readonly sky: FantasySky;
  readonly input: PlayerInput;
  readonly avatar: Avatar;
  readonly camera: ArcRotateCamera;
  readonly targets: Target[] = [];
  entered = false;
  paused = false;
  previewSky = false;
  reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  nearest: Target | null = null;
  onBloom: () => void = () => {};
  private bloomPetals: Mesh[] = [];
  private bloomTime = 0;
  private bloomOrigin = Vector3.Zero();
  onTargetScreen: (point: { x: number; y: number } | null) => void = () => {};
  onTarget: (target: Target | null) => void = () => {};
  onTime: (hour: number) => void = () => {};
  onMetrics: (fps: number) => void = () => {};
  private landscape: Landscape;
  private plantNodes = new Map<string, { stage: number; node: TransformNode }>();
  private ring: Mesh;
  private contactShadow: Mesh;
  private memoryObjects: MemoryObjects | null;
  private life: GardenLife;
  private destination: Vector3 | null = null;
  private clock = 0;
  private tick = 0;
  private sitting = false;
  private abort = new AbortController();
  private models: ModelLibrary | null = null;
  private disposed = false;
  readonly modelReady: Promise<void>;
  constructor(private canvas: HTMLCanvasElement, private game: GardenGame) {
    this.forest = game.save.currentIsland === 'forest';
    this.engine = new Engine(canvas, true, { stencil: false, preserveDrawingBuffer: false, powerPreference: 'default' });
    this.scene = new Scene(this.engine);
    this.scene.fogMode = Scene.FOGMODE_EXP2; this.scene.fogDensity = 0.009;
    this.scene.ambientColor = Color3.FromHexString('#a3b9b0');
    this.camera = new ArcRotateCamera('follow-camera', Math.PI / 2 - 0.25, 1.29, 31, new Vector3(0, 1.1, -1), this.scene);
    this.camera.fov = 0.92;
    this.camera.lowerBetaLimit = 0.48; this.camera.upperBetaLimit = 1.38;
    this.camera.lowerRadiusLimit = 7; this.camera.upperRadiusLimit = 34;
    this.camera.minZ = 0.1; this.camera.maxZ = 250; this.camera.wheelPrecision = 35;
    this.camera.panningSensibility = 0; this.camera.angularSensibilityX = 950; this.camera.angularSensibilityY = 1200;
    this.camera.attachControl(canvas, true);
    this.camera.inputs.removeByType('ArcRotateCameraKeyboardMoveInput');
    this.sky = new FantasySky(this.scene);
    this.landscape = this.forest ? createForest(this.scene) : createLandscape(this.scene);
    if(this.forest) {this.sky.hour=21;this.sky.auto=false;}
    this.avatar = new Avatar(this.scene); this.avatar.root.position.set(0, groundHeight(0, this.forest ? 6 : 7.7), this.forest ? 6 : 7.7);
    this.avatar.root.rotation.y = Math.PI;
    const shadowMat = material(this.scene, 'traveler-contact-shadow', '#183e32'); shadowMat.alpha = 0.22;
    this.contactShadow = MeshBuilder.CreateDisc('traveler-contact-shadow', { radius: 0.3, tessellation: 24, sideOrientation: Mesh.DOUBLESIDE }, this.scene);
    this.contactShadow.rotation.x = Math.PI / 2; this.contactShadow.scaling.y = 0.7; this.contactShadow.material = shadowMat; this.contactShadow.isPickable = false;
    this.input = new PlayerInput(canvas);
    const soil = material(this.scene, 'garden-soil', '#77685d');
    const border = material(this.scene, 'plot-stone', '#ddc9a7');
    this.activePlots.forEach(p => {
      const y = groundHeight(p.x, p.z);
      const base = orb(this.scene, `plot-${p.id}`, new Vector3(p.x, y + 0.07, p.z), new Vector3(0.78, 0.12, 0.78), soil, 18);
      base.isPickable = true; base.metadata = { targetId: p.id };
      const edging = MeshBuilder.CreateTorus('plot-edging', { diameter: 1.56, thickness: 0.055, tessellation: 32 }, this.scene);
      edging.position.set(p.x, y + 0.11, p.z); edging.material = border; edging.isPickable = false;
      this.targets.push({ id: p.id, kind: 'plot', position: new Vector3(p.x, y, p.z) });
    });
    if (!this.forest) this.targets.push(...stories.map(story => ({ id: story.id, kind: 'memory' as const, position: new Vector3(story.position.x, groundHeight(story.position.x, story.position.z), story.position.z) })));
    this.memoryObjects = this.forest ? null : new MemoryObjects(this.scene);
    this.life = new GardenLife(this.scene);
    const celebrationMat = material(this.scene,'celebration-petal','#f3d9ee',.3);
    for(let i=0;i<8;i++) { const petal=orb(this.scene,'celebration-'+i,Vector3.Zero(),new Vector3(.075,.025,.04),celebrationMat,6);petal.setEnabled(false);this.bloomPetals.push(petal); }
    if (!this.forest) this.targets.push({ id: 'bench', kind: 'bench', position: this.landscape.bench.add(new Vector3(0, 0, 0.8)) });
    this.targets.push({id:'travel',kind:'travel',position:this.forest ? new Vector3(0,groundHeight(0,9),9) : new Vector3(5.2,groundHeight(5.2,-10.2),-10.2)});
    if(this.forest) this.targets.push({id:'refuge',kind:'refuge',position:new Vector3(0,0,-7)},{id:'forest-story',kind:'lore',position:new Vector3(7,0,-6)});
    const memoryMat = material(this.scene, 'memory-gem', '#ffe6a6', 0.75);
    const gem = MeshBuilder.CreatePolyhedron('memory', { type: 1, size: 0.25 }, this.scene);
    gem.setEnabled(!this.forest);
    gem.position.set(-1.4, 1.35, -0.5); gem.material = memoryMat; gem.metadata = { targetId: 'welcome' };
    const ringMat = material(this.scene, 'interaction-ring', '#fff0bb', 0.65);
    this.ring = MeshBuilder.CreateTorus('selection-ring', { diameter: 1.95, thickness: 0.025, tessellation: 48 }, this.scene); this.ring.material = ringMat; this.ring.isPickable = false; this.ring.setEnabled(false);
    this.setQuality(matchMedia('(max-width: 800px)').matches ? 'low' : 'balanced');
    let pointerStart = { x: 0, y: 0 };
    canvas.addEventListener('pointerdown', e => { pointerStart = { x: e.clientX, y: e.clientY }; }, { signal: this.abort.signal });
    canvas.addEventListener('pointerup', e => {
      if (!this.entered || this.paused || Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y) > 8) return;
      const rect = canvas.getBoundingClientRect();
      const pick = this.scene.pick(e.clientX - rect.left, e.clientY - rect.top, mesh => !!mesh.metadata?.walkable || !!mesh.metadata?.targetId);
      if (pick?.hit && pick.pickedPoint) {
        const target = this.targets.find(t => t.id === pick.pickedMesh?.metadata?.targetId);
        this.destination = target ? target.position.clone() : pick.pickedPoint;
      }
    }, { signal: this.abort.signal });
    window.addEventListener('resize', () => this.engine.resize(), { signal: this.abort.signal });
    document.addEventListener('visibilitychange', () => { this.input.clear(); if (document.hidden) this.engine.stopRenderLoop(); else this.engine.runRenderLoop(this.render); }, { signal: this.abort.signal });
    this.refreshPlants();
    this.modelReady = this.forest ? Promise.resolve() : this.loadDetailedTree();
    this.engine.runRenderLoop(this.render);
  }
  enter(): void { this.entered = true; this.destination = null; this.canvas.focus(); }
  home(): void { this.avatar.root.position.set(0, groundHeight(0, 7.7), 7.7); this.destination = null; this.camera.alpha = Math.PI / 2 - 0.25; this.camera.beta = 1.18; this.sitting = false; }
  sit(): void { this.sitting = !this.sitting; if (this.sitting) this.avatar.root.position.copyFrom(this.landscape.bench.add(new Vector3(0, 0.2, 0))); }
  setQuality(quality: string): void {
    this.life.low = quality === 'low';
    const dpr = Math.min(devicePixelRatio || 1, quality === 'high' ? 1.75 : quality === 'balanced' ? 1.25 : 1);
    this.engine.setHardwareScalingLevel((quality === 'low' ? 1.25 : 1) / dpr);
    this.landscape?.motes.forEach((m, i) => m.setEnabled(quality !== 'low' || i < 8));
    this.scene.getMeshByName('meadow-blades')?.setEnabled(quality !== 'low');
    this.engine.resize();
  }
  refreshPlants(): void {
    this.scene.getMeshByName('refuge-lamp')?.setEnabled(!!this.game.save.forestRefuge);
    for (const p of this.activePlots) {
      const stage = this.game.getStage(p.id), previous = this.plantNodes.get(p.id);
      if (previous?.stage === stage) continue;
      previous?.node.dispose(); this.plantNodes.delete(p.id);
      if (stage < 0) continue;
      const node = new TransformNode(`plant-${p.id}`, this.scene); node.position.set(p.x, groundHeight(p.x, p.z) + 0.12, p.z);
      let stemMat = this.scene.getMaterialByName('plant-stem') as ReturnType<typeof material>;
      if (!stemMat) stemMat = material(this.scene, 'plant-stem', '#4e8d6c');
      let bloomMat = this.scene.getMaterialByName('moon-petal') as ReturnType<typeof material>;
      if (!bloomMat) bloomMat = material(this.scene, 'moon-petal', '#eee1ff', 0.22);
      const h = [0.18, 0.5, 0.85][stage];
      if (this.forest) {
        const mat = this.scene.getMaterialByName('fern-leaf') || material(this.scene,'fern-leaf','#99cce0',.25);
        for(let j=0;j<7;j++){ const a=j*Math.PI*2/7;const leaf=orb(this.scene,'starfern-leaf',new Vector3(Math.cos(a)*h*.23,h*.4,Math.sin(a)*h*.23),new Vector3(.065,h*.65,.09),mat as ReturnType<typeof material>,8);leaf.rotation.z=Math.sin(a)*.5;leaf.rotation.x=Math.cos(a)*.5;leaf.parent=node;}
      }
      const stem = MeshBuilder.CreateTube('flower-stem', { path: [Vector3.Zero(), new Vector3(0.05, h * 0.6, 0), new Vector3(0, h, 0)], radius: 0.035, tessellation: 7 }, this.scene); stem.material = stemMat; stem.parent = node; stem.isPickable = false;
      for (const side of [-1, 1]) { const leaf = orb(this.scene, 'flower-leaf', new Vector3(side * h * 0.23, h * 0.42, 0), new Vector3(h * 0.3, 0.035, h * 0.13), stemMat); leaf.rotation.z = side * 0.4; leaf.parent = node; }
      if (stage === 2 && !this.forest) for (let j = 0; j < 6; j++) {
        const angle = j / 6 * Math.PI * 2;
        const petal = orb(this.scene, 'moon-petal', new Vector3(Math.cos(angle) * 0.19, h + 0.03, Math.sin(angle) * 0.19), new Vector3(0.18, 0.08, 0.15), bloomMat); petal.parent = node;
      } else { const bud = orb(this.scene, 'flower-bud', new Vector3(0, h, 0), new Vector3(h * 0.2, h * 0.24, h * 0.2), bloomMat); bud.parent = node; }
      this.plantNodes.set(p.id, { stage, node });
      if (stage === 2 && previous && previous.stage < 2) {
        this.onBloom();
        if (!this.reducedMotion) { this.bloomOrigin.copyFrom(node.position); this.bloomTime = 1.6; }
      }
    }
    this.onTarget(this.nearest);
  }
  private render = (): void => {
    const dt = Math.min(this.engine.getDeltaTime() / 1000, 0.05);
    this.clock += this.paused ? 0 : dt;
    this.sky.update(this.paused && !this.previewSky ? 0 : dt, this.reducedMotion);
    this.memoryObjects?.update(this.clock, this.reducedMotion);
    this.life.update(this.clock, this.reducedMotion);
    if (!this.paused) this.plantNodes.forEach(({node})=>{
      const distance=Vector3.DistanceSquared(node.position,this.avatar.root.position);
      const target=!this.reducedMotion && distance<6.25 ? Math.sin(this.clock*2.8)*.055 : 0;
      node.rotation.z=this.reducedMotion ? 0 : node.rotation.z+(target-node.rotation.z)*Math.min(1,dt*5);
    });
    if (this.entered && !this.paused) this.movePlayer(dt);
    const playerPosition = this.avatar.root.position;
    this.contactShadow.position.set(playerPosition.x, groundHeight(playerPosition.x, playerPosition.z) + 0.035, playerPosition.z);
    const desired = this.entered ? this.avatar.root.position.add(new Vector3(0, 1.2, -1.5)) : new Vector3(0, 1.1, -1);
    this.camera.target = Vector3.Lerp(this.camera.target, desired, 1 - Math.exp(-dt * 3));
    if (this.entered && this.camera.radius > 16) this.camera.radius += (16 - this.camera.radius) * dt * 1.3;
    const gem = this.scene.getMeshByName('memory');
    if (gem && !this.reducedMotion) { gem.rotation.y = this.clock * 0.5; gem.position.y = 1.35 + Math.sin(this.clock * 1.3) * 0.12; }
    if (!this.reducedMotion) this.landscape.motes.forEach(m => { const { base, phase } = m.metadata; m.position.set(base.x + Math.sin(this.clock * 0.24 + phase) * 0.5, base.y + Math.sin(this.clock * 0.8 + phase) * 0.22, base.z + Math.cos(this.clock * 0.21 + phase) * 0.5); });
    this.tick += dt;
    if (this.tick > 1) { this.tick = 0; this.refreshPlants(); this.onTime(this.sky.hour); this.onMetrics(this.engine.getFps()); }
    if (!this.paused) this.bloomTime=Math.max(0,this.bloomTime-dt);
    if (this.reducedMotion) this.bloomTime=0;
    this.bloomPetals.forEach((petal,i)=>{petal.setEnabled(this.bloomTime>0);if(this.bloomTime>0){const t=1-this.bloomTime/1.6,a=i*Math.PI/4;petal.position.set(this.bloomOrigin.x+Math.cos(a)*t*.9,this.bloomOrigin.y+.8+Math.sin(t*Math.PI)*.65,this.bloomOrigin.z+Math.sin(a)*t*.9);petal.rotation.z=t*4+i;petal.scaling.set(.075*(1-t*.7),.025*(1-t*.7),.04*(1-t*.7));}});
    this.scene.render();
    const target = this.nearest;
    if (this.entered && !this.paused && target) {
      const rect = this.engine.getRenderingCanvas()!.getBoundingClientRect();
      const projected = Vector3.Project(target.position.add(new Vector3(0, 1.7, 0)), Matrix.Identity(), this.scene.getTransformMatrix(), this.camera.viewport.toGlobal(rect.width, rect.height));
      this.onTargetScreen(projected.z > 0 && projected.z < 1 && projected.x > 65 && projected.x < rect.width - 65 && projected.y > 100 && projected.y < rect.height - 210 ? { x: rect.left + projected.x, y: rect.top + projected.y } : null);
    } else this.onTargetScreen(null);
  };
  playCare(id: string, kind: 'plant' | 'water' | 'read'): void {
    if (this.reducedMotion) return;
    const target=this.targets.find(t=>t.id===id); if(!target) return;
    this.destination=null; this.input.clear(); this.sitting=false;
    const p=this.avatar.root.position;
    this.avatar.root.rotation.y=Math.atan2(target.position.x-p.x,target.position.z-p.z);
    this.avatar.care(kind);
  }
  private movePlayer(dt: number): void {
    if(this.avatar.caring) { this.avatar.animate(dt,false,this.reducedMotion); return; }
    const input = this.input.direction(), p = this.avatar.root.position;
    const forward = this.camera.target.subtract(this.camera.position); forward.y = 0; forward.normalize();
    const right = this.camera.getDirection(new Vector3(1, 0, 0)); right.y = 0; right.normalize();
    let direction = forward.scale(input.y).add(right.scale(input.x));
    if (direction.length() > 0.05) { this.destination = null; this.sitting = false; }
    else if (this.destination) { direction = this.destination.subtract(p); direction.y = 0; if (direction.length() < 0.65) { this.destination = null; direction.setAll(0); } }
    const moving = direction.length() > 0.05;
    if (moving) {
      direction.normalize(); const next = p.add(direction.scale(dt * 3.25));
      // Simple circular collision boundaries: island edge, trunk, pond and stone arch supports.
      const blocked = Math.hypot(next.x, next.z) > (this.forest ? 17.5 : 13.6) || (!this.forest && ( (next.x + 1.4) ** 2 + (next.z + 3) ** 2 < 0.65 ** 2
        || ((next.x - 5) / 2.9) ** 2 + ((next.z + 3) / 2.1) ** 2 < 1
        || [3.3, 7.1].some(x => (next.x - x) ** 2 + (next.z + 9) ** 2 < 0.5 ** 2)));
      if (!blocked) p.copyFrom(next); else this.destination = null;
      const targetAngle = Math.atan2(direction.x, direction.z);
      const delta = Math.atan2(Math.sin(targetAngle - this.avatar.root.rotation.y), Math.cos(targetAngle - this.avatar.root.rotation.y));
      this.avatar.root.rotation.y += delta * Math.min(1, dt * 12);
    }
    if (!this.sitting) p.y = groundHeight(p.x, p.z);
    this.avatar.animate(dt, moving, this.reducedMotion);
    let nearest: Target | null = null, best = 2.35;
    this.refreshGiftObjects();
    for (const t of this.targets) { if (!this.giftVisible(t.id)) continue; const distance = Math.hypot(p.x - t.position.x, p.z - t.position.z); if (distance < best) { best = distance; nearest = t; } }
    if (nearest?.id !== this.nearest?.id) { this.nearest = nearest; this.onTarget(nearest); }
    this.ring.setEnabled(!!nearest);
    if (nearest) this.ring.position.set(nearest.position.x, groundHeight(nearest.position.x, nearest.position.z) + 0.18, nearest.position.z);
  }
  private async loadDetailedTree(): Promise<void> {
    try {
      const { ModelLibrary } = await import('../../infrastructure/assets/modelLibrary');
      if (this.disposed) return;
      this.models = new ModelLibrary(this.scene);
      const container = await this.models.load(`${import.meta.env.BASE_URL}${assetCatalog.moonTree.url}`);
      if (this.disposed) return;
      const root = container.createRootMesh();
      container.addAllToScene();
      const bounds = root.getHierarchyBoundingVectors(true);
      const scale = 7.2 / Math.max(0.01, bounds.max.y - bounds.min.y);
      root.scaling.setAll(scale);
      root.position.set(-1.4, groundHeight(-1.4, -3) - bounds.min.y * scale, -3);
      container.meshes.forEach(mesh => { mesh.isPickable = false; });
      this.scene.getMeshByName('tree-trunk')?.setEnabled(false);
      this.scene.getMeshByName('tree-canopy')?.setEnabled(false);
    } catch (error) {
      if (!this.disposed) console.warn('El árbol detallado no se pudo cargar; se conserva el árbol ligero.', error);
    }
  }
  dispose(): void { this.disposed = true; this.abort.abort(); this.input.dispose(); this.engine.stopRenderLoop(); this.models?.dispose(); this.scene.dispose(); this.engine.dispose(); }
}
