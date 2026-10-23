import {TARGETS,BY_ID,RULES,stageAt,comboBonus} from './content.js';
import {makeThrowPlan,selectPattern} from './throws.js';
export function randomSource(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
export function segmentDistance(a,b,p){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0;return Math.hypot(a.x+dx*t-p.x,a.y+dy*t-p.y);}
export function intersects(a,b,o,mask){
 if(segmentDistance(a,b,o)>o.r*(mask?Math.SQRT2:1))return false;
 if(!mask)return true;
 const dx=b.x-a.x,dy=b.y-a.y,n=Math.max(1,Math.ceil(Math.hypot(dx,dy))),c=Math.cos(o.angle),s=Math.sin(o.angle);
 for(let i=0;i<=n;i++){const x=a.x+dx*i/n-o.x,y=a.y+dy*i/n-o.y,u=(x*c+y*s)/(2*o.r)+.5,v=(-x*s+y*c)/(2*o.r)+.5;if(u<0||u>=1||v<0||v>=1)continue;if(mask.data[Math.floor(v*mask.size)*mask.size+Math.floor(u*mask.size)])return true;}
 return false;
}
export class SliceGame{
 constructor({seed=Date.now(),width=960,height=860,masks={}}={}){this.width=width;this.height=height;this.masks=masks;this.reset(seed);}
 reset(seed=this.seed){this.lastBombZone=null;this.seed=seed>>>0;this.random=randomSource(this.seed);this.phase='ready';this.elapsed=0;this.score=0;this.mistakes=0;this.bombsHit=0;this.penaltyTotal=0;this.objects=[];this.effects=[];this.stains=[];this.events=[];this.pendingThrows=[];this.waveHistory=[];this.bombStreak=0;this.waveName='初试刀锋';this.finale=false;this.nextWave=.6;this.wave=0;this.id=0;this.spawned=0;this.cut=0;this.maxCombo=0;this.stroke=null;this.lastInput=null;this.finishReason=null;}
 get stage(){return stageAt(this.elapsed);}
 get remaining(){return Math.max(0,RULES.duration-this.elapsed);}
 start(){if(this.phase==='ready')this.phase='playing';}
 pause(){if(this.phase==='playing'){this.phase='paused';this.cancelStroke();}}
 resume(){if(this.phase==='paused')this.phase='playing';}
 retry(seed=this.seed){this.reset(seed);this.start();}
 resize(width,height){const sx=width/this.width,sy=height/this.height;for(const o of [...this.objects,...this.effects,...this.stains]){o.x*=sx;o.y*=sy;}for(const o of this.objects){o.vx*=sx;o.vy*=Math.sqrt(sy);}for(const q of this.pendingThrows){q.spec.x*=sx;q.spec.y*=sy;q.spec.vx*=sx;q.spec.vy*=Math.sqrt(sy);}this.width=width;this.height=height;this.cancelStroke();}
 beginStroke(p){if(this.phase!=='playing'||!Number.isFinite(p.x)||!Number.isFinite(p.y))return false;this.stroke={point:{...p},count:0,bonus:0,hitBomb:false};return true;}
 cancelStroke(){this.stroke=null;}
 endStroke(){this.cancelStroke();}
 moveStroke(p){
  const st=this.stroke;if(this.phase!=='playing'||!st||!Number.isFinite(p.x)||!Number.isFinite(p.y))return [];
  const a=st.point;if(Math.hypot(p.x-a.x,p.y-a.y)<RULES.minSwipe)return [];
  const b={...p},hits=this.objects.filter(o=>!o.dead&&o.entered&&intersects(a,b,o,this.masks[o.type.id])).sort((u,v)=>Math.hypot(u.x-a.x,u.y-a.y)-Math.hypot(v.x-a.x,v.y-a.y));
  const result=[];st.point=b;this.lastInput={a,b,time:this.elapsed};
  for(const o of hits){if(this.phase!=='playing')break;o.dead=true;const angle=Math.atan2(b.y-a.y,b.x-a.x);result.push(o.id);
   const cutOffset=(a.x-o.x)*-Math.sin(angle)+(a.y-o.y)*Math.cos(angle);
   this.effects.push({kind:'split',type:o.type,x:o.x,y:o.y,r:o.r,angle:o.angle,cutAngle:angle,cutOffset,vx:o.vx*.25,vy:o.vy*.2,age:0,spin:o.spin});
   if(o.type.group==='bomb'){st.hitBomb=true;const deduction=Math.min(this.score,RULES.bombPenalty);this.score-=deduction;this.bombsHit++;this.penaltyTotal+=deduction;this.events.push({kind:'bomb',x:o.x,y:o.y,points:-deduction,penalty:RULES.bombPenalty});this.cancelStroke();break;}
   this.stains.push({x:o.x,y:o.y,r:o.r,angle,seed:o.id,age:0});if(this.stains.length>RULES.maxStains)this.stains.splice(0,this.stains.length-RULES.maxStains);
   this.cut++;st.count++;this.maxCombo=Math.max(this.maxCombo,st.count);const bonus=st.hitBomb?0:comboBonus(st.count),delta=Math.max(0,bonus-st.bonus);st.bonus=bonus;this.score+=o.type.points+delta;
   this.events.push({kind:'cut',x:o.x,y:o.y,color:o.type.color,points:o.type.points,group:o.type.group});
   if(delta)this.events.push({kind:'combo',x:o.x,y:o.y,count:st.count,bonus:delta});
  }return result;
 }
 mistake(reason){this.mistakes++;this.events.push({kind:'mistake',reason});if(this.mistakes>=RULES.maxMistakes)this.finish('lost',reason);}
 finish(phase,reason){if(this.phase!=='playing')return;this.phase=phase;this.finishReason=reason;this.pendingThrows=[];this.cancelStroke();this.events.push({kind:'finish',phase});}
 spawn(type,options={}){
  type=typeof type==='string'?BY_ID[type]:type;if(!type)throw new Error('Unknown target');const r=type.r,side=this.random(),x=100+this.random()*(this.width-200),h=this.height;
  const o={id:++this.id,type,r,x,y:h+r+8,vx:(this.width/2-x)*.28+(side-.5)*100,vy:-Math.sqrt(2*RULES.gravity*(h*.64)),angle:(this.random()-.5)*.8,spin:(this.random()-.5)*2.4,entered:false,dead:false,...options};this.objects.push(o);this.spawned++;return o;
 }
 spawnWave(forcedPattern){
  this.wave++;if(this.stroke){this.stroke.count=0;this.stroke.bonus=0;}
  const pattern=forcedPattern||(this.elapsed>=85?'reward':selectPattern({time:this.elapsed,wave:this.wave,history:this.waveHistory.map(w=>w.pattern),random:this.random}));
  const wantsBomb=this.elapsed>=30&&this.wave%3!==1&&this.bombStreak<2;
  const obstacles=[...this.objects.filter(o=>!o.dead).map(o=>({...o,delay:0})),...this.pendingThrows.map(q=>({...q.spec,type:BY_ID[q.type],delay:Math.max(0,q.at-this.elapsed)}))];
  const plan=makeThrowPlan({pattern,width:this.width,height:this.height,time:this.elapsed,wave:this.wave,random:this.random,bomb:wantsBomb,lastBombZone:this.lastBombZone,obstacles});
  const hasBomb=plan.entries.some(e=>e.type.group==='bomb');this.bombStreak=hasBomb?this.bombStreak+1:0;this.waveName=plan.name;
  const hazard=plan.entries.find(e=>e.type.group==='bomb');if(hazard)this.lastBombZone=hazard.bombZone;
  this.waveHistory.push({wave:this.wave,pattern,name:plan.name,time:this.elapsed,count:plan.entries.length,bomb:hasBomb,bombZone:hazard?.bombZone||null});
  for(const entry of plan.entries){const {delay,type,...spec}=entry;this.pendingThrows.push({at:this.elapsed+delay,type: type.id,spec:{...spec,wave:this.wave}});}
  this.pendingThrows.sort((a,b)=>a.at-b.at);this.nextWave=this.elapsed+plan.interval;this.flushThrows();
 }
 flushThrows(){
  while(this.pendingThrows.length&&this.pendingThrows[0].at<=this.elapsed+1e-8){const q=this.pendingThrows.shift();this.spawn(q.type,q.spec);}
 }
 update(dt){
  if(this.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return;
  // Substeps also support deterministic offline route verification without tunnelling.
  let left=dt;while(left>1e-9&&this.phase==='playing'){const step=Math.min(left,1/120,this.remaining);if(step<=1e-9){this.finish(this.score>=RULES.goal?'won':'lost','time');break;}left-=step;this.elapsed+=step;
   if(this.elapsed>=85&&!this.finale){this.finale=true;this.spawnWave('reward');this.nextWave=Infinity;}
   else if(this.elapsed>=this.nextWave&&this.elapsed<82)this.spawnWave();
   this.flushThrows();
   for(const o of this.objects){if(o.dead)continue;o.x+=o.vx*step;o.vy+=RULES.gravity*step;o.y+=o.vy*step;o.angle+=o.spin*step;if(o.y+o.r<this.height-5)o.entered=true;
    if(o.entered&&o.y-o.r>this.height){o.dead=true;if(o.type.group!=='bomb')this.mistake('miss');if(this.phase!=='playing')break;}
   }
   for(const e of this.effects){e.age+=step;e.x+=e.vx*step;e.vy+=RULES.gravity*.5*step;e.y+=e.vy*step;}
   for(const stain of this.stains)stain.age+=step;
   this.stains=this.stains.filter(stain=>stain.age<RULES.stainLifetime);
   this.objects=this.objects.filter(o=>!o.dead);this.effects=this.effects.filter(e=>e.age<.85);
   if(this.remaining<=1e-8)this.finish(this.score>=RULES.goal?'won':'lost','time');
  }
 }
 drainEvents(){return this.events.splice(0);}
}
