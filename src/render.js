import {drawInteraction} from './interactions.js';
import {drawResident} from './residents.js';
import {drawSweetShadow} from './sweet-street.js';
import {MAP_BOUNDS} from './game.js';
import {SURFACE,roadsForBounds,itemDistrictOpen} from './terrain.js';
import {rotate} from './rolling.js';
import {characterMesh} from './character-mesh.js';
import {CharacterGPU} from './character-gpu.js';
import {drawItem,drawKingdom} from './kingdom.js';
const hex=s=>{const n=parseInt(s.slice(1),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]};
// Temporary, dependency-free WebGL renderer. Gameplay can later drive an engine adapter.
export class Renderer{
 constructor(canvas,{alpha=false}={}){
  this.canvas=canvas;this.gl=canvas.getContext('webgl',{antialias:true,alpha});if(!this.gl)throw Error('WebGL unavailable');const gl=this.gl;
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
  const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,'attribute vec3 aPosition;attribute vec4 aColor;uniform mat4 uMatrix;varying vec4 vColor;void main(){gl_Position=uMatrix*vec4(aPosition,1.0);vColor=aColor;}'));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec4 vColor;void main(){gl_FragColor=vColor;}'));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));gl.useProgram(p);
  this.program=p;this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
  for(const [name,offset,size] of [['aPosition',0,3],['aColor',12,4]]){const a=gl.getAttribLocation(p,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,28,offset)}
  this.uniform=gl.getUniformLocation(p,'uMatrix');gl.enable(gl.DEPTH_TEST);this.camera={x:0,z:0};this.span=100;this.vertices=[];this.particles=[];this.tick=0;
  this.characterGPU=new CharacterGPU(gl);
 }
 drawCharacter(game,matrix=this.viewMatrix){
  const gl=this.gl;this.lastCharacterBounds=this.characterGPU.draw(game,matrix);
  gl.useProgram(this.program);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
  for(let i=0;i<3;i++)gl.disableVertexAttribArray(i);
  for(const [name,offset,size]of [['aPosition',0,3],['aColor',12,4]]){const a=gl.getAttribLocation(this.program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,28,offset)}
 }
 cube(x,y,z,w,h,d,color){
  const p=[[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y+h,z-d/2],[x-w/2,y+h,z-d/2],[x-w/2,y,z+d/2],[x+w/2,y,z+d/2],[x+w/2,y+h,z+d/2],[x-w/2,y+h,z+d/2]];
  this.box(p,color);
 }
 box(p,color){
  const c=typeof color==='string'?hex(color):color,alpha=this.opacity??1,v=alpha<1?this.transparent:this.vertices;
  for(const [face,light] of [[[0,1,2,3],.79],[[5,4,7,6],.93],[[4,0,3,7],.7],[[1,5,6,2],.85],[[3,2,6,7],1.06]])for(const k of [0,1,2,0,2,3])v.push(...p[face[k]],...c.map(n=>Math.min(n*light,1)),alpha);
 }
 project(x,y,z){
  if(!this.viewMatrix)return null;const m=this.viewMatrix;
  return {x:(1+m[0]*x+m[4]*y+m[8]*z+m[12])*innerWidth/2,y:(1-m[1]*x-m[5]*y-m[9]*z-m[13])*innerHeight/2};
 }
 ground(x,z,w,d,color,top=SURFACE.grass){
  // Ground is a planar paint layer, never an overlapping thin box with side faces.
  const c=(typeof color==='string'?hex(color):color).map(v=>Math.min(v*1.06,1));
  const p=[[x-w/2,top,z-d/2],[x+w/2,top,z-d/2],[x+w/2,top,z+d/2],[x-w/2,top,z+d/2]],vertices=[];
  for(const n of [0,1,2,0,2,3])vertices.push(...p[n],...c,1);
  (this.groundPatches??=[]).push({top,vertices});
 }
 drawGround(){
  const gl=this.gl,vertices=[];
  // Stable height order determines the surface, even on 16-bit depth hardware.
  for(const patch of this.groundPatches.slice().sort((a,b)=>a.top-b.top))vertices.push(...patch.vertices);
  gl.depthMask(true);gl.depthFunc(gl.ALWAYS);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,vertices.length/7);
  gl.depthFunc(gl.LESS);this.lastGroundVertices=vertices.length/7;
 }
 dashTrailFor(game){
  if(game.state!=='playing'||game.dashCount===0){this.dashTrail=[];return}
  this.dashTrail??=[];this.dashTrail=this.dashTrail.filter(p=>game.elapsed>=p.at&&game.elapsed-p.at<.25);
  const last=this.dashTrail[this.dashTrail.length-1];
  if(game.dashRemaining>0&&(!last||Math.hypot(last.x-game.player.x,last.z-game.player.z)>game.config.radius*.15))this.dashTrail.push({x:game.player.x,z:game.player.z,at:game.elapsed,r:game.config.radius});
  if(this.dashTrail.length>12)this.dashTrail.shift();
  for(const p of this.dashTrail){const life=1-(game.elapsed-p.at)/.25;this.opacity=life*.38;this.cube(p.x,SURFACE.shadow+.025,p.z,p.r*.9,.06,p.r*.9,'#f1c87c')}
  this.opacity=1;
 }
 burst(x,z,color){for(let i=0;i<12;i++)this.particles.push({x,z,y:.8,vx:Math.cos(i*2.4)*(1+i%3),vz:Math.sin(i*2.4)*(1+i%3),vy:3+i%3,life:1,color})}
 character(game){
  const q=game.roll,mesh=characterMesh(game.stage),r=game.config.radius,floor=SURFACE.shadow+.008;
  const hop=game.bounceTime>0?Math.sin(Math.PI*game.bounceTime/.6)*3:0,t=game.transition,phase=t?(t.switched?Math.min(1,(t.elapsed-1.1)/.9):Math.min(1,t.elapsed/1.1)):0,scale=t?(t.switched?.05+phase*.95:1-phase*.95):1,rise=t&&!t.switched?phase*2:0,angle=t?t.elapsed*9:0;
  const cx=t&&!t.switched?t.start.x+(t.origin.x-t.start.x)*phase:game.player.x,cz=t&&!t.switched?t.start.z+(t.origin.z-t.start.z)*phase:game.player.z,center=floor+r+hop+rise;
  let minY=Infinity,maxY=-Infinity;
  for(let i=0;i<mesh.positions.length;i+=3){
   const p=rotate(q,[mesh.positions[i],mesh.positions[i+1],mesh.positions[i+2]]),n=rotate(q,[mesh.normals[i],mesh.normals[i+1],mesh.normals[i+2]]);
   const light=.60+.12*(n[1]*.5+.5)+.30*Math.max(0,-n[0]*.40+n[1]*.78+n[2]*.48),specular=.14*Math.pow(Math.max(0,-n[0]*.22+n[1]*.58+n[2]*.78),20);
   const shade=[0,1,2].map(k=>Math.min(1,Math.pow(Math.pow(mesh.colors[i+k],2.2)*light+specular,1/2.2)));
   const y=center+p[1]*r*scale;minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   this.vertices.push(cx+(p[0]*Math.cos(angle)-p[2]*Math.sin(angle))*r*scale,y,cz+(p[0]*Math.sin(angle)+p[2]*Math.cos(angle))*r*scale,...shade,1);
  }
  this.lastCharacterBounds={minY:floor+hop+rise,maxY,visualMinY:minY,colliderRadius:r,triangles:mesh.positions.length/9};

 }
 model(item,game){
  const t=item.type;if(item.state==='eaten')return;const progress=item.state==='eating'?item.progress:0,s=1-progress*.75;
  const x=item.x+(game.player.x-item.x)*progress*.4,z=item.z+(game.player.z-item.z)*progress*.4,y=progress*1.5,r=t.r*s,h=t.h*s;
  if(item.streetSample)drawSweetShadow(this,item);
  const eligible=game.canAccessItem(item);
  // Low-profile ground markers encode availability without obscuring the model.
  if(Math.hypot(x-game.player.x,z-game.player.z)<9){
   const color=eligible?'#91c0a0':'#e3b876';
   if(item.shopStyle!==undefined){for(const a of [-1,1])for(const b of [-1,1])this.ground(x+a*r*.88,z+b*r*.88,.22,.22,color,SURFACE.marker)}
   else this.ground(x,z,r*2+.15,r*2+.15,color,SURFACE.marker);
  }
  const c=t.color,dx=x-game.player.x,dz=z-game.player.z,screenX=(dx-dz)*.707,screenY=-(dx+dz)*.408;
  this.opacity=t.h>1.5&&dx+dz>0&&Math.abs(screenX)<r*1.5+game.config.radius&&screenY<game.config.radius*1.6&&screenY+h*.816>0?.28:1;
  if(!game.world&&!itemDistrictOpen(item,game.stage+1))this.opacity=Math.min(this.opacity,.35);
  if(item.spirit){this.cube(x,y+.4+Math.sin(game.elapsed*4+item.id)*.1,z,r*2,h,r*2,'#d9efb2');this.opacity=1;return;}
  const ride=item.rideId===undefined?null:game.interactions?.find(p=>p.id===item.rideId);drawItem(this,item,ride?{player:game.player,elapsed:ride.rideTime}:game);
  this.opacity=1;
 }
 render(game,dt){
  if(this.renderedGame!==game){this.renderedGame=game;this.sceneryBounds=NaN;this.sceneRevision=null;}
  if(game.state==='paused')dt=0;
  const gl=this.gl,dpr=Math.min(devicePixelRatio||1,1.6),w=Math.round(innerWidth*dpr),h=Math.round(innerHeight*dpr);if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;gl.viewport(0,0,w,h)}
  this.tick+=dt;const ready=game.state==='ready',follow=1-Math.exp(-dt*3);const targetSpan=game.transition?(game.transition.switched?9+Math.min(1,(game.transition.elapsed-1.1)/.9)*16:41-Math.min(1,game.transition.elapsed/1.1)*32):ready?(game.world?Math.max(game.extent.maxX-game.extent.minX,game.extent.maxZ-game.extent.minZ)+18:62):(innerHeight<510?16:25)+game.stage*4;this.span+=(targetSpan-this.span)*follow;
  // Screen basis: right=(.707,0,-.707), up=(-.408,.816,-.408).
  const offset=ready?14:0,tx=ready?(game.world?(game.extent.minX+game.extent.maxX)/2:-2):game.transition&&!game.transition.switched?game.transition.origin.x:game.player.x,tz=ready?(game.world?(game.extent.minZ+game.extent.maxZ)/2:0):game.transition&&!game.transition.switched?game.transition.origin.z:game.player.z;
  this.camera.x+=(tx-this.camera.x)*follow;this.camera.z+=(tz-this.camera.z)*follow;
  if(game.transition?.switched&&this.sceneRevision!==game.sceneRevision){this.camera={...game.player};this.span=12}
  const aspect=w/h,S=this.span/2,c=.70710678,a=.40824829,b=.81649658,ox=offset/aspect;
  const cx=this.camera.x,cz=this.camera.z;
  const depthRange=game.world?300:100;
  const matrix=new Float32Array([c/(S*aspect),-a/S,-.577/depthRange,0,0,b/S,-.577/depthRange,0,-c/(S*aspect),-a/S,-.577/depthRange,0,(-c*cx+c*cz+ox)/(S*aspect),(a*cx+a*cz)/S,0,1]);
  if(this.sceneRevision!==game.sceneRevision){this.particles=[];this.dashTrail=[];this.sceneRevision=game.sceneRevision}
  this.viewMatrix=matrix;gl.uniformMatrix4fv(this.uniform,false,matrix);gl.clearColor(.72,.85,.91,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);this.vertices=[];this.transparent=[];this.groundPatches=[];this.opacity=1;
  const bounds=game.bounds,side=bounds*2;
  if(this.sceneryBounds!==bounds||this.sceneryStage!==game.stage||this.sceneryOpen!==game.openAreas||this.sceneryExpansion!==game.expansion?.elapsed||this.sceneryRevision!==game.sceneRevision){drawKingdom(this,game);this.sceneryCache=this.vertices.slice();this.sceneryGroundCache=this.groundPatches.slice();this.sceneryBounds=bounds;this.sceneryStage=game.stage;this.sceneryOpen=game.openAreas;this.sceneryExpansion=game.expansion?.elapsed;this.sceneryRevision=game.sceneRevision}
  else{this.vertices=this.sceneryCache.slice();this.groundPatches=(this.sceneryGroundCache||[]).slice();}
  for(const i of game.items){if(game.world&&!game.isIntroduced(i))continue;const dx=i.x-cx,dz=i.z-cz,viewX=(dx-dz)*c,viewY=-(dx+dz)*a;if(Math.abs(viewX)>S*aspect+i.type.r*2||viewY>S+i.type.r*2||viewY<-S-i.type.h)continue;this.model(i,game);this.opacity=1}
  for(const prop of game.interactions||[]){drawInteraction(this,prop,game)}
  for(const n of game.residents||[]){
   const dx=n.x-cx,dz=n.z-cz;if(Math.abs((dx-dz)*c)>S*aspect+1||Math.abs(-(dx+dz)*a)>S+2)continue;
   drawResident(this,n,game);
  }
  const p=game.player,r=game.config.radius;
  this.dashTrailFor(game);
  this.ground(p.x,p.z,r*2.4,r*2,'#91a68b',SURFACE.shadow);
  if(game.transition){const t=game.transition,p=t.switched?game.player:t.origin;this.ground(p.x,p.z,4,4,'#bad7e6',.095);this.opacity=.72;for(let n=0;n<24;n++){const a=n*Math.PI/12+t.elapsed*5,rr=1.6+Math.sin(n+t.elapsed*7)*.25;this.cube(p.x+Math.cos(a)*rr,.25+(n%3)*.18,p.z+Math.sin(a)*rr,.22,.35,.22,n%2?'#c6a7e5':'#a3e0de')}this.opacity=1}
  if(game.world&&game.inWater()&&game.bounceTime<=0){
   const phase=(game.elapsed*2)%1;
   for(const a of [-1,1]){this.ground(p.x+a*r*(.8+phase*.7),p.z,.12,r*(1.3+phase), '#d6f2ef',.102);this.ground(p.x,p.z+a*r*(.8+phase*.7),r*(1.3+phase),.12,'#d6f2ef',.102)}
   if(Math.hypot(game.velocity.x,game.velocity.z)>.2)for(let n=0;n<4;n++){const a=n*Math.PI/2+game.elapsed*4;this.cube(p.x+Math.cos(a)*r,.12+Math.abs(Math.sin(game.elapsed*9+n))*.22,p.z+Math.sin(a)*r,.09,.12,.09,'#d6f2ef')}
  }
  for(const f of this.particles){f.life-=dt;f.x+=f.vx*dt;f.z+=f.vz*dt;f.y+=f.vy*dt;f.vy-=9*dt;const s=Math.max(0,f.life)*.17;if(f.life>0)this.cube(f.x,Math.max(.1,f.y),f.z,s,s,s,f.color)}this.particles=this.particles.filter(f=>f.life>0);
  this.drawGround();
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(this.vertices),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,this.vertices.length/7);
  this.drawCharacter(game,matrix);
  if(this.transparent.length){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(this.transparent),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,this.transparent.length/7);gl.depthMask(true);gl.disable(gl.BLEND)}
 }
}
