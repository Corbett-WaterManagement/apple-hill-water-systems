import {toWorld} from './wireframe-data.js?v=24';
// Same reviewed walkway centerlines for both paving and mulch exclusion.
export const walkwayLayout=[{widthFt:3,points:[[-5.9,-5.5,0],[-5.8,-2,0],[-5.25,1,0],[-4.4,3.8,0],[-3.2,5.1,0],[0,5.35,0],[6.8,5.15,0]]},{widthFt:3,points:[[-6.8,6.8,0],[-5.3,5.6,0],[-3.2,5.1,0]]}];
export function walkwayCurves(T){return walkwayLayout.map(w=>({...w,curve:new T.CatmullRomCurve3(w.points.map(p=>new T.Vector3(...toWorld(p))),false,'centripetal')}))}
export function walkwayClearance(T){return walkwayCurves(T).flatMap(w=>{const p=w.curve.getPoints(200);return p.slice(1).map((b,i)=>({a:p[i],b,radius:w.widthFt/2+.4}))})}
export function onWalkway(x,y,segments){return segments.some(({a,b,radius})=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a.x-t*dx,y-a.y-t*dy)<radius})}
