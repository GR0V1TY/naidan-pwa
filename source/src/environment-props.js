import {soundEvent} from './sound-events.js';
// New props share the existing contact-only lifecycle. Times use simulation dt.
export const ENV_NAMES={gift:'饼干礼盒',domino:'多米诺积木',watering:'浇水踏板',rainbow:'彩虹地板',windmill:'旋转风车',bell:'皇冠钟'};
export const ENV_ROWS=[['gift',-5,15],['gift',-21,-14],['domino',-39,-18],['domino',-36,-50],['watering',18,37],['watering',47.5,37],['rainbow',21,-29],['rainbow',43,-29],['windmill',-48,-21],['windmill',18,25],['bell',-7,3]];
export const isEnvironment=p=>Object.hasOwn(ENV_NAMES,p.kind);
export const DOMINO=Object.freeze({count:5,height:.85,thickness:.24,width:.65,spacing:.9,fallSeconds:.32});
export const DOMINO_DELAY=DOMINO.fallSeconds*Math.sqrt(Math.asin((DOMINO.spacing-DOMINO.thickness)/DOMINO.height)/(Math.PI/2));
export const DOMINO_DURATION=DOMINO_DELAY*(DOMINO.count-1)+DOMINO.fallSeconds;
export function dominoAngle(time,index){const t=Math.max(0,Math.min(1,(time-index*DOMINO_DELAY)/DOMINO.fallSeconds));return Math.PI/2*t*t}
export function dominoCorners(p,index){
 const angle=dominoAngle(p.animation,index),c=Math.cos(angle),s=Math.sin(angle),hinge=p.x-1.8+index*DOMINO.spacing+DOMINO.thickness/2;
 const t=DOMINO.thickness,h=DOMINO.height,w=DOMINO.width/2;
 return [[-t,0,-w],[0,0,-w],[0,h,-w],[-t,h,-w],[-t,0,w],[0,0,w],[0,h,w],[-t,h,w]].map(([x,y,z])=>[hinge+x*c+y*s,.1-x*s+y*c,p.z+z]);
}
export function initEnvironment(p){
 if(!isEnvironment(p))return p;
 return Object.assign(p,{r:p.kind==='domino'?3.05:p.kind==='rainbow'?2.4:.8,solid:['gift','windmill','bell'].includes(p.kind),hold:0,sequence:0,lastTile:-1,animation:0,rewardType:p.kind==='gift'?2:0,rewardName:p.kind==='watering'?'糖果花':undefined});
}
export function triggerEnvironment(g,p){
 if(p.kind==='gift'){p.state='empty';p.stock=0;p.solid=false;p.animation=0;g.dropRewards(p,3)}
 if(p.kind==='domino'){p.state='running';p.animation=0}
 if(p.kind==='watering'){p.state='running';p.animation=0}
 if(p.kind==='rainbow'){soundEvent(g,p,'rainbow');p.state='empty';p.stock=0;g.dropRewards(p,3)}
 if(p.kind==='windmill')p.animation=3;
 if(p.kind==='bell'){
  p.animation=2;
  for(const n of g.residents)if(n.active&&n.item?.state!=='eaten'&&Math.hypot(n.x-p.x,n.z-p.z)<12)n.celebrateTime=1.5;
 }
}
export function updateEnvironment(g,p,dt,activate){
 if(!g.isIntroduced(p))return;
 if(p.kind==='windmill'||p.kind==='bell')p.animation=Math.max(0,p.animation-dt);
 if(p.state==='running'){
  const before=p.animation;p.animation+=dt;
  if(p.kind==='domino')for(let i=0;i<DOMINO.count;i++){const landing=i*DOMINO_DELAY+DOMINO.fallSeconds;if(before<landing&&p.animation>=landing)soundEvent(g,p,i===DOMINO.count-1?'dominoLast':'domino',{index:i});}
  const duration=p.kind==='domino'?DOMINO_DURATION:1;
  if(p.animation>=duration){p.animation=duration;p.state='empty';p.stock=0;g.dropRewards(p,1);if(p.kind==='watering')soundEvent(g,p,'bloom')}
 }
 if(p.state!=='ready')return;
 if(p.kind==='watering'){
  const on=Math.abs(g.player.x-p.x)<.7+g.config.radius*.5&&Math.abs(g.player.z-p.z)<.7+g.config.radius*.5;
  if(on&&p.hold===0)soundEvent(g,p,'wateringPress');
  p.hold=on?p.hold+dt:0;if(p.hold>=.5-1e-9)activate(g,p);
 }else if(p.kind==='rainbow'){
  const dx=g.player.x-p.x,dz=g.player.z-p.z;
  const tile=Math.abs(dz)<=.7&&dx>=-2.4&&dx<2.4?Math.floor((dx+2.4)/1.6):-1;
  if(tile!==p.lastTile){
   if(tile>=0){if(tile===p.sequence){soundEvent(g,p,'rainbow'+tile);p.sequence++;}else{soundEvent(g,p,'wrong');p.sequence=tile===0?1:0;}if(p.sequence===3)activate(g,p)}
   p.lastTile=tile;
  }
 }
}
export function drawEnvironment(r,p,g){
 const x=p.x,z=p.z,empty=p.state==='empty',blue=empty?'#a4aaa4':'#7bbdd7',cream='#fff0cb',pink='#edabbc',gold='#efcd72';
 const B=(a,y,b,w,h,d,c)=>r.cube(x+a,.1+y,z+b,w,h,d,c);
 // A diamond plus contrasting outline distinguishes interactive props from food.
 r.ground(x,z,p.r*2+.35,p.kind==='rainbow'?1.8:p.kind==='domino'?1.2:p.r*2+.35,blue,.086);
 r.ground(x,z,.25,.25,cream,.088);
 if(p.kind==='gift'){
  B(0,0,0,1.25,.65,1.1,pink);B(0,.65+(empty?.65:0),empty?-.4:0,1.4,.15,1.25,cream);B(0,.01,.56,.18,.65,.035,gold);
  for(const a of [-.25,.25])B(a,empty?1.46:.81,empty?-.4:0,.35,.16,.25,gold);
 }else if(p.kind==='domino'){
  for(let i=0;i<DOMINO.count;i++){
   const corners=dominoCorners(p,i),color=empty?'#b2b3a7':[pink,gold,'#a2c9bb'][i%3];
   if(r.box)r.box(corners,color);else{const xs=corners.map(v=>v[0]),ys=corners.map(v=>v[1]),zs=corners.map(v=>v[2]),lo=Math.min(...ys);r.cube((Math.min(...xs)+Math.max(...xs))/2,lo,(Math.min(...zs)+Math.max(...zs))/2,Math.max(...xs)-Math.min(...xs),Math.max(...ys)-lo,Math.max(...zs)-Math.min(...zs),color)}
  }
 }else if(p.kind==='watering'){
  B(0,0,0,1.35,.12,1.35,gold);B(0,.12,0,1.1,.05,1.1,p.hold>0?'#84bfaf':blue);
  B(.45,.17,-.4,.16,.4,.16,'#92bd77');B(.45,.57,-.4,.5,.18,.5,empty?pink:cream);
  if(p.state==='running')for(let i=0;i<5;i++){const t=(p.animation*2+i*.19)%1;B(-.4+t*.8,.8+Math.sin(t*Math.PI)*.5-t*.4,-.4,.09,.12,.09,blue)}
  if(p.state==='ready'&&p.hold>0)B(-.5+p.hold, .19,.45,Math.max(.03,p.hold*2),.04,.1,cream);
 }else if(p.kind==='rainbow'){
  for(let i=0;i<3;i++){const a=(i-1)*1.6;B(a,0,0,1.5,.1,1.35,empty?'#a4aaa4':['#e7acbb','#eacb7d','#9cc9ba'][i]);B(a,.11,0,.6,.035,.18,p.sequence>i?cream:'#7b8f90');B(a+.24,.11,.16,.16,.035,.5,cream)}
 }else if(p.kind==='windmill'){
  B(0,0,0,.35,1.65,.35,cream);const angle=p.animation>0?(3-p.animation)*6:0;
  for(let i=0;i<4;i++){const a=angle+i*Math.PI/2;B(Math.cos(a)*.6,1.6+Math.sin(a)*.6,0,.55,.32,.16,i%2?pink:gold)}
  B(0,1.55,.12,.25,.25,.2,blue);
  if(p.animation>0)for(let i=0;i<6;i++){const a=i*2.4+g.elapsed;B(Math.cos(a)*1.2,.3+(i%3)*.3,Math.sin(a)*1.2,.12,.05,.15,pink)}
 }else if(p.kind==='bell'){
  for(const a of [-.6,.6])B(a,0,0,.2,1.9,.25,cream);B(0,1.9,0,1.6,.2,.4,gold);
  const swing=p.animation>0?Math.sin((2-p.animation)*16)*p.animation*.14:0;
  B(swing,1,0,.75,.7,.6,gold);B(swing,.9,0,.95,.12,.75,cream);B(swing,.68,0,.12,.25,.12,pink);
  for(const a of [-.3,0,.3])B(a,2.1,0,.16,a===0?.3:.2,.2,gold);
 }
}
