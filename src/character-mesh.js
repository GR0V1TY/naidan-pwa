// Reference-driven sculpted surfaces. Coordinates are local to a spherical collider;
// visual appendages intentionally do not constrain that collider.
export const CHARACTER_NAMES=['奶蛋','萌芽奶团','幼年奶龙','少年奶龙','完全体奶龙'];
const cache=new Map();
const GOLD=[1,.86,.36],CREAM=[1,.94,.77],TOE=[.47,.37,.25],WHITE=[1,.995,.96];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const normalize=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l)};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const mix=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
export const CHARACTER_PROPORTIONS=Object.freeze([
 {bottom:-.86,top:.96,width:.94,eyeY:.30,eyeX:.32,eyeW:.175,eyeH:.18,mouthY:.085,mouthW:.115,mouthH:.125},
 {bottom:-.84,top:1.02,width:.99,eyeY:.36,eyeX:.34,eyeW:.185,eyeH:.19,mouthY:.105,mouthW:.145,mouthH:.15},
 {bottom:-.84,top:1.23,width:.93,eyeY:.69,eyeX:.355,eyeW:.195,eyeH:.20,mouthY:.385,mouthW:.19,mouthH:.175},
 {bottom:-.87,top:1.43,width:.91,eyeY:.94,eyeX:.36,eyeW:.195,eyeH:.20,mouthY:.63,mouthW:.145,mouthH:.065},
 {bottom:-.88,top:1.63,width:.97,eyeY:1.10,eyeX:.37,eyeW:.205,eyeH:.21,mouthY:.79,mouthW:.235,mouthH:.245}
]);
export function characterMesh(stage){
 if(!Number.isInteger(stage)||stage<0||stage>4)throw RangeError('Character stage must be 0–4');
 if(cache.has(stage))return cache.get(stage);
 const spec=CHARACTER_PROPORTIONS[stage],positions=[],normals=[],colors=[],parts=[];
 function surface(name,fn,color,nu=40,nv=24,outward=null){
  const points=[],ns=[],cs=[],epsilon=.00005;
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
   const u=i/nu,v=j/nv,p=fn(u,v),uu=clamp(u,.0001,.9999),vv=clamp(v,.0001,.9999);
   const a=fn(uu+epsilon,vv),b=fn(uu-epsilon,vv),c=fn(uu,vv+epsilon),d=fn(uu,vv-epsilon);
   let n=normalize(cross(a.map((x,k)=>x-b[k]),c.map((x,k)=>x-d[k])));
   if(outward){const desired=outward(p,u,v);if(n.reduce((s,x,k)=>s+x*desired[k],0)<0)n=n.map(x=>-x)}
   points.push(p);ns.push(n);cs.push(typeof color==='function'?color(p,u,v):color);
  }
  const start=positions.length/3;
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){
   const ids=[j*(nu+1)+i,j*(nu+1)+i+1,(j+1)*(nu+1)+i+1,(j+1)*(nu+1)+i];
   for(const tri of [[0,1,2],[0,2,3]]){
    const verts=tri.map(k=>ids[k]),a=points[verts[0]],b=points[verts[1]],c=points[verts[2]],face=cross(b.map((x,k)=>x-a[k]),c.map((x,k)=>x-a[k]));
    if(Math.hypot(...face)<1e-12)continue;
    if(face.reduce((s,x,k)=>s+x*ns[verts[0]][k],0)<0)[verts[1],verts[2]]=[verts[2],verts[1]];
    for(const id of verts){positions.push(...points[id]);normals.push(...ns[id]);colors.push(...cs[id])}
   }
  }
  parts.push({name,start,count:positions.length/3-start});
 }
 function ell(name,center,size,color,tilt=0,nu=28,nv=18){
  surface(name,(u,v)=>{const a=u*Math.PI*2,t=(v-.5)*Math.PI,x=Math.cos(t)*Math.cos(a)*size[0],y=Math.sin(t)*size[1],z=Math.cos(t)*Math.sin(a)*size[2];return[center[0]+x*Math.cos(tilt)-y*Math.sin(tilt),center[1]+x*Math.sin(tilt)+y*Math.cos(tilt),center[2]+z]},color,nu,nv,p=>p.map((x,k)=>x-center[k]));
 }
 function section(y){
  const t=clamp(2*(y-spec.bottom)/(spec.top-spec.bottom)-1,-1,1),root=Math.sqrt(Math.max(0,1-t*t));
  let width,head=0;
  if(stage<2)width=spec.width*(1-.10*t)*Math.pow(root,t<0?.64:1);
  else{
   const headY=[0,0,.60,.78,.92][stage],headH=spec.top-headY,bodyY=stage===2?-.19:-.13,bodyH=bodyY-spec.bottom;
   const torso=spec.width*Math.sqrt(Math.max(0,1-((y-bodyY)/bodyH)**2)),face=[0,0,.76,.76,.81][stage]*Math.sqrt(Math.max(0,1-((y-headY)/headH)**2));
   const blend=.30*Math.min(1,Math.max(torso,face)*4),h=blend?Math.max(0,blend-Math.abs(torso-face))/blend:0;
   width=Math.max(torso,face)+h*h*blend*.25;
   head=.12/(1+Math.exp(-(t-.18)*9));
  }
  return {width,depth:width*(stage<2?.82:.84),z:head};
 }
 function front(x,y){const s=section(y);return s.z+s.depth*Math.sqrt(Math.max(0,1-(x/Math.max(s.width,.00001))**2))}
 surface('continuous pear body',(u,v)=>{const t=(v-.5)*Math.PI,y=spec.bottom+(Math.sin(t)+1)*.5*(spec.top-spec.bottom),s=section(y),a=u*2*Math.PI;return[Math.cos(a)*s.width,y,s.z+Math.sin(a)*s.depth]},GOLD,80,64,p=>[p[0],(p[1]-(spec.bottom+spec.top)/2)*.6,p[2]-section(p[1]).z]);
 // All face/belly patches follow skin depth, rather than floating ellipsoids.
 function patch(name,cx,cy,rx,ry,color,{offset=.005,bulge=0,tilt=0,shape=null,nu=48,nv=10}={}){
  surface(name,(u,v)=>{const a=u*2*Math.PI,xx=Math.cos(a)*rx*v,yy=(shape?shape(a):Math.sin(a)*ry)*v,x=cx+xx*Math.cos(tilt)-yy*Math.sin(tilt),y=cy+xx*Math.sin(tilt)+yy*Math.cos(tilt);return[x,y,front(x,y)+offset+bulge*(1-v*v)]},color,nu,nv,()=>[0,0,1]);
 }
 if(stage>=3)patch('cream belly',0,-.10,stage===4?.59:.54,stage===4?.63:.59,CREAM,{offset:.015,nu:72,nv:28});
 function limb(name,start,end,radius,color,depth=1){
  const axis=normalize(end.map((x,i)=>x-start[i])),basis=normalize(cross(axis,Math.abs(axis[2])>.9?[0,1,0]:[0,0,1])),other=cross(axis,basis),center=mix(start,end,.5),length=Math.hypot(...end.map((x,i)=>x-start[i]));
  surface(name,(u,v)=>{const a=u*2*Math.PI,t=(v-.5)*Math.PI,along=Math.sign(Math.sin(t))*Math.pow(Math.abs(Math.sin(t)),.82)*length*.5,r=Math.pow(Math.max(0,Math.cos(t)),.62)*radius;return center.map((x,i)=>x+axis[i]*along+basis[i]*Math.cos(a)*r+other[i]*Math.sin(a)*r*depth)},color,32,24,p=>p.map((x,i)=>x-center[i]));
 }
 if(stage>=1)for(const sign of [-1,1]){
  if(stage===1){
   ell('arm',[sign*.91,-.08,.30],[.175,.18,.18],GOLD,sign*.18);
   ell('foot',[sign*.50,-.84,.14],[.245,.145,.28],GOLD);
  }else{
   const raised=stage===4,start=[sign*.62,raised?.37:.16,.12],end=[sign*(raised?1.32:1.06),raised?.65:.13,.22];
   limb('arm',start,end,raised?.23:.20,GOLD);
   if(stage>=3)for(let k=0;k<3;k++)ell('finger tip',[sign*(raised?1.27:1.015)+(k-1)*.025,(raised?.69:.18)+(k-1)*.083,.32],[.054,.062,.067],TOE,sign*(raised?-1.0:-.3),20,14);
   const lift=stage===2&&sign===1,foot=[sign*(lift?.87:.47),lift?-.71:-1.04,lift?.47:.28];
   limb('foot',[sign*.46,-.48,.05],foot,.255,GOLD,1.18);
   for(let k=0;k<3;k++)ell('toe',[foot[0]+(k-1)*.105,foot[1]+.075+(lift?(k-1)*.05:0),foot[2]+.13],[.058,.065,.075],TOE,0,18,12);
  }
 }
 if(stage>=2){
  const path=t=>{const a=[-.40,-.51,-.43],b=[-1.11,-.82,-.64],c=[-1.08,-.38,-.82];return a.map((x,i)=>(1-t)**2*x+2*(1-t)*t*b[i]+t*t*c[i])};
  surface('tail root',(u,v)=>{const p=path(v),a=u*Math.PI*2,rad=.255*Math.pow(1-v,.65),tangent=normalize(path(Math.min(1,v+.001)).map((x,i)=>x-path(Math.max(0,v-.001))[i])),bx=normalize(cross(tangent,[0,1,0])),by=cross(tangent,bx);return p.map((x,i)=>x+rad*(Math.cos(a)*bx[i]+Math.sin(a)*by[i]))},GOLD,36,30,(p,u,v)=>p.map((x,i)=>x-path(v)[i]));
  for(let k=0;k<3;k++){const p=path(.42+k*.18);ell('tail nub',[p[0],p[1]+.17-k*.035,p[2]],[.095,.10,.07],[.76,.51,.26],0,20,14)}
  for(let k=0;k<3;k++){const y=.12+k*.28,s=section(y);ell('back nub',[-.17,y,s.z-s.depth+.015],[.10,.13,.11],[.91,.64,.28],0,20,14)}
 }
 // Thin curved insets: whites, shaded green iris, pupil and two highlights.
 for(const sign of [-1,1]){
  const x=sign*spec.eyeX,y=spec.eyeY,tilt=-sign*.13;
  patch('eye rim',x,y,spec.eyeW+.009,spec.eyeH+.009,[.45,.39,.19],{offset:.008,bulge:.01,tilt});
  patch('eye white',x,y,spec.eyeW,spec.eyeH,WHITE,{offset:.013,bulge:.017,tilt});
  const ix=x+.020,iy=y-.016;
  patch('green iris',ix,iy,spec.eyeW*.79,spec.eyeH*.85,(p,u,v)=>mix([.49,.64,.22],[.23,.38,.09],Math.pow(v,3)),{offset:.034,bulge:.013,tilt});
  patch('pupil',ix+.010,iy+.003,spec.eyeW*.58,spec.eyeH*.65,[.025,.042,.016],{offset:.049,bulge:.010,tilt});
  patch('eye glint',ix-.038,iy+.071,.033,.038,[1,1,1],{offset:.062,bulge:.003,tilt,nu:24,nv:6});
  patch('small glint',ix+.048,iy-.066,.012,.014,[.88,.95,.79],{offset:.063,nu:18,nv:4});
 }
 const mouthShape=a=>Math.sin(a)>=0?.022*Math.sin(a):-spec.mouthH*Math.pow(-Math.sin(a),.82);
 patch('mouth lip',0,spec.mouthY,spec.mouthW+.012,spec.mouthH,[.67,.33,.10],{offset:.009,shape:a=>mouthShape(a)*1.07,nu:56,nv:12});
 patch('mouth interior',0,spec.mouthY,spec.mouthW,spec.mouthH,[.29,.075,.035],{offset:.015,shape:mouthShape,nu:56,nv:14});
 if(stage!==3){
  const tongueY=spec.mouthY-spec.mouthH*.72,tongueW=spec.mouthW*.66,tongueH=stage===2?.115:spec.mouthH*.27;
  patch('pink tongue',stage===2?.015:0,tongueY,tongueW,tongueH,[.96,.43,.42],{offset:.025,bulge:stage===2?.07:.006,nu:40,nv:12});
  if(stage===2)patch('tongue crease',.015,tongueY+.025,.007,.035,[.79,.30,.30],{offset:.094,nu:16,nv:4});
 }
 // The reference's friendly lean is part of the rest pose. Every part still rolls
 // rigidly around the same origin at runtime, including eyes, fingers and tail.
 const lean=[.12,.12,.14,-.10,-.10][stage],ca=Math.cos(lean),sa=Math.sin(lean);
 for(const data of [positions,normals])for(let i=0;i<data.length;i+=3){const x=data[i],y=data[i+1];data[i]=x*ca-y*sa;data[i+1]=x*sa+y*ca}
 const mesh={positions:new Float32Array(positions),normals:new Float32Array(normals),colors:new Float32Array(colors),parts,name:CHARACTER_NAMES[stage],stage,reference:'reference.png',proportions:spec,restLean:lean};
 cache.set(stage,mesh);return mesh;
}
