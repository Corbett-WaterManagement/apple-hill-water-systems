import * as T from './assets/three.module.js';
// Photo-supported relationships, with deliberately simple presentation massing.
// +Y faces Worcester Road; parking and the building are on the opposite side.
export function createAH3Landscape({root,library,opening}){
 const group=new T.Group();root.add(group);
 const grass=library.get('turf-autumn',{color:'#c1c9b8'}),mulch=library.get('soil',{color:'#8c6950'}),paving=library.get('concrete-walk',{color:'#e4e3d9'}),asphalt=library.get('asphalt',{color:'#bac1ba'});
 const foliage=new T.MeshStandardMaterial({color:'#8d9f79',roughness:1}),wood=new T.MeshStandardMaterial({color:'#9c9486',roughness:1}),stripe=new T.MeshStandardMaterial({color:'#e2e3d8',roughness:1});
 function mesh(g,p,m){library.uv(g,4);const o=new T.Mesh(g,m);o.position.set(...p);o.receiveShadow=true;group.add(o);return o}
 function block(p,size,m){return mesh(new T.BoxGeometry(...size),p,m)}
 function outline(points){const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return s}
 function cut(shape){const h=new T.Path();h.moveTo(opening.left,opening.back);h.lineTo(opening.left,opening.front);h.lineTo(opening.right,opening.front);h.lineTo(opening.right,opening.back);h.closePath();shape.holes.push(h);return shape}
 mesh(new T.ShapeGeometry(cut(outline([[-13,-11.5],[13,-11.5],[13,12.8],[-13,12.8]]))),[0,0,-.008],grass);
 mesh(new T.ShapeGeometry(cut(outline([[-6.8,-2.7],[-2,-3.3],[5.9,-3],[7.4,-1],[7,3.9],[5.5,5.3],[-4.6,5],[-6.7,3]]))),[0,0,.035],mulch);
 // Worcester Road is parallel to the bed and the long equipment sequence.
 block([0,10.9,.015],[26,2.7,.04],asphalt);block([0,9.48,.03],[26,.22,.06],paving);
 for(let x=-12;x<13;x+=2.6)block([x,10.9,.043],[1.25,.035,.012],stripe);
 // The meandering pedestrian route sits between the planting bed and road.
 const path=new T.CatmullRomCurve3([[-13,8.5,.06],[-6.5,8.7,.06],[0,8.2,.06],[6.5,8.75,.06],[13,8.5,.06]].map(p=>new T.Vector3(...p))),positions=[],indices=[];
 for(let i=0;i<=64;i++){const p=path.getPoint(i/64),t=path.getTangent(i/64),n=new T.Vector3(-t.y,t.x,0).normalize().multiplyScalar(.23);for(const sign of [-1,1])positions.push(p.x+n.x*sign,p.y+n.y*sign,p.z);if(i<64){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3)}}
 const ribbon=new T.BufferGeometry();ribbon.setAttribute('position',new T.Float32BufferAttribute(positions,3));ribbon.setIndex(indices);ribbon.computeVertexNormals();mesh(ribbon,[0,0,0],paving);
 // A short drive and marked parking row establish the building-side context.
 block([0,-8.3,.01],[26,4.2,.04],asphalt);block([0,-6.11,.04],[26,.22,.08],paving);
 for(let x=-12;x<13;x+=1.5){const o=block([x,-9.1,.04],[.025,2.25,.012],stripe);o.rotation.z=-.14}
 for(const x of [-6.6,6.8]){const car=new T.MeshStandardMaterial({color:x<0?'#b4b8b4':'#aaaead',roughness:1});block([x,-9.45,.23],[.78,1.55,.42],car);block([x,-9.5,.5],[.65,.7,.25],car)}
 // Muted building fragment beyond the parking, never used as an asset anchor.
 const wall=new T.MeshStandardMaterial({color:'#c5c7bd',roughness:1}),window=new T.MeshStandardMaterial({color:'#8d9d98',roughness:1});
 block([0,-11.25,1.2],[20.5,.8,2.4],wall);for(let x=-9.5;x<9.7;x+=1.1)block([x,-10.83,1.25],[.85,.025,.8],window);
 // Low shrubs frame the open inspection area, matching the planted field bed.
 for(const [x,y,r] of [[-6,-1.1,.58],[-6.1,1.6,.58],[-5.9,3.5,.55],[6.6,-.3,.62],[6.3,2.2,.58],[-3.9,-2.8,.48],[-1.5,-2.9,.52],[1.3,-2.8,.5],[4.1,-2.6,.53]]){
  for(let i=0;i<3;i++){const o=mesh(new T.IcosahedronGeometry(r*.65,1),[x+Math.cos(i*2.1)*r*.35,y+Math.sin(i*2.1)*r*.35,r*.5],foliage);o.scale.z=.72}
 }
 function branch(a,b,r){const A=new T.Vector3(...a),B=new T.Vector3(...b),v=B.clone().sub(A),o=mesh(new T.CylinderGeometry(r*.6,r,v.length(),7),A.clone().add(B).multiplyScalar(.5).toArray(),wood);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize())}
 // Deciduous trunks and bare branches follow the autumn site photographs.
 for(const [x,y] of [[-9.6,5.2],[9.6,6.1]]){branch([x,y,0],[x+.12,y,3.6],.11);for(let i=0;i<6;i++){const a=i*2.4,z=1.6+i*.22,end=[x+Math.cos(a)*1.15,y+Math.sin(a)*1.15,z+1.1];branch([x,y,z],end,.045);branch(end,[end[0]+Math.cos(a+.5)*.45,end[1]+Math.sin(a+.5)*.45,end[2]+.45],.02)}}
 group.traverse(o=>{o.castShadow=false});
 return group;
}
