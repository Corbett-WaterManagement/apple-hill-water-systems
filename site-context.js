import {layout,nodes} from './wireframe-data.js?v=24';
// Photo/aerial-informed presentation proportions, not surveyed dimensions.
// Retain the roadward wall and reviewed hydraulic graph as fixed anchors.
const lengthFt=18,widthFt=4,depthFt=layout.shaftDepth;
export const shaftContext={lengthFt,widthFt,depthFt,center:[nodes.find(n=>n.id==='header').p[0],layout.shaftRoadwardEdgeY-widthFt/2,-depthFt/2],status:'Approximate elongated shaft envelope from user photo and annotated aerial; plan dimensions unmeasured.'};
const westX=shaftContext.center[0]-lengthFt/2-.75;
export const garageContext={westX,frontY:layout.shaftRoadwardEdgeY-widthFt-.25,widthFt:40,depthFt:8.4,heightFt:14.8,status:'Schematic garage-end fragment. Western building end aligns near shaft end; facade dimensions unmeasured.'};
