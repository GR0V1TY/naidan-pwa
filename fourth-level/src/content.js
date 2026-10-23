export const W=1440,H=810,GROUND=680,SLING={x:225,y:515},MAX_PULL=95;
export const AMMO={normal:{name:'普通奶蛋',color:'#fff0ba',density:.006,r:23},heavy:{name:'重型奶蛋',color:'#d5b58b',density:.014,r:26},burst:{name:'爆裂奶蛋',color:'#ffc3b6',density:.007,r:23}};
export const MATERIAL={wood:{name:'饼干木',color:'#d9a269',hp:38,density:.002,points:60},glass:{name:'脆糖玻璃',color:'#86dcd5',hp:17,density:.0015,points:80},stone:{name:'奶霜石',color:'#9cabc1',hp:160,density:.005,points:100}};
const block=(x,y,w,h,material='wood')=>({x,y,w,h,material});
function tower(x,floors=1,material='wood'){
 const b=[];for(let i=0;i<floors;i++){const bottom=GROUND-i*112;b.push(block(x-54,bottom-49,20,98,i===0?material:'wood'),block(x+54,bottom-49,20,98,i===0?material:'wood'),block(x,bottom-105,145,14,material==='stone'?'wood':material));}return b;
}
export const ARENAS=[
 {name:'云端哨站',subtitle:'瞄准下方支撑，让哨站倒下',ammo:['normal','normal','normal'],blocks:tower(930),enemies:[{x:930,y:GROUND-23}],barrels:[],par:2100},
 {name:'饼干双塔',subtitle:'脆糖支撑很脆弱，试试连锁倒塌',ammo:['normal','normal','heavy'],blocks:[...tower(870,2,'glass'),...tower(1110)],enemies:[{x:870,y:GROUND-23},{x:1110,y:GROUND-23},{x:870,y:GROUND-135}],barrels:[],par:4000},
 {name:'风车栈桥',subtitle:'红色糖桶会引发连锁爆炸',ammo:['normal','normal','burst'],blocks:[...tower(870),...tower(1130),block(1000,560,170,16,'glass')],enemies:[{x:870,y:657},{x:1130,y:657},{x:1000,y:530}],barrels:[{x:1000,y:655}],par:4400},
 {name:'水晶堡垒',subtitle:'重型奶蛋撞开石块，爆裂奶蛋清场',ammo:['heavy','heavy','burst','burst'],blocks:[...tower(940,2,'glass'),block(820,630,28,100,'stone'),block(1060,630,28,100,'stone')],enemies:[{x:940,y:657},{x:940,y:545},{x:1160,y:657}],barrels:[{x:1100,y:655}],par:4600},
 {name:'皇冠要塞',subtitle:'击败皇冠守卫，夺回云端核心',ammo:['normal','heavy','heavy','burst','burst'],blocks:[...tower(880,2,'glass'),...tower(1130,2,'stone'),block(1005,445,150,18,'wood')],enemies:[{x:880,y:657},{x:1130,y:657},{x:880,y:545},{x:1130,y:545},{x:1005,y:412,boss:true}],barrels:[{x:1005,y:655}],par:9000}
];
