import {createWaterFlowTour} from './water-flow-tour.js?v=41';
import {displayNote} from './display-notes.js?v=38';
import {createControlPointRender} from './control-point-render.js?v=37';
import * as T from './assets/three.module.js';
import {boxes,components,evidence,filterFlow,instrumentTee} from './ah2-data.js?v=43';
const $=s=>document.querySelector(s),host=$('#ah2-scene'),labelHost=$('#ah2-labels');
let selected='well',currentView='iso',moving=true,highlight=()=>{},focusComponent=()=>{};
function select(id,focus=false){const n=components.find(n=>n.id===id),b=boxes.find(b=>b.id===n.box);selected=id;$('#part-tag').textContent='';$('#part-tag').hidden=true;$('#part-name').textContent=n.name;$('#part-note').textContent=displayNote('ah2',n);$('#part-photo').src='assets/ah-2/'+(n.photo||b.photo);$('#part-photo').classList.toggle('annotation-contrast',/\/box-2\.png(?:$|\?)/.test($('#part-photo').src));$('#part-photo').alt=n.name+' · Reference photograph';const thumbs=$('#component-photo-thumbs');thumbs.replaceChildren();(n.photos||[]).slice(1).forEach((photo,i)=>{const button=document.createElement('button'),img=document.createElement('img'),caption=document.createElement('span');button.className='photo-button';img.src='assets/ah-2/'+photo;img.classList.toggle('annotation-contrast',photo==='box-2.png');img.alt=n.name+' · Additional photograph';caption.textContent=photo==='box-2.png'?'Annotated valve box ↗':'Additional photograph ↗';button.append(img,caption);button.onclick=()=>openReference(img.src,img.alt);thumbs.append(button)});document.querySelectorAll('[data-part]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.part===id)));highlight(id);if(focus)focusComponent(id)}
for(const n of components){const b=document.createElement('button');b.dataset.part=n.id;b.textContent=n.name;b.onclick=()=>select(n.id,true);$('#component-list').append(b)}
function openReference(src,caption){$('#large-photo').src=src;$('#large-photo').classList.toggle('annotation-contrast',/\/box-2\.png(?:$|\?)/.test(src));$('#large-photo').alt=caption;$('#photo-caption').textContent=caption;$('#photo-dialog').showModal()}$('#photo-open').onclick=()=>openReference($('#part-photo').src,components.find(n=>n.id===selected).name+' · Reference photograph');$('#close-dialog').onclick=()=>$('#photo-dialog').close();$('#photo-dialog').onclick=e=>{if(e.target===$('#photo-dialog'))$('#photo-dialog').close()};
let changeView=()=>{};document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{currentView=b.dataset.view;document.querySelectorAll('[data-view]').forEach(e=>e.setAttribute('aria-pressed',String(e===b)));$('#ah2-map').hidden=currentView!=='map';host.hidden=labelHost.hidden=currentView==='map';changeView(currentView)});
$('#reset').onclick=()=>changeView(currentView);
select(selected);
try{
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor('#edf0e9');host.append(renderer.domElement);
 const scene=new T.Scene(),wireRoot=new T.Group();scene.add(wireRoot);const camera=new T.OrthographicCamera(-6,6,4,-4,.1,100);camera.up.set(0,0,1);
 let azimuth=-Math.PI/2,elevation=.7,span=10.4,target=new T.Vector3(.5,0,-.6),drag=null;
 const labels=[],objects=[],cyan='#078b9e',frame='#8c9b8e',detail='#465f55',assumed='#926074';
 function line(points,color=frame,dashed=false){const g=new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),m=dashed?new T.LineDashedMaterial({color,dashSize:.13,gapSize:.09}):new T.LineBasicMaterial({color}),o=new T.Line(g,m);if(dashed)o.computeLineDistances();o.renderOrder=3;o.material.depthTest=false;scene.add(o);return o}
 function edge(g,p,color=detail,id,rotation){const o=new T.LineSegments(new T.EdgesGeometry(g,22),new T.LineBasicMaterial({color}));g.dispose();o.position.set(...p);if(rotation)o.rotation.set(...rotation);if(id){o.userData.part=id;objects.push(o)}wireRoot.add(o);return o}
 function wireBox(p,size,color=frame){return edge(new T.BoxGeometry(...size),p,color)}
 function cylinder(p,r,h,id,axis='z',color=detail){return edge(new T.CylinderGeometry(r,r,h,16),p,color,id,axis==='z'?[Math.PI/2,0,0]:axis==='x'?[0,0,Math.PI/2]:[0,0,0])}
 function label(text,p,id,context=false){if(/(?:≈|\bft\b|\bin BELOW|DEPTH UNKNOWN|WELL DEPTH)/i.test(text))return document.createElement('span');const e=document.createElement(id?'button':'span');e.textContent=text;e.className='wire-label'+(context?' context':'');if(id){e.dataset.part=id;e.onclick=()=>select(id,true);e.setAttribute('aria-label',components.find(n=>n.id===id).name)}labelHost.append(e);labels.push({e,text,p:new T.Vector3(...p)});return e}
 // Grade is a reference plane, not an invented site terrain or building footprint.
 const grade=new T.GridHelper(12,24,'#abb8a5','#d5ddcf');grade.rotation.x=Math.PI/2;wireRoot.add(grade);
 wireRoot.attach(line([[-4.4,2,0],[5,2,0]],frame));
 wireRoot.add(new T.ArrowHelper(new T.Vector3(0,1,0),new T.Vector3(1,2.1,0),.8,detail,.18,.13));label('TOWARD WORCESTER ROAD',[1,3.25,.1],null,true);label('BUILDING SIDE',[.5,-2.8,0],null,true);
 for(const b of boxes){if(b.shape==='round')edge(new T.TorusGeometry(.5,.025,8,40),[b.p[0],b.p[1],0]);else wireBox(b.p,b.size);label(b.tag+' · '+b.name,[b.p[0],-1.2,.1],components.find(n=>n.box===b.id).id);}
 // Estimated clear gaps. Box widths themselves are illustrative, not surveyed.
 const z=-evidence.componentDepthFt,well=components.find(n=>n.id==='well'),filter=components.find(n=>n.id==='filter'),back=filterFlow.inlet[1];
 // This dashed sequence is a conceptual route, not a claim about buried elbows.
 line(filterFlow.points,cyan,true);
 const flowPath=new T.CurvePath();for(let i=1;i<filterFlow.points.length;i++){const a=new T.Vector3(...filterFlow.points[i-1]),b=new T.Vector3(...filterFlow.points[i]);if(a.distanceToSquared(b)>1e-10)flowPath.add(new T.LineCurve3(a,b))}
 for(const [p,direction] of [[filterFlow.inlet,1],[filterFlow.outlet,-1]]){const start=[p[0],direction===1?p[1]+.05:p[1]+.5,p[2]];scene.add(new T.ArrowHelper(new T.Vector3(0,direction,0),new T.Vector3(...start),.38,cyan,.12,.08));}

 
 for(const x of [(well.p[0]+boxes[1].p[0])/2,(boxes[1].p[0]+filterFlow.inlet[0])/2]){const a=new T.ArrowHelper(new T.Vector3(-1,0,0),new T.Vector3(x,back,z),.48,cyan,.15,.1);scene.add(a)}
 label('FLOW  1 → 2 → 3  ·  RIGHT TO LEFT',[.5,-.65,.48],null,true);
 cylinder(well.p,.33,.12,'well');
 line([[well.p[0],0,z],[well.p[0],0,-3.5]],detail,true);scene.add(new T.ArrowHelper(new T.Vector3(0,0,-1),new T.Vector3(well.p[0],0,-3),.65,detail,.16,.12));label('WELL CONTINUES · DEPTH UNKNOWN',[well.p[0],0,-3.9],null,true);
 for(const id of ['winter1','winter2','shutoff','gauge','transducer','pressure','filter','sensor']){
  const n=components.find(n=>n.id===id);
  if(id==='sensor'){cylinder(n.p,.12,.5,id,'x');}
  else if(id==='pressure'){cylinder(n.p,.24,.55,id,'y',assumed);}
  else if(id==='filter'){cylinder(n.p,.19,19/30,id,'y');}
  else if(id==='gauge'){cylinder([n.p[0],n.p[1],z+.1],.105,.05,id);line([[n.p[0]-.06,n.p[1],z+.15],[n.p[0]+.06,n.p[1]+.07,z+.15]],detail);}
  else if(id==='shutoff'){cylinder(n.p,.12,.18,id);line([[n.p[0]-.18,n.p[1],z+.13],[n.p[0]+.18,n.p[1],z+.13]],detail);}
  else cylinder(n.p,.11,.2,id);
 }
 for(const points of [instrumentTee.header,instrumentTee.stem,...instrumentTee.risers.map(r=>r.points)])wireRoot.attach(line(points,detail));
 
 highlight=id=>{for(const o of objects.filter(o=>o.isLineSegments))o.material.color.set(o.userData.part===id?'#a20e37':o.userData.part==='pressure'?assumed:detail)};
 const finished=createControlPointRender(renderer,scene,{boxes,components,path:filterFlow.points,instrumentTee,depth:evidence.componentDepthFt,system:'ah2'});objects.push(...finished.objects);let rendered=true;const wireHighlight=highlight;highlight=id=>{wireHighlight(id);finished.highlight(id)};wireRoot.visible=false;
 document.querySelectorAll('[data-finish]').forEach(b=>b.onclick=()=>{rendered=b.dataset.finish==='rendered';wireRoot.visible=!rendered;finished.setVisible(rendered);document.querySelectorAll('[data-finish]').forEach(e=>e.setAttribute('aria-pressed',String(e===b)))});
 const dots=Array.from({length:10},()=>{const o=new T.Mesh(new T.SphereGeometry(.045,8,6),new T.MeshBasicMaterial({color:cyan}));scene.add(o);return o});
 function size(){const w=host.clientWidth||800,h=host.clientHeight||500;renderer.setSize(w,h,false);camera.left=-span*w/h/2;camera.right=span*w/h/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix()}
 function position(){camera.position.set(target.x+16*Math.cos(azimuth)*Math.cos(elevation),target.y+16*Math.sin(azimuth)*Math.cos(elevation),target.z+16*Math.sin(elevation));camera.lookAt(target);camera.updateMatrixWorld()}
 changeView=v=>{if(v==='map')return;azimuth=v==='iso'||v==='context'||v==='detail'?-1.3:-Math.PI/2;elevation=v==='plan'?Math.PI/2-.001:v==='side'?.015:1.05;span=v==='context'?20:v==='side'?7:14;target.set(0,1,v==='side'?-1.4:-.2);if(v==='detail'){const n=components.find(n=>n.id===selected),b=boxes.find(b=>b.id===n.box);target.set(b.p[0],b.p[1],n.p[2]);span=4.2}position();size();$('#caption').textContent=''};
 focusComponent=()=>{document.querySelector('[data-view=detail]').click();const r=host.getBoundingClientRect();if(r.top<0||r.bottom>innerHeight)host.closest('.wire-viewer').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'})};
 const route=filterFlow.points,control=[0,route[1][1],route[1][2]];
 const stages=[
 {id:'well',title:'Well head',text:'Water from the well enters the main pipe and travels toward the controls.',points:route.slice(0,2)},
 {id:'shutoff',title:'Pressure and controls',text:'Water travels along the main pipe past the shutoff and pressure controls. The pressure instruments and winterization connections branch from this pipe.',points:[route[1],control]},
 {id:'filter',title:'Through the filter',text:'Water enters the filter housing, passes through it, and returns to the outlet at the same end.',points:[control,...route.slice(2,6)]},
 {id:'sensor',title:'Flow sensor and mainline',text:'Filtered water passes through the inline flow sensor, beneath the round valve box, and continues toward the field.',points:route.slice(5)}];
 const tour=createWaterFlowTour({scene,stages,onSelect:id=>select(id),onStart:()=>document.querySelector('[data-view=iso]').click(),onStop:()=>document.querySelector('[data-view=iso]').click(),onFollow:(p,dt,first)=>{if(first)target.copy(p);else target.lerp(p,1-Math.exp(-dt*4));azimuth=-1.3;elevation=1.05;span=Math.max(5.8,5.8/(host.clientWidth/host.clientHeight));position();size();}});
 const ray=new T.Raycaster();ray.params.Line.threshold=.09;
 host.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};host.setPointerCapture(e.pointerId)};
 host.onpointermove=e=>{if(!drag)return;azimuth-=(e.clientX-drag.x)*.008;elevation=Math.max(.02,Math.min(Math.PI/2-.001,elevation+(e.clientY-drag.y)*.008));drag.x=e.clientX;drag.y=e.clientY;position()};
 host.onpointerup=e=>{if(drag&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<4){const r=host.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects(objects.filter(o=>rendered?finished.objects.includes(o):!finished.objects.includes(o)))[0];if(hit)select(hit.object.userData.part,true)}drag=null};host.onpointercancel=()=>drag=null;
 host.addEventListener('wheel',e=>{e.preventDefault();span=Math.max(3,Math.min(32,span*Math.exp(e.deltaY*.001)));size()},{passive:false});new ResizeObserver(size).observe(host);
 host.addEventListener('model-zoom',event=>{span=Math.max(3,Math.min(32,span*event.detail.factor));size()});
 let t=0,last=performance.now();function render(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;tour.tick(dt);if(moving)t+=dt;dots.forEach((o,i)=>{o.visible=moving&&currentView!=='map';o.position.copy(flowPath.getPointAt((t*.12+i/10)%1))});for(const l of labels){if(l.e.tagName==='BUTTON')l.e.textContent=l.text.replace(/^\d+ · /,'');const p=l.p.clone().project(camera);l.e.style.left=((p.x+1)*host.clientWidth/2)+'px';l.e.style.top=((-p.y+1)*host.clientHeight/2)+'px';l.e.style.display=p.z<-1||p.z>1||(rendered&&l.e.classList.contains('context')&&!l.e.textContent.includes('WORCESTER'))?'none':''}renderer.render(scene,camera);requestAnimationFrame(render)}
 changeView(new URLSearchParams(location.search).get('preview')==='1'?'context':'iso');select(selected);requestAnimationFrame(render);
}catch(e){$('#ah2-error').hidden=false;console.error('AH-2 wireframe unavailable',e)}
