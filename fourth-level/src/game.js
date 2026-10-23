import {ARENAS,AMMO,MATERIAL,SLING,MAX_PULL,GROUND,W} from './content.js';
const STEP=1000/120;
export const SETTLE_SECONDS=1,PROJECTILE_SECONDS=12;
export class SlingshotGame{
 constructor(Matter){this.M=Matter;this.reset();}
 reset(){this.total=0;this.results=[];this.load(0);}
 load(index){
  const {Engine,Bodies,Composite,Events}=this.M;if(this.engine){Events.off(this.engine);Engine.clear(this.engine);}
  this.index=index;this.arena=ARENAS[index];this.score=0;this.shots=0;this.destroyed=0;this.elapsed=0;this.phase='ready';this.paused=false;this.aim=null;this.projectile=null;this.shotTime=0;this.quiet=0;this.acc=0;this.events=[];this.effects=[];this.trail=[];this.damageQueue=[];this.settling=true;this.pendingWin=false;this.projectileRetired=false;this.fuse=null;
  // These small arenas have fewer than 25 bodies. Keep gravity active: removing
  // a support must never leave an isolated sleeping assembly floating in space.
  this.engine=Engine.create({enableSleeping:false,positionIterations:8,velocityIterations:8});this.engine.gravity.y=1;this.engine.gravity.scale=.001;
  this.entities=[];this.contacts=new Map();Composite.add(this.engine.world,[Bodies.rectangle(W/2,GROUND+40,4000,80,{isStatic:true,friction:.8}),Bodies.rectangle(-180,400,100,1600,{isStatic:true})]);
  for(const b of this.arena.blocks)this.add('block',Bodies.rectangle(b.x,b.y,b.w,b.h,{density:MATERIAL[b.material].density,friction:.65,restitution:.04}),{...b,hp:MATERIAL[b.material].hp});
  for(const e of this.arena.enemies)this.add('enemy',Bodies.circle(e.x,e.y,e.boss?29:23,{density:.002,friction:.75,restitution:.05}),{...e,hp:e.boss?110:25});
  for(const b of this.arena.barrels)this.add('barrel',Bodies.rectangle(b.x,b.y,34,48,{density:.002,friction:.65}),{hp:15});
  Events.on(this.engine,'collisionStart',e=>{if(this.settling||['won','lost'].includes(this.phase))return;for(const p of e.pairs){const a=p.bodyA,b=p.bodyB;const key=p.id;if(this.elapsed-(this.contacts.get(key)??-1)<.12)continue;const rel=Math.hypot(a.velocity.x-b.velocity.x,a.velocity.y-b.velocity.y);if(rel<1.1)continue;this.contacts.set(key,this.elapsed);const impact=rel*Math.min(5,Math.sqrt(Math.max(a.isStatic?b.mass:a.mass,b.isStatic?a.mass:b.mass)))*2.6;
   for(const body of [a,b]){const obj=body.plugin.entity;if(obj&&!obj.dead)this.damageQueue.push([obj,impact]);if(body===this.projectile&&this.ammoType==='burst'&&this.fuse==null)this.fuse=.22;}
  }});
  for(let i=0;i<120;i++)Engine.update(this.engine,STEP);this.settling=false;this.events=[];
 }
 add(kind,body,data){const e={kind,body,...data,dead:false};body.plugin.entity=e;this.entities.push(e);this.M.Composite.add(this.engine.world,body);return e;}
 get remaining(){return this.arena.ammo.length-this.shots;}
 get enemies(){return this.entities.filter(e=>e.kind==='enemy'&&!e.dead);}
 get currentAmmo(){return this.arena.ammo[this.shots];}
 beginAim(p){if(this.phase!=='ready'||this.paused||Math.hypot(p.x-SLING.x,p.y-SLING.y)>70)return false;this.phase='aiming';this.moveAim(p);return true;}
 moveAim(p){if(this.phase!=='aiming')return;let x=p.x-SLING.x,y=p.y-SLING.y;const d=Math.hypot(x,y);if(d>MAX_PULL){x*=MAX_PULL/d;y*=MAX_PULL/d;}this.aim={x:SLING.x+x,y:SLING.y+y};}
 cancelAim(){if(this.phase==='aiming'){this.phase='ready';this.aim=null;}}
 launch(){if(this.phase!=='aiming'||this.paused)return false;const aim=this.aim;this.aim=null;if(Math.hypot(aim.x-SLING.x,aim.y-SLING.y)<9){this.phase='ready';return false;}
  const {Bodies,Body,Composite}=this.M;this.ammoType=this.currentAmmo;const a=AMMO[this.ammoType];this.projectile=Bodies.circle(aim.x,aim.y,a.r,{density:a.density,restitution:.25,friction:.6,frictionAir:.0005});Composite.add(this.engine.world,this.projectile);Body.setVelocity(this.projectile,this.velocity(aim));Body.setAngularVelocity(this.projectile,this.launchSpin(aim));this.shots++;this.phase='flying';this.shotTime=0;this.quiet=0;this.fuse=null;this.trail=[];this.projectileRetired=false;this.events.push('launch');return true;
 }
 velocity(aim){return {x:(SLING.x-aim.x)*.215,y:(SLING.y-aim.y)*.215};}
 launchSpin(aim){return Math.sign(SLING.x-aim.x||1)*.065;}
 predict(){if(!this.aim)return [];const {Bodies,Body,Composite,Engine,Query}=this.M;const engine=Engine.create();engine.gravity.y=1;engine.gravity.scale=.001;const a=AMMO[this.currentAmmo],b=Bodies.circle(this.aim.x,this.aim.y,a.r,{frictionAir:.0005});Composite.add(engine.world,b);Body.setVelocity(b,this.velocity(this.aim));Body.setAngularVelocity(b,this.launchSpin(this.aim));const points=[],obstacles=this.M.Composite.allBodies(this.engine.world);for(let i=0;i<260;i++){Engine.update(engine,STEP);if(i%8===0)points.push({...b.position});if(Query.collides(b,obstacles).length||b.position.y>GROUND||b.position.x>W)break;}Engine.clear(engine);return points;}
 damage(e,n){if(e.dead||n<5)return;e.hp-=n;if(e.kind==='enemy')e.hitFlash=.16;if(e.hp<=0)this.destroy(e);}
 destroy(e){if(e.dead)return;e.dead=true;this.M.Composite.remove(this.engine.world,e.body);this.effects.push({kind:e.kind==='enemy'?'target-stars':'break',radius:e.boss?29:23,boss:Boolean(e.boss),x:e.body.position.x,y:e.body.position.y,age:0,color:e.kind==='enemy'?'#e6bc65':e.kind==='barrel'?'#ff986c':MATERIAL[e.material].color});if(e.kind==='enemy'){this.score+=e.boss?3000:1000;this.events.push('enemy');}else if(e.kind==='block'){this.destroyed++;this.score+=MATERIAL[e.material].points;this.events.push('break');}else{this.score+=120;this.explode(e.body.position,145);}}
 explode(p,r=165){this.effects.push({x:p.x,y:p.y,age:0,color:'#ffbc68',blast:true});this.events.push('explosion');for(const e of this.entities){if(e.dead)continue;const dx=e.body.position.x-p.x,dy=e.body.position.y-p.y,d=Math.hypot(dx,dy);if(d<r){this.M.Sleeping.set(e.body,false);this.M.Body.setVelocity(e.body,{x:dx/Math.max(d,1)*10,y:dy/Math.max(d,1)*10-3});this.damageQueue.push([e,(1-d/r)*110]);}}}
 pause(){if(this.phase==='won'||this.phase==='lost')return;this.cancelAim();this.paused=true;}
 resume(){this.paused=false;}
 retry(){this.load(this.index);}
 next(){if(this.phase!=='won'||this.index===ARENAS.length-1)return false;this.total+=this.score;this.results.push({arena:this.index,score:this.score,shots:this.shots,stars:this.stars});this.load(this.index+1);return true;}
 get stars(){return this.score>=this.arena.par?3:this.score>=this.arena.par*.7?2:1;}
 update(dt){if(this.paused||['won','lost'].includes(this.phase))return;this.acc+=Math.max(0,Math.min(dt,.1))*1000;while(this.acc>=STEP){this.acc-=STEP;this.step(STEP/1000);}}
 drainDamage(){let budget=500;while(this.damageQueue.length&&budget-->0){const [e,n]=this.damageQueue.shift();this.damage(e,n);}}
 retireProjectile(){if(this.projectile){this.M.Composite.remove(this.engine.world,this.projectile);this.projectile=null;this.quiet=0;}this.projectileRetired=true;}
 worldMoving(){return this.M.Composite.allBodies(this.engine.world).some(b=>!b.isStatic&&(b.speed>.35||Math.abs(b.angularVelocity)>.025));}
 finish(win){if(['won','lost'].includes(this.phase))return;if(win)this.score+=this.remaining*500;this.aim=null;this.phase=win?'won':'lost';this.events.push(win?'win':'lose');}
 step(dt){
  this.elapsed+=dt;this.M.Engine.update(this.engine,STEP);
  for(const e of this.entities)if(e.hitFlash>0)e.hitFlash=Math.max(0,e.hitFlash-dt);
  if(this.phase==='flying'||this.phase==='settling')this.shotTime+=dt;
  // Collisions, falling damage and chain reactions remain active while aiming,
  // loading and awaiting settlement, not just during the flight input state.
  this.drainDamage();
  if(this.fuse!=null){this.fuse-=dt;if(this.fuse<=0){if(this.projectile)this.explode({...this.projectile.position});this.fuse=null;this.retireProjectile();}}
  for(const e of this.entities)if(!e.dead&&(e.body.position.y>GROUND+130||e.body.position.x>W+200||e.body.position.x< -120))this.destroy(e);
  this.drainDamage();
  this.effects=this.effects.filter(e=>(e.age+=dt)<.75);
  if(this.projectile&&Math.floor(this.shotTime/dt)%6===0){this.trail.push({...this.projectile.position});if(this.trail.length>80)this.trail.shift();}
  if(!this.enemies.length){this.pendingWin=true;this.aim=null;this.phase='settling';}
  // Twelve seconds expires only the projectile. Structures keep falling and
  // dealing damage until the actual world has been quiet for a full second.
  if(this.projectile&&this.fuse==null&&(this.shotTime>=PROJECTILE_SECONDS||this.projectile.position.x< -120||this.projectile.position.x>W+200||this.projectile.position.y>GROUND+130)){
   this.retireProjectile();this.phase='settling';
  }
  this.quiet=this.worldMoving()||this.fuse!=null||this.damageQueue.length?0:this.quiet+dt;
  if(this.quiet<SETTLE_SECONDS)return;
  if(this.pendingWin){if(this.projectile){this.retireProjectile();return;}this.finish(true);return;}
  if(!['flying','settling'].includes(this.phase)||this.shotTime<1)return;
  if(this.projectile){this.retireProjectile();this.phase='settling';return;}
  if(!this.remaining){this.finish(false);return;}
  this.phase='ready';this.events.push('reload');
 }
}
