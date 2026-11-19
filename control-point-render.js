import {createAH3Landscape} from './ah3-landscape.js?v=35';
import {createAH2Landscape} from './ah2-landscape.js?v=30';
import * as T from './assets/three.module.js';
import {createMaterialLibrary} from './material-library.js';
// Finish layer only: all equipment and flow coordinates come from the reviewed data.
export function createControlPointRender(renderer,scene,{boxes,components,path,services=[],instrumentTee,depth,system}){
 const root=new T.Group(),lib=createMaterialLibrary(renderer),objects=[];scene.add(root);
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 const sky=new T.HemisphereLight('#fff8e9','#809084',2.4);sky.up.set(0,0,1);sky.position.set(0,0,10);scene.add(sky);
 const sun=new T.DirectionalLight('#fff3d8',3.2);sun.position.set(-3,-5,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9});sun.shadow.bias=-.0003;scene.add(sun);
 const mat=k=>lib.get(k);
 function mesh(g,p,m,id){lib.uv(g,2);const o=new T.Mesh(g,m);o.position.set(...p);o.castShadow=o.receiveShadow=true;if(id){o.userData.part=id;objects.push(o)}root.add(o);return o}
 function block(p,size,k,id){return mesh(new T.BoxGeometry(...size),p,mat(k),id)}
 function surfaceCap(p,size){const o=block(p,size,'turf-autumn');if(system==='ah3')o.material=lib.get('soil',{color:'#8c6950'});return o}
 function cyl(p,r,h,k,id,axis='z'){const o=mesh(new T.CylinderGeometry(r,r,h,40),p,mat(k),id);if(axis==='z')o.rotation.x=Math.PI/2;else if(axis==='x')o.rotation.z=Math.PI/2;return o}
 function pipe(points,k='galvanized',r=.045,id){for(let i=1;i<points.length;i++){const a=new T.Vector3(...points[i-1]),b=new T.Vector3(...points[i]),v=b.clone().sub(a);if(v.length()<.001)continue;const o=mesh(new T.CylinderGeometry(r,r,v.length(),16),a.clone().add(b).multiplyScalar(.5).toArray(),mat(k),id);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize())}}
 // Open inspection strip; lawn stops at its edge so it cannot obscure the apparatus.
 const minX=Math.min(...boxes.map(b=>b.p[0]-b.size[0]/2))-1,maxX=Math.max(...boxes.map(b=>b.p[0]+b.size[0]/2))+1,minY=-1.35,maxY=system==='ah3'?3.2:1.25,floor=-depth-1;
 block([(minX+maxX)/2,(minY+maxY)/2,floor-.12],[maxX-minX,maxY-minY,.24],'soil');
 for(const y of [minY-.45,maxY+.45]){block([(minX+maxX)/2,y,floor/2],[maxX-minX,.9,-floor],'soil');surfaceCap([(minX+maxX)/2,y,.012],[maxX-minX,.9,.025])}
 for(const x of [minX-.4,maxX+.4]){block([x,(minY+maxY)/2,floor/2],[.8,maxY-minY+1.8,-floor],'soil');surfaceCap([x,(minY+maxY)/2,.012],[.8,maxY-minY+1.8,.025])}
 for(const b of boxes){if(b.id==='well')continue;const [x,y]=b.p,[w,h]=b.size;if(b.shape==='round'){const ring=mesh(new T.TorusGeometry(w/2,.035,10,48),[x,y,-.03],mat('polymer-black'));continue}for(const yy of [-h/2,h/2])block([x,y+yy,-.04],[w,.055,.08],'polymer-black');for(const xx of [-w/2,w/2])block([x+xx,y,-.04],[.055,h,.08],'polymer-black')}
 if(system==='ah2')createAH2Landscape({root,library:lib,opening:{left:minX-.8,right:maxX+.8,back:minY-.9,front:maxY+.9}});
 if(system==='ah3')createAH3Landscape({root,library:lib,opening:{left:minX-.8,right:maxX+.8,back:minY-.9,front:maxY+.9}});
 // The internal filter leg is explanatory. Show it through the housing, not as a bypass.
 pipe(path,'galvanized',.043);
 services.forEach(s=>pipe(s.points,'copper-aged',.035));
 if(instrumentTee){
  pipe(instrumentTee.header,'galvanized',.045);pipe(instrumentTee.stem,'galvanized',.045);
  for(const r of instrumentTee.risers){pipe(r.points,'galvanized',.035,r.id);const top=r.points.at(-1);cyl([top[0],top[1],top[2]-.035],.055,.07,'galvanized',r.id);for(let j=0;j<3;j++)cyl([top[0],top[1],top[2]-.06+j*.018],.059,.008,'galvanized',r.id)}
 }

 const well=components.find(n=>n.id==='well');pipe([[well.p[0],well.p[1],well.p[2]],[well.p[0],well.p[1],-3.5]],'galvanized',.09,'well');
 for(const n of components){const [x,y,z]=n.p;
  if(n.id==='filter'){const length=system==='ah3'?1.05:19/30,r=system==='ah3'?.26:.19;const m=lib.get('polymer-black',{transparent:true,opacity:.76,depthWrite:false});const body=mesh(new T.CylinderGeometry(r,r,length,40),n.p,m,n.id);cyl([x,y-length/2+.06,z],r+.028,.09,'galvanized',n.id,'y');cyl([x,y+length/2-.03,z],r*.86,.055,'polymer-black',n.id,'y')}
  else if(n.id==='pressure'){cyl(n.p,.24,.55,'galvanized',n.id,'y');cyl([x,y-.27,z],.13,.08,'copper-aged',n.id,'y')}
  else if(n.id==='well'){cyl(n.p,system==='ah3'?.26:.33,.12,'copper-aged',n.id);cyl([x,y,z+.07],.07,.035,'galvanized',n.id)}
  else if(n.id==='gauge'){cyl([x,y,z+.1],.105,.045,'galvanized',n.id);const face=mesh(new T.CircleGeometry(.091,32),[x,y,z+.124],new T.MeshStandardMaterial({color:'#fffceb',roughness:.7}),n.id);pipe([[x,y,z+.13],[x+.045,y+.04,z+.13]],'polymer-black',.008,n.id)}
  else if(n.id==='sensor'){cyl(n.p,.12,.5,'polymer-black',n.id,system==='ah2'?'x':'y');block([x,y,z+.13],[.18,.2,.12],'polymer-black',n.id)}
  else {cyl(n.p,n.id==='quick'?.15:.1,.18,'copper-aged',n.id);if(n.id==='shutoff')block([x,y,z+.14],[.34,.06,.045],'valve-yellow',n.id);else if(n.id==='transducer')cyl([x,y,z+.07],.075,.15,'galvanized',n.id);else cyl([x,y,z+.11],.09,.04,'galvanized',n.id)}
 }
 return{root,objects,setVisible(v){root.visible=v},highlight(id){objects.forEach(o=>{if(!o.userData.originalMaterial)o.userData.originalMaterial=o.material;const base=o.userData.originalMaterial;if(o.userData.part===id){const m=base.clone();if(m.emissive){m.emissive.set('#4c2514');m.emissiveIntensity=.22}if(o.material!==base)o.material.dispose();o.material=m}else{if(o.material!==base)o.material.dispose();o.material=base}})}};
}
