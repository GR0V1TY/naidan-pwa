import {WORLD_SIDES,LAKE,inShallows} from './world.js';

export const ITEM_GAP=.8;
export const AVENUE_CLEAR_HALF=2;
// These are the road surfaces drawn in town-content, expressed in local map coordinates.
export const TOWN_ROADS=Object.freeze([
 {axis:'x',at:0,lo:-51,hi:51,width:12,avenue:true},
 {axis:'z',at:0,lo:-51,hi:51,width:12,avenue:true},
 {axis:'z',at:-31,lo:9,hi:52,width:7,market:true},
 ...[-18,-33,-47].map(at=>({axis:'x',at,lo:-50,hi:-14,width:3})),
 ...[-18,-30,-48].map(at=>({axis:'x',at,lo:13,hi:51,width:3})),
 ...[-1,1].flatMap(sx=>[-1,1].flatMap(sz=>[
  {axis:'x',at:sz*12,lo:sx<0?-51:9,hi:sx<0?-9:51,width:4},
  {axis:'z',at:sx*12,lo:sz<0?-54:12,hi:sz<0?-12:54,width:4}
 ])),
 {axis:'x',at:22,lo:21,hi:49,width:3,park:true},
 {axis:'x',at:48,lo:21,hi:49,width:3,park:true},
 {axis:'z',at:21,lo:21,hi:49,width:3,park:true},
 {axis:'z',at:49,lo:21,hi:49,width:3,park:true}
]);
export function sideAt(x,z){return Math.abs(x)>Math.abs(z)?(x<0?0:1):(z<0?2:3)}
export function ringAt(x,z,r=0){return WORLD_SIDES.findIndex(side=>Math.max(Math.abs(x),Math.abs(z))+r+.4<=side/2)}
export function onAvenue(x,z){return Math.min(Math.abs(x),Math.abs(z))<6&&Math.max(Math.abs(x),Math.abs(z))>=13}
export function clearAvenue(x,z,r){return Math.max(Math.abs(x),Math.abs(z))<13||Math.min(Math.abs(x),Math.abs(z))-r>=AVENUE_CLEAR_HALF}
export function dryFootprint(x,z,r){return !inShallows(x,z)&&!(Math.abs(x-LAKE.x)<LAKE.w/2+r+.4&&Math.abs(z-LAKE.z)<LAKE.d/2+r+.4)}

export function placementSlots(){
 const slots=Array.from({length:16},()=>[]),put=(id,x,z,role,yaw=0,extra={})=>slots[id].push({x,z,role,yaw,...extra});
 for(const road of TOWN_ROADS){
  const point=(along,across)=>road.axis==='x'?{x:along,z:across}:{x:across,z:along};
  for(let along=Math.ceil(road.lo/2)*2;along<=road.hi;along+=2)for(const sign of [-1,1]){
   const yaw=road.axis==='x'?0:1;
   const curb=road.avenue?5.1:road.width/2+.65;
   const shoulder=road.avenue?7.5:road.width/2+1.2;
   const p=point(along,road.at+sign*curb),b=point(along,road.at+sign*shoulder);
   // Lamps repeat at six-unit intervals; benches face the adjoining pavement.
   if(along%6===0)put(9,p.x,p.z,'lamp',0,{road});
   const face=road.axis==='x'?(sign>0?2:0):(sign>0?1:3);
   put(8,b.x,b.z,'seating',face,{road});
   put(10,b.x,b.z,'service',yaw,{road});
   put(5,b.x,b.z,'planter',yaw,{road});
   if(b.x< -7||road.avenue)put(4,b.x,b.z,'gift',yaw,{road});
   // Avenue parking occupies the outside strip; narrower roads get off-road bays.
   const parked=point(along,road.at+sign*(road.avenue?3.8:road.width/2+1.25));
   if(road.avenue||road.market||road.park||road.at===-18||road.at===-48){
    put(12,parked.x,parked.z,'parking',yaw,{road});
   }
   const market=b.x< -14&&b.z>13,entry=b.x>13&&Math.abs(b.z)>13;
   if(market||entry||road.avenue){
    put(11,b.x,b.z,'vendor',face,{road});
    put(13,b.x,b.z,'stall',face,{road});
   }
  }
 }
 for(let x=-50;x<=50;x+=2)for(let z=-50;z<=50;z+=2){
  if(x< -13&&(z>13||z< -13))put(4,x,z,'gift');
  if(x>13&&z< -13){put(6,x,z,'play');put(14,x,z,'play');}
  if(x>13&&z>13){put(7,x,z,'picnic');put(15,x,z,'garden');}
 }
 return slots;
}

const anchorDistance=(p,anchors)=>Math.min(...anchors.map(([x,z])=>Math.hypot(p.x-x,p.z-z)));
export function placementScore(p,id,items,sideCounts,seed){
 const peers=items.filter(i=>i.placement===p.role),nearest=peers.length?Math.min(...peers.map(i=>Math.hypot(p.x-i.x,p.z-i.z))):0;
 let theme=0;
 if(id===4)theme=anchorDistance(p,[[-18,17],[-44,17],[-18,31],[-44,31],[-27,-27],[-43,-40]]);
 if(id===5)theme=anchorDistance(p,[[-43,-22],[-27,-22],[-43,-35],[-27,-35],[-18,22],[-44,36],[18,21],[46,48]]);
 if(id===8)theme=anchorDistance(p,[[-35,-21],[-35,-35],[-21,-33],[21,25],[21,45],[46,48],[-31,25]]);
 if(id===9)theme=p.road?.avenue?-6:0;
 if(id===6||id===14)theme=anchorDistance(p,[[21,-22],[36,-35],[46,-43],[21,-48]]);
 if(id===7||id===15)theme=anchorDistance(p,[[18,21],[18,45],[46,48],[35,22]]);
 if(id===10)theme=anchorDistance(p,items.filter(i=>i.type.id===8||i.shopStyle!==undefined).map(i=>[i.x,i.z]));
 if(id===11||id===13)theme=p.x< -13&&p.z>13?0:5;
 const cluster=nearest>0?Math.min(nearest,12)*.4:0;
 const quadrant=o=>(o.x<0?0:2)+(o.z<0?0:1),districtCount=items.filter(i=>Math.abs(i.x)>6&&Math.abs(i.z)>6&&quadrant(i)===quadrant(p)).length;
 const balance=[5,8,9,10].includes(id)&&Math.min(Math.abs(p.x),Math.abs(p.z))>6?districtCount*.65:0;
 // Balance whole-map routes while keeping each functional group together.
 const tie=((Math.round(p.x*100)*73856093^Math.round(p.z*100)*19349663^seed)>>>0)/4294967296;
 return theme+cluster+balance+(sideCounts[sideAt(p.x,p.z)]||0)*(id===9?8:2)+tie*.1;
}
