import {TARGET_ART,targetPose} from './target-art.js';

export class TargetSprites{
 constructor(){
  this.image=new Image();this.loaded=false;this.error='';this.drawCount=0;this.lastPose=null;
  this.ready=new Promise((resolve,reject)=>{
   this.image.onload=()=>{this.loaded=true;this.createFlashMask();resolve(this);};
   this.image.onerror=()=>{this.error='目标素材加载失败，请重新打开页面';reject(Error(this.error));};
  });
  this.image.src=new URL('../assets/target-head.png',import.meta.url).href;
 }
 createFlashMask(){
  const [x0,y0,x1,y1]=TARGET_ART.sourceRect;
  this.flashMask=document.createElement('canvas');this.flashMask.width=x1-x0;this.flashMask.height=y1-y0;
  const c=this.flashMask.getContext('2d');c.drawImage(this.image,x0,y0,x1-x0,y1-y0,0,0,x1-x0,y1-y0);c.globalCompositeOperation='source-in';c.fillStyle='#fff';c.fillRect(0,0,x1-x0,y1-y0);
 }
 crown(c,r){
  c.save();c.translate(0,-r*.77);c.fillStyle='#edc66b';c.strokeStyle='#c9943e';c.lineWidth=1;
  c.beginPath();c.moveTo(-r*.48,0);c.lineTo(-r*.58,-r*.48);c.lineTo(-r*.24,-r*.29);c.lineTo(0,-r*.66);c.lineTo(r*.24,-r*.29);c.lineTo(r*.58,-r*.48);c.lineTo(r*.48,0);c.closePath();c.fill();c.stroke();
  c.fillStyle='#8ebcbb';c.beginPath();c.arc(0,-r*.15,r*.075,0,7);c.fill();c.restore();
 }
 draw(c,entity){
  const p=targetPose(entity);this.lastPose=p;this.drawCount++;
  c.save();c.translate(p.x,p.y);c.rotate(p.angle);
  if(!this.loaded){c.fillStyle='#bfc6b5';c.beginPath();c.arc(0,0,p.radius,0,7);c.fill();c.restore();return;}
  c.scale(p.squashX,p.squashY);
  const [x0,y0,x1,y1]=TARGET_ART.sourceRect,w=x1-x0,h=y1-y0,dx=(x0-TARGET_ART.center[0])*p.scale,dy=(y0-TARGET_ART.center[1])*p.scale;
  c.drawImage(this.image,x0,y0,w,h,dx,dy,w*p.scale,h*p.scale);
  if(p.hit>0){c.save();c.globalAlpha=.72*p.hit;c.drawImage(this.flashMask,dx,dy,w*p.scale,h*p.scale);c.restore();}
  if(p.boss)this.crown(c,p.radius);
  c.restore();
 }
 stars(c,e){
  const t=Math.max(0,Math.min(1,e.age/.75)),r=e.radius||23;
  c.save();c.globalAlpha=1-t;
  for(let i=0;i<7;i++){
   const a=i*Math.PI*2/7,dist=r*.25+t*r*1.7,x=e.x+Math.cos(a)*dist,y=e.y+Math.sin(a)*dist-t*r*.35,size=(e.boss?6:4.5)*(1-t*.5);
   c.save();c.translate(x,y);c.rotate(a+t*2);c.fillStyle=i%2?'#fff4bf':'#e6bc65';c.beginPath();for(let k=0;k<10;k++){const n=k*Math.PI/5-Math.PI/2,s=k%2?size*.43:size;if(!k)c.moveTo(Math.cos(n)*s,Math.sin(n)*s);else c.lineTo(Math.cos(n)*s,Math.sin(n)*s);}c.closePath();c.fill();c.restore();
  }c.restore();
 }
}
