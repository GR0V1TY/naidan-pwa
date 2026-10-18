import {drawTown} from './town-content.js';
import {drawShop,drawSweetStreet} from './sweet-street.js';
import {SURFACE,DISTRICTS,POND,roadsForBounds,SCENERY_SOLIDS,lockedDistricts} from './terrain.js';

// All assets are authored as reusable voxel parts; no network models or textures.
export function drawItem(renderer,item,game){
 if(item.isLandmark&&game.levelIndex===1){
  const p=item.progress||0,s=1-p*.75,x=item.x+(game.player.x-item.x)*p*.4,z=item.z+(game.player.z-item.z)*p*.4,y=p*1.5;
  const B=(a,b,c,w,h,d,col)=>renderer.cube(x+a*s,y+b*s,z+c*s,w*s,h*s,d*s,col);
  B(0,0,0,5.5,.6,5.5,'#d6c4dc');B(0,.6,0,4.6,.4,4.6,'#ece2d5');for(const a of [-1.8,1.8])for(const c of [-1.8,1.8]){B(a,1,c,.65,3.7,.65,'#c2b3cf');B(a,4.7,c,1,.35,1,'#e3d3df')}B(0,1,0,1.5,3.8,1.5,'#a3d3cc');B(0,4.8,0,1,1,1,'#bc9ed6');B(0,5.8,0,.5,.7,.5,'#dfc3ec');return;
 }
 if(item.shopStyle!==undefined){drawShop(renderer,item,game);return}
 if(item.waterFood)renderer.ground(item.x,item.z,item.type.r*2+.8,item.type.r*2+.65,'#b9d98d',.034);
 const t=item.type,p=item.state==='eating'?item.progress:0,s=1-p*.75;
 const x=item.x+(game.player.x-item.x)*p*.4,z=item.z+(game.player.z-item.z)*p*.4,y=p*1.5+.06,r=t.r*s,h=t.h*s;
 const c=t.color,cream='#fff1cf',pink='#ee9bb0',gold='#efc65b',wood='#b88961',dark='#637f78';
 const yaw=item.yaw??0,cos=[1,0,-1,0][yaw],sin=[0,1,0,-1][yaw];
 const B=(a,b,d,w,hh,dd,col=c)=>renderer.cube(x+(cos*a-sin*d)*r,y+b*h,z+(sin*a+cos*d)*r,(yaw%2?dd:w)*r,hh*h,(yaw%2?w:dd)*r,col);
 const wheels=()=>{for(const a of [-.55,.55])for(const d of [-.44,.44])B(a,0,d,.28,.22,.22,dark)};
 const canopy=(height=.7)=>{for(let n=0;n<5;n++)B((n-2)*.29,height,0,.29,.13,1.1,n%2?cream:c)};
 const cup=(a,d,col)=>{B(a,.15,d,.48,.26,.48,col);B(a,.39,d,.52,.04,.52,cream);B(a,.41,d,.32,.02,.32,'#ba9380');B(a+.31,.23,d,.13,.14,.18,col)};
 if(t.name==='糖果花'){B(0,0,0,.18,.6,.18,'#91b87d');B(.25,.22,0,.45,.12,.22,'#a5c68c');for(const [a,d] of [[-.35,0],[.35,0],[0,-.35],[0,.35]])B(a,.6,d,.48,.22,.48,pink);B(0,.64,0,.35,.25,.35,gold);return}
 switch(t.id){
 case 0:B(0,.1,0,1.05,.7,.9);B(-.65,.25,0,.3,.4,.6,cream);B(.65,.25,0,.3,.4,.6,cream);B(0,.1,.46,.2,.7,.02,cream);break;
 case 1:B(0,0,0,1.05,.75,1.05,cream);B(0,.74,0,.85,.2,.9);B(0,.17,.54,.7,.33,.04);B(.25,.88,0,.1,.25,.1,pink);break;
 case 2:B(0,0,0,1.3,.45,1.3);B(0,.45,0,1.05,.18,1.05);for(const [a,d]of [[-.3,-.3],[.3,-.2],[0,.3]])B(a,.64,d,.22,.08,.22,'#98704e');break;
 case 3:B(0,0,0,1.2,.7,1.2,gold);B(0,.7,0,1.1,.14,1.1,'#d69d68');B(0,.84,0,.5,.16,.5,cream);break;
 case 4:B(0,0,0,1.3,.8,1.3);B(0,.8,0,1.4,.12,1.4);B(0,0,.66,.22,.92,.04,cream);B(0,.93,0,.22,.05,1.4,cream);B(-.22,.97,0,.35,.18,.28,cream);B(.22,.97,0,.35,.18,.28,cream);break;
 case 5:B(0,0,0,1.05,.45,1.05);B(0,.4,0,1.2,.1,1.2);B(0,.5,0,.65,.3,.65,'#8fbf7c');for(const a of [-.3,.3])B(a,.82,0,.4,.18,.4,pink);break;
 case 6:B(0,0,0,1.2,.75,1.2);for(const a of [-.3,.3])for(const d of [-.3,.3])B(a,.75,d,.3,.2,.3,cream);break;
 case 7:B(0,0,0,1.3,.55,1);B(0,.55,0,1.35,.08,1.05,cream);for(const a of [-.52,.52])B(a,.6,0,.12,.4,.12,wood);B(0,.93,0,1.12,.1,.12,wood);break;
 case 8:for(const a of [-.5,.5])B(a,0,0,.18,.45,.55,dark);B(0,.42,0,1.45,.17,.75);B(0,.65,-.36,1.45,.35,.12);break;
 case 9:B(0,0,0,.7,.08,.7,dark);B(0,.08,0,.16,.66,.16,dark);B(0,.74,0,.65,.2,.65,gold);B(0,.94,0,.8,.06,.8,dark);break;
 case 10:B(0,0,0,1.05,.85,1.05);B(0,.85,0,1.2,.15,1.2,cream);B(0,.89,.61,.55,.06,.03,dark);break;
 case 11:wheels();B(0,.2,0,1.35,.35,1);for(const a of [-.55,.55])B(a,.55,0,.1,.27,.1,cream);canopy(.8);B(0,.58,.15,.36,.16,.4,gold);break;
 case 12:wheels();B(0,.2,0,1.4,.4,1);B(-.26,.6,0,.75,.3,1);B(-.26,.66,.51,.5,.16,.03,'#dbf3ea');B(.48,.45,.51,.25,.14,.03,cream);B(.26,.84,0,.3,.16,.3,pink);break;
 case 13:B(0,0,0,1.2,.45,1);for(const a of [-.5,.5])B(a,.45,0,.09,.25,.1,wood);canopy(.7);B(0,.82,0,.28,.1,.28,gold);B(0,.92,0,.42,.1,.42,pink);break;
 case 14:for(const a of [-.48,.48])B(a,0,-.35,.12,.8,.12,gold);B(0,.8,-.35,1.25,.1,.55,pink);for(let k=0;k<6;k++)B(0,.76-k*.12,-.25+k*.17,1,.1,.23,k%2?'#a2d6ce':cream);for(const a of [-.58,.58])B(a,.88,-.35,.1,.12,.6,cream);break;
 case 15:B(0,0,0,1.3,.1,1.3,cream);for(const a of [-.5,.5])for(const d of [-.5,.5])B(a,.1,d,.12,.6,.12,gold);for(let k=0;k<4;k++)B(0,.7+k*.07,0,1.4-k*.3,.09,1.4-k*.3,k%2?cream:pink);break;
 case 16:B(0,0,0,1.35,.62,1.3,cream);B(0,.62,0,1.4,.2,1.4);B(0,.83,0,1.1,.1,1.15,pink);for(const a of [-.4,.4])B(a,.22,.66,.3,.25,.04,'#9accc7');B(0,0,.67,.28,.37,.04,wood);canopy(.48);B(0,.96,0,.8,.1,.15,gold);break;
 case 17:B(0,0,0,1.35,.14,1.35,pink);for(let n=0;n<3;n++){const a=n*Math.PI*2/3+game.elapsed*.45;cup(Math.cos(a)*.3,Math.sin(a)*.3,['#f0ce75','#9cd1c5',pink][n]);}B(0,.14,0,.12,.6,.12,cream);for(let k=0;k<3;k++)B(0,.72+k*.08,0,1.2-k*.4,.09,1.2-k*.4,k%2?cream:pink);break;
 case 18:{B(0,0,0,1.3,.08,1.1,cream);for(const a of [-.4,.4])B(a,.08,0,.12,.5,.14,gold);
  for(let n=0;n<12;n++){const angle=n*Math.PI/6+game.elapsed*.09,a=Math.cos(angle),b=Math.sin(angle);B(a*.75,.57+b*.36,0,.16,.07,.18,pink);B(a*.4,.57+b*.19,0,.12,.035,.12,cream);if(n%2===0){B(a*.75,.53+b*.36,0,.32,.1,.38,n%4?gold:'#a0d2c6');}}
  B(0,.53,0,.32,.1,.28,gold);break;}
 case 19:B(0,0,0,1.35,.55,1.25,cream);B(0,.55,0,.8,.27,.8);B(0,.82,0,.7,.1,.7,cream);B(0,.92,0,.45,.08,.45,gold);
  for(const a of [-.52,.52])for(const d of [-.46,.46]){B(a,0,d,.35,.7,.35);for(let k=0;k<3;k++)B(a,.7+k*.065,d,.43-k*.12,.07,.43-k*.12,pink);B(a,.38,d+.19,.12,.14,.02,gold);}
  B(0,0,.64,.4,.35,.04,wood);B(0,.02,.68,.3,.28,.03,gold);for(const a of [-.2,0,.2])B(a,.98,0,.13,.05,.13,gold);
  for(let n=0;n<5;n++)B((n-2)*.25,.55,.58,.13,.07,.13,gold);break;
 }
}

