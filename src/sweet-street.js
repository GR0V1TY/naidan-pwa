// Sweet-street art sample. Shared layout data keeps scenery and collision aligned.
export const STREET=Object.freeze({x:-16.5,z:16.5,width:4.6,length:21,unlock:2});
export const SHOP_LOTS=Object.freeze([
 {x:-23,z:9.5,name:'草莓奶吧',style:0,facing:1},
 {x:-23,z:16.5,name:'曲奇工坊',style:1,facing:1},
 {x:-23,z:23.5,name:'甜甜圈屋',style:2,facing:1},
 {x:-10,z:9.5,name:'薄荷糖铺',style:3,facing:-1},
 {x:-10,z:16.5,name:'冰淇淋屋',style:4,facing:-1},
 {x:-10,z:23.5,name:'柠檬蛋糕店',style:5,facing:-1}
]);
export const SWEET_SOLIDS=Object.freeze([
 ...[-21.2,-11.8].flatMap(x=>[13,20].map(z=>({id:`sweet-flower-${x}-${z}`,x,z,kind:'flower',type:{r:.45,level:Infinity},state:'available'}))),
 ...[-19.5,-13.5].map(x=>({id:`sweet-post-${x}`,x,z:7,kind:'post',type:{r:.28,level:Infinity},state:'available'}))
]);
export function inSweetStreet(x,z){return x< -7&&z>7&&x> -27&&z<27}
export function arrangeSweetStreet(items,types){
 const candidates=items.filter(i=>i.x< -7&&i.z>=7&&i.type.id!==19);
 const shops=candidates.filter(i=>i.type.level>=4);
 for(const item of candidates)if(shops.length<6&&!shops.includes(item)&&item.type.level===3)shops.push(item);
 if(shops.length!==6)throw Error('Sweet-street shop allocation changed');
 shops.forEach((item,n)=>{const lot=SHOP_LOTS[n];Object.assign(item,{x:lot.x,z:lot.z,streetSample:true,shopStyle:lot.style,facing:lot.facing,type:{...types[16],name:lot.name,level:4,xp:75,points:375,r:1.75,h:4.8,color:['#e8a2b3','#e4c18a','#e9a99a','#a4cfc3','#b5bfdc','#e8cf88'][n]}})});
 const props=candidates.filter(i=>!shops.includes(i));
 props.forEach((item,n)=>{item.x=n%2?-14.1:-18.9;item.z=9+Math.floor(n/2)*3;item.streetSample=true;});
 return items;
}

export function drawShop(r,item,game){
 const p=item.state==='eating'?item.progress:0,s=1-p*.75,R=item.type.r*s,H=item.type.h*s;
 const x=item.x+(game.player.x-item.x)*p*.4,z=item.z+(game.player.z-item.z)*p*.4,y=.06+p*1.5;
 const facing=item.facing??1,style=item.shopStyle??0,col=item.type.color,cream='#fff0cf',trim='#f8dfb5',glass='#81b8b7',wood='#a57d64';
 const B=(a,b,d,w,h,depth,c)=>r.cube(x+facing*d*R,y+b*H,z-facing*a*R,depth*R,h*H,w*R,c);
 // Raised plinth, inset facade and stepped roof: all parts stay inside radius R.
 B(0,0,0,1.12,.04,.94,trim);B(0,.04,0,1.06,.58,.84,['#f8dfc7','#f5e6b7','#f5d6c8','#d9e9d6','#e3e2ed','#f4e7b8'][style]);
 B(0,.58,0,1.14,.045,.96,col);B(0,.625,0,1.06,.07,.88,col);B(0,.695,0,.92,.035,.78,trim);
 for(const a of [-.49,.49]){B(a,.07,.43,.07,.49,.025,trim);B(a,.07,-.43,.07,.49,.025,trim);}
 // Glazed shop door, two display windows and little pastry shelves.
 B(0,.04,.435,.25,.32,.035,wood);B(0,.085,.46,.16,.22,.018,glass);B(.075,.18,.48,.025,.025,.02,'#efc866');
 for(const a of [-.34,.34]){
  B(a,.15,.435,.28,.2,.025,wood);B(a,.175,.454,.23,.15,.018,glass);B(a,.175,.468,.022,.15,.01,cream);
  B(a,.13,.46,.31,.025,.1,trim);B(a,.18,.477,.12,.04,.035,col);
  B(a,.39,.435,.23,.12,.025,trim);B(a,.41,.455,.17,.08,.018,glass);
 }
 // Side windows remain readable from the isometric camera.
 for(const a of [-.54,.54])for(const d of [-.2,.2]){B(a,.18,d,.02,.2,.22,trim);B(a*1.02,.2,d,.018,.15,.16,glass);}
 // Individually striped awning with a scalloped voxel edge.
 for(let n=0;n<7;n++){const a=(n-3)*.16;B(a,.35,.55,.16,.035,.3,n%2?cream:col);B(a,.325,.69,.15,.03,.035,n%2?cream:col);}
 B(0,.49,.45,.62,.08,.04,col);B(0,.51,.477,.43,.025,.015,cream);
 // Rear-facing display window keeps the opposite shop row readable from the camera.
 B(0,.12,-.435,.69,.25,.025,trim);B(0,.145,-.455,.59,.19,.015,glass);
 for(const a of [-.2,0,.2])B(a,.145,-.47,.025,.19,.015,cream);
 B(0,.11,-.46,.76,.025,.12,trim);B(0,.43,-.435,.48,.08,.025,col);B(0,.455,-.455,.3,.02,.015,cream);
 for(let n=0;n<5;n++)B((n-2)*.14,.37,-.53,.14,.025,.2,n%2?cream:col);
 // Six roof signs identify the milk bar, cookie works, donut, mint, ice cream and cake.
 if(style===2){
  for(let n=0;n<8;n++){const a=n*Math.PI/4;B(Math.cos(a)*.17,.84+Math.sin(a)*.055,0,.1,.04,.12,n%2?col:'#e4b47b');}
 }else if(style===1){
  B(0,.76,0,.37,.14,.16,'#ddb578');B(0,.9,0,.3,.025,.14,'#e9c68e');
  for(const a of [-.09,.09])for(const b of [.8,.855])B(a,b,.09,.055,.018,.02,'#987052');
 }else if(style===4){
  B(0,.75,0,.12,.06,.12,'#d8b27b');B(0,.81,0,.2,.035,.2,'#e8c28a');B(0,.845,0,.32,.07,.3,'#fff2d8');B(0,.915,0,.22,.04,.22,'#e9b2c3');
 }else if(style===5){
  B(0,.74,0,.4,.06,.35,'#e3bd79');B(0,.8,0,.43,.025,.38,cream);B(0,.825,0,.35,.055,.3,col);B(0,.88,0,.22,.035,.2,cream);B(0,.915,0,.08,.035,.08,'#e4cc70');
 }else if(style===0){
  B(0,.75,0,.26,.16,.24,col);B(0,.91,0,.22,.035,.22,cream);B(.07,.945,0,.035,.04,.035,'#d58e9e');
 }else{
  B(0,.76,0,.28,.13,.25,col);B(-.23,.79,0,.15,.07,.2,trim);B(.23,.79,0,.15,.07,.2,trim);B(0,.89,0,.16,.04,.15,cream);
 }
 // Window flower boxes are attached to the building and disappear with it.
 for(const a of [-.35,.35]){B(a,.38,.48,.24,.035,.12,wood);B(a,.415,.48,.19,.035,.09,'#96b884');B(a-.04,.45,.48,.06,.025,.06,'#edb8c6');B(a+.04,.45,.48,.06,.025,.06,'#f1d280');}
}

