import * as T from './assets/three.module.js';
import {nodes,edges,layout,toWorld,serviceBranches,irrigationTankEnvelope} from './wireframe-data.js?v=45';
import {nonIrrigationTanks} from './non-irrigation-data.js?v=31';
import {walkwayLayout} from './walkway-layout.js?v=24';
import {createRaisedBed,bedHeight,insideBed} from './landscape-bed.js?v=28';
import {shaftContext,garageContext} from './site-context.js?v=24';
import {createMaterialLibrary} from './material-library.js?v=24';

// Presentation surfaces share the reviewed drawing coordinates. No graph node,
// access-box center, tank center, depth or hydraulic path is moved here.
export function createSiteRender({scene,renderer}){
 const library=createMaterialLibrary(renderer),M=key=>library.get(key);
 const context=new T.Group(),irrigation=new T.Group(),nonIrrigation=new T.Group();
 scene.add(context,irrigation,nonIrrigation);
 const paths=[],selectable=[],highlighted=[],earthSupports=[];
 const plain=(color,roughness=.65,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const concrete=M('concrete-weathered'),walk=M('concrete-walk'),soil=M('soil'),turf=M('turf-autumn'),brick=M('brick-red'),asphalt=M('asphalt'),steel=M('galvanized'),copper=M('copper-aged'),black=M('polymer-black'),blue=M('enamel-blue'),yellow=M('valve-yellow');
 const pale=plain('#d0cec2',.88),dark=plain('#202927',.9),pipeGrey=plain('#6c7370',.48,.2),white=plain('#e5e5d7',.35),glass=new T.MeshPhysicalMaterial({color:'#e5f5ef',roughness:.2,metalness:.15,transparent:true,opacity:.38,depthWrite:false});
 function mesh(g,m,parent=context,id){library.uv(g,m.userData.tileSizeFt||4);const o=new T.Mesh(g,m);o.castShadow=o.receiveShadow=true;parent.add(o);if(id){o.userData.node=id;selectable.push(o)}return o}
 function box(size,p,m,parent=context,id){const o=mesh(new T.BoxGeometry(...size),m,parent,id);o.position.set(...p);return o}
 function cyl(r,h,p,m,parent=irrigation,axis=[0,0,1],id){const o=mesh(new T.CylinderGeometry(r,r,h,40,1),m,parent,id);o.position.set(...p);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...axis).normalize());return o}
 function rod(a,b,r,m,parent=irrigation,id){const va=new T.Vector3(...a),vb=new T.Vector3(...b);return cyl(r,va.distanceTo(vb),va.clone().add(vb).multiplyScalar(.5).toArray(),m,parent,vb.sub(va).toArray(),id)}
 function curve(points){const c=new T.CurvePath();for(let i=1;i<points.length;i++)c.add(new T.LineCurve3(new T.Vector3(...points[i-1]),new T.Vector3(...points[i])));return c}
 function pipe(points,r,m,parent=irrigation,id){return mesh(new T.TubeGeometry(curve(points),Math.max(24,points.length*10),r,12,false),m,parent,id)}
 function sphere(p,r,m,parent=irrigation,scale=[1,1,1],id){const o=mesh(new T.SphereGeometry(r,28,18),m,parent,id);o.position.set(...p);o.scale.set(...scale);return o}
 function torus(p,r,t,m,parent=irrigation,axis=[0,0,1],id){const o=mesh(new T.TorusGeometry(r,t,8,40),m,parent,id);o.position.set(...p);o.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(...axis).normalize());return o}
 const node=id=>nodes.find(n=>n.id===id),wp=p=>toWorld(p);
 // Lighting follows the soft, warm studio treatment of the Corbett reference.
 const lights=new T.Group();scene.add(lights);
 lights.add(new T.HemisphereLight('#e7f0ff','#78644c',2.0));
 const sun=new T.DirectionalLight('#fff0d9',3.2);sun.position.set(-38,45,70);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-55,right:55,top:55,bottom:-55,near:1,far:180});sun.shadow.normalBias=.06;sun.shadow.bias=-.00015;sun.shadow.radius=4;lights.add(sun);
 const fill=new T.DirectionalLight('#e3efff',1);fill.position.set(50,-20,35);lights.add(fill);
 const bounce=new T.DirectionalLight('#f2e9d6',.8);bounce.position.set(0,25,-10);lights.add(bounce);
 const envScene=new T.Scene();envScene.background=new T.Color('#c2cabc');
 for(const [p,size,color,intensity] of [[[-20,15,30],[32,28],'#ffffff',2],[[30,10,15],[20,35],'#edf6ff',1.6],[[0,-25,12],[40,20],'#dcd4bf',1.3]]){
  const m=new T.MeshBasicMaterial({color,side:T.DoubleSide});m.color.multiplyScalar(intensity);const card=new T.Mesh(new T.PlaneGeometry(...size),m);card.position.set(...p);card.lookAt(0,0,-5);envScene.add(card);
 }
 const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(envScene,.04,.1,150);scene.environment=environment.texture;pmrem.dispose();envScene.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});
 // Turf is a thin cut section. Real holes expose the tanks, shaft and reviewed
 // connection corridors; a translucent blanket cannot conceal the assemblies.
 const bounds={x0:-34,x1:34,y0:-21,y1:28.2};
 const holes=nonIrrigationTanks.map(n=>({x:n.p[0],y:n.p[1],w:n.size[0]+1.8,h:n.size[1]+1.8}));
 const tc=wp(irrigationTankEnvelope.center),ts=[irrigationTankEnvelope.size[0]*layout.scaleX,irrigationTankEnvelope.size[1]*layout.scaleY,7];
 holes.push({x:tc[0],y:tc[1],w:ts[0]+1.8,h:ts[1]+1.8});
 const sc=shaftContext.center,sw=shaftContext.lengthFt,sh=shaftContext.widthFt;
 holes.push({x:sc[0],y:sc[1],w:sw+1.0,h:sh+1.0});
 // Subdivide the surface, subtracting rectangular cutaways and narrow route
 // windows without overlapping holes or producing invalid polygon topology.
 const serviceWindows=serviceBranches.flatMap(b=>b.points.slice(1).map((p,i)=>{const a=b.points[i];return{x:(a[0]+p[0])/2,y:(a[1]+p[1])/2,w:Math.abs(a[0]-p[0])+1.1,h:Math.abs(a[1]-p[1])+1.1,floorZ:Math.min(a[2],p[2])-1}}));
 for(const n of nodes.filter(n=>n.access)){
  const p=n.accessP||n.p,a=n.access,angle=T.MathUtils.degToRad(a.angleDeg||0);
  serviceWindows.push({x:p[0],y:p[1],w:Math.abs(Math.cos(angle))*a.widthFt+Math.abs(Math.sin(angle))*a.lengthFt+.3,h:Math.abs(Math.sin(angle))*a.widthFt+Math.abs(Math.cos(angle))*a.lengthFt+.3,floorZ:n.p[2]-1});
 }
 holes.push({x:node('well').p[0],y:node('well').p[1],w:1.4,h:1.4});
 const routeWindows=[...edges.filter(e=>['well','supply','return','distribution'].includes(e.kind)).flatMap(e=>e.points.slice(1).map((b,i)=>{const a=e.points[i];if(a[2]!==b[2]&&a[0]===b[0]&&a[1]===b[1])return null;return{x:(a[0]+b[0])/2,y:(a[1]+b[1])/2,w:Math.abs(a[0]-b[0])+1.15,h:Math.abs(a[1]-b[1])+1.15,floorZ:Math.min(a[2],b[2])-1}}).filter(Boolean))];
 const raisedBed=createRaisedBed(T,{library,holes:[...holes,...routeWindows,...serviceWindows]});context.add(raisedBed.group);
 const fullGround=new T.Group(),cutGround=new T.Group();context.add(fullGround,cutGround);
 function subtract(pieces,windows){for(const h of windows){const cut=[h.x-h.w/2,h.x+h.w/2,h.y-h.h/2,h.y+h.h/2];pieces=pieces.flatMap(([l,r,b,t])=>{const L=Math.max(l,cut[0]),R=Math.min(r,cut[1]),B=Math.max(b,cut[2]),U=Math.min(t,cut[3]);if(L>=R||B>=U)return[[l,r,b,t]];return[[l,L,b,t],[R,r,b,t],[L,R,b,B],[L,R,U,t]].filter(p=>p[1]-p[0]>.03&&p[3]-p[2]>.03)})}return pieces}
 function surface(windows,parent){for(const [l,r,b,t] of subtract([[bounds.x0,bounds.x1,bounds.y0,bounds.y1]],windows)){box([r-l,t-b,9],[(l+r)/2,(b+t)/2,-4.6],soil,parent);box([r-l,t-b,.15],[(l+r)/2,(b+t)/2,-.015],turf,parent)}}
 surface([...holes,...routeWindows,...serviceWindows],fullGround);
 // Restore continuous grade when standalone tanks are hidden in surface mode.
 const hiddenTankGround=new T.Group();context.add(hiddenTankGround);
 for(const n of nonIrrigationTanks){
  const [x,y]=n.p,w=n.size[0]+1.8,h=n.size[1]+1.8;
  box([w,h,9],[x,y,-4.6],soil,hiddenTankGround);
  box([w,h,.15],[x,y,-.015],turf,hiddenTankGround);
  // Reuse the existing mulch finish only within its reviewed bed boundary.
  const positions=[],uv=[],step=.3;
  for(let l=x-w/2;l<x+w/2;l+=step)for(let b=y-h/2;b<y+h/2;b+=step){
   const r=Math.min(l+step,x+w/2),t=Math.min(b+step,y+h/2);
   if(!insideBed((l+r)/2,(b+t)/2))continue;
   for(const [px,py] of [[l,b],[r,b],[r,t],[l,b],[r,t],[l,t]]){positions.push(px,py,.075);uv.push(px/4,py/4)}
  }
  if(positions.length){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();mesh(g,raisedBed.surfaceMaterial,hiddenTankGround)}
 }

 // Illustrative earth bottoms sit one foot below the lowest pipe in each
 // corridor. At crossings the deeper corridor wins, keeping both pipes exposed.
 // Tank chambers and the ventilation shaft retain their actual concrete floors.
 const trenchBeds=[...routeWindows,...serviceWindows];
 for(const bed of trenchBeds){
  const windows=[...holes,...trenchBeds.filter(other=>other.floorZ<bed.floorZ)];
  const footprint=[[bed.x-bed.w/2,bed.x+bed.w/2,bed.y-bed.h/2,bed.y+bed.h/2]];
  for(const [l,r,b,t] of subtract(footprint,windows))earthSupports.push(box([r-l,t-b,.4],[(l+r)/2,(b+t)/2,bed.floorZ-.2],soil));
 }
 // Open a broad presentation section toward the road, rather than allowing
 // foreground soil to hide the tank walls and the deep WG-3 assembly.
 surface([{x:-2,y:3.6,w:52,h:49.2}],cutGround);
 for(const [l,r,b,t] of subtract([[-28,24,-21,28.2]],[{x:sc[0],y:-10.5,w:sw+2,h:21},{x:node('well').p[0],y:node('well').p[1],w:1.4,h:1.4}]))box([r-l,t-b,.35],[(l+r)/2,(b+t)/2,-9.45],soil,cutGround);
 // Presentation excavation outside the concrete shaft. The three earth faces
 // meet the existing cut-ground section and its base follows the shaft bottom.
 // Subtract the shaft footprint so its original concrete floor stays exposed.
 const shaftEarth=new T.Group();context.add(shaftEarth);
 const excavation={left:sc[0]-sw/2-1,right:sc[0]+sw/2+1,back:-21,front:0};
 const bottom=-layout.shaftDepth-.01,top=-9.45,wallHeight=top-bottom;
 for(const [l,r,b,t] of subtract([[excavation.left,excavation.right,excavation.back,excavation.front]],[{x:sc[0],y:sc[1],w:sw+.36,h:sh+.36}]))box([r-l,t-b,.35],[(l+r)/2,(b+t)/2,bottom-.175],soil,shaftEarth);
 for(const x of [excavation.left,excavation.right])box([.2,excavation.front-excavation.back,wallHeight],[x,(excavation.back+excavation.front)/2,(top+bottom)/2],soil,shaftEarth);
 box([excavation.right-excavation.left,.2,wallHeight],[(excavation.left+excavation.right)/2,excavation.front,(top+bottom)/2],soil,shaftEarth);
 const wellSurface=node('well').p;
 // Well continuation is exposed below the displayed soil section; its endpoint is a drawing limit, not a measured depth.
 // Quiet base beneath the sectional study, separate from actual ground levels.
 const base=box([76,82,.45],[0,4,-19.25],plain('#d7d4c3',.95));base.castShadow=false;
 // Road and curb use the existing roadward edge; their widths are context.
 box([72,10.3,.45],[0,33.4,-.17],asphalt);box([72,.45,.5],[0,28.1,.06],walk);
 box([72,.12,.015],[0,33.3,.071],plain('#c9b56c',.9));
 // The supplied sidewalk alignment is retained, with a physical-width ribbon.
 function ribbon(raw,width,m){const ps=raw.map(p=>new T.Vector3(...wp(p))),c=new T.CatmullRomCurve3(ps,false,'centripetal'),v=[],uv=[],idx=[];for(let i=0;i<=100;i++){const p=c.getPoint(i/100),t=c.getTangent(i/100),n=new T.Vector3(-t.y,t.x,0).normalize().multiplyScalar(width/2);for(const s of [-1,1]){v.push(p.x+n.x*s,p.y+n.y*s,.09);uv.push((p.x+n.x*s)/4,(p.y+n.y*s)/4)}if(i<100&&!routeWindows.some(h=>Math.abs(p.x-h.x)<h.w/2&&Math.abs(p.y-h.y)<h.h/2)){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3)}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const o=mesh(g,m);o.castShadow=false;return c}
 const walkway=ribbon(walkwayLayout[0].points,walkwayLayout[0].widthFt,walk);
 ribbon(walkwayLayout[1].points,walkwayLayout[1].widthFt,walk);
 for(let i=2;i<walkway.getLength()/4;i++){const p=walkway.getPointAt(i*4/walkway.getLength()),t=walkway.getTangentAt(i*4/walkway.getLength()),n=new T.Vector3(-t.y,t.x,0).multiplyScalar(1.45);rod([p.x+n.x,p.y+n.y,.105],[p.x-n.x,p.y-n.y,.105],.012,plain('#999c8e',1),context)}
 // West Garage: a photo-informed facade on the reviewed footprint edge.
 // Bay count, height and depth are presentation massing, not measured records.
 const garageStart=new Set(context.children);
 const gy=garageContext.frontY,gx=garageContext.westX+garageContext.widthFt/2,gw=garageContext.widthFt,gz=7.4;
 box([gw,8.4,14.8],[gx,gy-4.2,gz],brick);
 for(const z of [.8,7.3,14.6])box([gw,.38,.8],[gx,gy+.06,z],pale);
 for(const z of [4.5,10.8])for(let x=garageContext.westX+4.5;x<garageContext.westX+gw-4;x+=9.5){box([8.1,.12,3.2],[x,gy+.22,z],dark);box([.55,.65,5.8],[x+4.25,gy+.05,z],pale)}
 for(let x=garageContext.westX+1;x<garageContext.westX+gw-1;x+=2)for(const z of [2.4,3,3.6,8.9,9.5,10.1])box([1.7,.09,.07],[x,gy+.35,z],plain('#a3aaa2',.6,.4));
 box([gw+.5,8.7,.35],[gx,gy-4.1,15.0],pale);
 const garageObjects=context.children.filter(o=>!garageStart.has(o));
 const shaftGrate=new T.Group();context.add(shaftGrate);
 for(let x=sc[0]-sw/2+.08;x<sc[0]+sw/2;x+=.18)box([.035,sh,.08],[x,sc[1],.08],steel,shaftGrate);
 for(const yy of [-sh/2,-sh/4,0,sh/4,sh/2])box([sw,.045,.09],[sc[0],sc[1]+yy,.08],steel,shaftGrate);
 for(const yy of [-sh/2,sh/2])box([sw+.3,.18,.22],[sc[0],sc[1]+yy,.03],concrete);
 // In the shaft, two walls are omitted toward the viewing side. Formwork seams
 // and pores are visible; dark streaks are generalized from the field photo.
 box([sw,sh,.38],[sc[0],sc[1],-18.2],concrete);

 const shaftBackWall=box([sw,.35,18],[sc[0],sc[1]+sh/2,-9],concrete);
 const shaftSideWall=box([.35,sh,18],[sc[0]-sw/2,sc[1],-9],concrete);
 // Preserve the concrete interior; exposed outside faces read as earth.
 shaftSideWall.material=[concrete,soil,soil,soil,concrete,concrete];
 shaftBackWall.material=[soil,soil,soil,concrete,concrete,concrete];
 for(const z of [-6,-12]){const seam=box([sw,.025,.035],[sc[0],sc[1]+sh/2-.19,z],dark);shaftBackWall.attach(seam);const sideSeam=box([.025,sh,.035],[sc[0]-sw/2+.19,sc[1],z],dark);shaftSideWall.attach(sideSeam)}
 // Tank shells match the agreed envelope; no tank connections are invented.
 function tankShell(p,size,parent,id,ladder=false){
  const [w,d,h]=size,t=.23,top=p[2]+h/2,bottom=p[2]-h/2;
  // Illustrative earth support meets the tank underside and fills the pit
  // footprint, leaving a visible soil margin outside the concrete chamber.
  // It follows the tank visibility toggle and does not alter its elevation.
  earthSupports.push(box([w+1.8,d+1.8,.6],[p[0],p[1],bottom-.3],soil,parent));
  box([w,d,t],[p[0],p[1],bottom+t/2],concrete,parent,id);
  box([w,t,h],[p[0],p[1]-d/2+t/2,p[2]],concrete,parent,id);
  box([t,d,h],[p[0]-w/2+t/2,p[1],p[2]],concrete,parent,id);
  // Fine transparent bounds show the two omitted faces without hiding interiors.
  box([w,.025,h],[p[0],p[1]+d/2,p[2]],glass,parent,id);
  box([.025,d,h],[p[0]+w/2,p[1],p[2]],glass,parent,id);
  for(const z of [top,bottom]){rod([p[0]-w/2,p[1]+d/2,z],[p[0]+w/2,p[1]+d/2,z],.024,pale,parent);rod([p[0]+w/2,p[1]-d/2,z],[p[0]+w/2,p[1]+d/2,z],.024,pale,parent)}
  if(ladder){const y=p[1]-d/2+.38;for(const dx of [-.65,.65])rod([p[0]+dx,y,bottom+.25],[p[0]+dx,y,top-.2],.045,steel,parent);for(let z=bottom+.6;z<top-.3;z+=.85)rod([p[0]-.65,y,z],[p[0]+.65,y,z],.04,steel,parent)}
 }
 nonIrrigationTanks.forEach(n=>{tankShell(n.p,n.size,nonIrrigation,n.id,n.id==='nonirr_1');if(n.id==='nonirr_2'){const surface=bedHeight(n.p[0],n.p[1]);cyl(.48,surface-n.topZ,[n.p[0],n.p[1],(surface+n.topZ)/2],concrete,nonIrrigation,[0,0,1],n.id);cyl(.53,.16,[n.p[0],n.p[1],surface+.08],M('iron-access'),nonIrrigation,[0,0,1],n.id)}});
 const upstream=new T.Group();irrigation.add(upstream);tankShell(tc,ts,upstream,'tank');
 // Tank access and well are supported by the surface photos. Green valve-box
 // covers are excluded. Non-irrigation access locations stay schematic.
 for(const access of irrigationTankEnvelope.accessCenters){
  const [x,y]=wp(access);
  cyl(.65,1.5,[x,y,-.75],concrete,upstream,[0,0,1],'tank');
  cyl(.67,.16,[x,y,.08],M('iron-access'),upstream,[0,0,1],'tank');
 }
 const well=node('well').p; cyl(.22,.55,[well[0],well[1],.2],steel,upstream,[0,0,1],'well');cyl(.29,.09,[well[0],well[1],.51],steel,upstream,[0,0,1],'well');
 const wellBottom=-12;const wellPipeMaterial=library.get('galvanized',{transparent:true,opacity:.3,depthWrite:false});
 rod([well[0],well[1],wellBottom],[well[0],well[1],well[2]],.18,wellPipeMaterial,upstream,'well');
 const wellDrops=Array.from({length:9},()=>sphere([well[0],well[1],wellBottom],.09,new T.MeshBasicMaterial({color:'#16a9c5'}),upstream));
 // Pump remains an explicitly assumed symbol aligned with the access, not a
 // manufacturer-specific model. No water level/capacity is asserted.
 cyl(.26,1.1,node('pump').p,steel,upstream,[0,0,1],'pump');
 // Same exact reviewed hydraulic polylines, rendered as tubular surfaces.
 edges.forEach(e=>{const assumed=!(e.kind==='assembly'||e.inline);const material=assumed?library.get('polymer-black',{transparent:true,opacity:.52,depthWrite:false}):e.kind==='assembly'?copper:pipeGrey;const o=pipe(e.points,e.kind==='assembly'?.075:.09,material,irrigation,e.to);paths.push({o,edge:e,baseOpacity:assumed?.52:1});
  if(e.kind==='assembly')for(const p of e.points.slice(1,-1))sphere(p,.1,copper,irrigation);
 });
 // Visible WG-3 unions, lever valves, pressure vessel, transducer and gauge.
 const y=-4.15*layout.scaleY,hz=-layout.headerDepth;
 for(const x of [.2,1.2]){
  const xx=x*layout.scaleX;
  for(const z of [-6.5,-12.3]){cyl(.13,.25,[xx,y,z],steel);torus([xx,y,z],.13,.018,steel)}
  cyl(.135,.4,[xx,y,-9.0],black);box([.08,.12,.72],[xx+.18,y+.05,-8.8],yellow,irrigation);
 }
 const tankP=[.85*layout.scaleX,y,-12.3];
 pipe([[tankP[0],y,hz],[tankP[0],y,tankP[2]-.45]],.055,copper);
 cyl(.45,.75,tankP,blue);sphere([tankP[0],y,tankP[2]+.375],.45,blue,irrigation,[1,1,.45]);sphere([tankP[0],y,tankP[2]-.375],.45,blue,irrigation,[1,1,.45]);
 // Manufacturer visible in the source photo; no unverified model number.
 function decal(text,p,w,h,axis=[0,1,0],parent=irrigation){const c=document.createElement('canvas');c.width=512;c.height=128;const a=c.getContext('2d');a.fillStyle='#eff1e4';a.font='600 47px Arial';a.textAlign='center';a.textBaseline='middle';a.fillText(text,256,65,490);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const o=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));o.position.set(...p);o.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(...axis));parent.add(o);return o}
 decal('WELL-X-TROL',[tankP[0],y-.455,tankP[2]],.88,.24,[0,-1,0]);
 const tx=.45*layout.scaleX;pipe([[tx,y,hz],[tx,y,hz+.65]],.04,copper);cyl(.07,.25,[tx,y,hz+.76],steel);
 const gauge=[tankP[0],y-.18,hz+.6];cyl(.22,.13,gauge,steel,irrigation,[0,1,0]);cyl(.185,.015,[gauge[0],gauge[1]-.08,gauge[2]],white,irrigation,[0,1,0]);
 for(let i=0;i<9;i++){const a=-.8+i*.4;rod([gauge[0]+Math.sin(a)*.135,gauge[1]-.095,gauge[2]+Math.cos(a)*.135],[gauge[0]+Math.sin(a)*.16,gauge[1]-.095,gauge[2]+Math.cos(a)*.16],.007,dark)}
 rod(gauge.map((v,i)=>i===1?v-.10:v),[gauge[0]-.08,gauge[1]-.10,gauge[2]+.1],.008,dark);
 // Conduit on the left follows the relationship visible in WG-3 photographs.
 for(let i=0;i<4;i++){const x=.2*layout.scaleX-.65-i*.18;pipe([[x,y-.18,-14.4],[x,y-.18,-6.4],[x+.2,y-.18,-5.8]],.045,steel);}
 // Access openings retain the existing source-photo centers and shapes.
 for(const id of ['v0','v1','filter','winter','meter']){
  const n=node(id),p=n.accessP||n.p,a=n.access;
  if(a.shape==='round')torus([p[0],p[1],.03],a.widthFt/2,.045,black,irrigation,[0,0,1],id);
  else{const g=new T.Group();g.position.set(p[0],p[1],.02);g.rotation.z=T.MathUtils.degToRad(a.angleDeg);irrigation.add(g);for(const s of [-1,1]){box([.06,a.lengthFt,.15],[s*a.widthFt/2,0,-.04],black,g,id);box([a.widthFt,.06,.15],[0,s*a.lengthFt/2,-.04],black,g,id)}}
 }
 for(const id of ['v0','v1']){const p=node(id).p;cyl(.12,.25,p,steel,irrigation,[0,1,0],id);cyl(.045,.35,[p[0],p[1],p[2]+.2],steel,irrigation,[0,0,1],id);box([.42,.08,.05],[p[0]+.1,p[1],p[2]+.4],yellow,irrigation,id)}
 const filterNode=node('filter'),fp=[filterNode.p[0]+.4,filterNode.p[1],filterNode.p[2]];
 // Sketch: flat housing back on the mainline, rounded body to the right.
 cyl(.13,.35,filterNode.p,black,irrigation,[0,1,0],'filter');
 cyl(.22,.8,fp,black,irrigation,[1,0,0],'filter');sphere([fp[0]+.4,fp[1],fp[2]],.22,black,irrigation,[.35,1,1],'filter');for(const xx of [-.3,.3])torus([fp[0]+xx,fp[1],fp[2]],.23,.035,black,irrigation,[1,0,0],'filter');decal('NETAFIM',[fp[0],fp[1],fp[2]+.235],.43,.12,[0,0,1]);
 // Explanatory x-ray guide: this is the confirmed flow pattern, not a claim
 // about the exact hidden filter-element channels. No line bypasses the housing.
 const filterEdge=edges.find(e=>e.throughFilter);
 const filterFlowGuide=new T.Line(new T.BufferGeometry().setFromPoints(filterEdge.points.slice(0,-1).map(p=>new T.Vector3(...p))),new T.LineDashedMaterial({color:'#00b5cf',dashSize:.06,gapSize:.025,transparent:true,opacity:.85,depthTest:false}));
 filterFlowGuide.computeLineDistances();filterFlowGuide.renderOrder=7;irrigation.add(filterFlowGuide);
 const mp=node('meter').p;cyl(.12,.75,mp,white,irrigation,[0,1,0],'meter');cyl(.115,.28,[mp[0],mp[1],mp[2]+.16],black,irrigation,[0,0,1],'meter');
 for(const branch of serviceBranches){pipe(branch.points,.055,steel,irrigation,'winter');const p=branch.points.at(-1);cyl(.1,.16,p,steel,irrigation,[0,0,1],'winter');box([.32,.06,.05],[p[0]+.08,p[1],p[2]+.12],yellow,irrigation,'winter')}
 // Selection accents never change an equipment material or its evidence status.
 function highlight(id){for(const o of highlighted){o.parent?.remove(o);o.geometry?.dispose();o.material?.dispose()}highlighted.length=0;
  const n=[...nodes,...nonIrrigationTanks].find(n=>n.id===id);if(!n)return;const pos=n.layer==='non-irrigation'?[n.p[0],n.p[1],(n.surfaceAccessZ??n.topZ)+.05]:(n.displayP||n.p);const ring=torus(pos,n.layer==='non-irrigation'?.5:.3,.025,new T.MeshBasicMaterial({color:'#a20e37',depthTest:false}),n.layer==='non-irrigation'?nonIrrigation:irrigation);ring.renderOrder=5;highlighted.push(ring);
 }
 function filter(mode){filterFlowGuide.material.opacity=mode==='supply'?.15:.85;paths.forEach(({o,edge,baseOpacity})=>{const belongs=mode==='all'||(mode==='supply'?['supply','well'].includes(edge.kind):['return','assembly','distribution'].includes(edge.kind));o.material.transparent=baseOpacity<1||!belongs;o.material.opacity=belongs?baseOpacity:.12})}
 // Each pipe needs its own filter opacity; the rest of the material library can
 // be shared. Cloning prevents path emphasis from tinting all copper objects.
 paths.forEach(p=>p.o.material=p.o.material.clone());
 let view='iso',cut=true,lastRendered=true,lastNon=true;function surfaceView(){hiddenTankGround.visible=!lastNon&&!cut&&view!=='section';shaftEarth.visible=view!=='section';garageObjects.forEach(o=>o.visible=view!=='post');earthSupports.forEach(o=>o.visible=!cut&&view!=='section');raisedBed.mode(cut,view!=='section');shaftGrate.visible=!cut&&view!=='section';fullGround.visible=!cut&&view!=='section';cutGround.visible=cut&&view!=='section';shaftBackWall.visible=view==='section';shaftSideWall.visible=view!=='section';upstream.visible=view!=='section';nonIrrigation.visible=lastRendered&&lastNon&&view!=='section';paths.forEach(({o,edge})=>o.visible=view!=='section'||edge.kind==='assembly'||edge.to==='inlet'||edge.from==='outlet')}
 return{context,irrigation,nonIrrigation,animate(time,active){wellDrops.forEach((o,i)=>{o.visible=active;o.position.z=wellBottom+((time*.22+i/wellDrops.length)%1)*(well[2]-wellBottom)})},view(v){view=v;surfaceView()},cutaway(show){cut=show;surfaceView()},selectable,highlight,filter,visibility(rendered,irr,non){lastRendered=rendered;lastNon=non;context.visible=rendered;irrigation.visible=rendered&&irr;lights.visible=rendered;surfaceView()},dispose(){raisedBed.dispose();library.dispose();environment.dispose()}};
}
