import {createWaterFlowTour} from './water-flow-tour.js?v=41';
import {displayNote} from './display-notes.js?v=38';
import {createControlPointRender} from './control-point-render.js?v=35';
import * as T from './assets/three.module.js';
import {boxes,components,evidence,mainPath,servicePaths,filterFlow} from './ah3-data.js?v=36';
const $=s=>document.querySelector(s),host=$('#ah3-scene'),labelHost=$('#ah3-labels');
let selected='well',currentView='iso',moving=true,highlight=()=>{},focusComponent=()=>{};
function select(id,focus=false){const n=components.find(n=>n.id===id),b=boxes.find(b=>b.id===n.box);selected=id;$('#part-tag').textContent='';$('#part-tag').hidden=true;$('#part-name').textContent=n.name;$('#part-note').textContent=displayNote('ah3',n);$('#part-photo').src='assets/ah-3/'+(n.photo||b.photo);$('#part-photo').alt=n.name+' · Reference photograph';const thumbs=$('#component-photo-thumbs');thumbs.replaceChildren();(n.photos||[]).slice(1).forEach((photo,i)=>{const button=document.createElement('button'),img=document.createElement('img'),caption=document.createElement('span');button.className='photo-button';img.src='assets/ah-3/'+photo;img.alt=n.name+' · Location view';caption.textContent='Location view ↗';button.append(img,caption);button.onclick=()=>openReference(img.src,img.alt);thumbs.append(button)});document.querySelectorAll('[data-part]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.part===id)));highlight(id);if(focus)focusComponent(id)}
for(const n of components){const b=document.createElement('button');b.dataset.part=n.id;b.textContent=n.name;b.onclick=()=>select(n.id,true);$('#component-list').append(b)}
function openReference(src,caption){$('#large-photo').src=src;$('#large-photo').alt=caption;$('#photo-caption').textContent=caption;$('#photo-dialog').showModal()}$('#photo-open').onclick=()=>openReference($('#part-photo').src,components.find(n=>n.id===selected).name+' · Reference photograph');$('#close-dialog').onclick=()=>$('#photo-dialog').close();$('#photo-dialog').onclick=e=>{if(e.target===$('#photo-dialog'))$('#photo-dialog').close()};
let changeView=()=>{};document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{currentView=b.dataset.view;document.querySelectorAll('[data-view]').forEach(e=>e.setAttribute('aria-pressed',String(e===b)));$('#ah3-map').hidden=currentView!=='map';host.hidden=labelHost.hidden=currentView==='map';changeView(currentView)});
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
 // Grade and orientation are diagram references, not a surveyed terrain model.
 const grade=new T.GridHelper(14,28,'#abb8a5','#d5ddcf');grade.rotation.x=Math.PI/2;wireRoot.add(grade);
 wireRoot.attach(line([[-3.3,3.5,0],[5.4,3.5,0]],frame));label('TOWARD WORCESTER ROAD',[.8,4,0],null,true);
 label('PARKING / BUILDING SIDE',[1,-2.3,0],null,true);
 for(const b of boxes){if(b.id==='well')continue;if(b.shape==='round')cylinder([b.p[0],b.p[1],0],b.size[0]/2,.04);else wireBox(b.p,b.size);const n=components.find(n=>n.box===b.id);label(b.tag+' · '+b.name,[b.p[0],b.p[1]-b.size[1]/2-.35,.1],n.id);}
 const z=-evidence.componentDepthFt,well=components.find(n=>n.id==='well');
 cylinder(well.p,.26,.18,'well');line([[well.p[0],0,.2],[well.p[0],0,-3.4]],detail,true);label('Well head',[well.p[0],-.7,.1],'well');
 scene.add(new T.ArrowHelper(new T.Vector3(0,0,-1),new T.Vector3(well.p[0],0,-2.9),.6,detail,.16,.1));label('WELL DEPTH UNKNOWN',[well.p[0],0,-3.8],null,true);
 line([[well.p[0],0,well.p[2]],[well.p[0],0,z]],cyan,true);
 line(mainPath,cyan,true);
 for(const [p,dy] of [[filterFlow.inlet,1],[filterFlow.outlet,-1]])scene.add(new T.ArrowHelper(new T.Vector3(0,dy,0),new T.Vector3(p[0],dy===1?.2:.65,p[2]),.35,cyan,.12,.08));

 const flowPath=new T.CurvePath();for(let i=1;i<mainPath.length;i++){const a=new T.Vector3(...mainPath[i-1]),b=new T.Vector3(...mainPath[i]);if(a.distanceToSquared(b)>1e-10)flowPath.add(new T.LineCurve3(a,b))}
 for(const x of [2.8,.5])scene.add(new T.ArrowHelper(new T.Vector3(-1,0,0),new T.Vector3(x,0,z),.55,cyan,.16,.1));scene.add(new T.ArrowHelper(new T.Vector3(0,1,0),new T.Vector3(-2.8,1,z),.55,cyan,.16,.1));
 for(const branch of servicePaths)line(branch.points,branch.to==='winter'?detail:assumed,branch.to!=='winter');
 for(const n of components){if(n.id==='well')continue;if(n.id==='filter'){cylinder(n.p,.26,1.05,n.id,'y');}
 else if(n.id==='sensor'){cylinder(n.p,.12,.5,n.id,'y');cylinder([n.p[0],n.p[1],z+.13],.13,.12,n.id);}
 else{cylinder(n.p,n.id==='quick'?.15:.12,.22,n.id);if(n.id==='shutoff')line([[n.p[0]-.2,n.p[1],z+.14],[n.p[0]+.2,n.p[1],z+.14]],detail);}}
 label('NORMAL FLOW · WELL → CONTROLS → FILTER → SENSOR',[.9,-1.45,.1],null,true);
 label('SERVICE BRANCH · NO NORMAL FLOW',[-.3,-2.1,z],null,true);
 highlight=id=>{for(const o of objects.filter(o=>o.isLineSegments))o.material.color.set(o.userData.part===id?'#a20e37':detail)};
 const finished=createControlPointRender(renderer,scene,{boxes,components,path:mainPath,services:servicePaths,depth:evidence.componentDepthFt,system:'ah3'});objects.push(...finished.objects);let rendered=true;const wireHighlight=highlight;highlight=id=>{wireHighlight(id);finished.highlight(id)};wireRoot.visible=false;
 document.querySelectorAll('[data-finish]').forEach(b=>b.onclick=()=>{rendered=b.dataset.finish==='rendered';wireRoot.visible=!rendered;finished.setVisible(rendered);document.querySelectorAll('[data-finish]').forEach(e=>e.setAttribute('aria-pressed',String(e===b)))});
 const dots=Array.from({length:10},()=>{const o=new T.Mesh(new T.SphereGeometry(.045,8,6),new T.MeshBasicMaterial({color:cyan}));scene.add(o);return o});
 function size(){const w=host.clientWidth||800,h=host.clientHeight||500;renderer.setSize(w,h,false);camera.left=-span*w/h/2;camera.right=span*w/h/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix()}
 function position(){camera.position.set(target.x+16*Math.cos(azimuth)*Math.cos(elevation),target.y+16*Math.sin(azimuth)*Math.cos(elevation),target.z+16*Math.sin(elevation));camera.lookAt(target);camera.updateMatrixWorld()}
 changeView=v=>{if(v==='map')return;azimuth=v==='iso'||v==='context'||v==='detail'?-1.3:-Math.PI/2;elevation=v==='plan'?Math.PI/2-.001:v==='side'?.015:1.05;span=v==='context'?27:v==='side'?7:17;target.set(.6,1,v==='side'?-1.2:-.2);if(v==='detail'){const n=components.find(n=>n.id===selected),b=boxes.find(b=>b.id===n.box);target.set(b.p[0],b.p[1],n.p[2]);span=4.2}position();size();$('#caption').textContent=''};
 focusComponent=()=>{document.querySelector('[data-view=detail]').click();const r=host.getBoundingClientRect();if(r.top<0||r.bottom>innerHeight)host.closest('.wire-viewer').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'})};
 const route=mainPath;
 const stages=[
 {id:'well',title:'Well head',text:'The well supplies water to the main pipe and the downstream equipment.',points:route.slice(0,2)},
 {id:'shutoff',title:'Controls and service connections',text:'Water travels through the shutoff along the main pipe. The winterization connection and quick coupler are service branches; normal flow continues along the main pipe.',points:route.slice(1,4)},
 {id:'filter',title:'Through the filter',text:'Water enters the filter housing and returns to the outlet at the same end before continuing along the main pipe.',points:route.slice(3,7)},
 {id:'sensor',title:'Flow sensor and mainline',text:'Filtered water turns toward Worcester Road, passes through the flow sensor, and continues underground beyond this view.',points:route.slice(6)}];
 const tour=createWaterFlowTour({scene,stages,onSelect:id=>select(id),onStart:()=>document.querySelector('[data-view=iso]').click(),onStop:()=>document.querySelector('[data-view=iso]').click(),onFollow:(p,dt,first)=>{if(first)target.copy(p);else target.lerp(p,1-Math.exp(-dt*4));azimuth=-1.3;elevation=1.05;span=Math.max(5.8,5.8/(host.clientWidth/host.clientHeight));position();size();}});
 const ray=new T.Raycaster();ray.params.Line.threshold=.09;
 host.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};host.setPointerCapture(e.pointerId)};
 host.onpointermove=e=>{if(!drag)return;azimuth-=(e.clientX-drag.x)*.008;elevation=Math.max(.02,Math.min(Math.PI/2-.001,elevation+(e.clientY-drag.y)*.008));drag.x=e.clientX;drag.y=e.clientY;position()};
 host.onpointerup=e=>{if(drag&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<4){const r=host.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects(objects.filter(o=>rendered?finished.objects.includes(o):!finished.objects.includes(o)))[0];if(hit)select(hit.object.userData.part,true)}drag=null};host.onpointercancel=()=>drag=null;
 host.addEventListener('wheel',e=>{e.preventDefault();span=Math.max(3,Math.min(32,span*Math.exp(e.deltaY*.001)));size()},{passive:false});new ResizeObserver(size).observe(host);
 host.addEventListener('model-zoom',event=>{span=Math.max(3,Math.min(32,span*event.detail.factor));size()});
 let t=0,last=performance.now();function render(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;tour.tick(dt);if(moving)t+=dt;dots.forEach((o,i)=>{o.visible=moving&&currentView!=='map';o.position.copy(flowPath.getPointAt((t*.12+i/10)%1))});for(const l of labels){if(l.e.tagName==='BUTTON')l.e.textContent=l.text.replace(/^\d+ · /,'');const p=l.p.clone().project(camera);l.e.style.left=((p.x+1)*host.clientWidth/2)+'px';l.e.style.top=((-p.y+1)*host.clientHeight/2)+'px';l.e.style.display=p.z<-1||p.z>1||(rendered&&l.e.classList.contains('context')&&!l.e.textContent.includes('WORCESTER'))?'none':''}renderer.render(scene,camera);requestAnimationFrame(render)}
 changeView(new URLSearchParams(location.search).get('preview')==='1'?'context':'iso');select(selected);requestAnimationFrame(render);
}catch(e){$('#ah3-error').hidden=false;console.error('AH-3 wireframe unavailable',e)}
