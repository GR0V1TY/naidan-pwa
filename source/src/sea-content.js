// Third level: one continuous side-view undersea ruin. Geometry and art share these props.
export const SEA_WORLD=Object.freeze({width:7000,height:1080,minX:0,maxX:7000,minY:80,maxY:1000,playerMinX:64,playerMaxX:6936,playerMinY:132,playerMaxY:930,surfaceY:78,floorY:958,safeX:620});
export const SEA_ZONES=Object.freeze([
 {id:0,name:'珊瑚浅湾',en:'CORAL SHALLOWS',x0:0,x1:1050,top:'#b6f5e8',bottom:'#2aa9bd',haze:'#86eadf',accent:'#ffb184',rock:'#477b7c',light:'#e8fff4'},
 {id:1,name:'沉没回廊',en:'SUNKEN COLONNADE',x0:1050,x1:2250,top:'#79e5e2',bottom:'#157e9f',haze:'#4dc8d0',accent:'#f3a07c',rock:'#356673',light:'#d6fff6'},
 {id:2,name:'古代神殿',en:'ANCIENT TEMPLE',x0:2250,x1:3650,top:'#48c6d3',bottom:'#0d5b88',haze:'#2a9fb8',accent:'#e2cd93',rock:'#2a526c',light:'#c8f7f2'},
 {id:3,name:'沉船裂谷',en:'WRECK RIFT',x0:3650,x1:5200,top:'#2c8db2',bottom:'#083f66',haze:'#176d92',accent:'#b9c3c9',rock:'#1d425e',light:'#a9e8ee'},
 {id:4,name:'王座深渊',en:'THRONE ABYSS',x0:5200,x1:7000,top:'#185273',bottom:'#04142f',haze:'#0b3358',accent:'#8fe9ff',rock:'#0b2444',light:'#8ed8e8'}
]);
export const SEA_STAGE_NAMES=Object.freeze(['小金鱼','大金鱼','初级长身海兽','成熟长身海兽','巨型长身海兽']);
export const SEA_GROWTH_XP=Object.freeze([0,8,24,52,96]);
export const SEA_STAGE_RADIUS=Object.freeze([16,23,34,47,63]);
export const SEA_STAGE_SPEED=Object.freeze([250,275,305,335,370]);
export const SEA_DASH=Object.freeze({durations:Object.freeze([.5,.65,.8,.95,1.1]),cooldown:4,multiplier:2.3,knockback:430});
export const SEA_LIVES=3;
export const SEA_TIME=240;
export const SEA_INVULN=1.5;
export const SEA_SAFE_RADIUS=0.9;
export const CREATURE_TYPES=Object.freeze({
 shrimp:{name:'海床清洁虾',level:0,xp:1,points:5,r:9,speed:34,color:'#f08a63',behavior:'bed'},
 fry:{name:'银鱼苗',level:0,xp:1,points:5,r:8,speed:86,color:'#b7eee4',behavior:'school'},
 small:{name:'珊瑚小鱼',level:1,xp:4,points:16,r:14,speed:118,color:'#ffd07a',behavior:'fish'},
 mid:{name:'青铜鱼',level:2,xp:10,points:38,r:22,speed:148,color:'#85d4db',behavior:'fish'},
 big:{name:'礁鲨',level:3,xp:24,points:85,r:32,speed:176,color:'#7b9fbd',behavior:'predator'},
 shark:{name:'裂谷鲨',level:4,xp:48,points:150,r:44,speed:212,color:'#96a4b2',behavior:'predator'},
 boss:{name:'王座巨鲨',level:5,xp:0,points:1500,r:78,speed:236,color:'#5f7183',behavior:'boss',boss:true}
});
export function zoneAt(x){
 if(!Number.isFinite(x))return SEA_ZONES[0];
 for(let i=SEA_ZONES.length-1;i>=0;i--)if(x>=SEA_ZONES[i].x0)return SEA_ZONES[i];
 return SEA_ZONES[0];
}
export function zoneBlend(x){
 const z=zoneAt(x),t=Math.max(0,Math.min(1,(x-z.x0)/(z.x1-z.x0)));
 return {zone:z,t};
}
// Stretch the authored late zones without scaling obstacle footprints.
const OLD_EDGES=[0,1050,2100,3150,4200,5250];
export function expandSeaX(x){let i=OLD_EDGES.findIndex((v,k)=>k<4&&x>=v&&x<OLD_EDGES[k+1]);if(i<0)i=x<0?0:4;const a=OLD_EDGES[i],b=OLD_EDGES[i+1],z=SEA_ZONES[i];return z.x0+(x-a)*(z.x1-z.x0)/(b-a)}
export const SEA_ITEMS=Object.freeze([
 {id:'pearl',kind:'pearl',name:'珍珠贝',x:expandSeaX(730),y:570,r:25,mode:'touch'},
 {id:'spring',kind:'spring',name:'气泡泉',x:expandSeaX(1560),y:615,r:36,mode:'touch'},
 {id:'tablet',kind:'tablet',name:'遗迹石碑',x:expandSeaX(2480),y:550,r:34,mode:'hold'},
 {id:'chest',kind:'chest',name:'沉船宝箱',x:expandSeaX(3690),y:570,r:31,mode:'press'},
 {id:'amulet',kind:'amulet',name:'发光护符',x:expandSeaX(4540),y:540,r:27,mode:'touch'}
]);
function rect(x,y,w,h){return {shape:'rect',x,y,w,h}}
function circle(x,y,r){return {shape:'circle',x,y,r}}
// Collision is derived from the same dimensions used by the renderer.
export function collidersFor(p){
 const {kind,x,y,w,h}=p;
 if(kind==='coral')return [circle(x,y+h*.10,w*.30)];
 if(kind==='rock')return [circle(x,y,w*.46)];
 if(kind==='rubble')return [circle(x,y,w*.42)];
 if(kind==='column')return [rect(x,y,w,h)];
 if(kind==='arch'||kind==='temple'){const pw=w*.15,ph=h;return [rect(x-w*.38,y,pw,ph),rect(x+w*.38,y,pw,ph),rect(x,y-h*.42,w,h*.14)]}
 if(kind==='statue')return [rect(x,y+h*.34,w*.58,h*.30),circle(x,y-h*.06,w*.30)];
 if(kind==='wreck')return [rect(x,y+h*.16,w*.82,h*.42),rect(x-w*.32,y-h*.05,w*.16,h*.34)];
 if(kind==='throne')return [rect(x,y+h*.30,w*.86,h*.30),rect(x,y-h*.10,w*.54,h*.52)];
 if(kind==='steps')return [rect(x,y,w,h)];
 if(kind==='gate')return [rect(x-w*.42,y,w*.14,h),rect(x+w*.42,y,w*.14,h),rect(x,y-h*.46,w,h*.12)];
 return [];
}
export function circleHitsShape(s,x,y,r){
 if(s.shape==='circle'){const dx=x-s.x,dy=y-s.y,rr=r+s.r;return dx*dx+dy*dy<rr*rr}
 const cx=Math.max(s.x-s.w/2,Math.min(x,s.x+s.w/2)),cy=Math.max(s.y-s.h/2,Math.min(y,s.y+s.h/2));
 return (x-cx)**2+(y-cy)**2<r*r;
}
export function hitsSolid(solids,x,y,r){return solids.some(s=>circleHitsShape(s,x,y,r))}
export function nearestSolid(solids,x,y,r){
 let best=null,bestD=Infinity;
 for(const s of solids){const cx=s.shape==='circle'?s.x:Math.max(s.x-s.w/2,Math.min(x,s.x+s.w/2)),cy=s.shape==='circle'?s.y:Math.max(s.y-s.h/2,Math.min(y,s.y+s.h/2));const d=Math.hypot(x-cx,y-cy)-r-(s.shape==='circle'?s.r:0);if(d<bestD){bestD=d;best=s}}
 return best;
}
function mulberry32(seed){let n=seed>>>0;return()=>{n=(n+0x6D2B79F5)>>>0;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
export function freeSpot(world,x,y,r,margin=0){
 if(!Number.isFinite(x+y+r))return false;
 if(x-r<SEA_WORLD.minX+margin||x+r>SEA_WORLD.maxX-margin||y-r<SEA_WORLD.minY+margin||y+r>SEA_WORLD.maxY-margin)return false;
 return !hitsSolid(world.solids,x,y,r);
}
export function relocateFree(world,x,y,r,{prefer={x:0,y:0}}={}){
 if(freeSpot(world,x,y,r))return {x,y};
 for(let radius=8;radius<900;radius+=8){
  for(let a=0;a<40;a++){
   const angle=a*Math.PI/20,px=x+Math.cos(angle)*radius,py=y+Math.sin(angle)*radius;
   if(freeSpot(world,px,py,r))return {x:px,y:py};
  }
 }
 return {x:prefer.x||170,y:prefer.y||540};
}
// --- authored world -------------------------------------------------------
function addProp(list,solids,kind,x,y,w,h,extra={}){
 const p={id:list.length,kind,x:expandSeaX(x),y,w,h,...extra};
 const cs=collidersFor(p);
 list.push(p);
 for(const s of cs)solids.push({...s,propId:p.id,kind});
 return p;
}
export function createSeaWorld(seed=42){
 const rng=mulberry32(seed),props=[],solids=[];
 // Zone 1: warm coral shallows. Low reef frames the wide central swim lane.
 for(const [x,y,w,h] of [[150,240,180,130],[900,210,170,110],[1030,300,120,90]])addProp(props,solids,'rock',x,y,w,h,{seed:rng()});
 for(const [x,y,w,h] of [[230,900,150,100],[420,918,120,78],[690,902,170,108],[860,918,130,84],[990,892,120,92]])addProp(props,solids,'coral',x,y,w,h,{hue:rng(),seed:rng()});
 addProp(props,solids,'arch',615,310,230,270,{seed:rng()});
 addProp(props,solids,'coral',560,850,100,70,{hue:.6,seed:rng()});
 addProp(props,solids,'kelp',105,880,80,240,{seed:rng()});
 addProp(props,solids,'kelp',790,880,90,220,{seed:rng()});
 addProp(props,solids,'vent',365,940,70,56,{seed:rng()});
 // Zone 2: sunken colonnade, broken columns and two arches above the main channel.
 for(const [x,y,w,h] of [[1130,790,64,300],[1320,220,70,270],[1720,800,60,280],[1970,205,76,290]])addProp(props,solids,'column',x,y,w,h,{broken:rng()>.5,seed:rng()});
 addProp(props,solids,'arch',1510,292,270,310,{seed:rng()});
 addProp(props,solids,'arch',1880,306,210,250,{seed:rng()});
 for(const [x,y,w,h] of [[1210,925,130,60],[1630,930,160,54],[1840,920,120,56]])addProp(props,solids,'rubble',x,y,w,h,{seed:rng()});
 addProp(props,solids,'kelp',1060,900,80,210,{seed:rng()});
 addProp(props,solids,'kelp',2040,900,80,230,{seed:rng()});
 // Zone 3: temple gate, statues, dais and carved steps.
 addProp(props,solids,'gate',2290,306,320,340,{seed:rng()});
 addProp(props,solids,'arch',2730,300,250,300,{seed:rng()});
 for(const [x,y,w,h] of [[2510,850,180,220],[3020,862,160,200]])addProp(props,solids,'statue',x,y,w,h,{seed:rng()});
 addProp(props,solids,'column',2900,205,74,300,{broken:true,seed:rng()});
 for(const [x,y,w,h] of [[2180,928,220,58],[2700,935,180,50],[3100,925,120,56]])addProp(props,solids,'steps',x,y,w,h,{seed:rng()});
 addProp(props,solids,'kelp',2110,900,80,230,{seed:rng()});
 // Zone 4: shipwreck rift. The wreck hull is at the bottom, masts are decorative.
 addProp(props,solids,'wreck',3550,820,430,270,{seed:rng(),flip:false});
 addProp(props,solids,'wreck',3970,262,290,180,{seed:rng(),flip:true,small:true});
 for(const [x,y,w,h] of [[3300,215,180,120],[4140,205,130,100],[3400,920,120,62],[3810,930,140,54]])addProp(props,solids,'rock',x,y,w,h,{seed:rng()});
 addProp(props,solids,'anchor',3750,545,120,180,{seed:rng()});
 addProp(props,solids,'kelp',3230,910,90,230,{seed:rng()});
 addProp(props,solids,'kelp',4130,905,80,200,{seed:rng()});
 // Zone 5: throne abyss, the final shark circles in front of the drowned throne.
 addProp(props,solids,'throne',5060,700,270,430,{seed:rng()});
 for(const [x,y,w,h] of [[4310,215,80,310],[4630,815,70,290],[4840,190,86,330]])addProp(props,solids,'column',x,y,w,h,{broken:rng()>.5,seed:rng()});
 for(const [x,y,w,h] of [[4380,930,180,54],[4760,930,160,50],[5000,930,280,62]])addProp(props,solids,'steps',x,y,w,h,{seed:rng()});
 addProp(props,solids,'rock',4210,220,150,110,{seed:rng()});
 addProp(props,solids,'kelp',4250,905,90,220,{seed:rng()});
 const world={seed,props,solids,zones:SEA_ZONES,creatures:[]};
 // Prey placement is deterministic, leaves the spawn shelf safe, and always includes lower tiers.
 const creatures=[];
 const add=(typeKey,x,y,extra={})=>{
  const type=CREATURE_TYPES[typeKey];
  const spot=extra.force?{x,y}:findCreatureSpot(world,creatures,x,y,type.r+6);
  if(!spot)return null;
  const c={id:creatures.length,type:typeKey,...type,x:spot.x,y:spot.y,homeX:spot.x,homeY:spot.y,vx:0,vy:0,state:'wander',stateT:0,alertT:0,cooldown:0,facing:x>=0?1:-1,phase:rng()*Math.PI*2,seed:rng(),school:extra.school??null,eaten:false,boss:Boolean(type.boss)};
  creatures.push(c);return c;
 };
 const scatter=(typeKey,count,x0,x1,y0,y1,school=null)=>{
  for(let i=0;i<count;i++){
   const x=expandSeaX(x0+rng()*(x1-x0)),y=y0+rng()*(y1-y0);
   add(typeKey,x,y,school?{school}:undefined);
  }
 };
 // Zone 1: the guaranteed starter shelf.
 scatter('shrimp',10,180,940,820,920);
 scatter('fry',16,230,980,430,660,1);
 add('fry',expandSeaX(370),520,{school:1});add('fry',expandSeaX(430),545,{school:1});add('fry',expandSeaX(500),510,{school:1});
 scatter('small',4,900,1000,480,660);
 // Zone 2
 scatter('small',10,1130,2010,500,700);
 scatter('mid',7,1150,2020,480,720);
 scatter('fry',6,1150,1980,400,650,2);
 // Zone 3
 scatter('mid',9,2160,3040,480,700);
 scatter('big',6,2190,3070,440,720);
 scatter('small',6,2150,3060,380,690);
 // Zone 4
 scatter('big',6,3200,4110,470,720);
 scatter('shark',3,3230,4120,430,730);
 scatter('mid',4,3200,4100,390,680);
 // Zone 5: boss waits in front of the throne.
 scatter('shark',4,4280,4850,420,720);
 scatter('big',3,4270,4860,380,690);
 add('boss',expandSeaX(4900),600,{force:true});
 world.creatures=creatures;
 world.items=SEA_ITEMS.map(item=>({...item,state:'ready',progress:0,cooldown:0}));
 for(const item of world.items)if(!freeSpot(world,item.x,item.y,item.r+8,6)){const q=relocateFree(world,item.x,item.y,item.r+8);item.x=q.x;item.y=q.y}
 return world;
}
function findCreatureSpot(world,creatures,x,y,r){
 for(let step=0;step<80;step++){
  const px=x+(step?((step%9)-4)*22:0),py=y+(step?((Math.floor(step/9)%9)-4)*18:0);
  if(!freeSpot(world,px,py,r,8))continue;
  if(px<SEA_WORLD.safeX+60&&r>18)continue;
  if(creatures.some(c=>!c.eaten&&Math.hypot(c.x-px,c.y-py)<c.r+r+6))continue;
  return {x:px,y:py};
 }
 return null;
}
export function reachableBandY(x){return {min:400,max:700}}
