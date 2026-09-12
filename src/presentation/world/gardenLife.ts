import { Scene, TransformNode, Vector3 } from '../engine';
import { material, orb, groundHeight } from './materials';
export class GardenLife {
  private butterflies: { root: TransformNode; left: TransformNode; right: TransformNode }[] = [];
  low = false;
  constructor(scene: Scene) {
    const wing = material(scene,'butterfly-cream','#efd4aa',.15), body = material(scene,'butterfly-body','#665063');
    for(let i=0;i<2;i++) {
      const root = new TransformNode('butterfly-'+i,scene);
      const center=orb(scene,'butterfly-body-'+i,Vector3.Zero(),new Vector3(.025,.035,.10),body,6);center.parent=root;
      const pivots=[-1,1].map(side=>{const pivot=new TransformNode('butterfly-wing',scene);pivot.parent=root;
        for(const [z,size] of [[.05,.13],[-.07,.09]]) {const mesh=orb(scene,'butterfly-petal',new Vector3(side*.10,0,z),new Vector3(size,.015,size*.75),wing,6);mesh.parent=pivot;}
        return pivot;
      });
      root.setEnabled(false);this.butterflies.push({root,left:pivots[0],right:pivots[1]});
    }
  }
  update(time: number, reduced: boolean): void {
    this.butterflies.forEach((b,i)=>{
      const phase=(time+i*13)%40;
      const active=!reduced && !(this.low && i>0) && phase<24;
      b.root.setEnabled(active);if(!active)return;
      const x=Math.sin(time*.25+i*3)*3+(i?4:-4),z=Math.cos(time*.2+i)*3;
      b.root.position.set(x,groundHeight(x,z)+1.3+Math.sin(time*1.6+i)*.18,z);
      b.root.rotation.y=time*.25+i;
      b.root.scaling.setAll(Math.min(1,phase/2,(24-phase)/2));
      b.left.rotation.z=Math.sin(time*15)*.65;b.right.rotation.z=-b.left.rotation.z;
    });
  }
}
