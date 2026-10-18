import {soundEvent} from './sound-events.js';
import {configureForest,updateForest} from './forest-props.js';
import {LEVELS,PORTAL_SECONDS,toLevel,fromLevel,levelExtent} from './levels.js';
import {AREAS,canWalkWorld,canWalkTownTerrain,areaAt,landAreaId,worldExtent,RESIDENT_ROUTES,worldHalf,inShallows,WATER_SPEED} from './world.js';
import {createInteractions,updateInteractions,nearbyInteraction} from './interactions.js';
import {makeTownItems,TOWN_SCENERY} from './town-content.js';
import {createResidents,updateResidents} from './residents.js';
import {arrangeSweetStreet,SHOP_LOTS} from './sweet-street.js';
// Pure gameplay: no DOM, renderer, audio, storage or platform API dependencies.
import {rollBy} from './rolling.js';
import {canWalkTerrain,districtAt,SCENERY_SOLIDS,canEnterDistrict,itemDistrictOpen} from './terrain.js';
export const STAGES = [
  {name:'奶蛋',xp:0,radius:.48,reach:.9,speed:4.1,color:'#f5c96b'},
  {name:'萌芽奶团',xp:50,radius:.64,reach:1.3,speed:5.0,color:'#f2ab76'},
  {name:'幼年奶龙',xp:125,radius:.85,reach:1.8,speed:6.0,color:'#e68f78'},
  {name:'少年奶龙',xp:370,radius:1.08,reach:2.4,speed:7.2,color:'#b39bc9'},
  {name:'完全体奶龙',xp:850,radius:1.35,reach:3.1,speed:8.5,color:'#8dbba6'}
];
// name, required stage, growth, points, duration, collision radius, height, color
export const SWALLOW_TIME_SCALE = .2;
export const MOTION = Object.freeze({driveResponse:8,coastResponse:5.5,stopSpeed:.02});
export const DASH = Object.freeze({durations:Object.freeze([.6,.8,1,1.2,1.4]),cooldown:4,multiplier:2.5});
export const REBOUND = Object.freeze({duration:.2,cooldown:.35,restitution:.65,minSpeed:1.8,maxSpeed:7,drag:3});
export const TYPES = [
 ['糖果',1,2,10,.75,.18,.35,'#ee9db0'],['奶盒',1,3,15,.85,.2,.4,'#9bcfc8'],['曲奇',1,3,15,.85,.22,.42,'#e4b56d'],['布丁',1,2,10,.55,.18,.24,'#f5d57b'],
 ['礼物箱',2,7,35,.75,.3,.5,'#ed9daf'],['花盆',2,7,35,.45,.35,.7,'#d99779'],['积木',2,8,40,.5,.4,.65,'#99cfc6'],['野餐篮',2,7,35,.4,.3,.72,'#dab378'],
 ['长椅',3,22,110,.38,.65,.8,'#c8966b'],['路灯',3,20,100,.5,.4,1.8,'#f6d783'],['垃圾桶',3,22,110,.75,.5,.9,'#99bdb0'],['售货推车',3,24,120,.65,.65,1.4,'#e9a2b3'],
 ['甜品车',4,65,325,.8,.7,1.1,'#96cfc8'],['冰淇淋摊',4,75,375,.7,.7,1.8,'#f5d891'],['彩虹滑梯',4,80,400,.9,.85,2.3,'#ebabb6'],['花园凉亭',4,90,450,1.2,1.05,2.5,'#eed8a1'],
 ['甜品店',5,150,750,1.4,1.15,3,'#f0c786'],['旋转茶杯',5,150,750,1.5,1.3,2,'#99cfc5'],['星星摩天轮',5,180,900,1.8,1.5,4.2,'#eca0b2'],
 ['奶油皇冠城堡',5,250,1500,2.5,4.2,8.4,'#f4dda0']
].map((a,id)=>({id,name:a[0],level:a[1],xp:a[2],points:a[3],duration:a[4]*SWALLOW_TIME_SCALE,r:a[5],h:a[6],color:a[7]}));
export const MAX_ITEM_RADIUS=Math.max(...TYPES.map(t=>t.r));
export const BOUNDS = 27;
export const MAP_BOUNDS = Object.freeze([27,33,40,48,58]);
export const EXPANSION_SECONDS = 1;
export function expansionItems(stage,firstId=0){
 const inner=MAP_BOUNDS[stage-1],outer=MAP_BOUNDS[stage];if(!inner||!outer)return [];
 const middle=(inner+outer)/2,types=TYPES.filter(t=>t.id!==19&&(stage===4?t.level>=4:t.level===stage+1)),items=[];
 for(let side=0;side<4;side++)for(let n=0;n<6;n++){
  const along=-inner+4+n*(2*inner-8)/5,x=side<2?(side===0?-middle:middle):along,z=side<2?along:(side===2?-middle:middle);
  items.push({id:firstId+items.length,type:types[(side*6+n)%types.length],x,z,state:'available',progress:0,expansionStage:stage,district:districtAt(x,z).id});
 }return items;
}
export function makeMap(seed=42){
 let n=seed>>>0;const random=()=>((n=(1664525*n+1013904223)>>>0)/4294967296);const items=[];
 const add=(type,x,z)=>items.push({id:items.length,type:TYPES[type],x,z,state:'available',progress:0});
 // Short food trails surround the retained spawn; 36 snacks allow route choice.
 for(let i=0;i<36;i++){const a=i*.58,r=2.4+i*.15;add(i%4,-15+Math.cos(a)*r,-14+Math.sin(a)*r)}
 // Four districts, with all large silhouettes visible before they become edible.
 const clusters=[[-17,-16],[16,-17],[-17,14],[16,16]];
 for(let tier=2;tier<=3;tier++)for(let area=0;area<4;area++)for(let k=0;k<6;k++){
  const [cx,cz]=clusters[area],x=cx+(k%3-1)*3.7+(random()-.5)*.35,z=cz+(tier===2?-5:4)+(k>=3?2:0);
  if(x>10&&x<22&&z>10&&z<22)continue;
  add((tier-1)*4+(k+area)%4,x,z);
 }
 // Replace the pond's skipped placements with bank-side rows.
 while(items.length<84){const k=items.length-78;add(8+(k%4+4)%4,7,k*2-8)}
 for(let area=0;area<4;area++)for(let k=0;k<4;k++){
  const [cx,cz]=clusters[area];add(12+k,cx+(k%2?4:-4),cz+(k<2?-1:3));
 }
 add(16,-20,7);add(17,19,-8);add(18,11,-20);add(19,0,0);
 arrangeSweetStreet(items,TYPES);
 // Resolve cross-tier clearance before building the spatial grid. This also keeps
 // decorative footprints and the largest body away from pond edges.
 const placed=[];
 for(const item of items){
  const legal=(x,z)=>(item.streetSample||!SHOP_LOTS.some(o=>Math.hypot(x-o.x,z-o.z)<item.type.r+1.75+1.35))&&(item.type.level===1||Math.hypot(x+15,z+14)>item.type.r+5)&&(item.type.id===19||Math.hypot(x,z)>item.type.r+6)&&Math.abs(x)+item.type.r<BOUNDS-.5&&Math.abs(z)+item.type.r<BOUNDS-.5&&canWalkTerrain(x,z,Math.max(item.type.r,1.35))&&!SCENERY_SOLIDS.some(o=>Math.hypot(x-o.x,z-o.z)<o.type.r+item.type.r+1.35)&&placed.every(o=>Math.hypot(x-o.x,z-o.z)>item.type.r+o.type.r+(item.type.level===o.type.level?.15:1.35));
  if(!legal(item.x,item.z)){
   const ox=item.x,oz=item.z;let found=false;
   for(let radius=.5;radius<55&&!found;radius+=.5)for(let a=0;a<32;a++){
    const x=ox+Math.cos(a*Math.PI/16)*radius,z=oz+Math.sin(a*Math.PI/16)*radius;
    if(legal(x,z)){item.x=x;item.z=z;found=true;break}
   }
   if(!found)throw Error('No clear item placement');
  }
  item.district=districtAt(item.x,item.z).id;placed.push(item);
 }
 return items;
}
export class SpatialGrid{
 constructor(items,cell=6){this.cell=cell;this.cells=new Map();for(const i of items){const k=this.key(i.x,i.z);if(!this.cells.has(k))this.cells.set(k,[]);this.cells.get(k).push(i)}}
 key(x,z){return `${Math.floor(x/this.cell)},${Math.floor(z/this.cell)}`}
 query(x,z,r){const out=[];for(let a=Math.floor((x-r)/this.cell);a<=Math.floor((x+r)/this.cell);a++)for(let b=Math.floor((z-r)/this.cell);b<=Math.floor((z+r)/this.cell);b++)for(const i of this.cells.get(`${a},${b}`)||[])if(i.state!=='eaten')out.push(i);return out}
}
export class LocalGame{
 constructor(seed=42){this.reset(seed)}
 reset(seed=42){this.seed=seed;this.items=makeMap(seed);this.grid=new SpatialGrid(this.items);this.player={x:-15,z:-14};this.stage=0;this.xp=0;this.score=0;this.count=0;this.time=240;this.elapsed=0;this.state='ready';this.target=null;this.evolveTime=0;this.combo=0;this.lastEat=-10;this.events=[];this.velocity={x:0,z:0};this.roll=[0,0,0,1];this.rollDistance=0;this.bounds=BOUNDS;this.targetBounds=BOUNDS;this.unlockedRings=0;this.expansion=null;this.dashRemaining=0;this.dashDuration=DASH.durations[0];this.dashStage=null;this.dashCooldown=0;this.dashDirection={x:-Math.SQRT1_2,z:-Math.SQRT1_2};this.lastDirection={...this.dashDirection};this.dashCount=0;this.reboundRemaining=0;this.reboundUntil=new Map();this.reboundCount=0;this.residents=createResidents()}
 canAccessItem(item){return item.type.level<=this.stage+1&&itemDistrictOpen(item,this.stage+1)}
 get maxItemRadius(){return MAX_ITEM_RADIUS}
 get config(){const c=STAGES[this.stage];return this.runeTime>0?{...c,reach:c.reach+1.5}:c}
 get availableDashDuration(){return DASH.durations[this.stage]}
 start(){if(this.state==='ready')this.state='playing'}
 pause(){if(this.state==='playing'){this.cancelDash('pause');this.reboundRemaining=0;this.velocity={x:0,z:0};this.state='paused'}}
 resume(){if(this.state==='paused')this.state='playing'}
 cancelTarget(){if(this.target){this.target.state='available';this.target.progress=0;this.target=null}}
 get canDash(){return this.state==='playing'&&this.dashRemaining<=0&&this.dashCooldown<=0&&this.reboundRemaining<=0}
 requestDash(input={x:0,z:0}){
  if(!this.canDash)return false;
  const direction=Math.hypot(input.x,input.z)>1e-6?input:Math.hypot(this.velocity.x,this.velocity.z)>MOTION.stopSpeed?this.velocity:this.lastDirection,len=Math.hypot(direction.x,direction.z);
  this.dashDirection={x:direction.x/len,z:direction.z/len};this.dashDuration=this.availableDashDuration;this.dashStage=this.stage;this.dashRemaining=this.dashDuration;this.dashCount++;
  this.velocity={x:this.dashDirection.x*this.config.speed*DASH.multiplier,z:this.dashDirection.z*this.config.speed*DASH.multiplier};
  this.events.push({kind:'dash',phase:'start',direction:{...this.dashDirection},stage:this.dashStage+1,duration:this.dashDuration});return true;
 }
 cancelDash(reason){if(this.dashRemaining>0){this.dashRemaining=0;this.dashCooldown=DASH.cooldown;this.events.push({kind:'dash',phase:'end',reason})}}
 blockingItem(x,z,r=this.config.radius){return [...SCENERY_SOLIDS,...this.grid.query(x,z,r+MAX_ITEM_RADIUS)].find(i=>i.type.level>this.stage+1&&Math.hypot(x-i.x,z-i.z)<r+i.type.r)}
 canStand(x,z,r=this.config.radius){return Math.abs(x)<=this.bounds-r&&Math.abs(z)<=this.bounds-r&&canWalkTerrain(x,z,r)&&canEnterDistrict(x,z,r,this.stage+1,this.bounds)&&!this.blockingItem(x,z,r)}
 rebound(item){
  this.cancelDash('collision');
  if(this.reboundRemaining>0||(this.reboundUntil.get(item.id)||0)>this.elapsed)return false;
  const dx=this.player.x-item.x,dz=this.player.z-item.z,d=Math.hypot(dx,dz);if(d<1e-9)return false;
  const nx=dx/d,nz=dz/d,incoming=-(this.velocity.x*nx+this.velocity.z*nz);if(incoming<=1e-6)return false;
  const speed=Math.min(REBOUND.maxSpeed,Math.max(REBOUND.minSpeed,incoming*REBOUND.restitution));
  // Preserve tangential motion for glancing contact, cap the total outgoing speed.
  const tx=this.velocity.x+incoming*nx,tz=this.velocity.z+incoming*nz;
  let vx=tx+speed*nx,vz=tz+speed*nz;const scale=Math.min(1,REBOUND.maxSpeed/Math.hypot(vx,vz));
  this.velocity={x:vx*scale,z:vz*scale};this.reboundRemaining=REBOUND.duration;this.reboundUntil.set(item.id,this.elapsed+REBOUND.cooldown);this.reboundCount++;
  this.events.push({kind:'rebound',itemId:item.id,normal:{x:nx,z:nz},incomingSpeed:incoming,speed:Math.hypot(this.velocity.x,this.velocity.z)});return true;
 }
 relocate(){if(this.canStand(this.player.x,this.player.z))return;const origin={...this.player};for(let r=.3;r<this.bounds*3;r+=.3)for(let a=0;a<24;a++){const x=origin.x+Math.cos(a*Math.PI/12)*r,z=origin.z+Math.sin(a*Math.PI/12)*r;if(this.canStand(x,z)){this.player={x,z};return}}throw Error('No walkable spawn')}
 beginExpansion(){this.targetBounds=MAP_BOUNDS[this.stage];this.expansion={from:this.bounds,to:this.targetBounds,elapsed:0,stage:this.stage}}
 updateExpansion(dt){
  if(!this.expansion)return;const e=this.expansion;e.elapsed=Math.min(EXPANSION_SECONDS,e.elapsed+dt);const t=e.elapsed/EXPANSION_SECONDS;
  this.bounds=e.from+(e.to-e.from)*t*t*(3-2*t);
  if(t===1){for(let s=this.unlockedRings+1;s<=e.stage;s++)this.items.push(...expansionItems(s,this.items.length));this.unlockedRings=e.stage;this.grid=new SpatialGrid(this.items);this.expansion=null;this.events.push({kind:'expand',side:this.bounds*2,rings:this.unlockedRings})}
 }
 update(dt,input={x:0,z:0}){
  if(this.state!=='playing')return;
  dt=Math.min(Math.max(dt,0),.05);
  // Split at the captured activation duration; evolution never extends the current burst.
  if(this.dashRemaining>1e-9&&this.dashRemaining<dt-1e-9){const part=this.dashRemaining;this.update(part,input);this.update(dt-part,input);return}
  if(this.reboundRemaining>1e-9&&this.reboundRemaining<dt-1e-9){const part=this.reboundRemaining;this.update(part,input);this.update(dt-part,input);return}
    this.time=Math.max(0,this.time-dt);this.elapsed+=dt;
  if(this.time<=0){this.cancelTarget();this.cancelDash('timeout');this.reboundRemaining=0;this.velocity={x:0,z:0};this.state='finished';this.events.push({kind:'end',win:false});return}
  if(this.world)updateInteractions(this,dt);
  this.updateExpansion(dt);
  this.evolveTime=Math.max(0,this.evolveTime-dt);
  const len=Math.hypot(input.x,input.z),scale=len>1?1/len:1,response=len>0?MOTION.driveResponse:MOTION.coastResponse,smooth=1-Math.exp(-dt*response);
  const dashing=this.dashRemaining>0;
  if(dashing)this.velocity={x:this.dashDirection.x*this.config.speed*DASH.multiplier,z:this.dashDirection.z*this.config.speed*DASH.multiplier};
  else{this.dashCooldown=Math.max(0,this.dashCooldown-dt);if(this.dashCooldown<1e-9)this.dashCooldown=0;
   if(this.reboundRemaining>0){const decay=Math.exp(-dt*REBOUND.drag);this.velocity.x*=decay;this.velocity.z*=decay;this.reboundRemaining=Math.max(0,this.reboundRemaining-dt);if(this.reboundRemaining<1e-9)this.reboundRemaining=0}
   else{this.velocity.x+=(input.x*scale*this.config.speed-this.velocity.x)*smooth;this.velocity.z+=(input.z*scale*this.config.speed-this.velocity.z)*smooth;if(len===0&&Math.hypot(this.velocity.x,this.velocity.z)<MOTION.stopSpeed)this.velocity={x:0,z:0}}
  }
  // Small substeps plus axis sliding prevent tunnelling and keep boundary contact smooth.
  const steps=Math.max(1,Math.ceil(Math.hypot(this.velocity.x,this.velocity.z)*dt/.15));
  for(let s=0;s<steps;s++){
   const before={...this.player};
   const rawX=this.player.x+this.velocity.x*dt/steps*(this.world?this.surfaceSpeed(this.player.x,this.player.z):1),x=Math.max(-this.bounds+this.config.radius,Math.min(this.bounds-this.config.radius,rawX));
   if(this.canStand(x,this.player.z)){this.player.x=x;if(x!==rawX)this.velocity.x=0}else{const item=this.blockingItem(x,this.player.z);if(item&&this.rebound(item))break;this.velocity.x=0}
   const rawZ=this.player.z+this.velocity.z*dt/steps*(this.world?this.surfaceSpeed(this.player.x,this.player.z):1),z=Math.max(-this.bounds+this.config.radius,Math.min(this.bounds-this.config.radius,rawZ));
   let bounced=false;
   if(this.canStand(this.player.x,z)){this.player.z=z;if(z!==rawZ)this.velocity.z=0}else{const item=this.blockingItem(this.player.x,z);bounced=Boolean(item&&this.rebound(item));if(!bounced)this.velocity.z=0}
   const dx=this.player.x-before.x,dz=this.player.z-before.z,distance=Math.hypot(dx,dz);this.roll=rollBy(this.roll,dx,dz,this.config.radius);this.rollDistance+=distance;if(distance>1e-9)this.lastDirection={x:dx/distance,z:dz/distance};
   if(bounced)break;
  }
  if(dashing&&this.dashRemaining>0){this.dashRemaining=Math.max(0,this.dashRemaining-dt);if(this.dashRemaining<1e-9)this.finishDash()}
  updateResidents(this,dt);
  if(this.evolveTime>0)return;
  if(this.target&&Math.hypot(this.target.x-this.player.x,this.target.z-this.player.z)>this.config.reach+this.target.type.r)this.cancelTarget();
  if(!this.target){const nearby=[...this.grid.query(this.player.x,this.player.z,this.config.reach+MAX_ITEM_RADIUS),...(this.world?this.residents.filter(n=>n.active).map(n=>n.item):[])].filter(i=>i.state==='available'&&this.canAccessItem(i)&&Math.hypot(i.x-this.player.x,i.z-this.player.z)<=this.config.reach+i.type.r);nearby.sort((a,b)=>Math.hypot(a.x-this.player.x,a.z-this.player.z)-Math.hypot(b.x-this.player.x,b.z-this.player.z));if(nearby.length){this.target=nearby[0];this.target.state='eating'}}
  if(this.target){this.target.progress+=dt/this.target.type.duration;if(this.target.progress>=1)this.consume(this.target)}
 }
 finishDash(){this.dashRemaining=0;this.dashCooldown=DASH.cooldown;this.events.push({kind:'dash',phase:'end',reason:'complete'})}
 consume(item){
  if(item!==this.target||item.state!=='eating')return;
  item.state='eaten';item.progress=1;this.target=null;this.xp+=item.type.xp;this.count++;
  this.combo=this.elapsed-this.lastEat<3?Math.min(this.combo+1,5):1;this.lastEat=this.elapsed;
  const gain=Math.round(item.type.points*(1+(this.combo-1)*.1));this.score+=gain;this.events.push({kind:'eat',item,gain});
  let evolved=false;while(this.stage<4&&this.xp>=STAGES[this.stage+1].xp){this.stage++;evolved=true}
  if(evolved){this.evolveTime=.75;this.beginExpansion();this.relocate();this.events.push({kind:'evolve',stage:this.stage})}
  if(item.human){const resident=this.residents.find(n=>n.id===item.residentId);if(resident)resident.active=false}
  if(item.type.id===19&&(!this.world||item.isLandmark)){this.cancelDash('victory');this.reboundRemaining=0;this.velocity={x:0,z:0};this.state='finished';this.events.push({kind:'end',win:true})}
 }
 drainEvents(){return this.events.splice(0)}
}

