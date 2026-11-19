import * as T from './assets/three.module.js';

// Routes come from the same geometry as the model's normal-flow animation.
export function createWaterFlowTour({scene,stages,radius=.11,speed=1,onSelect,onFollow,onStart,onStop}){
 const routes=stages.map(stage=>{
  const curve=new T.CurvePath();
  for(let i=1;i<stage.points.length;i++){
   const a=new T.Vector3(...stage.points[i-1]),b=new T.Vector3(...stage.points[i]);
   if(a.distanceToSquared(b)>1e-10)curve.add(new T.LineCurve3(a,b));
  }
  if(!curve.curves.length)throw new Error('Water tour needs a nonzero route');
  return {...stage,curve,duration:Math.max(3,Math.min(7,curve.getLength()/speed))};
 });
 const panel=document.createElement('section');panel.className='flow-tour';panel.setAttribute('aria-label','Guided water flow');
 panel.innerHTML='<div class="flow-tour-actions"><button type="button" class="flow-tour-start">▶ As the water flows</button><button type="button" class="flow-tour-pause" hidden>Pause</button><button type="button" class="flow-tour-stop" hidden>End tour</button></div><div class="flow-tour-copy" role="status" aria-live="polite" aria-atomic="true"><strong>Follow a drop through the system</strong><p>Start the tour to see where the water goes. The view moves with the blue drop.</p></div>';
 document.querySelector('.wire-layout').before(panel);
 const start=panel.querySelector('.flow-tour-start'),pause=panel.querySelector('.flow-tour-pause'),stop=panel.querySelector('.flow-tour-stop'),title=panel.querySelector('strong'),copy=panel.querySelector('p');
 const drop=new T.Group();
 const core=new T.Mesh(new T.SphereGeometry(radius,20,14),new T.MeshBasicMaterial({color:'#00b7ed',depthTest:false,depthWrite:false}));core.renderOrder=101;
 const halo=new T.Mesh(new T.SphereGeometry(radius*1.6,20,14),new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.45,depthTest:false,depthWrite:false}));halo.renderOrder=100;
 drop.add(halo,core);drop.visible=false;scene.add(drop);
 let active=false,paused=false,index=0,elapsed=0;
 function enter(){const stage=routes[index];title.textContent=(index+1)+' of '+routes.length+' · '+stage.title;copy.textContent=stage.text;onSelect(stage.id);}
 function finish(){active=false;paused=false;pause.hidden=true;start.disabled=false;start.textContent='↻ Replay water flow';title.textContent='Tour complete';copy.textContent='Water continues into the distribution mainline. Choose equipment to explore, or replay the tour.';}
 function end(restore=false){if(!active&&!drop.visible)return;active=false;paused=false;drop.visible=false;start.disabled=false;start.textContent='▶ As the water flows';pause.hidden=stop.hidden=true;pause.textContent='Pause';title.textContent='Follow a drop through the system';copy.textContent='Start the tour to see where the water goes. You can pause or end it at any time.';if(restore)onStop?.();}
 start.onclick=()=>{end();onStart?.();index=elapsed=0;active=true;paused=false;drop.visible=true;start.disabled=true;pause.hidden=stop.hidden=false;pause.textContent='Pause';pause.setAttribute('aria-pressed','false');enter();drop.position.copy(routes[0].curve.getPointAt(0));onFollow(drop.position,0,true);};
 pause.onclick=()=>{paused=!paused;pause.textContent=paused?'Resume':'Pause';pause.setAttribute('aria-pressed',String(paused));};
 stop.onclick=()=>end(true);
 // Manual exploration always takes precedence over the guided camera.
 for(const selector of ['[data-view]','[data-finish]','[data-style]','[data-path]','[data-model-zoom]','#reset','#previous-node','#next-node','#component-list','#ah2-labels','#ah3-labels','#wire-labels','#show-irrigation','#show-non-irrigation','#ground-cutaway']){
  document.querySelectorAll(selector).forEach(el=>el.addEventListener(el.matches('input')?'change':'click',()=>end(),{capture:true}));
 }
 const host=document.querySelector('#ah2-scene, #ah3-scene, #wire-scene');
 host.addEventListener('pointerdown',()=>end(),{capture:true});host.addEventListener('wheel',()=>end(),{capture:true,passive:true});host.addEventListener('model-zoom',()=>end(),{capture:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active&&!paused){paused=true;pause.textContent='Resume';pause.setAttribute('aria-pressed','true');}});
 return {tick(dt){if(!active||paused)return;elapsed+=dt;const stage=routes[index];const progress=Math.min(1,elapsed/stage.duration);drop.position.copy(stage.curve.getPointAt(progress));onFollow(drop.position,dt,false);if(elapsed>=stage.duration+1.8){if(index===routes.length-1)finish();else{index++;elapsed=0;enter();}}},stop:end};
}
