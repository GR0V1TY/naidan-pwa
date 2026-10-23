import {characterMesh} from './character-mesh.js';
import {SURFACE} from './terrain.js';

export function characterTransform(game){
 const radius=game.config.radius,floor=SURFACE.shadow+.008;
 const hop=game.bounceTime>0?Math.sin(Math.PI*game.bounceTime/.6)*3:0,t=game.transition;
 const phase=t?(t.switched?Math.min(1,(t.elapsed-1.1)/.9):Math.min(1,t.elapsed/1.1)):0;
 const scale=t?(t.switched?.05+phase*.95:1-phase*.95):1,rise=t&&!t.switched?phase*2:0;
 const x=t&&!t.switched?t.start.x+(t.origin.x-t.start.x)*phase:game.player.x,z=t&&!t.switched?t.start.z+(t.origin.z-t.start.z)*phase:game.player.z;
 return {center:[x,floor+radius+hop+rise,z],scale:radius*scale,yaw:t?t.elapsed*9:0,radius,floor:floor+hop+rise};
}

// The reference meshes stay in GPU memory. Rolling changes only uniforms, not
// hundreds of thousands of JS vertex allocations on every animation frame.
export class CharacterGPU{
 constructor(gl){
  this.gl=gl;this.buffers=new Map();
  const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader};
  const p=gl.createProgram();
  gl.attachShader(p,compile(gl.VERTEX_SHADER,`
   attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;
   uniform mat4 uMatrix;uniform vec4 uRoll;uniform vec3 uCenter;uniform float uScale;uniform float uYaw;
   varying vec3 vNormal;varying vec3 vColor;
   vec3 rotate(vec3 v){vec3 t=2.0*cross(uRoll.xyz,v);return v+uRoll.w*t+cross(uRoll.xyz,t);}
   vec3 yaw(vec3 v){float c=cos(uYaw),s=sin(uYaw);return vec3(v.x*c-v.z*s,v.y,v.x*s+v.z*c);}
   void main(){gl_Position=uMatrix*vec4(uCenter+yaw(rotate(aPosition))*uScale,1.0);vNormal=yaw(rotate(aNormal));vColor=aColor;}
  `));
  gl.attachShader(p,compile(gl.FRAGMENT_SHADER,`
   precision mediump float;varying vec3 vNormal;varying vec3 vColor;
   void main(){
    vec3 n=normalize(vNormal);
    float light=.60+.12*(n.y*.5+.5)+.30*max(0.0,dot(n,vec3(-.40,.78,.48)));
    float specular=.14*pow(max(0.0,dot(n,vec3(-.22,.58,.78))),20.0);
    vec3 color=pow(pow(vColor,vec3(2.2))*light+vec3(specular),vec3(1.0/2.2));
    gl_FragColor=vec4(min(color,vec3(1.0)),1.0);
   }
  `));
  for(const [i,name]of ['aPosition','aNormal','aColor'].entries())gl.bindAttribLocation(p,i,name);
  gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
  this.program=p;this.uniforms=Object.fromEntries(['uMatrix','uRoll','uCenter','uScale','uYaw'].map(n=>[n,gl.getUniformLocation(p,n)]));
 }
 draw(game,matrix){
  const gl=this.gl,mesh=characterMesh(game.stage),pose=characterTransform(game);
  if(!this.buffers.has(game.stage)){
   const data=new Float32Array(mesh.positions.length*3);
   for(let i=0,j=0;i<mesh.positions.length;i+=3,j+=9){data.set(mesh.positions.subarray(i,i+3),j);data.set(mesh.normals.subarray(i,i+3),j+3);data.set(mesh.colors.subarray(i,i+3),j+6)}
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);this.buffers.set(game.stage,buffer);
  }
  gl.useProgram(this.program);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffers.get(game.stage));
  for(let i=0;i<3;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,3,gl.FLOAT,false,36,i*12)}
  const u=this.uniforms;gl.uniformMatrix4fv(u.uMatrix,false,matrix);gl.uniform4fv(u.uRoll,game.roll);gl.uniform3fv(u.uCenter,pose.center);gl.uniform1f(u.uScale,pose.scale);gl.uniform1f(u.uYaw,pose.yaw);
  gl.drawArrays(gl.TRIANGLES,0,mesh.positions.length/3);
  const [a,b,c,w]=game.roll,rx=2*(a*b+c*w),ry=1-2*(a*a+c*c),rz=2*(b*c-a*w);let low=Infinity,high=-Infinity;
  for(let i=0;i<mesh.positions.length;i+=3){const y=rx*mesh.positions[i]+ry*mesh.positions[i+1]+rz*mesh.positions[i+2];low=Math.min(low,y);high=Math.max(high,y)}
  return {minY:pose.floor,maxY:pose.center[1]+high*pose.scale,visualMinY:pose.center[1]+low*pose.scale,colliderRadius:pose.radius,triangles:mesh.positions.length/9};
 }
}