// One production town shares the tested movement/swallowing core with local fixtures.
export class Game extends LocalGame{
 reset(seed=42){
  super.reset(seed);this.world=true;this.openAreas=1;this.visitedAreas=new Set([0]);this.bounds=54;this.targetBounds=54;this.player={x:0,z:10.5};
  this.interactions=createInteractions();this.interactionCount=0;this.bounceTime=0;this.runeTime=0;this.forestHop=null;this.items=makeTownItems(TYPES,this.interactions,seed);this.nextItemId=this.items.length;this.grid=new SpatialGrid(this.items);this.scenerySolids=TOWN_SCENERY;
  this.levelIndex=0;this.transition=null;this.levelSummaries=[];this.campaignElapsedBase=0;this.levelCheckpoint={score:0,count:0,totalElapsed:0,summaries:[]};this.pauseReturnState='playing';this.sceneRevision=(this.sceneRevision??0)+1;
  const bases=createResidents();this.residents=AREAS.flatMap(area=>Array.from({length:8},(_,index)=>{const id=area.id*8+index,route=RESIDENT_ROUTES[area.id],home=route[index%4];return {...bases[index],id,areaId:area.id,unlock:area.id+1,x:home[0],z:home[1],goal:(index+1)%4,home:[home[0]+(index>=4?1:0),home[1]],item:{id:'human-'+id,residentId:id,human:true,areaId:area.id,type:HUMAN_TYPE,x:home[0],z:home[1],state:'available',progress:0}}}));
 }
 update(dt,input={x:0,z:0}){
  if(this.state==='transition'){this.updatePortal(dt);return}
  if(this.state==='playing')updateForest(this,Math.min(.05,Math.max(0,dt)));
  super.update(dt,input);const area=this.getAreaAt(this.player.x,this.player.z);if(area)this.visitedAreas.add(area.id)}
 get level(){return LEVELS[this.levelIndex]}
 get campaignElapsed(){return this.campaignElapsedBase+this.elapsed}
 get areaDefinitions(){return AREAS.map(a=>({...a,...toLevel(a.x,a.z,this.levelIndex),name:this.level.areas[a.id]}))}
 getAreaAt(x,z){const p=fromLevel(x,z,this.levelIndex),a=areaAt(p.x,p.z);return a?this.areaDefinitions[a.id]:undefined}
 landAreaId(x,z){const p=fromLevel(x,z,this.levelIndex);return landAreaId(p.x,p.z)}
 terrainFree(x,z,r){const p=fromLevel(x,z,this.levelIndex);return canWalkWorld(p.x,p.z,r,this.openAreas,this.expansion)&&canWalkTownTerrain(p.x,p.z,r)}
 loadLevel(index,carry={score:0,count:0,totalElapsed:0,summaries:[]}){
  const seed=this.seed;this.reset(seed);this.levelIndex=index;this.score=carry.score;this.count=carry.count;this.campaignElapsedBase=carry.totalElapsed;this.levelSummaries=carry.summaries.map(s=>({...s}));this.levelCheckpoint={...carry,summaries:this.levelSummaries.map(s=>({...s}))};
  if(index===1){
   this.items=makeTownItems(TYPES,this.interactions,seed+101,1);
   const move=o=>Object.assign(o,toLevel(o.x,o.z,index));
   this.items.forEach(i=>{move(i);if(i.yaw!==undefined)i.yaw=(i.yaw+1)%4;if(i.isLandmark)i.type={...i.type,name:LEVELS[index].landmark,color:'#b8a1d3'};else if(i.shopStyle!==undefined)i.type={...i.type,name:['蘑菇杂货铺','糖晶工坊','精灵茶屋','森林果铺','月光冰店','蜂蜜糕点铺'][i.shopStyle]}});
   configureForest(this);this.interactions.forEach(move);this.scenerySolids=TOWN_SCENERY.map(o=>move({...o}));
   for(const [id,x,z]of [[0,-6.8,-2],[1,6.8,-2],[2,0,7]])this.scenerySolids.push(move({id:'ruin-pillar-'+id,x,z,kind:'ruin',state:'available',type:{r:.7,level:Infinity}}));
   this.residents.forEach(n=>{move(n);const h=toLevel(...n.home,index);n.home=[h.x,h.z];n.route=RESIDENT_ROUTES[n.areaId].map(([x,z])=>{const p=toLevel(x,z,index);return [p.x,p.z]});move(n.item)});
   this.player=toLevel(0,10.5,index);this.nextItemId=this.items.length;this.grid=new SpatialGrid(this.items);this.relocate();
  }
  this.state='playing';
 }
 retryLevel(){const index=this.levelIndex,carry=this.levelCheckpoint;this.loadLevel(index,carry)}
 pause(){if(this.state==='transition'){this.pauseReturnState='transition';this.state='paused';this.velocity={x:0,z:0}}else if(this.state==='playing'){this.pauseReturnState='playing';super.pause()}}
 resume(){if(this.state==='paused'){this.state=this.pauseReturnState||'playing';this.velocity={x:0,z:0}}}
 consume(item){
  const landmark=item===this.target&&item.state==='eating'&&item.isLandmark;super.consume(item);if(!landmark||item.state!=='eaten')return;
  const summary={level:this.levelIndex+1,name:this.level.name,score:this.score-this.levelCheckpoint.score,count:this.count-this.levelCheckpoint.count,seconds:+this.elapsed.toFixed(2)};this.levelSummaries.push(summary);
  if(this.levelIndex===0){this.events=this.events.filter(e=>!(e.kind==='end'&&e.win));this.state='transition';this.transition={elapsed:0,from:0,to:1,switched:false,origin:{x:item.x,z:item.z},start:{...this.player}};this.expansion=null;this.bounceTime=0;this.events.push({kind:'portal-start',nextLevel:2})}
 }
 updatePortal(dt){
  const t=this.transition;if(!t)return;dt=Math.min(.05,Math.max(0,dt));t.elapsed=Math.min(PORTAL_SECONDS,t.elapsed+dt);
  if(!t.switched&&t.elapsed>=1.1){const carry={score:this.score,count:this.count,totalElapsed:this.campaignElapsed,summaries:this.levelSummaries},events=this.events.slice();this.loadLevel(1,carry);this.events=[...events,{kind:'level-loaded',level:2}];this.transition=t;t.switched=true;this.state='transition'}
  if(t.elapsed>=PORTAL_SECONDS){this.transition=null;this.state='playing';this.events.push({kind:'level-ready',level:2})}
 }
 get extent(){return levelExtent(worldExtent(this.openAreas,this.expansion),this.levelIndex)}
 get targetExtent(){return levelExtent(worldExtent(this.expansion?this.expansion.stage+1:this.openAreas),this.levelIndex)}
 isIntroduced(o){const p=fromLevel(o.x,o.z,this.levelIndex);return canWalkWorld(p.x,p.z,o.type?.r??o.r??0,this.openAreas,this.expansion)}
 inWater(x=this.player.x,z=this.player.z){const p=fromLevel(x,z,this.levelIndex);return inShallows(p.x,p.z)}
 surfaceSpeed(x,z){return this.inWater(x,z)?WATER_SPEED:1}
 get nearbyInteraction(){return nearbyInteraction(this)}
 canAccessItem(item){return item.type.level<=this.stage+1&&this.isIntroduced(item)}
 blockingItem(x,z,r=this.config.radius,ignoreProp){
  const fixed=[...this.scenerySolids,...this.grid.query(x,z,r+MAX_ITEM_RADIUS)].find(i=>this.isIntroduced(i)&&i.type.level>this.stage+1&&Math.hypot(x-i.x,z-i.z)<r+i.type.r);if(fixed)return fixed;
  const prop=this.interactions.find(p=>p!==ignoreProp&&p.solid&&p.state!=='spent'&&this.isIntroduced(p)&&Math.hypot(x-p.x,z-p.z)<r+p.r);return prop?{id:'prop-'+prop.id,x:prop.x,z:prop.z,type:{r:prop.r,level:Infinity}}:undefined;
 }
 canStand(x,z,r=this.config.radius,ignoreProp){return this.terrainFree(x,z,r)&&!this.blockingItem(x,z,r,ignoreProp)}
 canPropStand(x,z,r,ignore){return this.terrainFree(x,z,r)&&![...this.scenerySolids,...this.grid.query(x,z,r+MAX_ITEM_RADIUS)].some(o=>o!==ignore&&this.isIntroduced(o)&&o.state!=='eaten'&&Math.hypot(x-o.x,z-o.z)<r+o.type.r+.03)&&!this.interactions.some(o=>this.isIntroduced(o)&&o!==ignore&&o.solid&&o.state!=='spent'&&Math.hypot(x-o.x,z-o.z)<r+o.r+.03)}
 dropRewards(source,count){
  const before=this.items.length;
  for(let k=0;k<count;k++)for(let step=0;step<128;step++){const a=(k/count+(step%32)/32)*Math.PI*2,rr=source.r+1+Math.floor(step/32)*.7,x=source.x+Math.cos(a)*rr,z=source.z+Math.sin(a)*rr;if(this.canPropStand(x,z,.25,source)&&this.items.every(i=>i.state==='eaten'||Math.hypot(x-i.x,z-i.z)>.25+i.type.r+.05)){const item={id:this.nextItemId++,type:source.rewardName?{...TYPES[source.rewardType??0],name:source.rewardName}:TYPES[source.rewardType??((source.id+k)%4)],x,z,areaId:this.landAreaId(x,z),state:'available',progress:0,rewardFrom:source.id};this.items.push(item);break}}
  this.grid=new SpatialGrid(this.items);if(this.items.length>before)soundEvent(this,source,'reward');
 }
 beginExpansion(){const fromHalf=worldHalf(this.openAreas,this.expansion);this.expansion={elapsed:0,stage:this.stage,fromHalf};this.targetBounds=this.targetExtent.maxX;}
 updateExpansion(dt){if(!this.expansion)return;this.expansion.elapsed=Math.min(EXPANSION_SECONDS,this.expansion.elapsed+dt);if(this.expansion.elapsed>=EXPANSION_SECONDS){this.openAreas=this.stage+1;this.unlockedRings=this.stage;this.expansion=null;this.relocate();this.events.push({kind:'expand',side:this.extent.maxX-this.extent.minX,rings:this.unlockedRings})}}
}
export const HUMAN_TYPE=Object.freeze({id:20,name:'小镇居民',level:1,xp:3,points:20,duration:.24,r:.32,h:1.3,color:'#93b9d1'});
