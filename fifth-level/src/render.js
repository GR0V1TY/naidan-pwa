import {MeshBuilder,rgb} from './geometry.js';
import {identity,mul,transform,perspective,lookAt,clamp} from './math.js';
import {playerMesh,chaserMesh,eggMesh,jointPose} from './models.js';
import {rollingPose} from './rolling-pose.js';
import {ZONES,RULES} from './content.js';

function scenery(zone){
 const b=new MeshBuilder(),z=ZONES[zone];
 b.box('city foundation',[0,-.60,-12],[80,.25,24],zone===2?'#57566c':'#d2c5b1');
 b.box('track bed',[0,-.25,-12],[10.3,.45,24],zone===2?'#55566c':'#a29b96');
 for(const lane of [-3,0,3]){
  for(let i=0;i<16;i++)b.box('sleepers',[lane,-.015,-i*1.5],[2.18,.12,.23],zone===2?'#72677f':'#bcac96');
  for(const dx of [-.68,.68]){b.box('rail',[lane+dx,.06,-12],[.075,.13,24],'#c1ccd0');b.box('rail dark edge',[lane+dx+.035,.035,-12],[.03,.08,24],'#657a81');}
 }
 for(const sign of [-1,1]){
  b.box('platform',[sign*7.0,-.1,-12],[3.8,.65,24],zone===2?'#75738b':'#ebd9c6');b.box('safety line',[sign*5.25,.245,-12],[.16,.04,24],z.accent);
  for(let i=0;i<4;i++){
   const d=-i*6-2;b.box('platform tiles',[sign*6.9,.24,d],[3.0,.025,.035],'#cabbb0');
   b.box('lamp post',[sign*7.4,2.1,d],[.12,3.8,.12],zone===2?'#aaa5b7':'#638c90');
   b.box('lamp',[sign*7.4,4.02,d],[1.1,.10,.30],'#ffecb9');
  }
  if(zone===2){b.box('tunnel wall',[sign*9.2,4,-12],[.7,8,24],'#4c4b6a');for(let j=0;j<3;j++)b.box('neon stripe',[sign*8.82,2.4+j*.30,-12],[.04,.055,24],j===1?'#f1adcc':'#7acbcf');}
  else for(let i=0;i<3;i++){
   const h=5+(i*3+zone*2)%5,d=-4-i*8;b.box('city building',[sign*(10.5+i%2*2),h/2,d],[3.5,h,6.5],i%2?z.building:'#f1e2cf');
   b.box('roof rim',[sign*(10.5+i%2*2),h+.1,d],[3.8,.2,6.8],z.accent);
   for(let floor=1;floor<h-1;floor+=1.5)for(let w=-1;w<=1;w++)b.box('building windows',[sign*(10.5+i%2*2)+w*.8,floor,d+3.26],[.40,.75,.04],floor%3<1?'#80afb7':'#fff1d3');
  }
  if(zone===0||zone===4){
   b.box('station pillar',[sign*6.2,2.5,-13],[.22,4.8,.26],z.color);b.box('canopy',[sign*7.4,5.0,-12],[5,.22,24],'#f4e6cf');b.box('canopy lip',[sign*4.95,4.92,-12],[.12,.4,24],z.color);
   b.box('bench seat',[sign*7.2,.74,-7],[1.6,.15,.65],z.accent);b.box('bench back',[sign*7.2,1.1,-7.27],[1.6,.6,.12],z.accent);
   for(const dx of [-.6,.6])b.box('bench legs',[sign*7.2+dx,.42,-7],[.10,.6,.48],'#73888a');
   b.box('flower pot',[sign*6.1,.50,-19],[.65,.65,.65],'#c4957d');for(let j=0;j<3;j++)b.ell('topiary',[sign*6.1+(j-1)*.22,1.15+j%2*.2,-19],[.32,.44,.32],'#80b698',0,12,8);
  }
 }
 if(zone===2){b.box('tunnel ceiling',[0,7.8,-12],[19,.4,24],'#434560');for(let j=0;j<3;j++){b.box('tunnel beam',[0,7.4,-j*8],[18,.3,.35],'#68658b');b.box('ceiling light',[0,7.21,-j*8],[3.6,.05,.15],'#a6e6df');}}
 return b.build('scenery-'+zone);
}
function obstacleMesh(type,ramp=false){
 const b=new MeshBuilder();
 if(type==='train'){
  b.box('train body',[0,1.32,-9],[2.45,2.45,18],'#62b8b2');b.box('cream upper train',[0,2.05,-9],[2.47,.94,18.02],'#f3e9cf');b.box('train roof',[0,2.55,-9],[2.5,.10,18.1],'#86a7a7');
  for(const sign of [-1,1])for(let j=0;j<6;j++)b.box('side window',[sign*1.245,2.10,-1.3-j*2.8],[.025,.63,1.8],'#355a6c');
  b.box('windshield',[0,2.10,.025],[1.9,.65,.045],'#355a6c');b.box('windshield divider',[0,2.1,.055],[.07,.66,.02],'#f3e9cf');
  b.box('coral train stripe',[0,.84,.05],[2.42,.23,.04],'#e68f7c');for(const sign of [-1,1])b.ell('headlight',[sign*.83,1.07,.08],[.15,.11,.035],'#fff4b4',0,16,10);
  if(ramp)b.surface('train access ramp',(u,v)=>[(u-.5)*2.42,2.6*v,(1-v)*9], '#e4b982',2,12);
 }else if(type==='barrier'){
  b.box('barrier',[0,.43,-.6],[2.30,.86,1.2],'#ec9e79');b.box('barrier top',[0,.89,-.6],[2.38,.12,1.24],'#f7d4a0');
  for(let i=0;i<4;i++)b.box('reflector',[-.81+i*.54,.5,.015],[.23,.42,.035],'#fff0d5');
 }else{
  for(const sign of [-1,1])b.box('overhead post',[sign*1.12,1.48,-.6],[.13,2.96,.18],'#587b88');b.box('overhead bar',[0,1.92,-.6],[2.4,1.62,.23],'#718ac0');
  b.box('bar stripe',[0,1.2,-.45],[2.4,.19,.05],'#f3d49b');for(const sign of [-1,1])b.box('down arrow',[sign*.57,1.7,-.45],[.12,.40,.04],'#f9edcb');
 }
 return b.build(type+(ramp?'-ramp':''));
}
export class RunnerRenderer{
 constructor(canvas){
  this.canvas=canvas;this.lost=false;this.draws=0;this.frame=0;this.lastZone=0;this.view=identity();this.meshes=new Map();
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;this.onLost?.();});canvas.addEventListener('webglcontextrestored',()=>{this.meshes.clear();this.init();this.lost=false;this.onRestore?.();});this.init();
 }
 init(){
  const gl=this.canvas.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:true});if(!gl)throw Error('当前浏览器未启用 WebGL，请使用支持三维图形的浏览器。');this.gl=gl;
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,`
   attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;attribute float aJoint;
   uniform mat4 uView;uniform mat4 uModel;uniform mat4 uJoints[7];varying vec3 vColor;varying float vFog;
   void main(){mat4 j=uJoints[0];if(aJoint>0.5)j=uJoints[1];if(aJoint>1.5)j=uJoints[2];if(aJoint>2.5)j=uJoints[3];if(aJoint>3.5)j=uJoints[4];if(aJoint>4.5)j=uJoints[5];if(aJoint>5.5)j=uJoints[6];
    vec4 world=uModel*j*vec4(aPosition,1.0);vec3 n=normalize(mat3(uModel)*mat3(j)*aNormal);
    float diffuse=.68+.30*max(0.,dot(n,normalize(vec3(-.4,.85,.6))));float spec=.10*pow(max(0.,dot(n,normalize(vec3(-.2,.65,.8)))),28.);
    vColor=pow(pow(aColor,vec3(2.2))*diffuse+vec3(spec),vec3(1./2.2));gl_Position=uView*world;vFog=clamp((-world.z-45.)/125.,0.,.94);}
  `));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec3 vColor;varying float vFog;uniform vec3 uFog;uniform float uOpacity;void main(){gl_FragColor=vec4(mix(vColor,uFog,vFog),uOpacity);}`));
  gl.bindAttribLocation(p,0,'aPosition');gl.bindAttribLocation(p,1,'aNormal');gl.bindAttribLocation(p,2,'aColor');gl.bindAttribLocation(p,3,'aJoint');gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
  this.program=p;this.opacity=1;this.u=Object.fromEntries(['uView','uModel','uJoints[0]','uFog','uOpacity'].map(n=>[n,gl.getUniformLocation(p,n)]));gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);
  this.scenes=ZONES.map((_,i)=>scenery(i));this.obstacleMeshes={train:obstacleMesh('train'),ramp:obstacleMesh('train',true),barrier:obstacleMesh('barrier'),bar:obstacleMesh('bar')};
  this.player=playerMesh();this.chaser=chaserMesh();this.egg=eggMesh();const b=new MeshBuilder();b.ell('milk candy',[0,0,0],[.20,.30,.12],'#ffce74',0,14,10);b.ell('candy center',[0,0,.122],[.105,.17,.015],'#fff0bb',0,12,8);this.coin=b.build('coin');
  this.powerMeshes={};for(const [name,color] of [['shield','#88d4d0'],['magnet','#e79297'],['double','#b69ad9']]){const m=new MeshBuilder();m.ell('power orb',[0,0,0],[.37,.37,.37],color,0,20,16);if(name==='magnet'){for(const sign of [-1,1])m.box('magnet tip',[sign*.13,.1,.34],[.12,.26,.06],'#fff3d8');m.box('magnet bottom',[0,-.1,.34],[.38,.12,.06],'#fff3d8');}else if(name==='double'){for(const sign of [-1,1])m.box('double mark',[sign*.12,0,.35],[.07,.37,.045],'#fff3d8');}else m.ell('shield emblem',[0,0,.34],[.2,.25,.04],'#fff3d8',0,16,12);this.powerMeshes[name]=m.build(name);}
  const power=new MeshBuilder();power.ell('奶蛋冲破道具',[0,0,0],[.36,.45,.35],'#ffe2a1',0,24,18);power.box('lightning upper',[.04,.14,.34],[.13,.26,.055],'#bf7229');power.box('lightning middle',[0,0,.37],[.26,.10,.055],'#bf7229');power.box('lightning lower',[-.04,-.14,.34],[.13,.26,.055],'#bf7229');this.powerMeshes.smash=power.build('smash pickup');
  const spark=new MeshBuilder();spark.box('破障碎块',[0,0,0],[.24,.20,.25],'#f5c076');this.shard=spark.build('break shard');const aura=new MeshBuilder();aura.surface('破障冲击环',(u,v)=>{const a=u*Math.PI*2,b=v*Math.PI*2,r=.84+.045*Math.cos(b);return [r*Math.cos(a),.045*Math.sin(b),r*Math.sin(a)];},'#f7ba64',40,8);this.aura=aura.build('smash aura');
  const s=new MeshBuilder();s.ell('shadow',[0,0,0],[.85,.012,.53],'#6e8987',0,20,8);this.shadow=s.build('shadow');
  const apron=new MeshBuilder();apron.box('foreground ground',[0,-.6,12],[80,.25,24],'#d2c5b1');apron.box('foreground rail bed',[0,-.25,12],[10.3,.45,24],'#a29b96');for(const sign of [-1,1])apron.box('foreground platform',[sign*7,-.1,12],[3.8,.65,24],'#ebd9c6');for(const lane of [-3,0,3]){for(const dx of [-.68,.68])apron.box('foreground rails',[lane+dx,.06,12],[.075,.13,24],'#c1ccd0');for(let i=0;i<16;i++)apron.box('foreground sleepers',[lane,-.015,i*1.5],[2.18,.12,.23],'#bcac96');}this.apron=apron.build('station foreground');
  const f=new MeshBuilder();for(const sign of [-1,1]){f.box('finish pillar',[sign*5,3,0],[.5,6,.6],'#58b8a7');}f.box('finish arch',[0,5.85,0],[10.5,.6,.65],'#f4dcad');for(let i=0;i<14;i++)f.box('finish checks',[-4.6+i*.7,5.89,.34],[.35,.3,.03],i%2?'#f3c486':'#466a74');this.finish=f.build('finish');
  this.neutral=Array.from({length:7},identity);this.neutralData=new Float32Array(this.neutral.flatMap(x=>Array.from(x)));
 }
 upload(mesh){if(this.meshes.has(mesh))return this.meshes.get(mesh);const gl=this.gl,data=new Float32Array(mesh.positions.length/3*10);for(let i=0,j=0;i<mesh.positions.length;i+=3,j+=10){data.set(mesh.positions.subarray(i,i+3),j);data.set(mesh.normals.subarray(i,i+3),j+3);data.set(mesh.colors.subarray(i,i+3),j+6);data[j+9]=mesh.joints?.[i/3]||0;}const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);const v={buffer,count:data.length/10};this.meshes.set(mesh,v);return v;}
 draw(mesh,matrix=identity(),joints=null){const gl=this.gl,o=this.upload(mesh);gl.bindBuffer(gl.ARRAY_BUFFER,o.buffer);for(const [i,size,offset]of [[0,3,0],[1,3,12],[2,3,24],[3,1,36]]){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,size,gl.FLOAT,false,40,offset);}gl.uniformMatrix4fv(this.u.uModel,false,matrix);gl.uniformMatrix4fv(this.u['uJoints[0]'],false,joints?new Float32Array(joints.flatMap(x=>Array.from(x))):this.neutralData);gl.uniform1f(this.u.uOpacity,this.opacity);if(this.opacity<1){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);}else{gl.disable(gl.BLEND);gl.depthMask(true);}gl.drawArrays(gl.TRIANGLES,0,o.count);this.draws++;}
 resize(){const r=this.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.65),w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);if(w!==this.canvas.width||h!==this.canvas.height){this.canvas.width=w;this.canvas.height=h;}this.gl.viewport(0,0,w,h);return w/h;}
 begin(zone,eye,target){const gl=this.gl,aspect=this.resize(),fog=rgb(ZONES[zone].sky);gl.depthMask(true);gl.disable(gl.BLEND);this.opacity=1;gl.clearColor(...fog,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);this.view=mul(perspective(.85,aspect,.15,240),lookAt(eye,target));gl.uniformMatrix4fv(this.u.uView,false,this.view);gl.uniform3fv(this.u.uFog,fog);this.draws=0;}
 character(kind,x,y,z,time,options={},yaw=Math.PI,scale=.85){const mesh=kind==='player'?this.player:kind==='egg'?this.egg:this.chaser,joints=jointPose(kind,time,options),slide=options.slide;
  const shadowScale=kind==='egg'||options.roll?(options.radius||RULES.eggRadius):scale*1.2;this.draw(this.shadow,transform(x,Math.max(.02,y-.02),z,0,0,0,shadowScale,1,shadowScale));
  if(kind==='egg'||(kind==='player'&&options.roll)){const pose=rollingPose(mesh,options.roll||[0,0,0,1],options.radius||RULES.eggRadius,x,y,z);this.draw(mesh,pose.matrix,pose.joints);this.lastPlayerPose={form:kind==='egg'?'egg':'roll',stage:mesh.stage,radius:pose.radius,scale:pose.scale,matrix:Array.from(pose.matrix),roll:options.roll};return;}
  let model;if(kind==='player')model=transform(x,y+(slide?.36:1.15)*scale,z,0,yaw,options.lean||0,scale,slide?scale*.28:scale,scale);
  else model=transform(x,y,z,slide?-.15:0,yaw,0,scale,slide?scale*.33:scale,scale);
  this.draw(mesh,model,joints);
  if(kind==='chaser')this.lastChaserDraws=(this.lastChaserDraws||0)+1;else this.lastPlayerPose={form:'run',stage:mesh.stage};
 }
 render(g){
  if(this.lost)return;this.frame++;this.lastChaserDraws=0;this.opacity=1;const menu=g.phase==='ready',zone=g.zone,t=g.elapsed,aspect=this.canvas.clientWidth/this.canvas.clientHeight,portrait=aspect<.8;
  if(menu){this.begin(0,portrait?[2,4.2,15]:[5,4.8,13],portrait?[0,1.5,-1]:[0,1.7,-2]);}
  else this.begin(zone,[g.x*.10,portrait?7.4:6.8,portrait?14.7:13],[g.x*.12,1.2,portrait?-8:-7]);
  this.lastZone=zone;
  const offset=g.distance%24;if(menu)this.draw(this.apron);for(let i=menu?0:-1;i<8;i++)this.draw(this.scenes[zone],transform(0,0,offset-i*24));
  for(const r of g.rows){for(const h of r.hazards){const z=g.distance-h.d;if(h.destroyed||z>32||z< -160)continue;this.draw(this.obstacleMeshes[h.ramp?'ramp':h.type],transform(h.lane*3,0,z));}
   for(const c of r.coins){const z=g.distance-c.d;if(c.taken||z>10||z< -105)continue;this.draw(this.coin,transform(c.lane*3,c.y+Math.sin(t*3+c.d)*.07,z,0,t*2+c.d,0));}
   for(const p of r.items){const z=g.distance-p.d;if(p.taken||z>10||z< -110)continue;this.draw(this.powerMeshes[p.type],transform(p.lane*3,p.y+Math.sin(t*3)*.12,z,0,t*1.4,0));}
  }
  if(g.mode==='story'&&g.elapsed>171){const left=180-g.elapsed;this.draw(this.finish,transform(0,0,-left*g.speed));}
  if(menu){this.character('player',-1.45,0,-1,0,{running:false},.22,1.0);this.character('chaser',1.6,0,-1.8,0,{running:false},-.18,.88);}
  else{
   const moving=['playing','countdown'].includes(g.phase),opts={running:moving,slide:g.slide>0,jump:g.y>g.floor+.15,lean:clamp((g.lane*3-g.x)*-.10,-.16,.16)};
   // Normal running issues NO chaser mesh or shadow draw calls. Danger fades it in.
   if(g.chaseVisibility>0){this.opacity=g.chaseVisibility;this.character('chaser',g.chaserX,g.chaserY,g.gap,t-.13,{running:moving,caught:g.phase==='caught'||g.phase==='lost',jump:g.chaserY>.2,slide:g.chaserSlide},Math.PI,.77);this.opacity=1;}
   if(g.smash>0){if(g.smash<2)this.opacity=.60+.40*(.5+.5*Math.sin(t*20));this.character('egg',g.x,g.y,0,t,{roll:g.roll,radius:RULES.eggRadius});this.opacity=1;this.draw(this.aura,transform(g.x,g.y+.08,0,0,t*3,0,1+Math.sin(t*7)*.07));}
   else this.character('player',g.x,g.y,0,t,{...opts,roll:g.slide>0?g.roll:null,radius:RULES.rollRadius},Math.PI,.85);
   if(g.shield>0)this.draw(this.powerMeshes.shield,transform(g.x+.93,g.y+1.5,.12,0,t*2,0,.38));
  }
  this.lastBreakFragments=0;for(const e of g.effects){const z=g.distance-e.d,a=e.age;this.opacity=Math.max(0,1-a/.65);for(let i=0;i<8;i++){const angle=i*Math.PI/4,s=.5+Math.min(1,a*4);this.draw(this.shard,transform(e.lane*3+Math.cos(angle)*a*5,.7+3.5*a-5*a*a+(i%3)*.18,z+Math.sin(angle)*a*4,a*(i+2)*3,a*4,angle,s));this.lastBreakFragments++;}this.opacity=1;}
  this.lastGLerror=this.gl.getError();
 }
 renderGallery({kind='chaser',angle=0,time=0,running=false}={}){if(this.lost)return;this.begin(0,[0,2.5,7.3],[0,1.85,0]);this.character(kind,0,0,0,time,{running},angle,kind==='player'?1.1:1);this.lastGLerror=this.gl.getError();}
 project(p){const m=this.view,[x,y,z]=p,w=m[3]*x+m[7]*y+m[11]*z+m[15];return {x:(1+(m[0]*x+m[4]*y+m[8]*z+m[12])/w)*this.canvas.clientWidth/2,y:(1-(m[1]*x+m[5]*y+m[9]*z+m[13])/w)*this.canvas.clientHeight/2};}
}
