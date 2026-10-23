import {CharacterGPU} from './model/character-gpu.js';
import {modelPose,modelMatrix} from './model-pose.js';

export class ModelSprites{
 constructor(){
  this.canvas=document.createElement('canvas');this.canvas.width=this.canvas.height=256;
  const gl=this.canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:true});
  if(!gl)throw Error('浏览器未能启用三维角色显示');
  this.gl=gl;this.gpu=new CharacterGPU(gl);this.staticImages=new Map();this.icons=new Map();this.last=null;this.lost=false;this.drawCount=0;
  this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;});
  this.canvas.addEventListener('webglcontextrestored',()=>{this.gpu=new CharacterGPU(gl);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(0,0,0,0);this.staticImages.clear();this.icons.clear();this.last=null;this.lost=false;});
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(0,0,0,0);
 }
 render(type,angle=0){
  if(this.lost)throw Error('三维角色显示已中断，请重新打开页面');
  const key=type+':'+angle.toFixed(6);if(this.last===key)return this.canvas;
  const pose=modelPose(type,angle),gl=this.gl;
  gl.viewport(0,0,256,256);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  this.bounds=this.gpu.draw({stage:pose.stage,roll:pose.roll,player:{x:0,z:0},config:{radius:pose.scale},bounceTime:0,transition:null},modelMatrix(pose.scale));
  const error=gl.getError();if(error!==gl.NO_ERROR)throw Error('角色绘制异常：'+error);
  this.last=key;this.drawCount++;this.lastPose=pose;return this.canvas;
 }
 image(type,angle=0){
  if(angle!==0)return this.render(type,angle);
  if(!this.staticImages.has(type)){
   const image=document.createElement('canvas');image.width=image.height=256;image.getContext('2d').drawImage(this.render(type),0,0);this.staticImages.set(type,image);
  }return this.staticImages.get(type);
 }
 icon(type){if(!this.icons.has(type))this.icons.set(type,this.image(type).toDataURL('image/png'));return this.icons.get(type);}
 draw(ctx,x,y,r,type,angle=0){
  const size=r*2*1.28;
  ctx.drawImage(this.image(type,angle),x-size/2,y-size/2,size,size);
 }
}
