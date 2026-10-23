import {RULES,makeRow,zoneAt,speedInfoAt,SPEED_STAGES,SPEED_WARNING} from './content.js';
import {clamp} from './math.js';
import {rollBy} from './model/rolling.js';
// Pure rules: fixed simulation time, no DOM, timers, browser or rendering imports.
export class RunnerGame{
 constructor({seed=20261021,mode='story'}={}){this.seed=seed;this.mode=mode;this.reset();}
 reset(){Object.assign(this,{phase:'ready',paused:false,elapsed:0,distance:0,speed:RULES.speed,score:0,coins:0,lane:0,x:0,y:0,vy:0,floor:0,slide:0,danger:0,invincible:0,magnet:0,double:0,shield:0,smash:0,roll:[0,0,0,1],chaseVisibility:0,broken:0,effects:[],hitCount:0,gap:7.5,chaserX:0,chaserY:0,chaserSlide:false,rows:[],nextRow:0,nextD:68,accumulator:0,countdown:3,catchTime:0,events:[],history:[],jumpBuffer:0});this.populate();}
 get zone(){return zoneAt(this.elapsed);}
 get speedInfo(){return speedInfoAt(this.elapsed);}
 get obstacles(){return this.rows.flatMap(r=>r.hazards);}
 get rolling(){return this.slide>0||this.smash>0;}
 get bodyHeight(){return this.rolling?2*(this.smash>0?RULES.eggRadius:RULES.rollRadius):2.05;}
 start({countdown=true}={}){if(this.phase!=='ready')return;this.phase=countdown?'countdown':'playing';this.events.push({type:'start'});}
 pause(){if(['playing','countdown','caught'].includes(this.phase)){this.paused=true;this.jumpBuffer=0;}}
 resume(){this.paused=false;this.accumulator=0;}
 action(a){if(this.paused||this.phase!=='playing')return false;
  if(a==='left'||a==='right'){this.lane=clamp(this.lane+(a==='left'?-1:1),-1,1);return true;}
  if(a==='jump'){if(this.slide>0)this.slide=0;this.jumpBuffer=.13;return true;}
  if(a==='slide'&&this.y<=this.floor+.06){if(!this.rolling)this.roll=[0,0,0,1];this.slide=RULES.slide;this.jumpBuffer=0;this.events.push({type:'slide'});return true;}
  return false;
 }
 populate(){while(this.nextD<this.distance+190){this.rows.push(makeRow(this.nextRow,this.nextD,this.seed));const normalGap=(38+Math.min(10,this.nextRow*.12))*.9,current=this.rows[this.rows.length-1],next=makeRow(this.nextRow+1,this.nextD+normalGap,this.seed),longTrain=[current,next].some(r=>r.hazards.some(h=>h.type==='train'));this.nextD+=Math.max(normalGap,longTrain?40.5:0);this.nextRow++;}this.rows=this.rows.filter(r=>r.d>this.distance-55);}
 damage(obstacle){if(obstacle.destroyed||obstacle.hit||this.smash>0||this.invincible>0||this.phase!=='playing')return;obstacle.hit=true;this.invincible=RULES.invincible;
  if(this.shield){this.shield=0;this.events.push({type:'shieldBreak'});return;}
  this.hitCount++;this.slide=0;
  if(this.danger>0){this.phase='caught';this.catchTime=0;this.jumpBuffer=0;this.events.push({type:'caught'});}else{this.danger=RULES.danger;this.events.push({type:'hit'});}
 }
 groundAt(d,x){for(const h of this.obstacles)if(!h.destroyed&&h.type==='train'&&h.ramp&&Math.abs(x-h.lane*3)<1.25){const rel=d-h.d;if(rel>=-9&&rel<0)return {height:(rel+9)/9*2.6,ramp:true};if(rel>=0&&rel<=h.length)return {height:2.6,ramp:false};}return {height:0,ramp:false};}
 activateSmash(){if(this.phase!=='playing')return;if(!this.rolling)this.roll=[0,0,0,1];this.smash=RULES.smash;this.slide=0;this.danger=0;this.events.push({type:'power',power:'smash'});}
 destroyObstacle(h,reason='smash'){if(h.destroyed)return;h.destroyed=true;h.hit=true;const points=h.type==='train'?150:50;this.score+=points;this.broken++;this.effects.push({id:h.id,lane:h.lane,d:clamp(h.d,this.distance,this.distance+RULES.smashRange),type:h.type,age:0});if(this.effects.length>12)this.effects.shift();this.events.push({type:'smashBreak',kind:h.type,points,reason});}
 collectPowers(){for(const r of this.rows)for(const p of r.items)if(!p.taken&&Math.abs(p.d-this.distance)<1&&Math.abs(this.x-p.lane*3)<.9&&Math.abs(this.y+1.1-p.y)<1.1){p.taken=true;if(p.type==='smash')this.activateSmash();else{this[p.type]=RULES[p.type];this.events.push({type:'power',power:p.type});}}}
 smashAhead(){for(const h of this.obstacles){const front=h.ramp?h.d-9:h.d;if(!h.destroyed&&Math.abs(this.x-h.lane*3)<=1.5&&front<=this.distance+RULES.smashRange&&h.d+h.length>=this.distance-.5)this.destroyObstacle(h);}}
 step(dt){
  if(this.phase==='countdown'){this.countdown-=dt;if(this.countdown<=0){this.countdown=0;this.phase='playing';}return;}
  if(this.phase==='caught'){this.chaseVisibility=1;this.catchTime+=dt;this.gap=Math.max(.45,this.gap-dt*8);this.chaserX+=(this.x-this.chaserX)*Math.min(1,dt*10);this.y=Math.max(0,this.y-dt*4);if(this.catchTime>=1){this.phase='lost';this.events.push({type:'lose'});}return;}
  if(this.phase!=='playing')return;
  const previousTime=this.elapsed,previousSpeed=speedInfoAt(previousTime).speed;this.elapsed+=dt;this.speed=this.speedInfo.speed;
  for(let stage=1;stage<SPEED_STAGES.length;stage++){const start=SPEED_STAGES[stage].start;if(previousTime+1e-9<start-SPEED_WARNING&&this.elapsed+1e-9>=start-SPEED_WARNING)this.events.push({type:'speedWarning',at:this.elapsed,stage:stage+1,name:SPEED_STAGES[stage].name,target:SPEED_STAGES[stage].speed});if(previousTime+1e-9<start&&this.elapsed+1e-9>=start)this.events.push({type:'speedStage',at:this.elapsed,stage:stage+1,name:SPEED_STAGES[stage].name,target:SPEED_STAGES[stage].speed});}
  const old=this.distance,oldX=this.x,wasSmash=this.smash>0;this.distance+=(previousSpeed+this.speed)*.5*dt;
  for(const k of ['danger','invincible','magnet','double','slide','jumpBuffer','smash'])this[k]=Math.max(0,this[k]-dt);
  this.effects=this.effects.filter(e=>{e.age+=dt;return e.age<.65;});
  const target=this.lane*3;this.x+=clamp(target-this.x,-RULES.laneSpeed*dt,RULES.laneSpeed*dt);
  this.collectPowers();if(this.smash>0)this.smashAhead();
  if(wasSmash&&this.smash===0){for(const h of this.obstacles)if(!h.destroyed&&Math.abs(this.x-h.lane*3)<=1.5&&this.distance+.6>=h.d&&this.distance-.6<=h.d+h.length)this.destroyObstacle(h,'expiryClearance');this.invincible=Math.max(this.invincible,RULES.smashGrace);this.events.push({type:'smashEnd'});}
  if(this.rolling)this.roll=rollBy(this.roll,this.x-oldX,-(this.distance-old),this.smash>0?RULES.eggRadius:RULES.rollRadius);
  const oldFloor=this.floor,ground=this.groundAt(this.distance,this.x);this.floor=ground.height;
  if(this.jumpBuffer>0&&Math.abs(this.y-this.floor)<.10&&this.vy<=0){this.vy=RULES.jumpVelocity;this.jumpBuffer=0;this.events.push({type:'jump'});}
  const previousY=this.y;
  this.vy-=RULES.gravity*dt;this.y+=this.vy*dt;
  const smallGroundStep=Math.abs(previousY-oldFloor)<.10&&this.floor>=oldFloor&&this.floor-oldFloor<=.12;
  if(this.y<this.floor&&this.vy<=0&&(smallGroundStep||previousY>=this.floor-.001)){this.y=this.floor;this.vy=0;}
  if(this.y<0){this.y=0;this.vy=0;}
  this.history.push({d:this.distance,x:this.x,y:this.y,slide:this.slide>0});while(this.history.length>1&&this.history[1].d<this.distance-9)this.history.shift();
  const goalGap=this.danger>0?3.1:7.5;this.gap+=(goalGap-this.gap)*Math.min(1,dt*4);
  this.chaseVisibility=clamp(this.chaseVisibility+(this.danger>0?3:-1.5)*dt,0,1);
  const past=this.history.find(p=>p.d>=this.distance-this.gap)||this.history[0];this.chaserX+=(past.x-this.chaserX)*Math.min(1,dt*10);this.chaserY=past.y;this.chaserSlide=past.slide;
  const height=this.bodyHeight;
  for(const h of this.obstacles){
   const near=this.distance+.4>=h.d&&old-.4<=h.d+h.length;if(h.destroyed||!near||Math.abs(this.x-h.lane*3)>1.5)continue;
   const blocked=h.type==='barrier'?this.y<.90:h.type==='bar'?this.y+height>1.10&&this.y<2.55:h.ramp?this.y<2.45&&!ground.ramp:this.y<2.65;
   if(blocked)this.damage(h);if(this.phase!=='playing')break;
  }
  if(this.phase!=='playing')return;
  for(const r of this.rows){for(const c of r.coins){if(c.taken)continue;const dx=Math.abs(this.x-c.lane*3),dz=c.d-this.distance,dy=Math.abs(this.y+.95-c.y);
   if((Math.abs(dz)<.9&&dx<.85&&dy<1.0)||(this.magnet>0&&Math.abs(dz)<6&&dx<6.2&&dy<3.2)){c.taken=true;this.coins++;this.score+=this.double>0?20:10;this.events.push({type:'coin',lane:c.lane});}}
  }
  this.populate();if(this.mode==='story'&&this.elapsed>=RULES.duration){this.elapsed=RULES.duration;this.phase='won';this.score+=1000;this.events.push({type:'win'});}
 }
 update(dt){if(this.paused||!Number.isFinite(dt)||dt<=0)return;this.accumulator+=Math.min(dt,.25);while(this.accumulator+1e-10>=RULES.step){this.accumulator-=RULES.step;this.step(RULES.step);}}
 drainEvents(){const a=this.events;this.events=[];return a;}
 snapshot(){return {phase:this.phase,paused:this.paused,elapsed:this.elapsed,distance:this.distance,score:this.score,coins:this.coins,lane:this.lane,x:this.x,y:this.y,danger:this.danger,shield:this.shield,hitCount:this.hitCount,gap:this.gap,rows:this.rows.length,smash:this.smash,broken:this.broken,chaseVisibility:this.chaseVisibility,roll:this.roll,speed:this.speed,speedStage:this.speedInfo.stage+1};}
}
