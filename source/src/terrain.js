import {SWEET_SOLIDS,inSweetStreet} from './sweet-street.js';
// Distinct surface heights prevent paving, water and decals competing for depth.
export const SURFACE=Object.freeze({grass:0,district:.02,road:.04,stripe:.06,marker:.08,shadow:.09});
export const DISTRICTS=Object.freeze([
 {id:'toys',name:'玩具庭院',x:-16,z:-15,color:'#d7e7b1',unlock:1},
 {id:'sweets',name:'甜品商业街',x:-16,z:15,color:'#f4dfc4',unlock:2},
 {id:'fair',name:'彩虹游乐园',x:16,z:-15,color:'#e8ddec',unlock:4},
 {id:'garden',name:'湖畔花园',x:16,z:16,color:'#cce4ba',unlock:3}
]);
export const POND=Object.freeze({x:16,z:16,w:10,d:10,bridgeWidth:4.8});
export function districtAt(x,z){return DISTRICTS[(x>=0?2:0)+(z>=0?1:0)]}
export function lockedDistricts(level,bounds=27){return DISTRICTS.filter(d=>d.unlock>level).map(d=>({district:d,x:Math.sign(d.x)*(bounds+7)/2,z:Math.sign(d.z)*(bounds+7)/2,w:bounds-7,d:bounds-7}))}
export function canEnterDistrict(x,z,r,level,bounds){return !lockedDistricts(level,bounds).some(o=>Math.hypot(Math.max(0,Math.abs(x-o.x)-o.w/2),Math.max(0,Math.abs(z-o.z)-o.d/2))<r)}
export function itemDistrictOpen(item,level){if(item.areaId!==undefined)return item.areaId<level;return Math.abs(item.x)<7||Math.abs(item.z)<7||districtAt(item.x,item.z).unlock<=level}
export function waterRects(){const p=POND,h=(p.d-p.bridgeWidth)/2;return [[p.x,p.z-(p.bridgeWidth+h)/2,p.w,h],[p.x,p.z+(p.bridgeWidth+h)/2,p.w,h]]}
export const SCENERY_SOLIDS=Object.freeze([
 {id:'fountain',x:5,z:5,type:{r:1.4,level:Infinity},state:'available'},
 ...[[-10,-10],[-10,10],[10,-10],[10,10],[-25,-12],[-25,12],[25,-12],[25,12],[-12,-25],[12,-25],[-12,25],[12,25]].map(([x,z],n)=>({id:'tree-'+n,x,z,type:{r:.7,level:Infinity},state:'available'})).filter(o=>!inSweetStreet(o.x,o.z)),
 ...SWEET_SOLIDS
]);
export function canWalkTerrain(x,z,r){return !waterRects().some(([cx,cz,w,d])=>Math.hypot(Math.max(0,Math.abs(x-cx)-w/2),Math.max(0,Math.abs(z-cz)-d/2))<r)}
// Tiled road cells never overlap. The main loop is supplemented by four gate avenues.
export function roadsForBounds(bounds=27){
 const cuts=[-bounds,-23,-18,-9,-2.5,2.5,9,18,23,bounds].filter(v=>Math.abs(v)<=bounds).sort((a,b)=>a-b),roads=[];
 for(let a=0;a<cuts.length-1;a++)for(let b=0;b<cuts.length-1;b++){
  const x=(cuts[a]+cuts[a+1])/2,z=(cuts[b]+cuts[b+1])/2;
  const ring=Math.max(Math.abs(x),Math.abs(z))<23&&Math.max(Math.abs(x),Math.abs(z))>18;
  const avenue=Math.abs(x)<2.5||Math.abs(z)<2.5;
  // A separate wooden bridge crosses the lake; paving stops outside the water.
  if(ring||avenue)roads.push([x,z,cuts[a+1]-cuts[a],cuts[b+1]-cuts[b]]);
 }
 return roads;
}
export const ROADS=roadsForBounds();
