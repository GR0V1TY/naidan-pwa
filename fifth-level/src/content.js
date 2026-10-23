import {seeded} from './math.js';
export const VERSION='0.34.0';
export const RULES=Object.freeze({duration:180,laneWidth:3,speed:15,maxSpeed:26,jumpVelocity:9.5,gravity:25,slide:.82,rollRadius:.50,eggRadius:.65,laneSpeed:19,danger:8,invincible:1.05,magnet:9,double:9,shield:1,smash:8,smashRange:8,smashGrace:1,step:1/120});
export const SPEED_TRANSITION=1;
export const SPEED_WARNING=2;
export const SPEED_STAGES=Object.freeze([
 Object.freeze({start:0,speed:15,name:'起跑'}),
 Object.freeze({start:40,speed:20,name:'加速'}),
 Object.freeze({start:80,speed:26,name:'极速'})
]);
export function speedInfoAt(elapsed){
 const t=Math.max(0,Number.isFinite(elapsed)?elapsed:0),epsilon=1e-9;
 const stage=t+epsilon>=SPEED_STAGES[2].start?2:t+epsilon>=SPEED_STAGES[1].start?1:0,spec=SPEED_STAGES[stage],next=SPEED_STAGES[stage+1];
 const progress=stage===0?1:Math.max(0,Math.min(1,(t-spec.start)/SPEED_TRANSITION)),blend=progress*progress*(3-2*progress),from=stage===0?spec.speed:SPEED_STAGES[stage-1].speed;
 return {stage,name:spec.name,speed:from+(spec.speed-from)*blend,target:spec.speed,transitioning:stage>0&&progress<1,progress,warning:Boolean(next&&t+epsilon>=next.start-SPEED_WARNING),nextStage:next?stage+1:null,warningSeconds:next?Math.max(0,next.start-t):0};
}
export const ZONES=Object.freeze([
 {name:'奶糖站台',short:'奶糖站',color:'#53c4b0',sky:'#b8e1ed',building:'#f3cab6',accent:'#ee927f'},
 {name:'城市轨道',short:'城市线',color:'#6ebbad',sky:'#b3d7ed',building:'#dec6ba',accent:'#d99e78'},
 {name:'霓虹隧道',short:'霓虹线',color:'#717fbd',sky:'#4d547e',building:'#5d6388',accent:'#ef9dbe'},
 {name:'列车车顶',short:'云上快线',color:'#69b4c2',sky:'#c5dce4',building:'#e7c1af',accent:'#f2b970'},
 {name:'终点车站',short:'终点站',color:'#54beac',sky:'#f1d8bc',building:'#f4c9ac',accent:'#ec987e'}
]);
export const zoneAt=t=>Math.min(4,Math.floor(t/36));
export function makeRow(index,distance,seed=20261021){
 const rand=seeded(seed+index*911),safe=Math.floor(rand()*3)-1,lanes=[-1,0,1].filter(x=>x!==safe),hazards=[],coins=[],items=[];
 const types=index<4?['barrier','barrier','bar']:['barrier','bar','train'];
 for(let i=0;i<lanes.length;i++){
  let type=types[Math.floor(rand()*types.length)],ramp=false;
  if(distance>1650&&distance<2400&&index%4===1&&i===0){type='train';ramp=true;}
  const length=type==='train'?18:1.2;
  hazards.push({id:`h${index}-${i}`,lane:lanes[i],d:distance,length,type,ramp,hit:false});
  if(ramp)for(let j=0;j<5;j++)coins.push({id:`roof${index}-${j}`,lane:lanes[i],d:distance-4+j*4,y:j===0?1.4:3.1,taken:false});
 }
 for(let j=0;j<6;j++)coins.push({id:`c${index}-${j}`,lane:safe,d:distance-8+j*2.5,y:.95,taken:false});
 if(index%5===1)items.push({id:`p${index}`,type:['smash','magnet','shield','double'][Math.floor(index/5)%4],lane:safe,d:distance+4,y:1.1,taken:false});
 return {id:index,d:distance,safe,hazards,coins,items};
}
export function accessibleLanes(row){return [-1,0,1].filter(l=>!row.hazards.some(h=>h.lane===l));}
