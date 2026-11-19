import * as T from './assets/three.module.js';
// Quiet context from the owner's aerials: roadward lawn, two trees and curved
// building frontage. Context massing is illustrative, never a surveyed footprint.
export function createAH2Landscape({root,library,opening}){
 const group=new T.Group();root.add(group);
 const grass=library.get('turf-autumn',{color:'#c1c9b8'}),earth=library.get('soil');
 const grey=new T.MeshStandardMaterial({color:'#b8c0bb',roughness:1}),glass=new T.MeshStandardMaterial({color:'#869a96',roughness:.8});
 const foliage=new T.MeshStandardMaterial({color:'#a5b59b',roughness:1}),trunk=new T.MeshStandardMaterial({color:'#a79780',roughness:1});
 function mesh(g,p,m){library.uv(g,4);const o=new T.Mesh(g,m);o.position.set(...p);o.receiveShadow=true;group.add(o);return o}
 function block(p,size,m){return mesh(new T.BoxGeometry(...size),p,m)}
 const bounds={left:-10,right:10,back:-8.6,front:10.2};
 const {left,right,back,front}=opening;
 const pieces=[[bounds.left,left,bounds.back,bounds.front],[right,bounds.right,bounds.back,bounds.front],[left,right,bounds.back,back],[left,right,front,bounds.front]];
 for(const [l,r,b,t] of pieces){if(r<=l||t<=b)continue;block([(l+r)/2,(b+t)/2,-.075],[r-l,t-b,.12],earth);block([(l+r)/2,(b+t)/2,-.008],[r-l,t-b,.015],grass)}
 const road=library.get('asphalt',{color:'#bcc2bb'}),walk=library.get('concrete-walk',{color:'#e2e3d8'});
 block([0,7.9,.018],[20,3,.04],road);block([0,6.28,.04],[20,.34,.08],walk);
 const stripe=new T.MeshStandardMaterial({color:'#e8e7d9',roughness:1});
 for(let x=-9;x<10;x+=2.5)block([x,7.9,.047],[1,.035,.012],stripe);
 // Low curved frontage provides orientation without screening the equipment.
 const shape=new T.Shape();shape.moveTo(-8.5,-8.4);shape.lineTo(8.5,-8.4);shape.lineTo(8.5,-7.6);shape.quadraticCurveTo(0,-5.8,-8.5,-7.6);shape.closePath();
 const mass=mesh(new T.ExtrudeGeometry(shape,{depth:2.4,bevelEnabled:false}),[0,0,0],grey);
 for(let x=-8;x<8.2;x+=.85){const y=-6.7-.9*(x/8.5)**2;block([x,y,1.35],[.65,.045,.8],glass)}
 for(const [x,y,h] of [[-5.8,3.6,3.8],[5.4,4.0,4.2]]){
  const stem=mesh(new T.CylinderGeometry(.055,.09,h*.6,8),[x,y,h*.3],trunk);stem.rotation.x=Math.PI/2;
  const crown=mesh(new T.IcosahedronGeometry(1.2,2),[x,y,h*.77],foliage);crown.scale.set(1.05,1.02,h*.36);
 }
 // Context does not cast hard shadows over the reviewed equipment.
 group.traverse(o=>{o.castShadow=false});
 return group;
}
