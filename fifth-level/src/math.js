export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const identity=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
export function quaternionMatrix([x,y,z,w]){return new Float32Array([1-2*(y*y+z*z),2*(x*y+z*w),2*(x*z-y*w),0,2*(x*y-z*w),1-2*(x*x+z*z),2*(y*z+x*w),0,2*(x*z+y*w),2*(y*z-x*w),1-2*(x*x+y*y),0,0,0,0,1]);}
export function mul(a,b){const c=new Float32Array(16);for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<4;k++)c[j*4+i]+=a[k*4+i]*b[j*4+k];return c;}
export function transform(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx){
 const a=identity(),b=identity(),c=identity();a[5]=a[10]=Math.cos(rx);a[6]=Math.sin(rx);a[9]=-a[6];b[0]=b[10]=Math.cos(ry);b[8]=Math.sin(ry);b[2]=-b[8];c[0]=c[5]=Math.cos(rz);c[1]=Math.sin(rz);c[4]=-c[1];
 const m=mul(mul(c,b),a);for(let i=0;i<3;i++){m[i]*=sx;m[4+i]*=sy;m[8+i]*=sz;}m[12]=x;m[13]=y;m[14]=z;return m;
}
export function perspective(fov,aspect,near=.1,far=300){const f=1/Math.tan(fov/2),m=new Float32Array(16);m[0]=f/aspect;m[5]=f;m[10]=(far+near)/(near-far);m[11]=-1;m[14]=2*far*near/(near-far);return m;}
export function lookAt(eye,target){const norm=v=>{const l=Math.hypot(...v);return v.map(x=>x/l)},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];const z=norm(eye.map((x,i)=>x-target[i])),x=norm(cross([0,1,0],z)),y=cross(z,x),m=identity();for(let i=0;i<3;i++){m[i*4]=x[i];m[i*4+1]=y[i];m[i*4+2]=z[i];}m[12]=-x.reduce((s,a,i)=>s+a*eye[i],0);m[13]=-y.reduce((s,a,i)=>s+a*eye[i],0);m[14]=-z.reduce((s,a,i)=>s+a*eye[i],0);return m;}
export function pivotMatrix(p,rx=0,ry=0,rz=0){return mul(transform(...p,rx,ry,rz),transform(...p.map(x=>-x)));}
export function seeded(seed){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
