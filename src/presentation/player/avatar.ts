import { defaultAvatarStyle } from '../../domain/avatarStyle';
import type { AvatarStyle } from '../../domain/avatarStyle';
import { Color3, StandardMaterial, MeshBuilder, Scene, TransformNode, Vector3 } from '../engine';
import { material, orb } from '../world/materials';

export class Avatar {
  readonly root: TransformNode;
  private skinMaterial!: StandardMaterial;
  private robeMaterial!: StandardMaterial;
  private cape!: TransformNode;
  private hairParts: TransformNode[] = [];
  private waveTime=0;
  style: AvatarStyle = {...defaultAvatarStyle};
  wave(): void { this.waveTime=1.8; }
  setStyle(style: AvatarStyle): void {
    this.style={...style};
    this.skinMaterial.diffuseColor=Color3.FromHexString({light:'#f1d0b4',warm:'#cc9873',deep:'#83553f'}[style.skin]);
    this.robeMaterial.diffuseColor=Color3.FromHexString({teal:'#366d79',lavender:'#79669f',rose:'#ae627f'}[style.robe]);
    this.skinMaterial.emissiveColor=this.skinMaterial.diffuseColor.scale(.07);
    this.robeMaterial.emissiveColor=this.robeMaterial.diffuseColor.scale(.09);
    const hair=style.hair==='auto' ? (this.appearance==='woman'?'braid':'short') : style.hair;
    this.hairParts.forEach((part,index)=>part.setEnabled(index===0 ? hair!=='short' : hair==='braid'));
  }
  private leftLeg: TransformNode;
  private rightLeg: TransformNode;
  private leftArm: TransformNode;
  private rightArm: TransformNode;
  private time = 0;
  private careTime = 0;
  private careKind: 'plant' | 'water' | 'read' = 'plant';
  private can: TransformNode;
  private seed: TransformNode;
  private drops: TransformNode[] = [];
  get caring(): boolean { return this.careTime > 0; }
  care(kind: 'plant' | 'water' | 'read'): void { this.careKind = kind; this.careTime = kind === 'read' ? .6 : 1.35; }

