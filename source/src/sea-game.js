import {LEVELS} from './levels.js';
import {
 SEA_WORLD,SEA_ZONES,SEA_STAGE_NAMES,SEA_GROWTH_XP,SEA_STAGE_RADIUS,SEA_STAGE_SPEED,SEA_DASH,
 SEA_LIVES,SEA_TIME,SEA_INVULN,SEA_ITEMS,CREATURE_TYPES,createSeaWorld,zoneAt,freeSpot,relocateFree,hitsSolid
} from './sea-content.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function normalize(x,y){const l=Math.hypot(x,y);return l>1?{x:x/l,y:y/l}:(x||y?{x,y}:{x:0,y:0})}
// Pure third-level simulation: no DOM, renderer, storage or audio dependencies.
export class SeaGame{
 constructor({seed=42,carry=null}={}){this.sceneRevision=0;this.reset(seed,carry)}
 reset(seed=42,carry=null){
  const c=carry&&typeof carry==='object'?carry:{};
  this.seed=seed>>>0;
  this.carry={score:Number(c.score)||0,count:Number(c.count)||0,totalElapsed:Number(c.totalElapsed)||0,summaries:Array.isArray(c.summaries)?c.summaries.map(s=>({...s})):[]};
  this.world=createSeaWorld(this.seed);
  this.levelIndex=2;this.levelSummaries=this.carry.summaries.map(s=>({...s}));this.levelCheckpoint={...this.carry,summaries:this.levelSummaries.map(s=>({...s}))};
  this.stage=0;this.xp=0;this.score=this.carry.score;this.count=this.carry.count;
  this.time=SEA_TIME;this.elapsed=0;this.state='ready';this.settled=false;
  this.player={x:170,y:540,z:0,facing:1,radius:SEA_STAGE_RADIUS[0]};
  this.velocity={x:0,y:0,z:0};this.lastDirection={x:1,y:0};
  this.lives=SEA_LIVES;this.invuln=0;this.hitFlash=0;this.cameraShake=0;
  this.dashRemaining=0;this.dashDuration=SEA_DASH.durations[0];this.dashCooldown=0;this.dashStage=null;this.dashDirection={x:1,y:0};this.dashCount=0;
  this.reboundRemaining=0;this.reboundCount=0;this.events=[];this.effects=[];
  this.replenishTimer=5;this.spawnReserve=18;this.zoneId=0;this.visitedAreas=new Set([0]);
  this.shield=0;this.springRemaining=0;this.tabletHint=false;this.openAreas=1;this.interactions=this.world.items;this.residents=[];this.target=null;
  this.rollDistance=0;this.roll=[0,0,0,1];this.movementStyle='free-swim';this.world2d=true;this.worldLand=false;
  this.bounds=SEA_WORLD.width/2;this.mapSide=SEA_WORLD.width;this.unlockedRings=0;this.expansion=null;this.targetBounds=SEA_WORLD.width;
  this.sceneRevision++;
 }
 get level(){return LEVELS[2]}
 get stageName(){return SEA_STAGE_NAMES[this.stage]}
 get playerLevel(){return this.stage+1}
 get config(){const s=this.stage;return {radius:SEA_STAGE_RADIUS[s],speed:SEA_STAGE_SPEED[s],reach:SEA_STAGE_RADIUS[s]*.92+Math.max(8,SEA_STAGE_RADIUS[s]*.24),name:SEA_STAGE_NAMES[s],color:'#f5c96b'}}
 get availableDashDuration(){return SEA_DASH.durations[this.stage]}
 get campaignElapsed(){return this.carry.totalElapsed+this.elapsed}
 get canDash(){return this.state==='playing'&&this.dashRemaining<=0&&this.dashCooldown<=0}
 get zone(){return zoneAt(this.player.x)}
 get extent(){return {minX:SEA_WORLD.minX,maxX:SEA_WORLD.maxX,minZ:SEA_WORLD.minY,maxZ:SEA_WORLD.maxY}}
 get targetExtent(){return this.extent}
 get growth(){const next=this.stage<3?SEA_GROWTH_XP[this.stage+1]:SEA_GROWTH_XP[4];const base=SEA_GROWTH_XP[this.stage];return {xp:this.xp,base,next,pct:this.stage>=4?1:clamp((this.xp-base)/(next-base),0,1),max:this.stage>=4}}
 start(){if(this.state==='ready')this.state='playing'}
 pause(){if(this.state==='playing'){this.state='paused';this.velocity={x:0,y:0,z:0}}}
 resume(){if(this.state==='paused')this.state='playing'}
 inWater(){return true}
 surfaceSpeed(){return 1}
 isIntroduced(){return true}
 canAccessItem(item){return this.state==='playing'&&Boolean(item&&item.state==='ready'&&Math.hypot(item.x-this.player.x,item.y-this.player.y)<=item.r+this.player.radius+25)}
 get nearbyItem(){return this.world.items.filter(i=>this.canAccessItem(i)).sort((a,b)=>Math.hypot(a.x-this.player.x,a.y-this.player.y)-Math.hypot(b.x-this.player.x,b.y-this.player.y))[0]||null}
 requestInteract(){const item=this.nearbyItem;if(!item||item.mode!=='press')return false;this.activateItem(item);return true}
 activateItem(item){if(this.state!=='playing'||item.state!=='ready')return false;
  if(item.kind==='pearl'){this.xp+=2;this.score+=20;this.applyGrowth();item.state='spent'}
  else if(item.kind==='spring'){this.springRemaining=2.5;item.cooldown=6;item.state='cooldown'}
  else if(item.kind==='tablet'){this.tabletHint=true;item.state='spent'}
  else if(item.kind==='chest'){this.score+=120;item.state='spent'}
  else if(item.kind==='amulet'){this.shield=1;item.state='spent'}
  this.effects.push({kind:'evolve',x:item.x,y:item.y,life:.65,age:0,size:item.r,color:'#a8f6e5'});
  this.events.push({kind:'sea-item',item:item.kind,name:item.name,state:item.state,score:this.score,x:item.x,y:item.y});this.events.push({kind:'sound',cue:'seaEvolve'});return true}
 updateItems(dt){
  this.springRemaining=Math.max(0,this.springRemaining-dt);
  for(const item of this.world.items){
   if(item.state==='cooldown'){item.cooldown=Math.max(0,item.cooldown-dt);if(item.cooldown===0)item.state='ready';continue}
   if(item.state!=='ready')continue;
   if(!this.canAccessItem(item)){item.progress=0;continue}
   if(item.mode==='touch')this.activateItem(item);
   else if(item.mode==='hold'){item.progress+=dt;if(item.progress>=.65)this.activateItem(item)}
  }
 }
 applyGrowth(){const old=this.stage;while(this.stage<4&&this.xp>=SEA_GROWTH_XP[this.stage+1])this.stage++;
  if(old===this.stage)return;
  this.player.radius=SEA_STAGE_RADIUS[this.stage];if(!freeSpot(this.world,this.player.x,this.player.y,this.player.radius,0)){const q=relocateFree(this.world,this.player.x,this.player.y,this.player.radius);this.player.x=q.x;this.player.y=q.y;this.velocity={x:0,y:0,z:0}}
  this.effects.push({kind:'evolve',x:this.player.x,y:this.player.y,life:.9,age:0,size:this.player.radius,color:'#ffe39a'});this.events.push({kind:'evolve',stage:this.stage});this.events.push({kind:'sound',cue:'seaEvolve'})}

