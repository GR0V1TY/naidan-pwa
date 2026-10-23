import {soundEvent} from './sound-events.js';
// Forest-only contact mechanics. All clocks advance on gameplay time.
const KINDS=new Set(['mushroom','crystal','forestfruit','rune','bloom']);
export const isForest=p=>KINDS.has(p.kind);
export function configureForest(g){
 const mapping={trampoline:['mushroom','弹跳蘑菇'],crate:['crystal','共鸣糖晶'],balloon:['crystal','共鸣糖晶'],tree:['forestfruit','森林果树'],fountain:['rune','古代符文盘'],picnic:['bloom','精灵花苞']};
 for(const p of g.interactions){const row=mapping[p.kind];if(!row)continue;[p.kind,p.name]=row;p.solid=p.kind==='forestfruit';p.movable=false;p.stock=p.kind==='forestfruit'?3:1;}
}
function rewards(g,p,count,name,color){
 const start=g.items.length;g.dropRewards({...p,rewardName:name,rewardType:0},count);
 for(const i of g.items.slice(start)){i.type={...i.type,xp:1,points:8,color};if(p.kind==='bloom'){i.spirit=true;i.life=12;}}
}
export function triggerForest(g,p){
 if(p.kind==='mushroom'){
  const v=g.velocity,d=Math.hypot(v.x,v.z),dir=d>.1?{x:v.x/d,z:v.z/d}:g.lastDirection;
  g.forestHop={x:dir.x,z:dir.z,left:.55};g.bounceTime=.6;p.cooldown=2;
 }else if(p.kind==='rune'){g.runeTime=5;p.cooldown=9;}
 else if(p.kind==='crystal'){
  const queue=[p],seen=new Set();
  while(queue.length){const c=queue.shift();if(seen.has(c.id))continue;seen.add(c.id);c.state='spent';c.phase=1;c.stock=0;if(c!==p)soundEvent(g,c,'crystal');rewards(g,c,3,'糖晶粒','#b4dceb');
   for(const other of g.interactions)if(other.kind==='crystal'&&other.state==='ready'&&g.isIntroduced(other)&&Math.hypot(other.x-c.x,other.z-c.z)<25&&!seen.has(other.id))queue.push(other);
  }
 }else if(p.kind==='forestfruit'){p.stock--;p.cooldown=2;if(!p.stock)p.state='empty';rewards(g,p,2,'森林果实','#efb573');}
 else if(p.kind==='bloom'){p.stock=0;p.state='spent';rewards(g,p,4,'精灵光团','#d4edaa');}
}
export function updateForest(g,dt){
 g.runeTime=Math.max(0,g.runeTime-dt);
 if(g.forestHop){const h=g.forestHop,step=Math.min(dt,h.left),distance=6*step,n=Math.ceil(distance/.08);
  for(let k=0;k<n;k++){const x=g.player.x+h.x*distance/n,z=g.player.z+h.z*distance/n;if(!g.canStand(x,z)){h.left=0;break}g.player.x=x;g.player.z=z;}
  h.left-=step;if(h.left<=0)g.forestHop=null;
 }
 let moved=false;
 for(const i of g.items){if(!i.spirit||i.state!=='available')continue;i.life-=dt;
  if(i.life<=0){i.spirit=false;continue}const dx=i.x-g.player.x,dz=i.z-g.player.z,d=Math.hypot(dx,dz);
  if(d<7&&d>.01){const x=i.x+dx/d*.85*dt,z=i.z+dz/d*.85*dt;if(g.canPropStand(x,z,i.type.r,i)){i.x=x;i.z=z;moved=true}}
 }
 // Moving collectibles must be reindexed before suction queries.
 if(moved)g.grid=new g.grid.constructor(g.items);
}
export function drawForest(r,p,g){
 const x=p.x,z=p.z,B=(a,y,b,w,h,d,c)=>r.cube(x+a,.1+y,z+b,w,h,d,c),pulse=p.phase*Math.sin(g.elapsed*20)*.12;
 if(p.kind==='mushroom'){B(0,0,0,.5,.8,.5,'#f5e8cc');B(0,.7+pulse,0,1.8,.45,1.8,'#bc90d1');for(const a of [-.5,.5])B(a,1.16+pulse,0,.3,.08,.3,'#fff0cc');}
 if(p.kind==='crystal')for(let k=-1;k<=1;k++){B(k*.48,0,0,.4,1.1+(k===0?.6:0),.4,'#9fd8dd');B(k*.48,1.1+(k===0?.6:0),0,.22,.24,.22,'#e3f6e6');}
 if(p.kind==='forestfruit'){B(0,0,0,.4,1.3,.4,'#ae8a77');B(pulse,1.2,0,1.9,1.3,1.9,'#8bbf9b');for(let k=0;k<p.stock;k++)B((k-1)*.55,1.6,.95,.3,.35,.3,'#eab077');}
 if(p.kind==='rune'){B(0,0,0,2,.15,2,'#b3a6ca');for(let k=0;k<4;k++){const a=k*Math.PI/2;B(Math.cos(a)*.65,.16,Math.sin(a)*.65,.3,.09,.3,g.runeTime>0?'#e5edab':'#c2dfd7');}if(g.runeTime>0)B(0,.3+Math.sin(g.elapsed*3)*.1,0,.35,.35,.35,'#e5edab');}
 if(p.kind==='bloom'){B(0,0,0,.2,.6,.2,'#8bbf9b');for(let k=0;k<4;k++){const a=k*Math.PI/2;B(Math.cos(a)*.3,.5,Math.sin(a)*.3,.55,.6,.55,'#d5b1da');}B(0,.9,0,.3,.25,.3,'#e8edb1');}
}
