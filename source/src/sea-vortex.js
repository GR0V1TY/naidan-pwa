import {SeaGame} from './sea-game.js';
import {SeaRenderer} from './sea-render.js';

// The second portal uses the first portal's animation. This canvas only supplies
// the actual sea scene behind the shared character and particle animation.
export class SeaPortalBackdrop{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.preview=null;this.previewSize=''}
 reset(){this.preview=null;this.previewSize='';this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height)}
 render(seed,carry){
  const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight),dpr=Math.min(1.5,devicePixelRatio||1),key=`${w}x${h}:${seed}`;
  if(this.canvas.width!==Math.round(w*dpr)||this.canvas.height!==Math.round(h*dpr)){this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);this.preview=null}
  if(!this.preview||this.previewSize!==key){
   const canvas=document.createElement('canvas'),game=new SeaGame({seed,carry});
   new SeaRenderer(canvas).render(game,0);this.preview=canvas;this.previewSize=key;
  }
  this.ctx.setTransform(dpr,0,0,dpr,0,0);this.ctx.drawImage(this.preview,0,0,w,h);
 }
}
