import {Renderer} from './render.js';
import {STAGES} from './game.js';
import {CHARACTER_NAMES} from './character-mesh.js';
import {rollBy} from './rolling.js';
const canvas=document.querySelector('#view'),renderer=new Renderer(canvas),select=document.querySelector('#stage'),angle=document.querySelector('#angle'),pitch=document.querySelector('#pitch');
const game={stage:0,roll:[0,0,0,1],player:{x:0,z:0},bounceTime:0,transition:null,get config(){return STAGES[this.stage]}};
export const reviewState={game,renderer,rolling:false,dirty:true};
CHARACTER_NAMES.forEach((name,i)=>select.add(new Option(`${i+1} · ${name}`,i)));
select.onchange=()=>{game.stage=+select.value;game.roll=[0,0,0,1];reviewState.dirty=true};
document.querySelector('#roll').onclick=e=>{reviewState.rolling=!reviewState.rolling;e.target.textContent=reviewState.rolling?'暂停滚动':'开始滚动';reviewState.dirty=true};
document.querySelector('#reset').onclick=()=>{game.roll=[0,0,0,1];angle.value=15;pitch.value=12;reviewState.dirty=true};
angle.oninput=pitch.oninput=()=>{reviewState.dirty=true};
document.querySelector('#reference').onclick=()=>document.querySelector('dialog').showModal();
document.querySelector('#close-reference').onclick=()=>document.querySelector('dialog').close();
let drag=null;
canvas.onpointerdown=e=>{drag={x:e.clientX,value:+angle.value};canvas.setPointerCapture(e.pointerId)};
canvas.onpointermove=e=>{if(drag){angle.value=Math.max(-180,Math.min(180,drag.value+(e.clientX-drag.x)*.4));reviewState.dirty=true}};
canvas.onpointerup=canvas.onpointercancel=()=>{drag=null};
window.onresize=()=>{reviewState.dirty=true};
let last=performance.now();
function frame(now){
 requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;
 if(document.hidden||(!reviewState.rolling&&!reviewState.dirty))return;
 reviewState.dirty=false;if(reviewState.rolling)game.roll=rollBy(game.roll,dt*1.1,0,1);
 const gl=renderer.gl,dpr=Math.min(devicePixelRatio,1.5),w=Math.round(innerWidth*dpr),h=Math.round(innerHeight*dpr);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
 gl.viewport(0,0,w,h);
 const radius=game.config.radius,aspect=w/h,S=radius*Math.max(2,1.6/aspect),yaw=+angle.value*Math.PI/180,tilt=+pitch.value*Math.PI/180,c=Math.cos(yaw),s=Math.sin(yaw),a=Math.sin(tilt),b=Math.cos(tilt);
 const matrix=new Float32Array([c/(S*aspect),-a*s/S,-b*s/20,0,0,b/S,-a/20,0,-s/(S*aspect),-a*c/S,-b*c/20,0,0,-radius*1.1/S-.18,0,1]);gl.uniformMatrix4fv(renderer.uniform,false,matrix);
 gl.clearColor(1,.974,.922,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 renderer.drawCharacter(game,matrix);
 const shadow=[],y=renderer.lastCharacterBounds.visualMinY-.012;
 for(let i=0;i<48;i++){
  const a=i*Math.PI/24,b=(i+1)*Math.PI/24;
  shadow.push(0,y,0,.81,.76,.65,1,Math.cos(a)*radius*1.1,y,Math.sin(a)*radius*.8,1,.974,.922,1,Math.cos(b)*radius*1.1,y,Math.sin(b)*radius*.8,1,.974,.922,1);
 }
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(shadow),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,shadow.length/7);

}
requestAnimationFrame(frame);
