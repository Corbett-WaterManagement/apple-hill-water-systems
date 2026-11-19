import {bedHeight} from './landscape-bed.js?v=24';
import {nodes,irrigationTankEnvelope} from './wireframe-data.js?v=24';
// Approximate image registration to the two existing drawing anchors. This is
// image-based location evidence, not GIS coordinates or measured tank dimensions.
const srcTank=[1242,-561],srcShaft=[1043,-991];
const tank=nodes.find(n=>n.id==='tank').p,shaft=nodes.find(n=>n.id==='header').p;
const u=[srcShaft[0]-srcTank[0],srcShaft[1]-srcTank[1]],v=[shaft[0]-tank[0],shaft[1]-tank[1]],den=u[0]**2+u[1]**2;
const a=(u[0]*v[0]+u[1]*v[1])/den,b=(u[0]*v[1]-u[1]*v[0])/den;
export function mapPoint([x,y]){const dx=x-srcTank[0],dy=-y-srcTank[1];return[tank[0]+a*dx-b*dy,tank[1]+b*dx+a*dy,.05]}
export const tankLocationEvidence={source:'non irrigation storage tanks locations.png',imageSize:[2271,1152],anchors:{irrigationAccess:srcTank,shaft:srcShaft},status:'Approximate placement registered from annotated screenshot to existing schematic anchors; not surveyed.',depths:null,connections:[],connection_status:'User confirmed no pipe connections; show standalone tanks only.'};
const definitions=[
 {id:'nonirr_1',tag:'NI-1',name:'Unused tank',sourceFolder:'Non-irrigation storage tank',pixels:[[999,655],[1169,637],[1180,719],[1010,739]],photo:'non-irrigation-overview.jpg',photos:['non-irrigation-overview.jpg','non-irrigation-interior-1.jpg'],note:'The central circled non-irrigation tank is nearer the garage and left of the irrigation tank. Supplied photos show a rectangular concrete chamber and two surface access covers. The outline follows the mapped footprint approximately; depth and capacity are unconfirmed.'},
 {id:'nonirr_2',tag:'NI-2',name:'Rainwater collection tank',sourceFolder:'Non-irrigation storage tank 2',pixels:[[608,518],[692,509],[721,759],[637,769]],photo:null,photos:[],note:'The longer non-irrigation tank is farther left beside the walkway. Its folder supplies the shared location map only. Internal arrangement, depth and capacity are unconfirmed.'}
];
export const nonIrrigationTanks=definitions.map(d=>{
 const sourceFootprint=d.pixels.map(mapPoint),center=[0,1].map(i=>sourceFootprint.reduce((sum,v)=>sum+v[i],0)/sourceFootprint.length);
 if(d.id==='nonirr_1'){center[0]-=10;center[1]+=.5;} // User 'here' marker: approximate relocation in the displayed overhead, 2026-11-12.
 const sideLengths=sourceFootprint.map((p,i)=>Math.hypot(p[0]-sourceFootprint[(i+1)%4][0],p[1]-sourceFootprint[(i+1)%4][1]));
 const shortSide=Math.min(...sideLengths),longSide=Math.max(...sideLengths),parallel=d.id==='nonirr_1';
 const size=[parallel?longSide:shortSide,parallel?shortSide:longSide,irrigationTankEnvelope.size[2]];
 const p=[...center,irrigationTankEnvelope.center[2]],topZ=p[2]+size[2]/2,bottomZ=p[2]-size[2]/2;
 const footprint=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>[center[0]+x*size[0]/2,center[1]+y*size[1]/2,topZ]);
 const orientation=parallel?'Long side parallel to Worcester Avenue':'Long side perpendicular to Worcester Avenue';
 return{...d,layer:'non-irrigation',source_asset_id:null,surfaceAccessZ:d.id==='nonirr_2'?bedHeight(p[0],p[1]):undefined,p,footprint,sourceFootprint,size,topZ,bottomZ,orientation,connections:[],connection_status:'User confirmed no pipe connections.',model_status:'User-requested orientation. Depth and top/bottom elevations match the illustrative irrigation tank, not field measurements.',level:'7 ft model depth · Matched to irrigation tank',note:d.note+(d.id==='nonirr_2'?' Latest user correction: the mulch bed and tank head are at lawn grade. The tank remains buried, with its chamber visible in the cutaway; pipe openings and walkway stay clear.':' NI-1 remains outside the ground-level mulch bed.')+' '+orientation+'. The draft uses the same 7-ft vertical envelope and top/bottom elevations as the irrigation tank; actual depth is unverified. NI-1 placement follows the user’s revised overhead marker; map registration remains approximate. NI labels are temporary documentation references; no field asset IDs were supplied. Standalone tank; no pipe connections, as confirmed by the site owner.'};
});