  private femaleParts: TransformNode[] = [];
  appearance: 'woman' | 'man' = 'man';
  setAppearance(value: 'woman' | 'man'): void {
    this.appearance = value;
    this.femaleParts.forEach(part => part.setEnabled(value === 'woman'));
    if(this.skinMaterial)this.setStyle(this.style);
  }
  constructor(scene: Scene) {
    this.root = new TransformNode('traveler', scene);
    const robe = this.robeMaterial = material(scene, 'traveler-teal', '#366d79');
    const cloak = material(scene, 'traveler-ivory', '#efe0bf');
    const skin = this.skinMaterial = material(scene, 'traveler-skin', '#dfb795');
    const hair = material(scene, 'traveler-hair', '#5e485b');
    const boots = material(scene, 'traveler-boots', '#64586b');
    const make = (name: string, p: Vector3, s: Vector3, mat = robe) => { const m = orb(scene, name, p, s, mat, 12); m.parent = this.root; return m; };
    make('tunic', new Vector3(0, 0.84, 0), new Vector3(0.23, 0.4, 0.18));
    this.cape=make('cape', new Vector3(0, 0.85, -0.13), new Vector3(0.31, 0.43, 0.11), cloak);
    make('head', new Vector3(0, 1.35, 0.015), new Vector3(0.21, 0.24, 0.20), skin);
    make('hair', new Vector3(0, 1.46, -0.03), new Vector3(0.23, 0.18, 0.22), hair);
    this.hairParts.push(make('long-hair', new Vector3(0, 1.16, -0.15), new Vector3(0.24, 0.32, 0.13), hair));
    this.hairParts.push(make('braid', new Vector3(0.19, 1.08, 0.1), new Vector3(0.07, 0.27, 0.07), hair));
    this.femaleParts.push(make('dress', new Vector3(0, 0.62, 0), new Vector3(0.30, 0.27, 0.23), robe));
    const eyes=material(scene,'traveler-eyes','#252638');
    make('eye-left',new Vector3(-.075,1.37,.199),new Vector3(.029,.038,.018),eyes);
    make('eye-right',new Vector3(.075,1.37,.199),new Vector3(.029,.038,.018),eyes);
    make('nose',new Vector3(0,1.32,.213),new Vector3(.029,.03,.027),skin);
    make('smile',new Vector3(0,1.27,.195),new Vector3(.041,.01,.012),eyes);
    const gold=material(scene,'traveler-clasp','#dcb974',.12);
    make('cape-clasp',new Vector3(0,1.105,.225),new Vector3(.04,.05,.022),gold);
    this.setAppearance('man');
    make('scarf', new Vector3(0, 1.14, 0), new Vector3(0.25, 0.09, 0.22), cloak);
    const limb = (name: string, x: number, y: number, length: number, arm: boolean) => {
      const pivot = new TransformNode(name, scene); pivot.parent = this.root; pivot.position.set(x, y, 0);
      const m = MeshBuilder.CreateCapsule(`${name}-mesh`, { radius: arm ? 0.085 : 0.095, height: length, tessellation: 8, subdivisions: 1 }, scene);
      m.parent = pivot; m.position.y = -length / 2 + 0.05; m.material = arm ? robe : boots; m.isPickable = false;
      return pivot;
    };
    this.leftLeg = limb('left-leg', -0.11, 0.56, 0.48, false);
    this.rightLeg = limb('right-leg', 0.11, 0.56, 0.48, false);
    this.leftArm = limb('left-arm', -0.27, 1.03, 0.42, true);
    this.rightArm = limb('right-arm', 0.27, 1.03, 0.42, true);
    const brass = material(scene, 'care-brass', '#c7ad72');
    const water = material(scene, 'care-water', '#addfe8', .3);
    this.can = new TransformNode('watering-can', scene); this.can.parent = this.root;
    this.can.position.set(.3,.8,.5);
    const body = orb(scene,'can-body',Vector3.Zero(),new Vector3(.18,.16,.14),brass); body.parent=this.can;
    const spout = MeshBuilder.CreateTube('can-spout',{path:[new Vector3(0,0,0),new Vector3(0,.06,.3)],radius:.04,tessellation:8},scene);spout.parent=this.can;spout.material=brass;spout.isPickable=false;
    const handle=MeshBuilder.CreateTorus('can-handle',{diameter:.28,thickness:.035,tessellation:12},scene);handle.parent=this.can;handle.position.z=-.12;handle.rotation.x=Math.PI/2;handle.material=brass;handle.isPickable=false;
    this.seed=make('care-seed',new Vector3(0,.5,.5),new Vector3(.065,.1,.065),brass);
    for(let i=0;i<7;i++) this.drops.push(make('care-drop-'+i,Vector3.Zero(),new Vector3(.025,.06,.025),water));
    this.can.setEnabled(false);this.seed.setEnabled(false);this.drops.forEach(d=>d.setEnabled(false));
  }
  animate(dt: number, moving: boolean, reducedMotion: boolean): void {
    this.time += dt;
    this.waveTime = reducedMotion || moving ? 0 : Math.max(0,this.waveTime-dt);
    this.cape.rotation.x=reducedMotion?0:Math.sin(this.time*(moving?7:2))*(moving?.075:.025);
    this.leftArm.rotation.z=0;this.rightArm.rotation.z=0;
    if (reducedMotion || moving) this.careTime = 0;
    this.careTime = Math.max(0,this.careTime-dt);
    const active=this.caring, water=active && this.careKind==='water';
    const progress=1-this.careTime/(this.careKind === 'read' ? .6 : 1.35), bend=active ? Math.sin(progress*Math.PI) : 0;
    this.root.rotation.x = bend * (this.careKind === 'read' ? .06 : water ? .1 : .32);
    this.can.setEnabled(water); this.seed.setEnabled(active && this.careKind === 'plant' && progress<.75);
    this.seed.position.set(0,.75-progress*.65,.6);
    this.can.rotation.x=bend*.35;
    this.drops.forEach((drop,i)=>{drop.setEnabled(water && progress>.2 && progress<.85);const fall=(progress*3+i/7)%1;drop.position.set(.3+Math.sin(i)*.06,.8-fall*.7,.78+fall*.15);});
    if(active) { this.leftArm.rotation.x=-bend*.85; this.rightArm.rotation.x=-bend*1.2;this.leftLeg.rotation.x=bend*.22;this.rightLeg.rotation.x=-bend*.22;return; }

    const swing = moving && !reducedMotion ? Math.sin(this.time * 11) * 0.5 : 0;
    this.leftLeg.rotation.x = swing; this.rightLeg.rotation.x = -swing;
    const breath=!moving&&!reducedMotion?Math.sin(this.time*2)*.035:0;
    this.leftArm.rotation.x = -swing * 0.7+breath; this.rightArm.rotation.x = swing * 0.7+breath;
    if(this.waveTime>0){this.rightArm.rotation.z=-2.3+Math.sin(this.time*14)*.18;this.rightArm.rotation.x=-.3;}
  }
}
