// Coordinates are drawing geometry in feet; unmeasured sizes are illustrative.
export const orientation={roadwardAxis:'+Y',source:'Owner instruction and overarching.png',filterAndPressure:'Project toward Worcester Road; perpendicular to conceptual mainline',registration:'Relative orientation only; no surveyed bearing or road offset'};
export const evidence={componentDepthFt:8/12,gapsFt:[.5,1],gapBasis:'User estimates; interpreted as edge-to-edge gaps for draft.',boxDimensions:'Owner supplied 14 × 19 × 6 inches; width across flow, length roadward, height. Applied to all three for draft.',wellDepth:'Unknown; continuation below section is symbolic.',branchConnections:'Owner confirms gauge and pressure transducer screw into a common metallic tee; its takeoff and pressure-tank connection remain unconfirmed.'};
const w=14/12,d=19/12,h=6/12;
export const boxes=[{id:'box1',tag:'1',name:'Well head',p:[w+.5,0,-h/2],size:[w,d,h],photo:'box-1.png'},{id:'box2',tag:'2',name:'Pressure / control assembly',p:[0,0,-h/2],size:[w,d,h],photo:'box-2.png'},{id:'box3',tag:'3',name:'Filter',p:[-w-1,0,-h/2],size:[w,d,h],photo:'box-3.png'}];
const z=-evidence.componentDepthFt;
const rawComponents=[
 {id:'well',box:'box1',name:'Well head',p:[3.5,0,z],photos:['box-1.png','well-additional-v37.jpg'],note:'Identified in your annotated photo. The well head sits approximately 8 inches below lawn grade. The well continues deeper; its depth and construction are unknown.'},
 {id:'winter1',box:'box1',name:'Winterization connection 1',p:[3.5,-1,z],note:'Identified by your “Wint Connection 1” annotation. Exact takeoff and buried fitting arrangement remain unconfirmed. No normal-flow animation enters this service connection.'},
 {id:'winter2',box:'box2',name:'Winterization connection 2',photo:'controls-photo-v37.jpg',p:[1.8,-.3,z],note:'Identified at the left of the supplied box-2 photograph. A service connection; its exact takeoff and operating procedure are unconfirmed.'},
 {id:'shutoff',box:'box2',name:'Shutoff valve',p:[.45,-.3,z],note:'Identified at the right of the supplied box-2 photograph. Shown beside the conceptual flow line; exact fittings and its order relative to the instrument takeoffs need confirmation.'},
 {id:'gauge',box:'box2',name:'Pressure gauge',photo:'controls-photo-v37.jpg',p:[.8,.15,z],note:'Identified by your photo annotation. Screws into the common metallic tee with the pressure transducer, per the owner. Displays pressure at its connection. No pressure range, reading or performance value is inferred.'},
 {id:'transducer',box:'box2',name:'Pressure transducer',p:[1.35,.15,z],note:'Identified by your photo annotation. Screws into the common metallic tee with the gauge, per the owner. Converts pressure into an electrical signal. Controller connection and control logic are unconfirmed.'},
 {id:'pressure',box:'box2',name:'Pressure tank',p:[1.15,.8,z],note:'Identified by your photo annotation. The vessel projects toward Worcester Road, as confirmed by the owner. Vessel proportions and mounting are schematic. Its connection to the main pipe, capacity, precharge and operating logic are unconfirmed.'},
 {id:'filter',box:'box3',name:'Filter',p:[-1.7,.3,z],photo:'filter-connections.jpg',note:'Both inlet and outlet connect at the head on the side away from Worcester Road, as confirmed by the owner. Water enters, passes through the roadward-projecting housing, and returns to the outlet at the same building-side end. The internal loop is a flow explanation, not a model of the filter element or internal channels. Port spacing, fittings, manufacturer and model are unconfirmed. The outlet continues straight into the displayed dirt face. The mainline beyond this section remains unconfirmed.'}
];
// Every control-box component includes the shared annotated photograph.
for(const n of rawComponents.filter(n=>n.box==='box2')){
 const shared=boxes.find(b=>b.id===n.box).photo;
 n.photos=[...new Set([n.photo||shared,...(n.photos||[]),shared])];
}
// Preserve photo-relative positions within the newly sized box envelopes.
const oldCenters={box1:3.5,box2:1.15,box3:-1.7};
export const components=rawComponents.map(n=>({...n,p:[boxes.find(b=>b.id===n.box).p[0]+(n.p[0]-oldCenters[n.box])*(w/(n.box==='box2'?2:1.7)),n.p[1]*d/3,n.p[2]]}));
export const connections=[{from:'box1',to:'box2',status:'User-documented sequence; concealed geometry schematic'},{from:'box2',to:'box3',status:'User-documented sequence; concealed geometry schematic'}];
const fx=components.find(n=>n.id==='filter').p[0],fy=components.find(n=>n.id==='filter').p[1],back=fy-.6*d/3,wellX=components.find(n=>n.id==='well').p[0];
export const filterFlow={inlet:[fx+.14,back,z],outlet:[fx-.14,back,z],sameSide:'Away from Worcester Road / building side',bodyDirection:'+Y toward Worcester Road',internalGeometry:'Illustrative flow loop only; exact internal passage and lateral port spacing unknown',postFilterRoute:'Owner-requested straight continuation to the displayed soil face; beyond section unconfirmed',points:[[wellX,0,z],[wellX,back,z],[fx+.14,back,z],[fx+.14,fy+.15,z],[fx-.14,fy+.15,z],[fx-.14,back,z],[boxes[2].p[0]-w/2-1,back,z]]};

// Owner-added inline sensor. Longitudinal spacing is illustrative pending measurement.
const sensorX=boxes[2].p[0]-w/2-1;
boxes.push({id:'sensorbox',tag:'4',name:'Flow sensor',shape:'round',p:[sensorX,back,-h/2],size:[1,1,h],photo:'sensor-closeup-v37.jpg'});
components.push({id:'sensor',box:'sensorbox',name:'Flow sensor',p:[sensorX,back,z],photo:'sensor-closeup-v37.jpg',photos:['sensor-closeup-v37.jpg','sensor-location-v37.jpg'],note:'Inline flow sensor downstream of the filter. A 12-inch round access box is centered above it. Normal flow continues through the sensor toward the field. Spacing from the filter is illustrative.'});
filterFlow.points.push([sensorX-1.6,back,z]);

// Owner-confirmed common tee for the two instruments; fitting sizes are illustrative.
const gauge=components.find(n=>n.id==='gauge'),transducer=components.find(n=>n.id==='transducer');
const teeZ=z-.1,teeX=(gauge.p[0]+transducer.p[0])/2,teeY=gauge.p[1];
export const instrumentTee={header:[[gauge.p[0],teeY,teeZ],[transducer.p[0],teeY,teeZ]],stem:[[teeX,teeY,teeZ],[teeX,teeY+.15,teeZ]],risers:[{id:'gauge',points:[[gauge.p[0],teeY,teeZ],[gauge.p[0],teeY,z+.08]]},{id:'transducer',points:[[transducer.p[0],teeY,teeZ],transducer.p]}],status:'Owner specifies shared metallic tee; exact dimensions, thread sizes and takeoff remain schematic.'};