function drawLocalKingdom(r,game){
 const bounds=game.bounds,side=bounds*2;
 r.ground(0,0,side+30,side+30,'#a4d9e7',-.85);
 r.cube(0,-2.3,0,side+1,1.6,side+1,'#c7a181');r.cube(0,-1,0,side+.5,.96,side+.5,'#a9c794');r.ground(0,0,side,side,'#c9dfa9');
 for(const d of DISTRICTS)r.ground(d.x,d.z,23,23,d.color,SURFACE.district);
 for(const [x,z,w,d]of roadsForBounds(bounds))r.ground(x,z,w,d,'#eee6cf',SURFACE.road);
 drawSweetStreet(r,game);
 // A stepped square plaza reads as a voxel ring without coplanar overlapping roads.
 r.ground(0,0,16,16,'#f4e6c8',SURFACE.stripe);
 for(const sign of [-1,1])for(let n=-7;n<=7;n+=2){r.ground(n,sign*7,.7,.7,'#ebbac1',.065);r.ground(sign*7,n,.7,.7,'#e7cc85',.065)}
 // Fountain is low decorative paving, outside the castle's collision footprint.
 r.ground(5,5,2.8,2.8,'#fff0ca',.067);r.ground(5,5,2.2,2.2,'#9fd6de',.07);r.ground(5,5,1,1,'#f2d575',.074);r.cube(5,.08,5,.85,.5,.85,'#fff0cb');r.cube(5,.58,5,.65,.65,.65,'#f6db8a');for(const a of [-.22,0,.22])r.cube(5+a,1.23,5,.15,.2,.18,'#efc45e');
 const p=POND;r.ground(p.x,p.z,p.w+.8,p.d+.8,'#f6e4b6',.025);r.ground(p.x,p.z,p.w,p.d,'#8fcddf',.03);
 for(let k=0;k<9;k++)r.ground(p.x-4.4+k*1.1,p.z,1.02,p.bridgeWidth,'#d5aa79',.075);
 // Rails stay over blocked water; the bridge has the full usable 4.8-unit width.
 for(const sign of [-1,1]){r.cube(p.x,.08,p.z+sign*2.58,10,.22,.16,'#bb9065');for(const a of [-4,0,4])r.cube(p.x+a,.08,p.z+sign*2.58,.2,.7,.2,'#d2ac7a');}
 for(const [x,z]of [[13,12],[19,20]]){r.cube(x,.04,z,.45,.18,.55,'#f8e295');r.cube(x+.15,.22,z,.22,.22,.24,'#fff0bf');}
 // Cherry tree grows in the inaccessible water bed, never on a walkable tile.
 r.cube(18,.04,20,.35,1.2,.35,'#b28a68');r.cube(18,1.1,20,1.5,.7,1.2,'#edb4c7');r.cube(18,1.7,20,1,.45,1,'#f3c6d3');
 // Flower borders are flat ground details, so they never create invisible obstacles.
 for(const d of DISTRICTS)for(let n=0;n<10;n++){
  if(d.id==='sweets')continue;
  const x=d.x-8+n*1.7,z=d.z-8;
  r.ground(x,z,.9,.65,'#91bd7c',.066);r.ground(x-.18,z,.25,.25,n%2?'#f1b7c6':'#f8dd8a',.072);
 }
 // Solid trees share positions and footprints with the movement system.
 for(const tree of SCENERY_SOLIDS.filter(o=>o.id.startsWith('tree'))){
  r.cube(tree.x,0,tree.z,.25,.8,.25,'#b28e6c');r.cube(tree.x,.6,tree.z,.95,.9,.95,'#96c77c');r.cube(tree.x,1.5,tree.z,.7,.5,.7,'#b5d98b');
 }
 // Small flowering mosaic beds enrich the grass without blocking movement.
 for(const d of DISTRICTS)for(let a=0;a<4;a++)for(let n=0;n<5;n++){
  if(d.id==='sweets')continue;
  const x=d.x-6+a*4,z=d.z-6+n*3;
  if(x>10&&z>10&&x<22&&z<22)continue;
  r.ground(x,z,.6,.6,'#b6d795',.023);r.ground(x+.15,z,.18,.18,(a+n)%2?'#efd38a':'#ebb8c7',.028);
 }
 if(!game.worldTown){
 // Gate avenues divide the outer wall into four accessible openings.
 for(const sign of [-1,1])for(let k=-bounds+1;k<bounds;k+=2){if(Math.abs(k)<3)continue;
  for(const swap of [false,true]){const x=swap?sign*bounds:k,z=swap?k:sign*bounds;
   r.cube(x,0,z,swap?.55:1.92,.85,swap?1.92:.55,'#f3e3b9');r.cube(x,.85,z,.6,.27,.6,'#fff0cb');}
 }
 for(const sign of [-1,1])for(const swap of [false,true]){
  const x=swap?sign*bounds:0,z=swap?0:sign*bounds;
  for(const a of [-3,3]){const xx=x+(swap?0:a),zz=z+(swap?a:0);r.cube(xx,0,zz,1.4,2.1,1.4,'#f5e4b9');r.cube(xx,2.1,zz,1.65,.4,1.65,'#f0b1b7');r.cube(xx,2.5,zz,1.05,.4,1.05,'#eca1ad');}
 }
 }
 // Closed gardens remain visible behind fences until the associated evolution.
 for(const o of lockedDistricts(game.stage+1,bounds)){
  const sx=Math.sign(o.district.x),sz=Math.sign(o.district.z);
  for(let a=7;a<bounds;a+=1.6){
   for(const [x,z,swap]of [[sx*7,sz*a,false],[sx*a,sz*7,true]]){
    r.cube(x,0,z,.14,.65,.14,'#f5e5bf');r.cube(x,.28,z,swap?1.6:.12,.13,swap?.12:1.6,'#ecc798');
   }
  }
  const x=sx*7,z=sz*15;r.cube(x,0,z,.13,1.8,.13,'#d5ae70');r.cube(x+sx*.4,1.05,z,.8,.6,.09,'#eaa6b6');
 }
 // Outer trees and water blocks make a miniature island silhouette beyond play bounds.
 if(!game.worldTown)for(let n=0;n<22;n++){const a=n*Math.PI*2/22,x=Math.cos(a)*(bounds+5),z=Math.sin(a)*(bounds+5);
  if(Math.abs(x)<3||Math.abs(z)<3)continue;r.cube(x,-.8,z,1.2,.9,1.2,'#9fc88a');r.cube(x,.1,z,1.9,1.8,1.9,n%2?'#a5ca7d':'#8bbd7e');r.cube(x,1.9,z,1.2,.8,1.2,'#bedb8d');
 }
 // Land and base silhouettes arrive together during expansion; final items activate once settled.
}

export function drawKingdom(r,game){if(game.world)drawTown(r,game);else drawLocalKingdom(r,game)}