 requestDash(input={x:0,y:0}){
  if(!this.canDash)return false;
  const dir=normalize(input.x||0,input.y||0),use=Math.hypot(dir.x,dir.y)>1e-6?dir:(Math.hypot(this.velocity.x,this.velocity.y)>8?normalize(this.velocity.x,this.velocity.y):this.lastDirection);
  this.dashDirection={x:use.x,y:use.y};this.dashDuration=this.availableDashDuration;this.dashStage=this.stage;this.dashRemaining=this.dashDuration;this.dashCount++;
  this.velocity={x:use.x*this.config.speed*SEA_DASH.multiplier,y:use.y*this.config.speed*SEA_DASH.multiplier,z:0};
  this.events.push({kind:'dash',phase:'start',direction:{...this.dashDirection},stage:this.dashStage+1,duration:this.dashDuration});this.events.push({kind:'sound',cue:'seaDash'});
  return true;
 }
 cancelDash(reason){if(this.dashRemaining>0){this.dashRemaining=0;this.dashCooldown=SEA_DASH.cooldown;this.events.push({kind:'dash',phase:'end',reason})}}
 mouth(){const r=this.player.radius;return {x:this.player.x+this.player.facing*r*.92,y:this.player.y,r:Math.max(10,r*.42)}}
 canEat(c){return Boolean(c&&!c.eaten&&(c.boss?this.playerLevel>=5:c.level<this.playerLevel))}
 isDanger(c){return Boolean(c&&!c.eaten&&(c.level>this.playerLevel))}
 isNeutral(c){return Boolean(c&&!c.eaten&&!this.canEat(c)&&!this.isDanger(c))}
 update(dt,input={x:0,y:0}){
  if(this.state!=='playing')return;
  dt=clamp(Number.isFinite(dt)?dt:0,0,.05);
  if(dt<=0)return;
  this.time=Math.max(0,this.time-dt);this.elapsed+=dt;
  if(this.time<=0){this.finish(false,'timeout');return}
  this.invuln=Math.max(0,this.invuln-dt);this.hitFlash=Math.max(0,this.hitFlash-dt);this.cameraShake=Math.max(0,this.cameraShake-dt*2.4);
  const dir=normalize(input.x||0,input.y||0),moving=Math.hypot(dir.x,dir.y)>1e-6;
  if(this.dashRemaining>0){
   this.velocity={x:this.dashDirection.x*this.config.speed*SEA_DASH.multiplier,y:this.dashDirection.y*this.config.speed*SEA_DASH.multiplier,z:0};
   this.dashRemaining=Math.max(0,this.dashRemaining-dt);
   if(this.dashRemaining<=0){this.dashCooldown=SEA_DASH.cooldown;this.events.push({kind:'dash',phase:'end',reason:'complete'})}
  }else{
   this.dashCooldown=Math.max(0,this.dashCooldown-dt);
   const smooth=1-Math.exp(-dt*7),target={x:dir.x*this.config.speed,y:dir.y*this.config.speed};
   this.velocity.x+=(target.x-this.velocity.x)*smooth;this.velocity.y+=(target.y-this.velocity.y)*smooth;
   if(!moving&&Math.hypot(this.velocity.x,this.velocity.y)<6)this.velocity={x:0,y:0,z:0};
  }
  if(this.springRemaining>0)this.velocity.y-=Math.min(130,130*dt*7);
  this.movePlayer(dt);
  this.updateCreatures(dt);
  this.resolveContacts();
  // A boss contact finishes the level inside resolveContacts: freeze the same
  // frame so no later contact, spawn or summary-bearing counter can still move.
  if(this.state!=='playing')return;
  this.updateItems(dt);
  this.updateReplenishment(dt);
  this.updateEffects(dt);
  const z=zoneAt(this.player.x);if(z.id!==this.zoneId){this.zoneId=z.id;this.visitedAreas.add(z.id);this.events.push({kind:'zone-enter',zone:{id:z.id,name:z.name}})}
 }
 movePlayer(dt){
  const r=this.player.radius,speed=Math.hypot(this.velocity.x,this.velocity.y),steps=Math.max(1,Math.ceil(speed*dt/14));
  for(let i=0;i<steps;i++){
   const nx=clamp(this.player.x+this.velocity.x*dt/steps,SEA_WORLD.playerMinX,SEA_WORLD.playerMaxX);
   if(!hitsSolid(this.world.solids,nx,this.player.y,r))this.player.x=nx;else this.velocity.x=0;
   const ny=clamp(this.player.y+this.velocity.y*dt/steps,SEA_WORLD.playerMinY,SEA_WORLD.playerMaxY);
   if(!hitsSolid(this.world.solids,this.player.x,ny,r))this.player.y=ny;else this.velocity.y=0;
  }
  if(Math.abs(this.velocity.x)>10)this.player.facing=this.velocity.x>=0?1:-1;
  this.player.radius=r;
  if(Math.hypot(this.velocity.x,this.velocity.y)>1)this.lastDirection=normalize(this.velocity.x,this.velocity.y);
  if(this.dashRemaining>0&&this.world.props.length&&this.elapsed%0.12<dt)this.effects.push({kind:'bubble',x:this.player.x-this.player.facing*r*.9,y:this.player.y+r*.25,vx:-this.player.facing*18,vy:-16,life:.8,age:0,size:r*.12,color:'#d9fbff'});
 }
 updateCreatures(dt){
  const p=this.player,playerLevel=this.playerLevel;
  for(const c of this.world.creatures){
   if(c.eaten)continue;
   c.cooldown=Math.max(0,c.cooldown-dt);c.phase+=dt*.8;
   const dx=p.x-c.x,dy=p.y-c.y,d=Math.hypot(dx,dy),z=zoneAt(c.homeX);
   const inSafe=p.x<SEA_WORLD.safeX;
   if(c.behavior==='predator'||c.behavior==='boss'){
    if(c.state==='alert'){
     c.alertT-=dt;c.vx*=.9;c.vy*=.9;
     if(c.alertT<=0){c.state='chase';c.stateT=4.5;this.events.push({kind:'danger',phase:'chase',creature:{type:c.type,name:c.name,level:c.level,x:c.x,y:c.y}})}
    }else if(c.state==='chase'){
     c.stateT-=dt;
     if(inSafe||d>860||c.stateT<=0||c.level<playerLevel&&c.cooldown>0){c.state='return';c.stateT=2.5;this.events.push({kind:'danger',phase:'lost',creature:{type:c.type,name:c.name,level:c.level,x:c.x,y:c.y}})}
     else this.steer(c,p.x,p.y,c.speed,dt,z);
    }else if(c.state==='return'){
     c.stateT-=dt;const hx=c.homeX,hy=c.homeY;
     if(Math.hypot(hx-c.x,hy-c.y)<42||c.stateT<=0)c.state='wander';else this.steer(c,hx,hy,c.speed*.75,dt,z);
    }else{
     const tx=c.homeX+Math.cos(c.phase*.6+c.seed*6)*90,ty=c.homeY+Math.sin(c.phase*.45+c.seed*4)*42;
     this.steer(c,tx,ty,c.speed*.38,dt,z);
     if(!inSafe&&c.level>=playerLevel&&d<360&&c.state==='wander'){
      c.state='alert';c.alertT=.6;this.events.push({kind:'danger',phase:'alert',creature:{type:c.type,name:c.name,level:c.level,x:c.x,y:c.y}});
      this.events.push({kind:'sound',cue:'seaAlert'});
     }
    }
   }else{
    const flee=this.canEat(c)&&d<(c.behavior==='bed'?150:220);
    if(flee){
     const nx=(c.x-p.x)/(d||1),ny=(c.y-p.y)/(d||1),sp=c.speed*(c.behavior==='bed'?.9:1.35);
     this.steer(c,c.x+nx*120,c.y+ny*80,sp,dt,z);
     c.state='flee';
    }else{
     const swirl=c.behavior==='school'?120:70;
     const tx=c.homeX+Math.cos(c.phase*.7+c.seed*8)*swirl,ty=c.homeY+Math.sin(c.phase*.55+c.seed*5)*(c.behavior==='bed'?10:36);
     this.steer(c,tx,ty,c.speed*.52,dt,z);c.state='wander';
    }
   }
  }
 }
 steer(c,tx,ty,speed,dt,zone=zoneAt(c.x)){
  const dx=tx-c.x,dy=ty-c.y,d=Math.hypot(dx,dy)||1,smooth=1-Math.exp(-dt*3.2);
  c.vx+=((dx/d)*speed-c.vx)*smooth;c.vy+=((dy/d)*speed-c.vy)*smooth;
  const minX=zone.x0+34,maxX=zone.x1-34;
  const nx=clamp(c.x+c.vx*dt,minX,maxX),ny=clamp(c.y+c.vy*dt,SEA_WORLD.minY+30,SEA_WORLD.maxY-70);
  if(!hitsSolid(this.world.solids,nx,c.y,c.r*.82))c.x=nx;else c.vx*=-.25;
  if(!hitsSolid(this.world.solids,c.x,ny,c.r*.82))c.y=ny;else c.vy*=-.25;
  if(Math.abs(c.vx)>6)c.facing=c.vx>=0?1:-1;
 }
 resolveContacts(){
  const m=this.mouth(),p=this.player;
  for(const c of this.world.creatures){
   if(c.eaten)continue;
   const md=Math.hypot(c.x-m.x,c.y-m.y);
   if(this.canEat(c)&&md<=m.r+c.r*.95){this.consume(c);if(this.state!=='playing')return;continue}
   const d=Math.hypot(c.x-p.x,c.y-p.y);
   if(d<p.radius+c.r*.86){
    if(this.isDanger(c))this.hit(c);
    else if(this.isNeutral(c)&&d>0){const nx=(p.x-c.x)/d,ny=(p.y-c.y)/d,px=p.x+nx*(p.radius+c.r*.86-d+2),py=p.y+ny*(p.radius+c.r*.86-d+2);if(freeSpot(this.world,px,py,p.radius,4)){p.x=px;p.y=py}}
   }
  }
 }
 consume(c){
  // After finish() the settlement snapshot is final: no extra XP, score or count.
  if(this.state!=='playing'||this.settled)return false;
  if(!this.canEat(c))return false;
  c.eaten=true;c.state='eaten';c.vx=c.vy=0;
  this.xp+=c.xp;this.count++;const gain=c.points;this.score+=gain;
  this.effects.push({kind:'eat',x:c.x,y:c.y,life:.55,age:0,size:c.r,gain,color:c.color});
  this.events.push({kind:'eat',creature:c,gain,x:c.x,y:c.y});
  if(c.boss){this.finish(true,'boss');return true}
  this.events.push({kind:'sound',cue:'seaEat'});
  this.applyGrowth();
  return true;
 }
 hit(c){
  if(this.invuln>0||c.cooldown>0||this.state!=='playing')return false;
  if(this.shield>0){this.shield=0;this.invuln=SEA_INVULN;this.events.push({kind:'sea-shield'});this.effects.push({kind:'evolve',x:this.player.x,y:this.player.y,life:.55,age:0,size:this.player.radius,color:'#a8f6e5'});c.cooldown=1.6;c.state='return';return true}
  this.lives--;this.invuln=SEA_INVULN;this.hitFlash=.55;this.cameraShake=1;c.cooldown=1.6;c.state='return';c.stateT=2;
  const dx=this.player.x-c.x,dy=this.player.y-c.y,d=Math.hypot(dx,dy)||1;
  this.velocity={x:dx/d*SEA_DASH.knockback,y:dy/d*SEA_DASH.knockback,z:0};this.dashRemaining=0;
  this.effects.push({kind:'hit',x:this.player.x,y:this.player.y,life:.5,age:0,size:this.player.radius,color:'#ffb0a0'});
  this.events.push({kind:'hit',lives:this.lives,creature:{type:c.type,name:c.name,level:c.level},x:c.x,y:c.y});
  this.events.push({kind:'sound',cue:'seaHurt'});
  if(this.lives<=0)this.finish(false,'lives');
  return true;
 }
 finish(win,reason){
  if(this.state==='finished')return;
  this.state='finished';this.velocity={x:0,y:0,z:0};this.dashRemaining=0;this.target=null;
  if(!this.settled){
   this.settled=true;
   this.levelSummaries=[...this.carry.summaries,{level:3,name:this.level.name,score:this.score-this.carry.score,count:this.count-this.carry.count,seconds:+this.elapsed.toFixed(2),win:Boolean(win)}];
  }
  this.events.push({kind:'end',win:Boolean(win),reason});
  this.events.push({kind:'sound',cue:win?'seaWin':'seaLose'});
 }
 retryLevel(){
  const seed=this.seed,carry={...this.carry,summaries:this.carry.summaries.map(s=>({...s}))};
  this.reset(seed,carry);this.state='playing';return true;
 }
 updateReplenishment(dt){
  if(this.spawnReserve<=0)return;
  this.replenishTimer-=dt;
  if(this.replenishTimer>0)return;
  this.replenishTimer=5;
  const live=this.world.creatures.filter(c=>!c.eaten&&c.x<SEA_WORLD.safeX&&c.level===0).length;
  if(live>=14)return;
  const typeKey=this.spawnReserve%2?'fry':'shrimp';
  for(let step=0;step<60;step++){
   const x=180+(step*37)%380,y=typeKey==='shrimp'?820+(step*29)%100:430+(step*41)%220;
   if(!freeSpot(this.world,x,y,CREATURE_TYPES[typeKey].r+6,4))continue;
   if(this.world.creatures.some(c=>!c.eaten&&Math.hypot(c.x-x,c.y-y)<c.r+16))continue;
   const t=CREATURE_TYPES[typeKey];
   this.world.creatures.push({id:this.world.creatures.length,type:typeKey,...t,x,y,homeX:x,homeY:y,vx:0,vy:0,state:'wander',stateT:0,alertT:0,cooldown:0,facing:1,phase:(step*.7)%6.28,seed:(step%17)/17,school:null,eaten:false,boss:false});
   this.spawnReserve--;this.effects.push({kind:'bubble',x,y,vx:0,vy:-24,life:1,age:0,size:8,color:'#d9fbff'});
   return;
  }
 }
 updateEffects(dt){
  for(const e of this.effects){e.age+=dt;if(e.kind==='eat'||e.kind==='evolve'||e.kind==='hit'){e.y-=24*dt}else if(e.kind==='bubble'){e.x+=e.vx*dt;e.y+=e.vy*dt;e.vy-=20*dt}}
  this.effects=this.effects.filter(e=>e.age<e.life);
 }
 drainEvents(){return this.events.splice(0)}
 // Compact, non-visual hints shared by the HUD and automated checks.
 get proximity(){
  let edible=null,danger=null;
  for(const c of this.world.creatures){
   if(c.eaten)continue;const d=Math.hypot(c.x-this.player.x,c.y-this.player.y);
   if(this.canEat(c)&&d<430&&(!edible||d<edible.distance))edible={type:c.type,name:c.name,distance:d};
   if(this.isDanger(c)&&d<680&&(!danger||d<danger.distance||c.state==='chase'))danger={type:c.type,name:c.name,level:c.level,state:c.state,distance:d};
  }
  return {edible,danger};
 }
}
export {SEA_ZONES,SEA_STAGE_NAMES};
