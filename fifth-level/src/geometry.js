// All assets are real, lit triangle meshes. No camera-facing character images.
export const rgb=s=>typeof s==='string'?[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255):s;
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const normal=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l);};
export class MeshBuilder{
 constructor(){this.positions=[];this.normals=[];this.colors=[];this.joints=[];this.parts=[];}
 surface(name,fn,color,nu=24,nv=16,joint=0){
  const start=this.positions.length/3,p=[],ns=[],eps=.0001;
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const u=i/nu,v=j/nv,a=fn(u+eps,v),b=fn(u-eps,v),c=fn(u,v+eps),d=fn(u,v-eps);p.push(fn(u,v));ns.push(normal(cross(a.map((x,k)=>x-b[k]),c.map((x,k)=>x-d[k]))));}
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const q=j*(nu+1)+i;for(const id of [q,q+1,q+nu+2,q,q+nu+2,q+nu+1]){this.positions.push(...p[id]);this.normals.push(...ns[id]);this.colors.push(...rgb(typeof color==='function'?color(p[id]):color));this.joints.push(joint);}}
  this.parts.push({name,start,count:this.positions.length/3-start,joint});return this;
 }
 ell(name,c,s,color,joint=0,nu=28,nv=18){return this.surface(name,(u,v)=>{const a=-u*Math.PI*2,t=(v-.5)*Math.PI;return [c[0]+Math.cos(t)*Math.cos(a)*s[0],c[1]+Math.sin(t)*s[1],c[2]+Math.cos(t)*Math.sin(a)*s[2]];},color,nu,nv,joint);}
 tube(name,points,radii,color,joint=0,nu=12){return this.surface(name,(u,v)=>{v=Math.max(0,Math.min(.999999,v));const t=v*(points.length-1),i=Math.floor(t),f=t-i,c=points[i].map((x,k)=>x+(points[i+1][k]-x)*f),a=u*Math.PI*2,r=radii[i]+(radii[i+1]-radii[i])*f;const axis=normal(points[i+1].map((x,k)=>x-points[i][k])),b=normal(cross(axis,Math.abs(axis[1])>.9?[1,0,0]:[0,1,0])),d=cross(axis,b);return c.map((x,k)=>x+r*(Math.cos(a)*b[k]+Math.sin(a)*d[k]));},color,nu,Math.max(8,points.length*4),joint);}
 box(name,c,s,color,joint=0){const start=this.positions.length/3,p=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(p=>p.map((x,i)=>c[i]+x*s[i]/2));for(const [face,n,shade] of [[[0,3,2,1],[0,0,-1],.84],[[4,5,6,7],[0,0,1],1],[[0,4,7,3],[-1,0,0],.91],[[1,2,6,5],[1,0,0],.96],[[3,7,6,2],[0,1,0],1.08],[[0,1,5,4],[0,-1,0],.7]])for(const i of [0,1,2,0,2,3]){this.positions.push(...p[face[i]]);this.normals.push(...n);this.colors.push(...rgb(color).map(x=>Math.min(1,x*shade)));this.joints.push(joint);}this.parts.push({name,start,count:this.positions.length/3-start,joint});return this;}
 build(name='mesh'){return {name,positions:new Float32Array(this.positions),normals:new Float32Array(this.normals),colors:new Float32Array(this.colors),joints:new Float32Array(this.joints),parts:this.parts};}
}
