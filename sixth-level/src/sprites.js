import {TARGETS} from './content.js';
import {characterMesh} from './model/character-mesh.js';
import {CharacterGPU} from './model/character-gpu.js';
export class Sprites{
 constructor(){this.images={};this.masks={};this.metrics=[];}
 async load(){
  for(const type of TARGETS.filter(t=>t.group==='fruit')){const image=new Image();image.src=new URL('../'+type.file,import.meta.url).href;await image.decode();this.store(type,image);}
  const c=document.createElement('canvas');c.width=c.height=384;
  const gl=c.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:true});if(!gl)throw Error('无法显示原版奶娃模型，请启用浏览器图形加速后重试。');
  const gpu=new CharacterGPU(gl);gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
  for(let stage=0;stage<5;stage++){
   const mesh=characterMesh(stage);let radius=0;for(let i=0;i<mesh.positions.length;i+=3)radius=Math.max(radius,Math.hypot(mesh.positions[i],mesh.positions[i+1],mesh.positions[i+2]));
   const scale=1/radius,yaw=.38,co=Math.cos(yaw),si=Math.sin(yaw),f=1.20;
   const matrix=new Float32Array([co/f,0,-si/10,0,0,1/f,0,0,-si/f,0,-co/10,0,0,-(.008+scale)/f,0,1]);
   gl.viewport(0,0,384,384);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   const bounds=gpu.draw({stage,roll:[0,0,0,1],player:{x:0,z:0},config:{radius:scale},bounceTime:0,transition:null},matrix);
   if(gl.getError()!==0)throw Error('奶娃模型绘制失败');
   const image=document.createElement('canvas');image.width=image.height=384;image.getContext('2d').drawImage(c,0,0);this.store(TARGETS.find(t=>t.stage===stage),image);
   this.metrics.push({stage,triangles:bounds.triangles,radius});
   await new Promise(r=>setTimeout(r,0));
  }
  gl.getExtension('WEBGL_lose_context')?.loseContext();
 }
 store(type,image){
  const raw=document.createElement('canvas');raw.width=image.width;raw.height=image.height;const rc=raw.getContext('2d',{willReadFrequently:true});rc.drawImage(image,0,0);const pixels=rc.getImageData(0,0,raw.width,raw.height).data;
  let x0=raw.width,y0=raw.height,x1=0,y1=0;for(let y=0;y<raw.height;y++)for(let x=0;x<raw.width;x++)if(pixels[(y*raw.width+x)*4+3]>24){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  if(x1<=x0||y1<=y0)throw Error('素材为空：'+type.name);
  const side=Math.max(x1-x0+1,y1-y0+1),sprite=document.createElement('canvas');sprite.width=sprite.height=384;
  const ctx=sprite.getContext('2d');ctx.drawImage(raw,(x0+x1+1-side)/2-2,(y0+y1+1-side)/2-2,side+4,side+4,0,0,384,384);this.images[type.id]=sprite;
  const small=document.createElement('canvas');small.width=small.height=96;const sc=small.getContext('2d');sc.drawImage(sprite,0,0,96,96);const data=sc.getImageData(0,0,96,96).data;this.masks[type.id]={size:96,data:Uint8Array.from({length:96*96},(_,i)=>data[i*4+3]>24?1:0)};
 }
 draw(ctx,o){const image=this.images[o.type.id];if(image)ctx.drawImage(image,-o.r,-o.r,o.r*2,o.r*2);}
}
