// World-space quaternion integration driven by actual collision-resolved displacement.
export function rollBy(q,dx,dz,radius){
 const distance=Math.hypot(dx,dz);if(distance<1e-10)return q;
 const half=distance/(2*radius),s=Math.sin(half),ax=dz/distance*s,az=-dx/distance*s,w=Math.cos(half),[x,y,z,t]=q;
 const result=[w*x+ax*t-az*y,w*y+az*x-ax*z,w*z+az*t+ax*y,w*t-ax*x-az*z],norm=Math.hypot(...result);
 return result.map(v=>v/norm);
}
export function rotate(q,[x,y,z]){
 const [a,b,c,w]=q,tx=2*(b*z-c*y),ty=2*(c*x-a*z),tz=2*(a*y-b*x);
 return [x+w*tx+b*tz-c*ty,y+w*ty+c*tx-a*tz,z+w*tz+a*ty-b*tx];
}
