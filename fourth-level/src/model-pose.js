import {characterMesh,CHARACTER_NAMES} from './model/character-mesh.js';

export const MODEL_STAGES=Object.freeze({normal:0,heavy:4,burst:2});
export const MODEL_YAW=.38;
const metrics=new Map();
export function modelMetrics(type){
 const stage=MODEL_STAGES[type];
 if(stage===undefined)throw new RangeError('Unknown ammunition model: '+type);
 if(metrics.has(type))return metrics.get(type);
 const mesh=characterMesh(stage);let radius=0;
 for(let i=0;i<mesh.positions.length;i+=3)radius=Math.max(radius,Math.hypot(mesh.positions[i],mesh.positions[i+1],mesh.positions[i+2]));
 const result=Object.freeze({stage,name:CHARACTER_NAMES[stage],radius,scale:1/radius,triangles:mesh.positions.length/9});metrics.set(type,result);return result;
}
export function modelPose(type,angle=0){
 const spec=modelMetrics(type),half=-angle/2;
 // Rotate around the camera-facing axis, matching Matter's screen-clockwise
 // rotation. Limbs, eyes and tail all retain the source model's rigid pose.
 return {...spec,roll:[Math.sin(MODEL_YAW)*Math.sin(half),0,Math.cos(MODEL_YAW)*Math.sin(half),Math.cos(half)]};
}
export function modelMatrix(scale){
 const c=Math.cos(MODEL_YAW),s=Math.sin(MODEL_YAW),frame=1.28;
 // CharacterGPU places the model at (0, .008 + scale, 0); cancel that
 // translation so the original rolling origin maps to the physical centre.
 return new Float32Array([c/frame,0,-s/10,0,0,1/frame,0,0,-s/frame,0,-c/10,0,0,-(.008+scale)/frame,0,1]);
}
