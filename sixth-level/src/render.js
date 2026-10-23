import {RULES,BY_ID,VERSION} from './content.js';
export const PREVIEW_IDS=['01-grape','06-tomato','model-4','11-watermelon'];
export function previewTargets(width,height){return PREVIEW_IDS.map((id,i)=>({type:BY_ID[id],x:width*(.16+i*.23),y:height*.75,r:BY_ID[id].r,angle:0}));}
export function stainOpacity(age){return .30*Math.max(0,Math.min(1,(RULES.stainLifetime-age)/3));}
export class Renderer{
 constructor(canvas,sprites){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.sprites=sprites;this.trail=[];this.pops=[];this.flash=0;}
 resize(width,height){this.width=width;this.height=height;this.dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(width*this.dpr);this.canvas.height=Math.round(height*this.dpr);this.trail=[];}
 point(p,time){this.trail.push({...p,time});if(this.trail.length>50)this.trail.shift();}
 event(e){if(e.kind==='cut')this.pops.push({...e,text:'+'+e.points,age:0});if(e.kind==='combo')this.pops.push({...e,text:`${e.count} 连斩 +${e.bonus}`,age:0,combo:true});if(e.kind==='bomb'){this.flash=.3;this.pops.push({...e,text:'−50',penalty:true,age:0});}}
 clear(){this.trail=[];this.pops=[];this.flash=0;}
 background(ctx,w,h){
  const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#cbb18b');g.addColorStop(.48,'#e5cfa7');g.addColorStop(1,'#c6a983');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  for(let i=0;i<9;i++){const x=i*w/8;ctx.fillStyle=i%2?'#98754b0c':'#fff2d011';ctx.fillRect(x,0,w/8,h);ctx.strokeStyle='#8d70442b';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  ctx.save();ctx.globalAlpha=.16;ctx.strokeStyle='#7a5c36';for(let i=0;i<65;i++){const x=(Math.sin(i*77.1)*.5+.5)*w,y=(Math.sin(i*19.7)*.5+.5)*h;ctx.beginPath();ctx.ellipse(x,y,1.5+(i%4),45+i%35,0,0,Math.PI*2);ctx.stroke();}ctx.restore();
  ctx.save();ctx.translate(w*.5,h*.42);ctx.strokeStyle='#8f704328';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,Math.min(w*.28,h*.24),0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,Math.min(w*.28,h*.24)-10,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#9f7e4824';ctx.font=`${Math.min(w*.22,h*.2)}px Georgia,Microsoft YaHei`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('切',0,0);ctx.restore();
  const v=ctx.createRadialGradient(w/2,h*.4,Math.min(w,h)*.1,w/2,h/2,Math.max(w,h)*.8);v.addColorStop(0,'#00000000');v.addColorStop(1,'#49372035');ctx.fillStyle=v;ctx.fillRect(0,0,w,h);
 }
 stain(ctx,s){
  const opacity=stainOpacity(s.age);if(opacity<=0)return;
  const noise=i=>{const v=Math.sin(s.seed*71.73+i*37.19)*43758.5453;return v-Math.floor(v);};
  ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.angle);ctx.globalAlpha=opacity;
  const points=Array.from({length:15},(_,i)=>{const a=i/15*Math.PI*2,r=s.r*(.55+noise(i)*.7);return{x:Math.cos(a)*r*1.15,y:Math.sin(a)*r*.72};});
  ctx.fillStyle='#efbd16';ctx.beginPath();ctx.moveTo((points[14].x+points[0].x)/2,(points[14].y+points[0].y)/2);
  for(let i=0;i<15;i++){const a=points[i],b=points[(i+1)%15];ctx.quadraticCurveTo(a.x,a.y,(a.x+b.x)/2,(a.y+b.y)/2);}ctx.closePath();ctx.fill();
  for(let i=0;i<11;i++){const a=noise(i+20)*Math.PI*2,d=s.r*(1.1+noise(i+40)*1.45),r=s.r*(.035+noise(i+60)*.1);ctx.beginPath();ctx.ellipse(Math.cos(a)*d,Math.sin(a)*d*.8,r*1.4,r,a,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=opacity*.55;ctx.fillStyle='#fff7ba';ctx.beginPath();ctx.ellipse(-s.r*.28,-s.r*.22,s.r*.22,s.r*.045,-.3,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 bomb(ctx,o){
  const r=o.r,g=ctx.createRadialGradient(-r*.3,-r*.35,r*.1,0,0,r);g.addColorStop(0,'#52615a');g.addColorStop(1,'#1b2824');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e4b576';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,-r+3);ctx.quadraticCurveTo(3,-r-24,15,-r-18);ctx.stroke();ctx.fillStyle='#fff5aa';ctx.beginPath();ctx.arc(16,-r-18,5+Math.sin(o.angle*8)*2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#eb9972';ctx.font=`bold ${r*.82}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('!',0,1);
 }
 target(ctx,o){ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.angle);ctx.shadowColor='#715c4b44';ctx.shadowBlur=8;ctx.shadowOffsetY=6;if(o.type.group==='bomb')this.bomb(ctx,o);else this.sprites.draw(ctx,o);ctx.restore();if(o.type.rare){ctx.save();ctx.fillStyle='#fff7d0';ctx.font='18px sans-serif';ctx.fillText('✦',o.x+o.r*.8,o.y-o.r*.8);ctx.restore();}}
 split(ctx,e){
  if(e.type.group==='bomb'){ctx.save();ctx.globalAlpha=Math.max(0,1-e.age*2);ctx.strokeStyle='#fff0b4';ctx.lineWidth=10*(1-e.age);ctx.beginPath();ctx.arc(e.x,e.y,e.r+e.age*200,0,Math.PI*2);ctx.stroke();ctx.restore();return;}
  const n={x:-Math.sin(e.cutAngle),y:Math.cos(e.cutAngle)},local=e.cutAngle-e.angle,t=e.age;
  for(const side of [-1,1]){ctx.save();ctx.globalAlpha=Math.max(0,1-t/.85);ctx.translate(e.x+n.x*side*t*100,e.y+n.y*side*t*100);ctx.rotate(e.angle+(e.spin+side*1.6)*t);ctx.save();ctx.rotate(local);ctx.beginPath();ctx.rect(-e.r*2,(e.cutOffset||0)+(side<0?-e.r*2:0),e.r*4,e.r*2);ctx.clip();ctx.rotate(-local);this.sprites.draw(ctx,e);ctx.restore();ctx.restore();}
  for(let k=0;k<12;k++){const a=k*2.399+e.cutAngle,d=30+140*t*(.4+(k%4)*.25),x=e.x+Math.cos(a)*d,y=e.y+Math.sin(a)*d;ctx.save();ctx.globalAlpha=Math.max(0,1-t/.7);ctx.fillStyle=k%3===0?'#fff0c6':e.type.color;ctx.translate(x,y);ctx.rotate(a+t*3);if(e.type.group==='model'){ctx.font=(8+k%3*3)+'px sans-serif';ctx.fillText('✦',0,0);}else{ctx.beginPath();ctx.ellipse(0,0,3+k%3,2+k%2,a,0,Math.PI*2);ctx.fill();}ctx.restore();}
 }
 render(g,dt=0){
  const ctx=this.ctx,sx=this.canvas.width/g.width,sy=this.canvas.height/g.height;ctx.setTransform(sx,0,0,sy,0,0);this.background(ctx,g.width,g.height);
  if(g.phase==='ready'){
   for(const p of previewTargets(g.width,g.height))this.target(ctx,p);
  }
  for(const s of g.stains)this.stain(ctx,s);
  for(const o of g.objects)this.target(ctx,o);for(const e of g.effects)this.split(ctx,e);
  if(g.phase==='playing'){this.pops.forEach(p=>p.age+=dt);this.pops=this.pops.filter(p=>p.age<.85);this.flash=Math.max(0,this.flash-dt);}
  for(const p of this.pops){ctx.save();ctx.globalAlpha=1-p.age/.85;ctx.font=`bold ${p.combo?34:p.penalty?32:27}px Microsoft YaHei`;ctx.textAlign='center';ctx.strokeStyle=p.penalty?'#fff6dd':'#365040';ctx.lineWidth=4;ctx.fillStyle=p.penalty?'#b33b26':p.combo?'#fff1aa':'#fff9e2';const y=p.y-(p.combo?100:40)-p.age*70;ctx.strokeText(p.text,p.x,y);ctx.fillText(p.text,p.x,y);ctx.restore();}
  this.trail=this.trail.filter(p=>g.elapsed-p.time<.16);if(this.trail.length>1){ctx.save();ctx.lineCap=ctx.lineJoin='round';ctx.shadowColor='#fff9c6';ctx.shadowBlur=14;for(let i=1;i<this.trail.length;i++){const a=this.trail[i-1],b=this.trail[i];ctx.strokeStyle='#fffbe5';ctx.lineWidth=2+7*i/this.trail.length;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.restore();}
  if(this.flash){ctx.fillStyle=`rgba(255,144,88,${this.flash*.7})`;ctx.fillRect(0,0,g.width,g.height);}
  ctx.save();ctx.font='14px system-ui';ctx.textAlign='right';ctx.fillStyle='#634e38';ctx.fillText('v'+VERSION,g.width-18,25);ctx.restore();
 }
}
