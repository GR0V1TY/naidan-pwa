// Frame timestamps stay unbounded by the simulation's 50 ms step cap.
export class FrameMetrics{
 constructor(){this.reset()}
 reset(){this.previous=null;this.frames=0;this.totalMs=0;this.longFrames=0;this.maxMs=0;this.recent=[]}
 observe(timestamp,active){
  if(!active||!Number.isFinite(timestamp)){this.previous=null;return}
  if(this.previous!==null){const ms=timestamp-this.previous;if(ms>0){this.frames++;this.totalMs+=ms;this.longFrames+=ms>50?1:0;this.maxMs=Math.max(this.maxMs,ms);this.recent.push(ms);if(this.recent.length>600)this.recent.shift()}}
  this.previous=timestamp;
 }
 snapshot(){
  const sorted=[...this.recent].sort((a,b)=>a-b),windowMs=this.recent.reduce((a,b)=>a+b,0);
  return {frames:this.frames,activeSeconds:this.totalMs/1000,averageFps:this.totalMs?this.frames*1000/this.totalMs:null,recentFps:windowMs?this.recent.length*1000/windowMs:null,p95FrameMs:sorted.length?sorted[Math.ceil(sorted.length*.95)-1]:null,maxFrameMs:this.maxMs,longFramesOver50Ms:this.longFrames,sampleWindowFrames:this.recent.length};
 }
}
