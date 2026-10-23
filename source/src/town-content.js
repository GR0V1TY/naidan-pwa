import {placementSlots,placementScore,sideAt,ringAt,clearAvenue,dryFootprint,ITEM_GAP,onAvenue} from './placement.js';
import {toLevel,fromLevel,levelColor} from './levels.js';
import {AREAS,LAKE,areaAt,canWalkTownTerrain,worldLand,landAreaId,canWalkWorld,inShallows,WORLD_SIDES} from './world.js';
export const TOWN_SCENERY=Object.freeze([
 ...[[-43,-27],[-27,-27],[-43,-40],[-27,-40]].map(([x,z],n)=>({id:'house-'+n,x,z,kind:'house',state:'available',type:{r:3.6,level:Infinity}})),
 ...[[-49,17],[-49,32],[-49,47],[15,48],[48,15],[15,-48],[48,-15]].map(([x,z],n)=>({id:'tree-'+n,x,z,kind:'tree',state:'available',type:{r:.8,level:Infinity}}))
]);
export function makeTownItems(types,interactions,seed=42,variant=0){
 const items=[];
 const forestNames={4:'糖晶礼盒',5:'蘑菇花盆',6:'符文积木',7:'森林野餐篮',8:'林间长椅',9:'萤晶路灯',10:'林间垃圾桶',11:'森林售货推车',12:'蜂蜜甜品车',13:'森林冰淇淋摊',14:'蘑菇滑梯',15:'精灵凉亭'};
 const add=(type,x,z,extra={})=>items.push({id:items.length,type,x,z,areaId:areaAt(x,z).id,state:'available',progress:0,...extra});
 for(let k=0;k<36;k++){const a=k*Math.PI*2/36,r=9+(k%3)*.3;add(types[k%4],Math.cos(a)*r,Math.sin(a)*r,{placement:'snack',spawnFood:true})}
 add({...types[19],name:'奶油皇冠城堡'},0,0,{isLandmark:true});
 const shops=[];
 for(let side=0;side<2;side++)for(let k=0;k<3;k++){
  const style=side*3+k,x=side?-18:-44,z=17+k*14;
  const shop={x,z,r:2.8};shops.push(shop);
  add({...types[16],name:['草莓奶吧','曲奇工坊','甜甜圈屋','薄荷糖铺','冰淇淋屋','柠檬蛋糕店'][style],level:4,xp:75,points:375,r:2.8,h:6.2,color:['#e8a2b3','#e4c18a','#e9a99a','#a4cfc3','#b5bfdc','#e8cf88'][style]},x,z,{shopStyle:style,facing:side?-1:1,streetSample:true});
 }
 const rides=[{type:18,x:24,z:-39,r:3.2,h:9,rideId:15},{type:18,x:43,z:-39,r:3.2,h:9,rideId:16},{type:17,x:24,z:-19,r:2.5,h:3.4,rideId:15},{type:17,x:43,z:-19,r:2.5,h:3.4,rideId:16}];
 for(const ride of rides)add({...types[ride.type],r:ride.r,h:ride.h},ride.x,ride.z,{rideId:ride.rideId});
 for(const [k,x,z]of [[0,28,29],[1,31,30],[2,29,33],[3,34,31],[4,37,34],[5,39,39],[6,42,36],[7,34,41]]){
  add({...types[k%2],name:k%2?'漂浮奶盒':'荷叶糖果'},x,z,{waterFood:true,placement:'water'});
 }
 const fixed=[...TOWN_SCENERY,...interactions.map(p=>({x:p.x,z:p.z,type:{r:p.r}}))];
 const free=(type,p,ring)=>ringAt(p.x,p.z,type.r)===ring&&clearAvenue(p.x,p.z,type.r)&&dryFootprint(p.x,p.z,type.r)&&
  [...fixed,...items].every(o=>Math.hypot(p.x-o.x,p.z-o.z)>=type.r+o.type.r+ITEM_GAP);
 const slots=placementSlots();
 const place=(type,ring,extra={})=>{
  const sideCounts=[0,0,0,0];for(const i of items.filter(i=>type.id===9?i.type.id===9:i.ring===ring&&!i.infill))sideCounts[sideAt(i.x,i.z)]++;
  const choices=slots[type.id].filter(p=>free(type,p,ring)).map(p=>({p,score:placementScore(p,type.id,items,sideCounts,seed)}));
  choices.sort((a,b)=>a.score-b.score);
  const p=choices[0]?.p;if(!p)throw Error(`No ${type.name} slot in growth ring ${ring}`);
  const themed=variant&&forestNames[type.id]?{...type,name:forestNames[type.id]}:type;
  add(themed,p.x,p.z,{ring,side:sideAt(p.x,p.z),placement:p.role,yaw:p.yaw,avenue:onAvenue(p.x,p.z),...extra});
 };
 // Six of each tier-specific prop per growth ring; constrained uses take their lots first.
 for(let ring=1;ring<5;ring++){
  const ids=ring===1?[6,7,4,5]:ring===2?[8,9,10,11]:[14,15,12,13];
  for(const id of ids)for(let k=0;k<6;k++)place(types[id],ring);
 }
 // Snack pairs mark both sides of all four avenue arms; their centers remain walkable.
 for(let ring=1;ring<=2;ring++)for(let side=0;side<4;side++)for(let k=0;k<2;k++){
  const type={...types[(side*2+k)%4],xp:1,points:6},start=ring===1?14:24;
  let chosen;
 for(let step=0;step<16&&!chosen;step++)for(const sign of [k%2?-1:1,k%2?1:-1]){
   const along=start+k*3+step*.5,across=sign*3.2;
   const p={x:side<2?(side===0?-along:along):across,z:side<2?across:(side===2?-along:along)};
   if(free(type,p,ring)){chosen=p;break;}
  }
  if(!chosen)throw Error('No avenue snack slot');
  add(type,chosen.x,chosen.z,{infill:true,ring,placement:'snack',avenue:true});
 }
 // Eleven additional functional props per band gather around their corresponding uses.
 for(let ring=1;ring<5;ring++)for(let k=0;k<11;k++){
  const id=ring<=2?(ring===1?4:8)+k%4:[9,12,9,13,8,10,5,12,9,13,5][k],base=types[id];
  place({...base,xp:Math.max(1,Math.round(base.xp*.6)),points:Math.round(base.points*.6)},ring,{infill:true});
 }
 if(items.length!==211)throw Error('Unexpected item count '+items.length);
 return items;
}
function drawLocalTown(r,g){
 const original=r,{rects}=worldLand(g.openAreas,g.expansion);
 original.ground(0,0,160,160,'#a4d9e7',-.85);
 for(const o of rects){const x=(o.x0+o.x1)/2,z=(o.z0+o.z1)/2,w=o.x1-o.x0,d=o.z1-o.z0;original.cube(x,-2.3,z,w,2.25,d,'#c7a181');original.ground(x,z,w,d,'#c9dfa9')}
 const h=rects[0].x1;
 for(const sign of [-1,1]){
  original.cube(sign*(h+.18),0,0,.36,.9,2*h+.72,'#f3e3b9');original.cube(0,0,sign*(h+.18),2*h,.9,.36,'#f3e3b9');
  for(let a=-h+1;a<h;a+=2){original.cube(sign*(h+.18),.9,a,.5,.2,.6,'#fff0cb');original.cube(a,.9,sign*(h+.18),.6,.2,.5,'#fff0cb')}
 }
 // Clip all terrain paint to the exact same growing rectangles used by collision.
 r={ground(x,z,w,d,color,top){for(const o of rects){const x0=Math.max(x-w/2,o.x0),x1=Math.min(x+w/2,o.x1),z0=Math.max(z-d/2,o.z0),z1=Math.min(z+d/2,o.z1);if(x1>x0&&z1>z0)original.ground((x0+x1)/2,(z0+z1)/2,x1-x0,z1-z0,color,top)}},cube(x,y,z,w,h,d,...args){if(canWalkWorld(x,z,Math.max(w,d)/2,g.openAreas,g.expansion))original.cube(x,y,z,w,h,d,...args)}};
 for(const a of AREAS.slice(1))r.ground(a.x,a.z,46,46,a.color,.02);
 // One plaza, one castle, one continuous avenue system, no copied town centers.
 r.ground(0,0,108,12,'#eee6cf',.04);r.ground(0,-30,12,48,'#eee6cf',.04);r.ground(0,30,12,48,'#eee6cf',.04);r.ground(0,0,24,24,'#f4e6c8',.06);
 for(const sign of [-1,1])for(let k=-50;k<=50;k+=4){r.ground(k,sign*2,.7,.7,'#ebc879',.065);r.ground(sign*2,k,.7,.7,'#ebc879',.065)}
 for(const a of AREAS.slice(1)){const sx=Math.sign(a.x),sz=Math.sign(a.z);r.ground(sx*30,sz*12,42,4,'#eee6cf',.04);r.ground(sx*12,sz*33,4,42,'#eee6cf',.04)}
 for(const z of [-18,-33,-47])r.ground(-32,z,36,3,'#eee6cf',.04);
 r.ground(-31,31,7,44,'#fff0d9',.041);for(let z=11;z<52;z+=3)for(const x of [-34,-28])r.ground(x,z,.45,.8,'#e7baa8',.06);
 for(const z of [-18,-30,-48])r.ground(32,z,38,3,'#eee6cf',.04);r.ground(32,-31,3,40,'#eee6cf',.04);
 const p=LAKE;r.ground(p.x,p.z,p.w+2,p.d+2,'#f6e4b6',.025);r.ground(p.x,p.z,p.w,p.d,'#8fcddf',.03);
 for(const [x,z]of [[30,31],[37,38],[40,30]]){r.ground(x,z,1.2,1.2,'#b9d98d',.033);r.ground(x+.3,z,.3,.3,'#edb6c8',.035)}
 for(const [x,z]of [[18,45],[46,48]]){r.ground(x,z,4,3,'#eab7c6',.026);for(let k=-1;k<=1;k++)r.ground(x+k,z,.4,3,'#fff0cf',.027)}
 for(const [x,z,w,d]of [[35,22,28,3],[35,48,28,3],[21,35,3,29],[49,35,3,29]])r.ground(x,z,w,d,'#eee6cf',.04);
 // Parking bays remain visible after a car is swallowed and share its road direction.
 for(const i of g.items.filter(i=>i.placement==='parking'&&g.isIntroduced(i))){
  const p=fromLevel(i.x,i.z,g.levelIndex),vertical=((i.yaw-(g.levelIndex||0)+4)%4)%2;
  const w=vertical?2:3,d=vertical?3:2;
  r.ground(p.x,p.z,w,d,'#d2c9b5',.045);
  for(const sign of [-1,1]){
   r.ground(p.x+sign*w/2,p.z,.08,d,'#fff0cd',.05);
   r.ground(p.x,p.z+sign*d/2,w,.08,'#fff0cd',.05);
  }
 }
 for(const o of TOWN_SCENERY){
  if(!canWalkWorld(o.x,o.z,o.type.r,g.openAreas,g.expansion))continue;
  if(o.kind==='house'&&g.levelIndex===1){r.cube(o.x,0,o.z,1.6,2.5,1.6,'#f3e6cf');r.cube(o.x,2.1,o.z,4.8,1.1,4.4,'#bd93ce');r.cube(o.x,3.2,o.z,3.2,.7,3,'#d4b8df');for(const a of [-1,1])r.cube(o.x+a,3.25,o.z,.5,.2,.6,'#fff2d3');}
  else if(o.kind==='house'){
   r.cube(o.x,0,o.z,4.8,2.8,4.2,'#fff0cb');for(let k=0;k<4;k++)r.cube(o.x,2.8+k*.35,o.z,5.1-k*.9,.4,4.6,'#e8a2b3');r.cube(o.x,.05,o.z+2.15,.8,1.8,.08,'#b68c68');
   for(const sign of [-1,1]){r.cube(o.x+sign*1.4,1,o.z+2.15,.8,.8,.08,'#8fc7c6');r.ground(o.x+sign*2,o.z+3,1,.8,'#95bd7e',.07)}
  }else{r.cube(o.x,0,o.z,.35,1,.35,'#b28e6c');r.cube(o.x,.8,o.z,1.3,1.2,1.3,'#96c77c');r.cube(o.x,2,o.z,.9,.6,.9,'#b5d98b')}
 }
 for(const a of AREAS.slice(1))for(let k=0;k<12;k++){const x=a.x-10+k*1.7,z=a.z+20;if(!canWalkTownTerrain(x,z,.4))continue;r.ground(x,z,.8,.6,'#94bd7d',.066);r.ground(x,z,.24,.24,k%2?'#edb5c8':'#efd38b',.072)}
}

export function drawTown(r,g){
 if(g.levelIndex!==1){drawLocalTown(r,g);return}
 const adapter={ground(x,z,w,d,c,y){const p=toLevel(x,z,1);r.ground(p.x,p.z,d,w,levelColor(c,1),y)},cube(x,y,z,w,h,d,c){const p=toLevel(x,z,1);r.cube(p.x,y,p.z,d,h,w,levelColor(c,1))}};
 drawLocalTown(adapter,g);
 for(const p of g.scenerySolids.filter(o=>o.kind==='ruin'&&g.isIntroduced(o))){r.cube(p.x,0,p.z,1,1.8,1,'#c9bad9');r.cube(p.x,1.8,p.z,1.2,.25,1.2,'#f0e6d3');r.cube(p.x,2.05,p.z,.4,.65,.4,'#b2d9d0')}
}
