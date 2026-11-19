import * as T from './assets/three.module.js';
import {materialCatalog} from './assets/materials/catalog.js';

// Shared Apple Hill material API. Mesh units and tile sizes are in feet.
// Base color uses sRGB; normal/roughness data stays linear.
export function createMaterialLibrary(renderer){
 const materials=new Map(),textures=new Map(),loader=new T.TextureLoader();
 const root=new URL('./assets/materials/',import.meta.url);
 function texture(file,color=false){
  if(!textures.has(file)){const t=loader.load(new URL(file,root).href);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=T.SRGBColorSpace;textures.set(file,t)}
  return textures.get(file);
 }
 function get(key,options={}){
  const cache=key+JSON.stringify(options);if(materials.has(cache))return materials.get(cache);
  const d=materialCatalog.materials.find(m=>m.key===key);if(!d)throw Error('Unknown Apple Hill material: '+key);
  const m=new T.MeshStandardMaterial({color:'#ffffff',map:texture(d.maps.basecolor,true),normalMap:texture(d.maps.normal),normalScale:new T.Vector2(d.normal_strength,d.normal_strength),roughnessMap:texture(d.maps.roughness),roughness:1,metalness:d.metalness,...options});
  m.userData={materialId:d.id,tileSizeFt:d.tile_size_ft,evidence:d.evidence_status};materials.set(cache,m);return m;
 }
 function uv(geometry,tileFt=4){
  // Project each face in physical model units; identical finishes retain scale
  // when a wall, tank or walkway changes size.
  const p=geometry.attributes.position,n=geometry.attributes.normal;
  if(!p||!n)return geometry;const values=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));values.push((nz>nx&&nz>ny?x:ny>nx?x:y)/tileFt,(nz>nx&&nz>ny?y:z)/tileFt)}
  geometry.setAttribute('uv',new T.Float32BufferAttribute(values,2));return geometry;
 }
 return{get,uv,catalog:materialCatalog,dispose(){materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())}};
}
