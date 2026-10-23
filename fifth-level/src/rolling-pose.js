import {identity,mul,transform,quaternionMatrix} from './math.js';
const bounds=new WeakMap();
export function rollingBounds(mesh){if(bounds.has(mesh))return bounds.get(mesh);let radius=0;for(let i=0;i<mesh.positions.length;i+=3)radius=Math.max(radius,Math.hypot(mesh.positions[i],mesh.positions[i+1],mesh.positions[i+2]));const result={radius};bounds.set(mesh,result);return result;}
// A rigid rotation and UNIFORM scale: the existing whole-character roll, no flattening.
export function rollingPose(mesh,roll,radius,x=0,foot=0,z=0){const scale=radius/rollingBounds(mesh).radius;return {matrix:mul(transform(x,foot+radius,z),mul(quaternionMatrix(roll),transform(0,0,0,0,Math.PI,0,scale))),joints:Array.from({length:7},identity),radius,scale};}
