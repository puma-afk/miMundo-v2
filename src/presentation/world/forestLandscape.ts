import { MeshBuilder, Scene, Vector3 } from '../engine';
import { island } from './landscape';
import type { Landscape } from './landscape';
import { material, orb, groundHeight, merge } from './materials';
export function createForest(scene: Scene): Landscape {
  const ground=island(scene,'forest-island',19,Vector3.Zero(),material(scene,'forest-moss','#729aaf'),material(scene,'forest-rock','#59637f'),0);
  ground.isPickable=true;ground.metadata={walkable:true};
  const bark=material(scene,'forest-bark','#6b657e'), leaves=material(scene,'forest-leaves','#709ab6'), cap=material(scene,'forest-cap','#c8a8dd',.25), stem=material(scene,'forest-stem','#dcd2d4');
  const decor=[];
  for(let i=0;i<12;i++) {
    const a=i*Math.PI/6,x=Math.cos(a)*13,z=Math.sin(a)*13,y=groundHeight(x,z);
    const trunk=MeshBuilder.CreateCylinder('forest-trunk',{height:3.6,diameterTop:.3,diameterBottom:.65,tessellation:10},scene);trunk.position.set(x,y+1.8,z);trunk.material=bark;decor.push(trunk);
    for(let j=0;j<3;j++) decor.push(orb(scene,'forest-crown',new Vector3(x+Math.sin(j*2)*.7,y+3.7+j*.55,z+Math.cos(j*2)*.5),new Vector3(1.65,1.2,1.4),leaves,10));
  }
  for(let i=0;i<16;i++) {const a=i*2.4,r=8+i%3,x=Math.cos(a)*r,z=Math.sin(a)*r,y=groundHeight(x,z);decor.push(orb(scene,'mushroom-stem',new Vector3(x,y+.22,z),new Vector3(.09,.25,.09),stem,8));decor.push(orb(scene,'mushroom-cap',new Vector3(x,y+.45,z),new Vector3(.35,.13,.3),cap,10));}
  for(let i=0;i<14;i++){const z=7-i,x=Math.sin(i*.45)*.7;decor.push(orb(scene,'moon-path',new Vector3(x,groundHeight(x,z)+.03,z),new Vector3(.35,.04,.23),cap,8));}
  merge(decor,'forest-decoration');
  const platform=MeshBuilder.CreateCylinder('forest-refuge-base',{height:.15,diameter:3,tessellation:24},scene);platform.position.set(0,groundHeight(0,-7),-7);platform.material=bark;platform.metadata={targetId:'refuge'};
  const roof=orb(scene,'forest-refuge-roof',new Vector3(0,2,-7),new Vector3(1.9,.45,1.5),leaves,12);roof.isPickable=true;roof.metadata={targetId:'refuge'};
  for(const x of [-1,1]) {const post=MeshBuilder.CreateCylinder('refuge-post',{height:1.8,diameter:.14,tessellation:8},scene);post.position.set(x,.9,-7);post.material=bark;}
  const lamp=orb(scene,'refuge-lamp',new Vector3(0,1.6,-7),new Vector3(.18,.25,.18),material(scene,'refuge-glow','#ffe3a0',.8),10);lamp.setEnabled(false);
  const stone=orb(scene,'forest-story-stone',new Vector3(7,.7,-6),new Vector3(.7,1,.5),cap,10);stone.isPickable=true;stone.metadata={targetId:'forest-story'};
  const portal=MeshBuilder.CreateTorus('forest-return',{diameter:2,thickness:.12,tessellation:32},scene);portal.rotation.x=Math.PI/2;portal.position.set(0,1.3,9);portal.material=cap;portal.metadata={targetId:'travel'};
  const water=MeshBuilder.CreateDisc('forest-placeholder-water',{radius:.1},scene);water.setEnabled(false);
  return {ground,water,motes:[],tree:new Vector3(0,0,-12),bench:new Vector3(0,0,-7)};
}