export function drawSweetShadow(r,item){
 if(item.state==='eaten')return;
 const p=item.state==='eating'?item.progress:0,s=1-p,x=item.x,z=item.z,R=item.type.r;
 if(s<=0)return;
 // Layered opaque ground tones approximate contact softness without a shadow map.
 r.ground(x+.12,z+.16,R*2.25*s,R*1.9*s,'#e4cbb7',.067);
 r.ground(x+.08,z+.1,R*1.95*s,R*1.65*s,'#d8bfa8',.069);
 r.ground(x,z,R*1.55*s,R*1.4*s,'#cfb49e',.071);
}

export function drawSweetStreet(r,game){
 // Warm sidewalk, raspberry edging and a broad, unobstructed walking lane.
 r.ground(-16.5,16.6,19,20.6,'#eddbc4',.041);
 r.ground(STREET.x,STREET.z,STREET.width,STREET.length,'#f4e6d4',.045);
 for(const x of [-19.1,-13.9])r.ground(x,16.5,.18,21,'#e6b4b7',.049);
 for(let n=0;n<12;n++)for(const x of [-20.1,-12.9])r.ground(x,7.5+n*1.6,.55,.55,n%2?'#f6e6ca':'#e8cbb3',.052);
 for(let n=0;n<8;n++)for(let a=0;a<3;a++)r.ground(-17.8+a*1.3,8+n*2.5,.25,.25,n%2?'#ebd0c5':'#e7d5b5',.051);
 // The arch clears the largest rolling body. Posts use SWEET_SOLIDS for collision.
 const open=game.stage+1>=STREET.unlock;
 r.cube(-16.5,3.4,7,6.3,.42,.3,open?'#e8adb9':'#dbbf9f');r.cube(-16.5,3.48,7,3.8,.21,.33,'#fff0cd');
 for(const a of [-.3,0,.3])r.cube(-16.5+a,3.9,7,.16,.2,.16,'#edc96e');
 for(const o of SWEET_SOLIDS){
  if(o.kind==='post'){r.cube(o.x,0,o.z,.34,3.4,.34,'#f1d6ab');r.cube(o.x,3.35,o.z,.48,.28,.48,'#e6a5b1');continue;}
  r.ground(o.x+.1,o.z+.1,1.2,1.2,'#d9c5ac',.065);r.cube(o.x,0,o.z,.6,.35,.6,'#e6bb99');r.cube(o.x,.35,o.z,.63,.09,.63,'#fff0ce');
  r.cube(o.x,.44,o.z,.55,.35,.55,'#99bd7e');r.cube(o.x-.13,.78,o.z,.2,.15,.2,'#edb0c2');r.cube(o.x+.12,.75,o.z+.1,.2,.16,.2,'#f2d481');
 }
}
