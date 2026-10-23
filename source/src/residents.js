import {AREAS,canWalkWorld,canWalkTownTerrain,RESIDENT_ROUTES,areaAt,landAreaId} from './world.js';
import {DISTRICTS,SCENERY_SOLIDS,canWalkTerrain,canEnterDistrict} from './terrain.js';
export const RESIDENT_RULES=Object.freeze({radius:.32,walkSpeed:1.25,fleeSpeed:5.8,notice:5.5,safeDistance:9.5,calmSeconds:1.2,steerSeconds:.14});
const ROUTES=[
 [[-8,-12],[-13,-8],[-20,-8],[-8,-21]],
 [[-16.5,10],[-16.5,14],[-16.5,19],[-16.5,23]],
 [[8,-12],[8,-23],[23,-23],[23,-8]],
 [[8.2,10],[8.2,23],[23,23],[23,10]]
];
export function canResidentStand(game,x,z,r=RESIDENT_RULES.radius){
 if(game.world){const t=game.getAreaAt(x,z);if(!t||!game.terrainFree(x,z,r))return false;if(game.interactions.some(p=>game.isIntroduced(p)&&p.solid&&p.state!=='spent'&&Math.hypot(x-p.x,z-p.z)<r+p.r+.03))return false;return ![...game.scenerySolids,...game.grid.query(x,z,r+game.maxItemRadius)].some(o=>game.isIntroduced(o)&&o.state!=='eaten'&&Math.hypot(x-o.x,z-o.z)<r+o.type.r+.03)}
 if(Math.abs(x)>game.bounds-r||Math.abs(z)>game.bounds-r||!canWalkTerrain(x,z,r)||!canEnterDistrict(x,z,r,game.stage+1,game.bounds))return false;
 if(SCENERY_SOLIDS.some(o=>Math.hypot(x-o.x,z-o.z)<r+o.type.r+.03))return false;
 return !game.grid.query(x,z,r+(game.maxItemRadius??5)).some(o=>o.state!=='eaten'&&Math.hypot(x-o.x,z-o.z)<r+o.type.r+.03);
}
export function createResidents(){return ROUTES.flatMap((route,district)=>route.map((home,n)=>({id:district*4+n,district,unlock:DISTRICTS[district].unlock,x:home[0],z:home[1],active:false,state:'walk',goal:(n+1)%route.length,dx:0,dz:1,steer:0,quiet:0,stuck:0,distance:0,fleeCount:0,home:[...home]})))}
function place(game,n){
 const free=(x,z)=>canResidentStand(game,x,z)&&Math.hypot(x-game.player.x,z-game.player.z)>game.config.radius+.6&&!game.residents.some(o=>o!==n&&o.active&&Math.hypot(x-o.x,z-o.z)<.9);
 for(let radius=0;radius<8;radius+=.5)for(let a=0;a<16;a++){
  const x=n.home[0]+Math.cos(a*Math.PI/8)*radius,z=n.home[1]+Math.sin(a*Math.PI/8)*radius;
  if(free(x,z)){n.x=x;n.z=z;n.active=true;return true;}
 }return false;
}
export function updateResidents(game,dt){
 if(game.state!=='playing'||dt<=0)return;
 const rules=RESIDENT_RULES;
 for(const n of game.residents){
  if(n.item?.state==='eaten')continue;
  if(game.world?!game.isIntroduced({x:n.home[0],z:n.home[1],r:RESIDENT_RULES.radius}):n.unlock>game.stage+1)continue;
  if(!n.active){if(!place(game,n))continue;}
  if(n.celebrateTime>0){n.celebrateTime=Math.max(0,n.celebrateTime-dt);if(n.item){n.item.x=n.x;n.item.z=n.z}continue}
  const dist=Math.hypot(n.x-game.player.x,n.z-game.player.z),notice=rules.notice+game.config.radius+(game.dashRemaining>0?2.5:0);
  if(dist<notice&&n.state!=='flee'){n.state='flee';n.steer=0;n.quiet=0;n.fleeCount++;game.events.push({kind:'resident-flee',residentId:n.id});}
  if(n.state==='flee'){
   n.quiet=dist>rules.safeDistance+game.config.radius?n.quiet+dt:0;
   if(n.quiet>=rules.calmSeconds){n.state='return';n.steer=0;n.quiet=0;}
  }
  const route=game.world?(n.route||RESIDENT_ROUTES[n.areaId]):ROUTES[n.district];let gx,gz;
  if(n.state==='flee'){
   // Anticipate the moving player, including a dash; exact overlap gets a stable escape direction.
   const px=game.player.x+game.velocity.x*.3,pz=game.player.z+game.velocity.z*.3;
   gx=n.x-px;gz=n.z-pz;if(Math.hypot(gx,gz)<.001){gx=Math.cos(n.id*2.4);gz=Math.sin(n.id*2.4);}
  }else{
   const goal=route[n.goal];gx=goal[0]-n.x;gz=goal[1]-n.z;
   if(Math.hypot(gx,gz)<.7||n.stuck>1.2){n.goal=(n.goal+1)%route.length;n.stuck=0;gx=route[n.goal][0]-n.x;gz=route[n.goal][1]-n.z;if(n.state==='return')n.state='walk';}
  }
  const length=Math.hypot(gx,gz)||1;gx/=length;gz/=length;
  const safe=(x,z)=>{
   if(!canResidentStand(game,x,z))return false;
   const separation=Math.hypot(x-game.player.x,z-game.player.z);
   if(separation<game.config.radius+rules.radius+.08&&separation<dist-.0001)return false;
   return !game.residents.some(o=>o!==n&&o.active&&Math.hypot(x-o.x,z-o.z)<rules.radius*2+.04);
  };
  // The suction slows an actively captured resident, while leaving range still cancels it.
  const speed=(n.state==='flee'?rules.fleeSpeed:rules.walkSpeed)*(n.item?.state==='eating'?.42:1)*(game.world?game.surfaceSpeed(n.x,n.z):1);
  n.steer-=dt;
  if(n.steer<=0){
   let best=-Infinity,bx=0,bz=0;
   for(let k=0;k<24;k++){
    const angle=k*Math.PI/12,dx=Math.cos(angle),dz=Math.sin(angle),near=speed*dt+.06,far=Math.max(.65,near);
    if(!safe(n.x+dx*near,n.z+dz*near)||!safe(n.x+dx*far,n.z+dz*far))continue;
    const score=(dx*gx+dz*gz)*3+(dx*n.dx+dz*n.dz)*.22;
    if(score>best){best=score;bx=dx;bz=dz;}
   }
   n.dx=bx;n.dz=bz;n.steer=rules.steerSeconds;
  }
  const beforeX=n.x,beforeZ=n.z,steps=Math.max(1,Math.ceil(speed*dt/.1));
  for(let step=0;step<steps;step++){
   const x=n.x+n.dx*speed*dt/steps,z=n.z+n.dz*speed*dt/steps;
   if(safe(x,z)){n.x=x;n.z=z;}else{n.steer=0;break;}
  }
  const moved=Math.hypot(n.x-beforeX,n.z-beforeZ);n.distance+=moved;n.stuck=moved<.001?n.stuck+dt:0;if(n.item){n.item.x=n.x;n.item.z=n.z}
 }
}
export function drawResident(r,n,game){
 if(!n.active||n.item?.state==='eaten')return;
 const shirt=['#dc9dad','#91c5bd','#e8ca7e','#b5a5d1','#93b9d1','#e4ad86'][n.id%6],skin=['#f2cfad','#cb9f7e','#a97859'][n.id%3];
 const length=Math.hypot(n.dx,n.dz),dx=length?n.dx/length:0,dz=length?n.dz/length:1,swing=Math.sin(n.distance*11),floor=.098,bob=length?Math.abs(swing)*.018:0;
 const celebrating=n.celebrateTime>0;
 const progress=n.item?.state==='eating'?n.item.progress:0,s=1-progress*.75,cx=n.x+((game?.player.x??n.x)-n.x)*progress*.4,cz=n.z+((game?.player.z??n.z)-n.z)*progress*.4;
 const B=(a,y,b,w,h,d,c)=>r.cube(cx+(dz*a+dx*b)*s,floor+y*s+progress*.8,cz+(-dx*a+dz*b)*s,w*s,h*s,d*s,c);
 r.ground(n.x,n.z,.65,.48,'#a9b69b',.09);
 for(const side of [-1,1]){const stride=side*swing*.095;B(side*.09,Math.max(0,side*swing)*.045,stride,.13,.12,.17,'#657d83');B(side*.09,.1, stride,.11,.34,.12,'#82949a');B(side*.22,celebrating?.95:.5+bob,-stride,.085,.32,.085,skin);}
 B(0,.43+bob,0,.34,.43,.28,shirt);B(0,.86+bob,0,.32,.32,.32,skin);B(0,1.18+bob,0,.36,.09,.35,shirt);
 for(const a of [-.075,.075])B(a,1.02+bob,.174,.035,.045,.035,'#4c625c');
 if(celebrating){B(0,1.5+Math.sin(game.elapsed*9)*.08,0,.22,.14,.22,'#efcd72');}
 if(n.state==='flee'&&!celebrating){B(0,1.47,0,.075,.2,.075,'#edb94e');B(0,1.35,0,.075,.065,.075,'#edb94e');}
}
