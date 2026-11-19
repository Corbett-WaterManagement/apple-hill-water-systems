import {walkwayClearance,onWalkway} from './walkway-layout.js?v=24';
// Approximate yellow-outline tracing reconciled to the reviewed local layout.
// Latest user correction supersedes the earlier mound: mulch is at lawn grade.
export const mulchBed={heightFt:0,slopeRunFt:0,outline:[[-27,-19],[-16,-20],[-14,-16],[-14,-8],[-14,0],[-12,7],[-6,13],[-2,18],[-9,18],[-16,15],[-17.5,11],[-21,6],[-25,0],[-26,-7],[-28,-13]],source:'Screenshot 2026-11-12 140214.png',tankId:'nonirr_2'};
export function insideBed(x,y){let yes=false;const p=mulchBed.outline;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes}return yes}
export function bedHeight(){return 0}

export function createRaisedBed(T,{library,holes}){
 const paving=walkwayClearance(T);
 const group=new T.Group(),full=new T.Group(),cut=new T.Group();group.add(full,cut);
 const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle='#513c2a';g.fillRect(0,0,512,512);let seed=4581;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
 for(let i=0;i<12000;i++){g.save();g.translate(rand()*512,rand()*512);g.rotate(rand()*Math.PI);g.fillStyle=['#72553b','#846448','#5e442d','#997750'][i%4];g.fillRect(-2,-.6,3+rand()*8,1+rand()*2);g.restore()}
 const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;
 const material=new T.MeshStandardMaterial({map:texture,bumpMap:texture,bumpScale:.015,roughness:1,side:T.DoubleSide});
 function build(parent,opened){const positions=[],uv=[],step=.3;
  const hole=(x,y)=>holes.some(h=>Math.abs(x-h.x)<h.w/2+step/2&&Math.abs(y-h.y)<h.h/2+step/2);
  for(let x=-28;x<0;x+=step)for(let y=-20;y<18;y+=step){if(!insideBed(x+step/2,y+step/2)||hole(x+step/2,y+step/2)||onWalkway(x+step/2,y+step/2,paving))continue;for(const [dx,dy] of [[0,0],[step,0],[step,step],[0,0],[step,step],[0,step]]){const px=x+dx,py=y+dy;positions.push(px,py,bedHeight(px,py)+.075);uv.push(px/4,py/4)}}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();const o=new T.Mesh(geo,material);o.castShadow=o.receiveShadow=true;parent.add(o);
 }
 build(full,true);
 return{group,surfaceMaterial:material,mode(open,visible){full.visible=true;cut.visible=false;group.visible=visible&&!open},dispose(){texture.dispose();material.dispose()}};
}
