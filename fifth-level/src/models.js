import {characterMesh} from './model/character-mesh.js';
import {MeshBuilder,rgb} from './geometry.js';
import {identity,pivotMatrix} from './math.js';
export const PLAYER_STAGE=4;
export const PLAYER_PIVOTS=[[0,0,0],[0,.95,0],[-.62,.37,.12],[.62,.37,.12],[-.46,-.48,.05],[.46,-.48,.05],[-.40,-.51,-.43]];
export const CHASER_PIVOTS=[[0,0,0],[0,2.21,0],[-.43,1.96,0],[.43,1.96,0],[-.23,1.02,0],[.23,1.02,0],[0,2.8,0]];
let player,chaser,egg;
export function eggMesh(){if(!egg){const src=characterMesh(0);egg={...src,name:'奶蛋冲破 · 第一阶段奶蛋',joints:new Float32Array(src.positions.length/3),parts:src.parts.map(p=>({...p,joint:0})),pivots:Array.from({length:7},()=>[0,0,0]),groundOffset:.90};}return egg;}
export function playerMesh(){
 if(player)return player;const src=characterMesh(PLAYER_STAGE),joints=new Float32Array(src.positions.length/3),parts=[];
 for(const p of src.parts){let x=0;for(let i=p.start*3;i<(p.start+p.count)*3;i+=3)x+=src.positions[i];x/=p.count;let joint=0;
  if(['arm','finger tip'].includes(p.name))joint=x<0?2:3;
  if(['foot','toe'].includes(p.name))joint=x<0?4:5;
  if(p.name.startsWith('tail'))joint=6;
  joints.fill(joint,p.start,p.start+p.count);parts.push({...p,joint});
 }
 player={...src,name:'第一关第五阶段 · 完全体奶龙',joints,parts,pivots:PLAYER_PIVOTS,groundOffset:1.15};return player;
}
export function chaserMesh(){
 if(chaser)return chaser;const b=new MeshBuilder(),skin='#f6c9b2',light='#ffdeca',hair='#49312b',hairLight='#5b4036',cloth='#292a30',seam='#424047',white='#f7eee2',shoe='#202025';
 // Body and flared skirt, with a separate jacket and a continuous hem.
 b.ell('neck',[0,2.15,0],[.17,.28,.16],skin);
 b.surface('flared black skirt',(u,v)=>{const a=u*Math.PI*2,r=.37+.27*v;return [Math.cos(a)*r,1.43-.63*v,Math.sin(a)*r*.62];},cloth,48,18);
 b.surface('skirt hem',(u,v)=>{const a=u*Math.PI*2,r=.64-.018*v;return [Math.cos(a)*r,.80+v*.045,Math.sin(a)*r*.62];},seam,48,3);
 b.ell('jacket torso',[0,1.73,0],[.49,.43,.28],cloth,0,36,24);
 for(const sign of [-1,1]){
  b.surface('jacket front panel',(u,v)=>{const x=sign*(.025+u*.42),y=1.44+v*.56,z=.265+Math.sin(u*Math.PI)*.018;return [x,y,z];},'#303036',18,18);
  b.tube('jacket front seam',[[sign*.025,1.43,.282],[sign*.02,1.69,.293],[sign*.035,1.96,.26]],[.009,.009,.006],seam);
 }
 b.ell('silver jacket button',[0,1.96,.29],[.071,.071,.026],'#c9cbd0',0,24,16);
 b.ell('button inset',[0,1.96,.317],[.04,.04,.009],'#f4f1ed',0,20,12);
 b.tube('round neckline',[[-.19,2.04,.20],[-.10,1.998,.275],[0,1.985,.29],[.10,1.998,.275],[.19,2.04,.20]],[.018,.018,.018,.018,.018],'#171a20');
 // Legs, socks, Mary Jane shoes, and articulated sleeves/hands.
 for(const sign of [-1,1]){
  const arm=sign<0?2:3,leg=sign<0?4:5;
  b.ell('bare leg',[sign*.23,.66,.015],[.155,.43,.17],light,leg);
  b.ell('ribbed white sock',[sign*.23,.245,.02],[.157,.23,.165],white,leg);
  for(let j=-2;j<=2;j++)b.tube('sock rib',[[sign*.23+j*.04,.15,.174],[sign*.23+j*.036,.39,.156]],[.003,.003],'#ded9ce',leg,6);
  b.ell('shoe sole',[sign*.23,.072,.12],[.225,.066,.33],'#111319',leg);
  b.ell('black leather shoe',[sign*.23,.135,.13],[.212,.13,.307],shoe,leg);
  b.ell('shoe opening',[sign*.23,.231,.02],[.135,.014,.13],white,leg);
  b.tube('Mary Jane strap',[[sign*.23-.14,.21,.07],[sign*.23,.253,.13],[sign*.23+.14,.21,.07]],[.038,.038,.038],shoe,leg);
  b.ell('shoe buckle',[sign*.23+sign*.15,.205,.09],[.025,.035,.02],'#8a8c92',leg,12,10);
  b.ell('toe shine',[sign*.23-.046,.224,.29],[.09,.013,.068],'#5d5f66',leg,18,10);
  b.tube('jacket sleeve',[[sign*.41,1.96,0],[sign*.60,1.63,.015],[sign*.75,1.32,.045]],[.19,.17,.13],cloth,arm,20);
  b.tube('jacket cuff',[[sign*.74,1.37,.045],[sign*.775,1.28,.05]],[.139,.13],'#171a21',arm,20);
  b.ell('hand',[sign*.80,1.19,.065],[.125,.18,.105],skin,arm);
  b.ell('thumb',[sign*.70,1.16,.14],[.053,.09,.06],light,arm,16,12);
  for(let j=0;j<3;j++)b.ell('finger',[sign*(.76+j*.035),1.06+j*.014,.092],[.027,.064,.042],light,arm,12,10);
 }
 // The head is fully modeled; face patches and eyes have real depth.
 b.ell('head',[0,2.83,.025],[.82,.86,.66],light,1,64,44);
 for(const sign of [-1,1]){
  b.ell('ear',[sign*.79,2.60,.015],[.155,.22,.13],skin,1);
  b.ell('inner ear',[sign*.83,2.60,.125],[.07,.13,.026],'#e9ab94',1,20,16);
  b.ell('cheek blush',[sign*.48,2.55,.552],[.17,.079,.026],'#f3b4a4',1,26,16);
  b.ell('eye dark rim',[sign*.325,2.86,.573],[.263,.288,.117],'#47302b',1,40,28);
  b.ell('eye white',[sign*.325,2.855,.601],[.246,.270,.113],'#fff9f0',1,40,28);
  b.ell('brown iris',[sign*.325+.012,2.846,.699],[.168,.209,.051],'#684331',1,36,28);
  b.ell('iris shadow',[sign*.325+.012,2.89,.733],[.132,.15,.023],'#34221d',1,30,20);
  b.ell('black pupil',[sign*.325+.015,2.87,.75],[.104,.147,.025],'#1c1515',1,30,24);
  b.ell('large eye highlight',[sign*.325-.04,2.96,.778],[.043,.047,.01],'#ffffff',1,20,16);
  b.ell('small eye highlight',[sign*.325+.073,2.768,.751],[.02,.022,.009],'#efdfc9',1,16,12);
  const path=[];for(let i=0;i<=12;i++){const a=.05+Math.PI*.95*i/12;path.push([sign*.325+Math.cos(a)*.254,2.855+Math.sin(a)*.272,.654+Math.sin(a)*.02]);}
  b.tube('upper eyeliner',path,path.map(()=>.018),'#281d1b',1,10);
  b.tube('eyelash wing',[[sign*.55,2.96,.638],[sign*.63,2.995,.60],[sign*.66,3.035,.565]],[.025,.022,.002],'#281d1b',1,10);
  b.tube('eyebrow',[[sign*.17,3.25,.56],[sign*.32,3.30,.55],[sign*.48,3.27,.52],[sign*.58,3.22,.47]],[.041,.045,.034,.004],hair,1,14);
 }
 b.ell('nose bridge',[0,2.66,.666],[.075,.13,.061],light,1);
 b.ell('nose tip',[0,2.59,.714],[.083,.064,.067],'#f6c7ad',1);
 b.ell('beauty mark',[-.525,2.625,.62],[.017,.019,.012],'#503026',1,16,12);
 b.tube('smile line',[[-.205,2.377,.558],[-.105,2.343,.633],[0,2.339,.65],[.105,2.343,.633],[.205,2.377,.558]],[.005,.012,.014,.012,.005],'#a65e51',1,12);
 b.ell('lower lip',[0,2.319,.632],[.126,.041,.028],'#e69480',1,28,16);
 b.ell('lip highlight',[0,2.332,.662],[.068,.007,.005],'#ffd6bd',1,18,8);
 // Asymmetric brown bob: scalp, back curtain, sweeping front lock, fine strands.
 b.surface('side parted hair cap',(u,v)=>{const a=u*Math.PI*2,front=Math.max(0,Math.sin(a)),max=1.85-front*(.80+.15*Math.cos(a)),t=v*max;return [Math.cos(a)*.891*Math.sin(t),2.91+.967*Math.cos(t),.015+Math.sin(a)*.741*Math.sin(t)];},p=>{const l=.045*Math.sin(p[0]*8+p[1]*3);return rgb(hairLight).map(v=>v+l);},72,36,1);
 b.surface('bob back and sides',(u,v)=>{const a=Math.PI-.30+u*(Math.PI+.68),r=.86+.04*Math.sin(v*Math.PI)-.01*v;return [Math.cos(a)*r,3.17-v*1.15,.015+Math.sin(a)*r*.83];},hair,64,24,1);
 const fringe=(u,v)=>{const center=.28-1.15*(1-(1-v)**2),width=.14*(1-v)+.028,x=center+(u-.5)*2*width,y=3.73-1.56*v-.035*Math.pow(2*u-1,2),z=.06+.76*Math.sqrt(Math.max(.025,1-(x/.90)**2-((y-2.91)/.98)**2));return [x,y,z];};
 b.surface('swept fringe',fringe,hairLight,28,38,1);
 for(let k=0;k<14;k++){
  const a=Math.PI-.25+k*(Math.PI+.55)/13,path=[];for(let j=0;j<7;j++){const v=j/6,r=.863+.04*Math.sin(v*Math.PI)-.01*v;path.push([Math.cos(a)*r,3.17-v*1.145,.015+Math.sin(a)*r*.83]);}
  b.tube('bob hair strand',path,path.map(()=>.0045),k%3?'#51372e':'#64483b',1,6);
 }
 for(let k=0;k<7;k++){
  const path=[];for(let j=0;j<9;j++){const v=.08+j*.095,p=fringe(.16+k*.11,v);p[2]+=.004;path.push(p);}
  b.tube('swept hair strand',path,path.map(()=>.004),'#71513f',1,6);
 }
 chaser={...b.build('参考图追击者 · 黑裙短发'),pivots:CHASER_PIVOTS,groundOffset:0};return chaser;
}
export function jointPose(kind,time=0,{running=true,slide=false,jump=false,caught=false}={}){
 const pivots=kind==='player'?PLAYER_PIVOTS:CHASER_PIVOTS,mats=pivots.map(()=>identity()),a=running?Math.sin(time*12)*.68:0;
 if(kind==='player'){
  mats[2]=pivotMatrix(pivots[2],jump?-1.1:a,0,slide?1.5:1.05);
  mats[3]=pivotMatrix(pivots[3],jump?-1.1:-a,0,slide?-1.5:-1.05);
  mats[4]=pivotMatrix(pivots[4],jump?-.72:-a);mats[5]=pivotMatrix(pivots[5],jump?.45:a);
  mats[6]=pivotMatrix(pivots[6],0,Math.sin(time*12)*.12,0);
 }else{
  mats[1]=pivotMatrix(pivots[1],Math.sin(time*12)*.025,Math.sin(time*12)*.035);
  mats[2]=pivotMatrix(pivots[2],caught?-1.35:-a*.9,0,.10);
  mats[3]=pivotMatrix(pivots[3],caught?-1.35:a*.9,0,-.10);
  mats[4]=pivotMatrix(pivots[4],jump?-.60:a);mats[5]=pivotMatrix(pivots[5],jump?.50:-a);
 }
 return mats;
}
