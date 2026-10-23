import {goldfish,seaBeast,creatureArt,seabed,stoneDetail,coralGarden,statue} from './sea-art.js';
import {SEA_WORLD,SEA_ZONES,zoneAt,zoneBlend,SEA_STAGE_RADIUS} from './sea-content.js';
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rgb(hex){const n=parseInt(hex.slice(1),16);return [n>>16&255,n>>8&255,n&255]}
function mix(a,b,t){const A=rgb(a),B=rgb(b);return `rgb(${Math.round(A[0]+(B[0]-A[0])*t)},${Math.round(A[1]+(B[1]-A[1])*t)},${Math.round(A[2]+(B[2]-A[2])*t)})`}
function rgba(hex,a){const [r,g,b]=rgb(hex);return `rgba(${r},${g},${b},${a})`}
function lerpHex(a,b,t){const A=rgb(a),B=rgb(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')}
function hash(n){let x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)}
function ease(t){return t*t*(3-2*t)}
function blob(ctx,x,y,rx,ry,points,seed,fill,stroke=null){
 ctx.beginPath();
 for(let i=0;i<points;i++){const a=i/points*TAU,r=1+ (hash(seed+i*3.3)-.5)*.18,px=x+Math.cos(a)*rx*r,py=y+Math.sin(a)*ry*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}
}
function fin(ctx,x,y,len,width,angle,fill,alpha=1){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha*=alpha;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(len*.55,-width,len,0);ctx.quadraticCurveTo(len*.55,width*.35,0,0);ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.restore()
}
export class SeaRenderer{
 constructor(canvas){
  this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});
  if(!this.ctx)throw Error('Canvas2D unavailable');
  this.camera={x:170,y:540,scale:1};this.follow=null;this.viewW=0;this.viewH=0;this.dpr=1;this.resize();
  this.bgCache=null;
 }
 transitionSnapshot(game){
  const fish=document.createElement('canvas');fish.width=fish.height=512;const c=fish.getContext('2d');c.translate(256,256);c.scale(game.player.facing,1);
  (game.stage<2?goldfish:seaBeast)(c,100,game.elapsed,0,0);
  const draw=this.drawPlayer;
  try{this.drawPlayer=()=>{};this.render(game,0);return {fish:fish.toDataURL(),background:this.canvas.toDataURL(),position:{x:this.sx(game.player.x)/this.cssW,y:this.sy(game.player.y)/this.cssH}};}
  finally{this.drawPlayer=draw;this.render(game,0);}
 }
 resize(){
  const dpr=Math.min(2,globalThis.devicePixelRatio||1),w=Math.max(1,globalThis.innerWidth||960),h=Math.max(1,globalThis.innerHeight||720);
  if(this.canvas.width!==Math.round(w*dpr)||this.canvas.height!==Math.round(h*dpr)){this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr)}
  this.dpr=dpr;this.cssW=w;this.cssH=h;
 }
 view(game){
  const w=this.cssW,h=this.cssH,scale=clamp(Math.min(h/760,w/700),.42,1.15),vw=w/scale,vh=h/scale;
  let tx=game.player.x+game.player.facing*Math.min(90,vw*.06),ty=game.player.y;
  tx=vw>=SEA_WORLD.width?SEA_WORLD.width/2:clamp(tx,vw/2,SEA_WORLD.width-vw/2);
  ty=vh>=1000?540:clamp(ty,SEA_WORLD.minY+vh/2,SEA_WORLD.maxY-vh/2);
  return {tx,ty,scale,vw,vh,w,h};
 }
 render(game,dt=0){
  this.resize();const ctx=this.ctx,v=this.view(game),{w,h}=v;
  const smooth=dt>0?1-Math.exp(-dt*4.5):1;
  if(!this.follow||dt===0||Math.abs(this.follow.x-v.tx)>v.vw*.55||Math.abs(this.follow.y-v.ty)>v.vh*.55)this.follow={x:v.tx,y:v.ty};
  else this.follow.x+=(v.tx-this.follow.x)*smooth,this.follow.y+=(v.ty-this.follow.y)*smooth;
  const shake=game.cameraShake?game.cameraShake:0;
  const cam={x:this.follow.x+(shake?Math.sin(game.elapsed*47)*6*shake:0),y:this.follow.y+(shake?Math.cos(game.elapsed*39)*5*shake:0),scale:v.scale,vw:v.vw,vh:v.vh};
  this.cam=cam;this.v=v;
  ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  this.drawWater(ctx,game,cam,w,h);
  this.drawFar(ctx,game,cam);
  this.drawZonePlaques(ctx,game,cam);
  seabed(ctx,this,game,cam);
  this.drawSolids(ctx,game,cam);
  this.drawItems(ctx,game,cam);
  this.drawCreatures(ctx,game,cam);
  this.drawEffects(ctx,game,cam);
  this.drawForeground(ctx,game,cam,w,h);
  this.drawVignette(ctx,w,h);
 }
 sx(x,cam=this.cam){return (x-cam.x)*cam.scale+this.v.w/2}
 sy(y,cam=this.cam){return (y-cam.y)*cam.scale+this.v.h/2}
 parallaxX(x,cam,amount){return (x-cam.x)*cam.scale*amount+this.v.w/2}
 palette(game){
  const z=zoneAt(game.player.x),zt=clamp((game.player.x-z.x0)/(z.x1-z.x0),0,1),n=SEA_ZONES[Math.min(z.id+1,SEA_ZONES.length-1)];
  return {zone:z,next:n,t:zt,top:lerpHex(z.top,n.top,zt*.55),bottom:lerpHex(z.bottom,n.bottom,zt*.55),haze:lerpHex(z.haze,n.haze,zt*.5),rock:lerpHex(z.rock,n.rock,zt*.5),accent:z.accent,light:z.light};
 }
 drawWater(ctx,game,cam,w,h){
  const p=this.palette(game);
  const g=ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0,p.top);g.addColorStop(.42,mix(p.top,p.bottom,.42));g.addColorStop(.78,p.bottom);g.addColorStop(1,mix(p.bottom,'#020b18',.45));
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  // warm surface glow and moving caustics
  const surf=this.sy(SEA_WORLD.surfaceY,cam);
  if(surf>-160){
   const rg=ctx.createRadialGradient(w*.5,surf,10,w*.5,surf,Math.max(w,h)*.8);
   rg.addColorStop(0,rgba(p.light,.34));rg.addColorStop(.5,rgba(p.light,.10));rg.addColorStop(1,rgba(p.light,0));
   ctx.fillStyle=rg;ctx.fillRect(0,0,w,h);
   ctx.save();ctx.globalAlpha=.20;ctx.strokeStyle=p.light;ctx.lineWidth=1.4;
   for(let i=0;i<7;i++){const yy=surf+16+i*13+Math.sin(game.elapsed*1.1+i)*3;ctx.beginPath();for(let x=0;x<=w;x+=22){const y=yy+Math.sin(x*.012+game.elapsed*.8+i*1.7)*4;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}
   ctx.restore();
  }
  // light shafts from the surface
  ctx.save();ctx.globalCompositeOperation='screen';
  for(let i=0;i<7;i++){
   const bx=this.parallaxX((i*870+game.elapsed*16)%SEA_WORLD.width,cam,.45),bw=90+i*22;
   const ex=bx+(((i%2)?1:-1)*(70+i*10)),top=this.sy(SEA_WORLD.surfaceY,cam),bottom=this.sy(820,cam);
   const lg=ctx.createLinearGradient(bx,top,ex,bottom);lg.addColorStop(0,rgba(p.light,.16));lg.addColorStop(1,rgba(p.light,0));
   ctx.fillStyle=lg;ctx.beginPath();ctx.moveTo(bx-bw*.3,top);ctx.lineTo(bx+bw*.3,top);ctx.lineTo(ex+bw,this.sy(1000,cam));ctx.lineTo(ex-bw,this.sy(1000,cam));ctx.closePath();ctx.fill();
  }
  ctx.restore();
  // marine snow
  ctx.save();ctx.fillStyle=rgba('#e9feff',.45);
  for(let i=0;i<70;i++){
   const x=((hash(i*4.7)*SEA_WORLD.width+game.elapsed*(8+i%7*3))%SEA_WORLD.width),y=120+hash(i*9.1)*820;
   const sx=this.sx(x,cam),sy=this.sy(y+(Math.sin(game.elapsed*.6+i)*10),cam);
   if(sx<-4||sx>w+4)continue;ctx.globalAlpha=.14+hash(i*2.3)*.28;ctx.beginPath();ctx.arc(sx,sy,1+hash(i)*2,0,TAU);ctx.fill();
  }
  ctx.restore();
 }
 drawFar(ctx,game,cam){
  const p=this.palette(game);
  ctx.save();
  // distant ruin silhouettes, 3 depth bands
  for(let band=0;band<3;band++){
   const amount=.18+band*.10,alpha=.20-band*.04,base=this.sy(SEA_WORLD.floorY-band*40,cam);
   const first=Math.floor((cam.x-cam.vw)/260)*260,last=cam.x+cam.vw;
   for(let x=first;x<last;x+=260){
    const k=Math.floor(x/260),hsh=hash(k*2.1+band*7.3),hgt=150+hsh*300,xx=this.parallaxX(x+band*40,cam,amount);
    ctx.globalAlpha=alpha;ctx.fillStyle=mix(p.rock,p.bottom,.35+band*.12);
    if(k%3===0){ctx.fillRect(xx,base-hgt,46+40*hsh,hgt+40);ctx.fillRect(xx-18,base-hgt-18,82+40*hsh,22)}
    else if(k%3===1){ctx.beginPath();ctx.moveTo(xx-60,base);ctx.lineTo(xx,base-hgt);ctx.lineTo(xx+70,base);ctx.closePath();ctx.fill();ctx.fillRect(xx-30,base-hgt*.4,60,hgt*.6)}
    else{ctx.beginPath();ctx.arc(xx,base-hgt*.4,90+hsh*60,Math.PI,0);ctx.fill();ctx.fillRect(xx-90-hsh*60,base-hgt*.4,180+hsh*120,hgt*.4)}
   }
  }
  // distant fish silhouettes
  ctx.globalAlpha=.28;ctx.fillStyle=mix(p.haze,'#081c2e',.25);
  for(let i=0;i<22;i++){
   const x=((i*311+game.elapsed*(6+i%5*3))%SEA_WORLD.width),y=260+hash(i*5.3)*520;
   const sx=this.parallaxX(x,cam,.32),sy=this.sy(y+Math.sin(game.elapsed*.4+i)*20,cam),s=5+hash(i*3.7)*9;
   if(sx<-20||sx>this.v.w+20)continue;ctx.beginPath();ctx.ellipse(sx,sy,s*1.7,s*.7,0,0,TAU);ctx.fill();ctx.beginPath();ctx.moveTo(sx-s*1.5,sy);ctx.lineTo(sx-s*2.5,sy-s*.7);ctx.lineTo(sx-s*2.5,sy+s*.7);ctx.closePath();ctx.fill();
  }
  ctx.restore();
 }
 drawZonePlaques(ctx,game,cam){
  ctx.save();
  for(const z of SEA_ZONES){
   const x=z.x0+120,sx=this.sx(x,cam);if(sx<-320||sx>this.v.w+320)continue;
   const sy=this.sy(170,cam);
   ctx.globalAlpha=.55;ctx.strokeStyle=rgba('#d9fff7',.6);ctx.lineWidth=1.5;
   ctx.beginPath();ctx.moveTo(sx-46,sy+18);ctx.lineTo(sx+250,sy+18);ctx.stroke();
   ctx.fillStyle='#eafff9';ctx.font='700 24px "Microsoft YaHei",sans-serif';ctx.fillText(z.name,sx-44,sy);
   ctx.globalAlpha=.42;ctx.font='600 10px "Segoe UI",sans-serif';ctx.fillText(z.en,sx-44,sy+35);
  }
  ctx.restore();
 }
 drawSolids(ctx,game,cam){
  const p=this.palette(game);const props=[...game.world.props].sort((a,b)=>a.y-b.y);
  for(const prop of props){const sx=this.sx(prop.x,cam);if(sx<-420||sx>this.v.w+420)continue;this['prop_'+prop.kind]?.(ctx,prop,cam,p,game);stoneDetail(ctx,prop,this,cam)}
 }
 // --- authored props -----------------------------------------------------
 prop_coral(ctx,p,cam,pal){coralGarden(ctx,p,this,cam)}
 prop_rock(ctx,p0,cam,pal){
  const x=this.sx(p0.x,cam),y=this.sy(p0.y,cam),s=p0.w*cam.scale*.5;
  blob(ctx,x,y+s*.12,s,s*.82,8,p0.seed,mix(pal.rock,'#0b1a27',.18),rgba('#c7fff2',.10));
  blob(ctx,x-s*.28,y-s*.15,s*.42,s*.38,7,p0.seed+4,rgba('#9de4d6',.10));
 }
 prop_rubble(ctx,p0,cam,pal){
  const x=this.sx(p0.x,cam),y=this.sy(p0.y,cam),s=p0.w*cam.scale*.5;
  for(let i=0;i<4;i++){const bx=x+(hash(p0.seed+i)-.5)*s*1.6,by=y+(hash(p0.seed+i+5)-.5)*s*.5,rr=s*(.18+hash(p0.seed+i+2)*.22);blob(ctx,bx,by,rr,rr*.72,6,p0.seed+i,mix(pal.rock,'#091722',.2))}
 }
 prop_column(ctx,p0,cam,pal){
  const x=this.sx(p0.x,cam),y=this.sy(p0.y,cam),w=p0.w*cam.scale,h=p0.h*cam.scale;
  const top=y-h/2,bottom=y+h/2;
  const g=ctx.createLinearGradient(x-w/2,0,x+w/2,0);g.addColorStop(0,mix(pal.rock,'#06131f',.4));g.addColorStop(.45,mix(pal.rock,'#e5f6e7',.22));g.addColorStop(1,mix(pal.rock,'#071522',.45));
  ctx.fillStyle=g;ctx.fillRect(x-w/2,top,w,h);
  ctx.fillStyle=mix(pal.rock,'#d7efe4',.18);ctx.fillRect(x-w*.66,top-h*.035,w*1.32,h*.05);ctx.fillRect(x-w*.62,bottom-h*.02,w*1.24,h*.035);
  ctx.strokeStyle=rgba('#03111d',.35);ctx.lineWidth=Math.max(1,w*.04);
  for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(x+i*w*.24,top+h*.06);ctx.lineTo(x+i*w*.24,bottom-h*.06);ctx.stroke()}
  ctx.fillStyle=rgba('#9ee8c7',.22);
  for(let i=0;i<5;i++){const vy=top+h*(.18+i*.16);if(hash(p0.seed+i)>.5)ctx.fillRect(x-w*.45,vy,w*.28,Math.max(2,h*.025))}
  if(p0.broken){ctx.fillStyle=mix(pal.rock,'#04101a',.35);ctx.beginPath();ctx.moveTo(x-w/2,top);ctx.lineTo(x-w*.15,top-h*.10);ctx.lineTo(x+w*.05,top-h*.02);ctx.lineTo(x+w/2,top-h*.13);ctx.lineTo(x+w/2,top);ctx.closePath();ctx.fill()}
 }
 prop_arch(ctx,p0,cam,pal,game){
  const x=this.sx(p0.x,cam),y=this.sy(p0.y,cam),w=p0.w*cam.scale,h=p0.h*cam.scale,pw=w*.15;
  const top=y-h/2,bottom=y+h/2;
  const g=ctx.createLinearGradient(0,top,0,bottom);g.addColorStop(0,mix(pal.rock,'#d9f4e6',.22));g.addColorStop(1,mix(pal.rock,'#05121e',.35));
  ctx.fillStyle=g;
  for(const sgn of [-1,1]){const px=x+sgn*w*.38;ctx.fillRect(px-pw/2,top+h*.14,pw,h*.86);ctx.fillRect(px-pw*.8,top+h*.10,pw*1.6,h*.055);ctx.fillRect(px-pw*.75,bottom-h*.045,pw*1.5,h*.045)}
  // curved arch body (collision is the two piers plus the lintel)
  ctx.beginPath();ctx.moveTo(x-w*.46,top+h*.18);ctx.lineTo(x-w*.46,top+h*.07);ctx.quadraticCurveTo(x,top-h*.06,x+w*.46,top+h*.07);ctx.lineTo(x+w*.46,top+h*.18);ctx.quadraticCurveTo(x,top+h*.06,x-w*.46,top+h*.18);ctx.closePath();ctx.fill();
  ctx.fillStyle=mix(pal.rock,'#effff2',.25);ctx.fillRect(x-w*.07,top+h*.02,w*.14,h*.10);
  // hanging weed and glow specks
  ctx.strokeStyle=rgba('#8fe3b5',.42);ctx.lineWidth=2;
  for(let i=0;i<5;i++){const vx=x-w*.34+i*w*.17,vy=top+h*(.13+hash(p0.seed+i)*.10),ln=18+hash(p0.seed+i+2)*34;ctx.beginPath();ctx.moveTo(vx,vy);ctx.quadraticCurveTo(vx+Math.sin(game.elapsed*.8+i)*8,vy+ln*.6,vx+Math.sin(game.elapsed*.6+i)*12,vy+ln);ctx.stroke()}
 }
 prop_gate(ctx,p0,cam,pal,game){
  this.prop_arch(ctx,{...p0,w:p0.w*.98,h:p0.h},cam,pal,game);
  const x=this.sx(p0.x,cam),y=this.sy(p0.y,cam),s=p0.w*cam.scale;
  ctx.save();ctx.globalAlpha=.55;ctx.strokeStyle='#9cf6ff';ctx.lineWidth=Math.max(2,s*.018);ctx.shadowColor='#67e9ff';ctx.shadowBlur=14;
  ctx.beginPath();ctx.moveTo(x,y-s*.20);ctx.lineTo(x,y+s*.24);ctx.moveTo(x-s*.10,y-s*.11);ctx.lineTo(x,y-s*.20);ctx.lineTo(x+s*.10,y-s*.11);ctx.stroke();ctx.restore();
  ctx.save();ctx.globalAlpha=.35;ctx.fillStyle='#bafcff';ctx.font=`700 ${Math.round(s*.05)}px "Microsoft YaHei",sans-serif`;ctx.textAlign='center';ctx.fillText('深海王座',x,y+s*.30);ctx.restore();
 }
 prop_statue(ctx,p,cam,pal){statue(ctx,p,this,cam,pal)}
 prop_wreck(ctx,p0,cam,pal){
  const x=this.sx(p0.x,cam),y=this.sy(p0.y,cam),w=p0.w*cam.scale,h=p0.h*cam.scale,f=p0.flip?-1:1;
  ctx.save();ctx.translate(x,y);ctx.scale(f,1);
  ctx.fillStyle=mix(pal.rock,'#2a211c',.64);
  ctx.beginPath();ctx.moveTo(-w*.5,-h*.18);ctx.quadraticCurveTo(-w*.44,h*.30,-w*.22,h*.42);ctx.lineTo(w*.36,h*.40);ctx.quadraticCurveTo(w*.52,h*.10,w*.48,-h*.18);ctx.closePath();ctx.fill();
  ctx.fillStyle=mix(pal.rock,'#7d6146',.45);ctx.beginPath();ctx.moveTo(-w*.47,-h*.20);ctx.lineTo(w*.46,-h*.20);ctx.lineTo(w*.40,-h*.11);ctx.lineTo(-w*.42,-h*.11);ctx.closePath();ctx.fill();
  ctx.strokeStyle=rgba('#24170f',.55);ctx.lineWidth=Math.max(1,w*.008);
  for(let i=0;i<5;i++){const vx=-w*.36+i*w*.16;ctx.beginPath();ctx.moveTo(vx,-h*.10);ctx.lineTo(vx+2,h*.34);ctx.stroke()}
  ctx.fillStyle=rgba('#0d2233',.8);for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(-w*.24+i*w*.17,h*.10,w*.022,0,TAU);ctx.fill()}
  // mast and torn sail
  ctx.strokeStyle=mix(pal.rock,'#4a3928',.5);ctx.lineWidth=Math.max(2,w*.018);ctx.beginPath();ctx.moveTo(-w*.08,-h*.14);ctx.lineTo(-w*.02,-h*.88);ctx.stroke();
  ctx.fillStyle=rgba('#b9d6cf',.20);ctx.beginPath();ctx.moveTo(-w*.02,-h*.84);ctx.quadraticCurveTo(w*.30,-h*.66,w*.17,-h*.34);ctx.lineTo(-w*.02,-h*.42);ctx.closePath();ctx.fill();
  ctx.strokeStyle=rgba('#c8e8e0',.20);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(w*.46,-h*.22);ctx.lineTo(w*.26,-h*.80);ctx.stroke();
  ctx.restore();
  ctx.strokeStyle=rgba('#95e8d8',.20);ctx.lineWidth=2;
  for(let i=0;i<3;i++){const vx=x-w*.3+i*w*.28,vy=y+h*.15;ctx.beginPath();ctx.moveTo(vx,vy);ctx.lineTo(vx+5,vy+h*.20);ctx.stroke()}
 }
 prop_throne(ctx,p0,cam,pal,game){
  const x=this.sx(p0.x,cam),y=this.sy(p0.y,cam),w=p0.w*cam.scale,h=p0.h*cam.scale;
  const g=ctx.createLinearGradient(x,0,x+w,0);g.addColorStop(0,mix(pal.rock,'#020a14',.4));g.addColorStop(.5,mix(pal.rock,'#5c7f9d',.30));g.addColorStop(1,mix(pal.rock,'#020a14',.5));
  ctx.fillStyle=g;
  ctx.fillRect(x-w*.27,y-h*.36,w*.54,h*.48);
  ctx.fillRect(x-w*.42,y+h*.10,w*.84,h*.10);ctx.fillRect(x-w*.48,y+h*.24,w*.96,h*.08);
  ctx.fillRect(x-w*.30,y-h*.48,w*.10,h*.16);ctx.fillRect(x+w*.20,y-h*.48,w*.10,h*.16);
  // tall back spires with the tide crown
  ctx.beginPath();ctx.moveTo(x-w*.26,y-h*.36);ctx.lineTo(x-w*.12,y-h*.52);ctx.lineTo(x,y-h*.40);ctx.lineTo(x+w*.12,y-h*.52);ctx.lineTo(x+w*.26,y-h*.36);ctx.closePath();ctx.fill();
  ctx.save();ctx.globalAlpha=.5;ctx.strokeStyle='#8ff2ff';ctx.lineWidth=Math.max(2,w*.012);ctx.shadowColor='#61e4ff';ctx.shadowBlur=16;
  ctx.beginPath();ctx.moveTo(x,y-h*.32);ctx.lineTo(x,y-h*.04);ctx.moveTo(x-w*.10,y-h*.19);ctx.lineTo(x,y-h*.32);ctx.lineTo(x+w*.10,y-h*.19);ctx.stroke();ctx.restore();
  ctx.strokeStyle=rgba('#9fe7cd',.25);ctx.lineWidth=2;
  for(let i=0;i<4;i++){const vx=x-w*.32+i*w*.2,vy=y-h*.10;ctx.beginPath();ctx.moveTo(vx,vy);ctx.quadraticCurveTo(vx+6,vy+h*.12,vx+2,vy+h*.24);ctx.stroke()}
 }
 prop_steps(ctx,p0,cam,pal){
  const x=this.sx(p0.x,cam),y=this.sy(p0.y,cam),w=p0.w*cam.scale,h=p0.h*cam.scale;
  ctx.fillStyle=mix(pal.rock,'#081724',.22);ctx.fillRect(x-w/2,y-h/2,w,h);
  ctx.strokeStyle=rgba('#b6ead4',.14);ctx.lineWidth=1.4;
  for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(x-w/2+i*w*.08,y-h/2+i*h/4);ctx.lineTo(x+w/2-i*w*.08,y-h/2+i*h/4);ctx.stroke()}
 }
 prop_kelp(ctx,p0,cam,pal,game){
  const x=this.sx(p0.x,cam),y=this.sy(p0.y,cam),s=p0.w*cam.scale,h=p0.h*cam.scale;
  const base=y+h/2;
  ctx.save();ctx.strokeStyle=rgba('#4fb98e',.5);ctx.lineCap='round';
  for(let i=0;i<5;i++){
   const bx=x+(i-2)*s*.22,ln=h*(.7+hash(p0.seed+i)*.45),wob=Math.sin(game.elapsed*.75+i*1.8+p0.seed*6)*s*.30;
   ctx.lineWidth=Math.max(2,s*.055);ctx.beginPath();ctx.moveTo(bx,base);ctx.quadraticCurveTo(bx+wob,base-ln*.55,bx+wob*.7,base-ln);ctx.stroke();
   ctx.fillStyle=rgba('#7fd9a6',.28);
   for(let k=1;k<4;k++){const lx=bx+wob*.4,ly=base-ln*k*.25,dir=k%2?1:-1;ctx.beginPath();ctx.moveTo(lx,ly);ctx.quadraticCurveTo(lx+dir*s*.48,ly-ln*.16,lx+dir*s*.35,ly-ln*.24);ctx.quadraticCurveTo(lx+dir*s*.06,ly-ln*.18,lx,ly);ctx.fill()}
  }
  ctx.restore();
 }
 prop_anchor(ctx,p0,cam,pal,game){
  const x=this.sx(p0.x,cam),y=this.sy(p0.y,cam),s=p0.w*cam.scale,h=p0.h*cam.scale;
  ctx.save();ctx.strokeStyle=rgba('#7d98a6',.38);ctx.lineWidth=Math.max(2,s*.03);
  for(let i=0;i<10;i++){const yy=y-h/2+i*h*.10;ctx.beginPath();ctx.ellipse(x+Math.sin(i*.7+game.elapsed*.4)*6,yy,s*.055,s*.09,0,0,TAU);ctx.stroke()}
  ctx.strokeStyle=rgba('#a6c1c9',.55);ctx.lineWidth=s*.07;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+s*.55);ctx.moveTo(x-s*.26,y+s*.34);ctx.quadraticCurveTo(x,y+s*.62,x+s*.26,y+s*.34);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y-s*.10,s*.13,0,TAU);ctx.stroke();ctx.restore();
 }
 prop_vent(ctx,p0,cam,pal,game){
  const x=this.sx(p0.x,cam),y=this.sy(p0.y,cam),s=p0.w*cam.scale;
  blob(ctx,x,y+s*.3,s*.8,s*.34,6,p0.seed,mix(pal.rock,'#0a1822',.3));
  ctx.save();ctx.strokeStyle=rgba('#bff8ff',.5);ctx.lineWidth=2;
  for(let i=0;i<5;i++){const t=(game.elapsed*.35+i*.23)%1,by=y-t*s*1.4,bx=x+Math.sin(t*8+i)*s*.22;ctx.globalAlpha=(1-t)*.45;ctx.beginPath();ctx.arc(bx,by,s*(.05+t*.05),0,TAU);ctx.stroke()}
  ctx.restore();
 }
 drawItems(ctx,game,cam){
  for(const item of game.world.items){const x=this.sx(item.x,cam),y=this.sy(item.y,cam),r=Math.max(8,item.r*cam.scale);if(x<-80||x>this.v.w+80)continue;
   const t=game.elapsed,active=item.state==='ready',pulse=1+Math.sin(t*3+item.x)*.08;
   ctx.save();ctx.translate(x,y);ctx.globalAlpha=active?1:.38;ctx.shadowColor=item.kind==='chest'?'#ffd777':'#8fffee';ctx.shadowBlur=active?18:0;
   ctx.fillStyle=item.kind==='chest'?'#b98b50':item.kind==='tablet'?'#558488':item.kind==='spring'?'#72dce9':'#e4dfac';
   if(item.kind==='pearl'){ctx.beginPath();ctx.ellipse(0,r*.2,r*.8,r*.52,0,0,TAU);ctx.fill();ctx.fillStyle='#fff9d5';ctx.beginPath();ctx.arc(0,-r*.25,r*.46,0,TAU);ctx.fill()}
   else if(item.kind==='spring'){for(let i=0;i<5;i++){const yy=r*.7-((t*.9+i*.22)%1)*r*2;ctx.beginPath();ctx.arc(Math.sin(t+i)*r*.3,yy,r*(.13+i*.02),0,TAU);ctx.strokeStyle='#c9ffff';ctx.lineWidth=2;ctx.stroke()}ctx.fillRect(-r*.7,r*.42,r*1.4,r*.28)}
   else if(item.kind==='tablet'){ctx.fillRect(-r*.65,-r,r*1.3,r*2);ctx.strokeStyle='#b3ecda';ctx.lineWidth=2;ctx.strokeRect(-r*.65,-r,r*1.3,r*2);ctx.beginPath();ctx.moveTo(0,-r*.55);ctx.lineTo(r*.3,0);ctx.lineTo(0,r*.45);ctx.lineTo(-r*.3,0);ctx.closePath();ctx.stroke()}
   else if(item.kind==='chest'){ctx.fillRect(-r,-r*.35,r*2,r*1.2);ctx.fillStyle='#e4bb75';ctx.fillRect(-r,-r*.48,r*2,r*.27);ctx.fillRect(-r*.12,-r*.48,r*.24,r*1.2)}
   else{ctx.beginPath();for(let i=0;i<6;i++){const a=i*TAU/6-Math.PI/2,px=Math.cos(a)*r*pulse,py=Math.sin(a)*r*pulse;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();ctx.fill();ctx.fillStyle='#fff9ce';ctx.beginPath();ctx.arc(0,0,r*.38,0,TAU);ctx.fill()}
   ctx.restore();if(active){ctx.save();ctx.fillStyle='#f0ffff';ctx.font='600 11px "Microsoft YaHei",sans-serif';ctx.textAlign='center';ctx.fillText(item.name,x,y-r-12);if(item.progress>0){ctx.fillStyle='#9ffff0';ctx.fillRect(x-r,y+r+7,r*2*item.progress/.65,3)}ctx.restore()}
  }
 }
 // --- creatures ----------------------------------------------------------
 drawCreatures(ctx,game,cam){
  const list=game.world.creatures.filter(c=>!c.eaten).map(c=>({y:c.y,kind:'c',c}));
  list.push({y:game.player.y,kind:'p'});
  list.sort((a,b)=>a.y-b.y);
  for(const row of list){const sx=this.sx(row.kind==='p'?game.player.x:row.c.x,cam);if(sx<-300||sx>this.v.w+300)continue;if(row.kind==='p')this.drawPlayer(ctx,game,cam);else this.drawCreature(ctx,row.c,game,cam)}
 }
 drawCreature(ctx,c,game,cam){
  const x=this.sx(c.x,cam),y=this.sy(c.y,cam),s=c.r*cam.scale;
  ctx.save();ctx.translate(x,y);ctx.scale(c.facing,1);
  const t=game.elapsed;
  creatureArt(ctx,c,s,t);
  ctx.restore();
  if(c.state==='alert'||c.state==='chase'){
   ctx.save();ctx.globalAlpha=.85;ctx.strokeStyle=c.state==='chase'?'#ff7b6e':'#ffd27a';ctx.lineWidth=2.4;
   const pulse=1+Math.sin(t*10+c.phase)*.08;ctx.beginPath();ctx.arc(x,y,s*1.35*pulse,0,TAU);ctx.stroke();
   ctx.fillStyle=c.state==='chase'?'#ffb1a6':'#ffe6a3';ctx.font=`700 ${Math.max(11,Math.round(s*.55))}px "Segoe UI",sans-serif`;ctx.textAlign='center';ctx.fillText(c.state==='chase'?'!':'?',x,y-s*1.5);ctx.restore();
  }
 }
 drawPlayer(ctx,game,cam){
  const pl=game.player,x=this.sx(pl.x,cam),y=this.sy(pl.y,cam),r=pl.radius*cam.scale;
  const t=game.elapsed,speed=Math.hypot(game.velocity.x,game.velocity.y),tail=Math.sin(t*(5+speed*.012))*.16,chomp=Math.max(game.dashRemaining>0?Math.min(1,game.dashRemaining*3):0,...game.effects.filter(e=>e.kind==='eat'&&e.age<.24).map(e=>Math.sin(e.age/.24*Math.PI)));
  ctx.save();ctx.translate(x,y);
  const blink=game.invuln>0? .55+.35*Math.sin(t*28):1;
  ctx.globalAlpha=blink;
  ctx.scale(pl.facing,1);
  ctx.rotate(clamp(game.velocity.y/game.config.speed*.18,-.28,.28));
  // dash bubbles
  if(game.dashRemaining>0){ctx.save();ctx.globalAlpha=.35;ctx.fillStyle='#d9fbff';for(let i=0;i<4;i++){const bx=-r*(1.3+i*.6),by=r*.2+Math.sin(t*14+i)*r*.25;ctx.beginPath();ctx.arc(bx,by,r*(.10+i*.02),0,TAU);ctx.fill()}ctx.restore()}
  if(game.stage<2)this.drawGoldfish(ctx,r,t,tail,chomp);
  else this.drawLeviathan(ctx,r,t,tail,chomp);
  ctx.restore();
  if(game.invuln>0){ctx.save();ctx.globalAlpha=.28;ctx.strokeStyle='#bff8ff';ctx.lineWidth=2;ctx.setLineDash([6,7]);ctx.beginPath();ctx.arc(x,y,r*1.28,0,TAU);ctx.stroke();ctx.restore()}
  if(game.hitFlash>0){ctx.save();ctx.globalAlpha=Math.min(.35,game.hitFlash*.6);ctx.fillStyle='#ff8c7d';ctx.beginPath();ctx.arc(x,y,r*1.1,0,TAU);ctx.fill();ctx.restore()}
 }
 drawGoldfish(ctx,r,t,tail,chomp){goldfish(ctx,r,t,tail,chomp)}
 drawLeviathan(ctx,r,t,tail,chomp){seaBeast(ctx,r,t,tail,chomp)}
 drawEffects(ctx,game,cam){
  for(const e of game.effects){
   const x=this.sx(e.x,cam),y=this.sy(e.y,cam),k=e.age/e.life;
   ctx.save();ctx.globalAlpha=Math.max(0,1-k);
   if(e.kind==='eat'){ctx.strokeStyle='#ffe9a0';ctx.lineWidth=2.5;for(let i=0;i<8;i++){const a=i/8*TAU,d=e.size*(.3+k*1.3);ctx.beginPath();ctx.moveTo(x+Math.cos(a)*d*.5,y+Math.sin(a)*d*.5);ctx.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d);ctx.stroke()}ctx.fillStyle='#fff3c2';ctx.font='700 13px "Segoe UI",sans-serif';ctx.textAlign='center';ctx.fillText('+'+(e.gain??Math.round(e.size)),x,y-18-k*12)}
   else if(e.kind==='evolve'){ctx.strokeStyle='#ffe9a0';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,e.size*(.6+k*1.5),0,TAU);ctx.stroke();ctx.globalAlpha*=.6;ctx.beginPath();ctx.arc(x,y,e.size*(.4+k*.9),0,TAU);ctx.stroke()}
   else if(e.kind==='hit'){ctx.fillStyle='#ff8b7b';ctx.beginPath();ctx.arc(x,y,e.size*(.4+k*.9),0,TAU);ctx.fill()}
   else if(e.kind==='bubble'){ctx.strokeStyle='#d9fbff';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(x,y,e.size*(1+k),0,TAU);ctx.stroke()}
   ctx.restore();
  }
 }
 drawForeground(ctx,game,cam,w,h){
  const p=this.palette(game);
  // near kelp and reef fingers, deliberately in front of the swimmer
  ctx.save();ctx.globalAlpha=.5;
  for(let i=0;i<9;i++){
   const wx=((i*760)%(SEA_WORLD.width+300))-150,sx=this.parallaxX(wx,cam,1.22),base=this.sy(SEA_WORLD.floorY+30,cam);
   if(sx<-100||sx>w+100)continue;
   ctx.strokeStyle=mix(p.rock,'#071420',.55);ctx.lineCap='round';
   for(let k=0;k<3;k++){const sway=Math.sin(game.elapsed*.65+i+k)*22;ctx.lineWidth=5-k;ctx.beginPath();ctx.moveTo(sx+k*12,base);ctx.quadraticCurveTo(sx+sway,base-90,sx+sway*1.4,base-190-k*22);ctx.stroke()}
  }
  ctx.restore();
  // ambient rising bubbles
  ctx.save();ctx.strokeStyle='rgba(210,255,255,.32)';ctx.lineWidth=1.4;
  for(let i=0;i<16;i++){const t=(game.elapsed*.10+i*.137)%1,bx=((hash(i*3.1)*SEA_WORLD.width-game.elapsed*7)%SEA_WORLD.width+SEA_WORLD.width)%SEA_WORLD.width,by=SEA_WORLD.floorY-t*820,br=2+hash(i*7.7)*5;const sx=this.sx(bx,cam),sy=this.sy(by,cam);if(sx<-10||sx>w+10)continue;ctx.beginPath();ctx.arc(sx,sy,br,0,TAU);ctx.stroke()}
  ctx.restore();
 }
 drawVignette(ctx,w,h){
  const g=ctx.createRadialGradient(w*.5,h*.46,Math.min(w,h)*.28,w*.5,h*.5,Math.max(w,h)*.75);
  g.addColorStop(0,'rgba(2,10,20,0)');g.addColorStop(.72,'rgba(2,10,20,.16)');g.addColorStop(1,'rgba(1,6,14,.52)');
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  // subtle top and bottom letterboxing into deep water
  const top=ctx.createLinearGradient(0,0,0,h*.16);top.addColorStop(0,'rgba(5,30,44,.26)');top.addColorStop(1,'rgba(5,30,44,0)');ctx.fillStyle=top;ctx.fillRect(0,0,w,h*.16);
 }
}
// Keep the authored stage radii available to browser diagnostics without another import.
export const SEA_RADII=SEA_STAGE_RADIUS;
