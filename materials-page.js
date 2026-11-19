import {materialCatalog} from './assets/materials/catalog.js';
const grid=document.querySelector('#material-grid');
for(const d of materialCatalog.materials){
 const article=document.createElement('article');article.className='material-card';
 const image=document.createElement('img');image.src='assets/materials/'+d.maps.basecolor;image.alt=d.name+' tiling surface swatch';image.loading='lazy';article.append(image);
 const content=document.createElement('div'),id=document.createElement('p'),h=document.createElement('h2'),p=document.createElement('p'),spec=document.createElement('p'),link=document.createElement('a');
 id.className='eyebrow';id.textContent=d.id;h.textContent=d.name;p.textContent=d.observation;spec.className='fine';spec.textContent=d.tile_size_ft+' ft tile · Roughness '+d.roughness+' · Metalness '+d.metalness;
 link.href='assets/'+d.source_photo.replace('../','');link.target='_blank';link.rel='noopener';link.textContent='Source photograph ↗';link.className='text';content.append(id,h,p,spec,link);article.append(content);grid.append(article);
}
