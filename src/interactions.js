import {soundEvent} from './sound-events.js';
import {isForest,triggerForest,drawForest} from './forest-props.js';
import {ENV_NAMES,ENV_ROWS,isEnvironment,initEnvironment,triggerEnvironment,updateEnvironment,drawEnvironment} from './environment-props.js';
import {landAreaId} from './world.js';
const NAMES={...ENV_NAMES,fountain:'喷泉',statue:'广场雕像',crate:'货箱',vending:'售货机',tree:'果树',crop:'菜地',pushbox:'木箱',cart:'手推车',ball:'皮球',balloon:'气球',trampoline:'弹跳垫',ride:'游乐设施开关',duck:'小鸭',picnic:'野餐篮'};
export function createInteractions(){
 const rows=[
 ['fountain',8,-8],['statue',-8,-8],['pushbox',4.8,17],['crate',-3,24],
 ['tree',-18,-21],['tree',-18,-37],['crop',-35,-46],['crop',-43,-46],['pushbox',-30,-19],['ball',-18,-16],
 ['crate',-36,18],['crate',-36,40],['vending',-24,22],['vending',-24,40],['cart',-30,35],
 ['ride',16,-25],['ride',38,-15],['balloon',20,-18],['balloon',42,-22],['trampoline',34,-27],['ball',45,-46],
 ['duck',30,32],['duck',40,38],['picnic',18,45],['picnic',46,48],['ball',17,20],['tree',47,17]
 ];
 return [...rows,...ENV_ROWS].map(([kind,x,z],id)=>initEnvironment({id,kind,name:NAMES[kind],x,z,areaId:landAreaId(x,z),r:kind==='fountain'?1.6:kind==='tree'?1.4:kind==='statue'?.9:.8,solid:['pushbox','cart','ball','crate','tree','vending','statue','fountain'].includes(kind),movable:['pushbox','cart','ball','duck'].includes(kind),state:'ready',on:false,stock:kind==='vending'?3:kind==='tree'?3:1,cooldown:0,touching:false,contactUsed:false,vx:0,vz:0,phase:0,uses:0,rideTime:0}));
}
export function interactionAvailable(g,p){return g.isIntroduced(p)&&p.state==='ready'}
export function nearbyInteraction(g){return g.interactions.filter(p=>interactionAvailable(g,p)&&Math.hypot(p.x-g.player.x,p.z-g.player.z)<g.config.radius+p.r+2).sort((a,b)=>Math.hypot(a.x-g.player.x,a.z-g.player.z)-Math.hypot(b.x-g.player.x,b.z-g.player.z))[0]}
export function activateInteraction(g,p){
 if(g.state!=='playing'||!p||!interactionAvailable(g,p)||p.cooldown>0||Math.hypot(p.x-g.player.x,p.z-g.player.z)>g.config.radius+p.r+2)return false;
 p.uses++;p.cooldown=.8;p.phase=1;
 const dx=p.x-g.player.x,dz=p.z-g.player.z,length=Math.hypot(dx,dz)||1;
 if(isForest(p))triggerForest(g,p);
 else if(isEnvironment(p))triggerEnvironment(g,p);
 else if(p.movable){p.vx=dx/length*(p.kind==='duck'?3:5);p.vz=dz/length*(p.kind==='duck'?3:5)}
 else if(p.kind==='fountain'||p.kind==='ride'){p.on=!p.on}
 else if(p.kind==='trampoline'){g.bounceTime=.6}
 else{
  const amount=p.kind==='picnic'?4:p.kind==='crate'||p.kind==='statue'?3:p.kind==='tree'||p.kind==='crop'?2:1;
  p.stock--;if(p.stock===0){p.state=['tree','vending'].includes(p.kind)?'empty':'spent';if(p.state==='spent')p.solid=false}
  g.dropRewards(p,amount);p.cooldown=p.kind==='tree'||p.kind==='vending'?2:.8;
 }
 if(p.stock===0&&['tree','vending','forestfruit'].includes(p.kind))p.emptyTouch=true;
 g.interactionCount++;g.events.push({kind:'interact',id:p.id,name:p.name,action:p.kind,on:p.on,x:p.x,z:p.z});return true;
}
// Repair a pre-existing overlap without crossing scenery or another body.
function separateMovable(g,p){
 const radius=g.config.radius+p.r+.002,dx=p.x-g.player.x,dz=p.z-g.player.z,d=Math.hypot(dx,dz);
 if(d>=radius-1e-8)return;
 const nx=d>1e-8?dx/d:1,nz=d>1e-8?dz/d:0;
 const clearPath=(from,to,free)=>{const steps=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.z-from.z)/.08));for(let k=1;k<=steps;k++)if(!free(from.x+(to.x-from.x)*k/steps,from.z+(to.z-from.z)*k/steps))return false;return true};
 const target={x:g.player.x+nx*radius,z:g.player.z+nz*radius};
 if(clearPath(p,target,(x,z)=>g.canPropStand(x,z,p.r,p))){p.x=target.x;p.z=target.z;}
 else{
  const target={x:p.x-nx*radius,z:p.z-nz*radius};
  if(clearPath(g.player,target,(x,z)=>g.canStand(x,z,g.config.radius,p))){g.player=target;g.velocity={x:0,z:0};g.cancelDash('prop-contact');}
 }
 p.vx=0;p.vz=0;
}
export function updateInteractions(g,dt){
 if(g.state!=='playing'||dt<=0)return;
 dt=Math.min(dt,.05);const wasAirborne=g.bounceTime>0;g.bounceTime=Math.max(0,g.bounceTime-dt);if(wasAirborne&&g.bounceTime===0)soundEvent(g,{id:'player',...g.player},'land');
 for(const p of g.interactions){
  p.cooldown=Math.max(0,p.cooldown-dt);p.phase=Math.max(0,p.phase-dt*2);
  if(isEnvironment(p)){updateEnvironment(g,p,dt,activateInteraction);if(p.kind==='watering'||p.kind==='rainbow')continue}
  if(p.state==='empty'&&['vending','tree','forestfruit'].includes(p.kind)&&g.isIntroduced(p)){const touch=Math.hypot(p.x-g.player.x,p.z-g.player.z)<g.config.radius+p.r+.32;if(touch&&!p.emptyTouch)soundEvent(g,p,'empty');p.emptyTouch=touch;}
  if(!interactionAvailable(g,p))continue;if(p.kind==='ride'&&p.on)p.rideTime+=dt;
  if(p.movable&&p.solid)separateMovable(g,p);
  const contactX=p.kind==='domino'?p.x-1.8:p.x,contactRadius=p.kind==='domino'?.35:p.r;
  const d=Math.hypot(contactX-g.player.x,p.z-g.player.z),touch=d<g.config.radius+contactRadius+.32;
  if(p.kind==='duck'&&d>6)p.duckNear=false;
  if(p.kind==='duck'&&d<5&&p.cooldown===0){p.vx=(p.x-g.player.x)/(d||1)*3;p.vz=(p.z-g.player.z)/(d||1)*3;p.cooldown=.4;if(!p.duckNear&&(p.quackUntil??0)<=g.elapsed){soundEvent(g,p,'duck');p.quackUntil=g.elapsed+2;p.duckNear=true;}}
  // Hysteresis prevents contact jitter; a failed cooldown attempt stays pending.
  if(d>g.config.radius+contactRadius+.55){p.touching=false;p.contactUsed=false}
  const impactSpeed=Math.max(Math.hypot(p.vx,p.vz),Math.hypot(g.velocity.x,g.velocity.z));
  if(touch){p.touching=true;if(!p.contactUsed&&activateInteraction(g,p)){p.contactUsed=true;if(p.kind==='ball'){soundEvent(g,p,'ball',{volume:Math.min(1,.35+impactSpeed/10)});p.hitUntil=g.elapsed+.16;}}}
  if(p.movable&&p.solid&&touch){
   // Transfer only velocity toward the prop: retreating or glancing cannot pull it into the player.
   const dx=p.x-g.player.x,dz=p.z-g.player.z,len=Math.hypot(dx,dz)||1,nx=dx/len,nz=dz/len,push=g.velocity.x*nx+g.velocity.z*nz;
   if(push>.2){p.vx=nx*push*1.25;p.vz=nz*push*1.25}
  }
  const speed=Math.hypot(p.vx,p.vz),steps=Math.max(1,Math.ceil(speed*dt/.12));
  for(let n=0;n<steps;n++){
   const x=p.x+p.vx*dt/steps*g.surfaceSpeed(p.x,p.z),z=p.z+p.vz*dt/steps*g.surfaceSpeed(p.x,p.z);
   if(g.canPropStand(x,z,p.r,p)&&(!p.solid||Math.hypot(x-g.player.x,z-g.player.z)>=p.r+g.config.radius+.001)){p.x=x;p.z=z}else{if(p.kind==='ball'&&Math.hypot(p.vx,p.vz)>.4&&(p.hitUntil??0)<=g.elapsed){soundEvent(g,p,'ball',{volume:Math.min(1,Math.hypot(p.vx,p.vz)/8)});p.hitUntil=g.elapsed+.16;}p.vx=0;p.vz=0;break}
  }
  const decay=Math.exp(-dt*(p.kind==='ball'?1.3:4));p.vx*=decay;p.vz*=decay;
 }
}
export function drawInteraction(r,p,g){
 if(p.state==='spent'||(g.world&&!g.isIntroduced(p)))return;
 if(isForest(p)){drawForest(r,p,g);return}
 if(isEnvironment(p)){if(g.isIntroduced(p))drawEnvironment(r,p,g);return}
 const x=p.x,z=p.z,cream='#fff0cb',pink='#e8a3b5',wood='#bc966f',gold='#ecc56d',green='#97c17f';
 const B=(a,y,b,w,h,d,c)=>r.cube(x+a,.1+y,z+b,w,h,d,c);
 r.ground(x,z,p.r*2+.3,p.r*2+.3,'#adb98e',.085);
 switch(p.kind){
 case 'fountain':B(0,0,0,2.1,.4,2.1,cream);B(0,.4,0,1.7,.05,1.7,'#8acbdf');B(0,.45,0,.35,.8,.35,gold);if(p.on)for(let n=0;n<8;n++){const a=n*Math.PI/4,t=(g.elapsed*1.8+n*.13)%1;B(Math.cos(a)*t*.8,1.3+Math.sin(t*Math.PI)*.6-t*.8,Math.sin(a)*t*.8,.12,.18,.12,'#a2e4ec')}break;
 case 'tree':B(0,0,0,.4,1.3,.4,wood);B(Math.sin(g.elapsed*24)*p.phase*.13,1.2,0,1.8,1.2,1.8,green);B(0,2.4,0,1.3,.55,1.3,'#badb8c');for(let a=0;a<p.stock;a++)B((a-1)*.5,1.7,.9,.25,.3,.24,pink);break;
 case 'crop':B(0,0,0,1.5,.14,1.4,wood);for(const a of [-.4,.4])for(const b of [-.4,.4]){B(a,.14,b,.45,.18,.45,green);B(a,.32,b,.22,.25,.22,'#efb771')}break;
 case 'statue':B(0,0,0,1.2,.35,1.2,cream);B(0,.35,0,.7,.8,.7,gold);B(0,1.15,0,.85,.45,.85,'#f5d98b');break;
 case 'vending':B(0,0,0,1,1.6,.8,pink);B(0,.4,.42,.7,.8,.06,'#95c9cf');B(0,.13,.42,.6,.18,.07,wood);for(let n=0;n<p.stock;n++)B((n-1)*.22,.6,.47,.14,.22,.08,gold);break;
 case 'balloon':B(0,0,0,.04,1.1,.04,wood);B(0,1.1+Math.sin(g.elapsed*2)*.05,0,.75,.85,.75,pink);break;
 case 'trampoline':B(0,0,0,1.5,.2,1.5,gold);B(0,.2,0,1.2,.13,1.2,'#99cfc8');for(const a of [-.65,.65])for(const b of [-.65,.65])B(a,.33,b,.14,.45,.14,pink);break;
 case 'ride':B(0,0,0,.8,.8,.8,cream);B(0,.8,0,.18,.45,.18,wood);B(p.on?.25:-.25,1.2,0,.5,.2,.2,p.on?green:pink);break;
 case 'duck':B(0,0,0,.65,.35,.5,gold);B(.2,.3,0,.32,.35,.32,cream);B(.42,.33,0,.25,.13,.18,'#e4a05b');break;
 case 'ball':B(0,0,0,.8,.8,.8,'#a8ced7');B(0,.8,0,.45,.04,.45,cream);break;
 case 'picnic':B(0,0,0,1,.55,.75,wood);B(0,.55,0,1.1,.12,.85,pink);B(0,.7,0,.15,.3,.75,cream);break;
 default:B(0,0,0,1,.9,.9,wood);B(0,.4,.47,1,.13,.05,cream);if(p.kind==='cart'){for(const a of [-.4,.4])B(a,0,0,.2,.3,1,'#6c8277');B(0,.9,-.6,1,.12,.2,gold)}
 }
}
