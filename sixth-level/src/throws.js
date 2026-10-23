import {TARGETS,BY_ID,RULES} from './content.js';
export const PATTERNS=Object.freeze([
 {id:'fan',name:'扇形齐抛'}, {id:'stairs',name:'阶梯连发'},
 {id:'wings',name:'双翼合流'}, {id:'layers',name:'高低双层'},
 {id:'fountain',name:'中央喷泉'}, {id:'leader',name:'大果领队'},
 {id:'relay',name:'奶娃接力'}, {id:'reward',name:'稀有奖励阵'}
]);
export function positionAt(o,t){return{x:o.x+o.vx*t,y:o.y+o.vy*t+.5*RULES.gravity*t*t};}
export function flightEnd(o,height){const d=o.vy*o.vy+2*RULES.gravity*(height+o.r*Math.SQRT2-o.y);return(-o.vy+Math.sqrt(Math.max(0,d)))/RULES.gravity;}
export function visibleWindow(o,height){const bound=o.r*Math.SQRT2,disc=o.vy*o.vy-2*RULES.gravity*(o.y-(height-bound));return disc<=0?0:2*Math.sqrt(disc)/RULES.gravity;}
export function separationScore(a,b,height){
 let score=Infinity;const end=Math.min(a.delay+flightEnd(a,height),b.delay+flightEnd(b,height));
 for(let t=Math.max(a.delay,b.delay);t<end;t+=1/40){const u=positionAt(a,t-a.delay),v=positionAt(b,t-b.delay);if(u.y+a.r>height||v.y+b.r>height)continue;score=Math.min(score,Math.hypot(u.x-v.x,u.y-v.y)/(Math.abs(a.r-b.r)+18));}return score;
}
function spreadOccluded(entries,height,width,finale){
 const settled=[];for(const original of entries){let chosen=original,best=-1;
  search:for(const extra of (finale?[0,.1]:[0,.14,.28,.42]))for(const dx of [0,-32,32,-64,64,-96,96,-144,144,-192,192]){
   const end=positionAt(original,flightEnd(original,height)),bound=original.r*Math.SQRT2;
   const lo=original.limits?.lo??width*.025+bound,hi=original.limits?.hi??width*.975-bound;
   const shift=Math.max(lo-Math.min(original.x,end.x),Math.min(hi-Math.max(original.x,end.x),dx));
   const candidate={...original,x:original.x+shift,delay:original.delay+extra};
   const score=Math.min(...settled.map(b=>separationScore(candidate,b,height)));if(score>best){chosen=candidate;best=score;}if(score>=1)break search;
  }settled.push(chosen);
 }return settled;
}
export function minimumBombGap(a,b,height){
 let gap=Infinity;const end=Math.min(a.delay+flightEnd(a,height),b.delay+flightEnd(b,height));
 for(let t=Math.max(a.delay,b.delay);t<end;t+=1/90){const u=positionAt(a,t-a.delay),v=positionAt(b,t-b.delay),ab=a.r*Math.SQRT2,bb=b.r*Math.SQRT2;if(u.y-ab>height||v.y-bb>height||u.y+ab<0||v.y+bb<0)continue;gap=Math.min(gap,Math.hypot(u.x-v.x,u.y-v.y)-ab-bb);}return gap;
}
function bombCandidate({width,height,time,random,lastBombZone,obstacles}){
 const zones=['left','middle','right'].filter(z=>z!==lastBombZone),offset=Math.floor(random()*zones.length),order=zones.slice(offset).concat(zones.slice(0,offset)),type=BY_ID.bomb,bound=type.r*Math.SQRT2;
 // A second bomb waits for the first to leave rather than forcing the next
 // normal group into several narrow gaps at once.
 if(obstacles.some(o=>o.type.group==='bomb'&&o.delay+flightEnd(o,height)>0))return null;
 const motions=['vertical','inward','short'],start=Math.floor(random()*motions.length),motionOrder=motions.slice(start).concat(motions.slice(0,start));
 for(const zone of order)for(const delay of [.38,.64,.90])for(const motion of motionOrder){
  const center={left:.14,middle:.50,right:.86}[zone],x=width*(center+(random()-.5)*.035),y=height+type.r+8;
  const apexY=Math.max(bound+4,Math.min(height*(motion==='short'?.48:.31),height-bound-200));
  const c={type,r:type.r,x,y,vy:-Math.sqrt(2*RULES.gravity*(y-apexY)),vx:0,delay,angle:0,spin:random()<.5?-.8:.8,bombZone:zone,bombMotion:motion};
  const direction=zone==='left'?1:zone==='right'?-1:(random()<.5?-1:1),drift=motion==='vertical'?0:direction*width*(motion==='short'?.035:.075);
  const endX=Math.max(bound+12,Math.min(width-bound-12,x+drift));c.vx=(endX-x)/flightEnd(c,height);
  if(time+delay+flightEnd(c,height)>=84.8)continue;
  if(obstacles.every(o=>minimumBombGap(c,o,height)>=32))return c;
 }return null;
}
function mapAroundBombs(entries,hazards,height,width){
 const bands=hazards.map(b=>{const end=positionAt(b,flightEnd(b,height)),bound=b.r*Math.SQRT2+28;return{lo:Math.min(b.x,end.x)-bound,hi:Math.max(b.x,end.x)+bound};}).sort((a,b)=>a.lo-b.lo),regions=[];
 let cursor=width*.025;for(const b of bands){if(b.lo>cursor)regions.push({lo:cursor,hi:Math.min(b.lo,width*.975)});cursor=Math.max(cursor,b.hi);}if(cursor<width*.975)regions.push({lo:cursor,hi:width*.975});
 return entries.map((e,i)=>{const bound=e.r*Math.SQRT2,available=regions.filter(r=>r.hi-r.lo>bound*2+8);if(!available.length)throw Error('No safe normal target corridor');
  const end=positionAt(e,flightEnd(e,height)),preferred=(e.x+end.x)/2;
  const region=available.reduce((a,b)=>Math.abs((a.lo+a.hi)/2-preferred)<Math.abs((b.lo+b.hi)/2-preferred)?a:b),lo=region.lo+bound,hi=region.hi-bound;
  const u=(e.x-width*.025)/(width*.95),v=(end.x-width*.025)/(width*.95),x=lo+(hi-lo)*Math.max(0,Math.min(1,u)),endX=lo+(hi-lo)*Math.max(0,Math.min(1,v));
  return{...e,x,vx:(endX-x)/flightEnd(e,height),limits:{lo,hi}};
 });
}
export function selectPattern({time,wave,history,random}){
 let pool=time<30?['fan','stairs','leader']:time<60?['fan','stairs','leader','wings','layers','relay','reward']:['fan','stairs','leader','wings','layers','relay','fountain','reward'];
 if(time>=60&&wave%3===0)pool=['fan','stairs','leader'];
 if(time>=78)pool=pool.filter(id=>id!=='reward');
 for(let back=3;back>=0;back--){const fresh=pool.filter(id=>back===0||!history.slice(-back).includes(id));if(fresh.length)return fresh[Math.floor(random()*fresh.length)];}
}
export function makeThrowPlan({pattern,width=960,height=860,time=0,wave=1,random=Math.random,bomb=false,lastBombZone=null,obstacles=[]}){
 if(!PATTERNS.some(p=>p.id===pattern))throw new RangeError('Unknown throw pattern');
 const count=time<30?3+wave%2:time<60?4+wave%2:4+wave%3;
 let types=Array.from({length:count},(_,i)=>i===0?BY_ID[`model-${(wave-1)%5}`]:TARGETS[Math.floor(random()*9)]);
 if(pattern==='relay')types=Array.from({length:count},(_,i)=>i%2===0?BY_ID[`model-${((wave+i-1)%5)}`]:TARGETS[Math.floor(random()*9)]);
 if(pattern==='leader')types=[TARGETS[8],...types.slice(1).map((t,i)=>TARGETS[(wave+i)%5])];
 if(pattern==='reward')types=[TARGETS[9+wave%2],...types.slice(1)];
 const mirrored=random()<.5,entries=[],normalRight=width*.975,normalLeft=width*.025;
 for(let i=0;i<types.length;i++){
  const type=types[i],bound=type.r*Math.SQRT2,lo=normalLeft+bound,hi=normalRight-bound;
  const lane=(i+.5)/count,spread=.20+.60*lane;
  let from=spread,to=spread,delay=0,apex=.27+random()*.045;
  if(pattern==='fan'){from=.50+(lane-.5)*.50;to=.08+lane*.84;apex=.22+Math.abs(lane-.5)*.15;}
  if(pattern==='stairs'){from=.16+lane*.70;to=from+.035;delay=i*.18;apex=.40-i*.033;}
  if(pattern==='wings'){from=i%2===0?.08+.14*Math.floor(i/2):.92-.14*Math.floor(i/2);to=i%2===0?.38+.20*Math.floor(i/2):.62-.20*Math.floor(i/2);delay=i*.08;apex=i%2===0?.22:.43;}
  if(pattern==='layers'){from=.18+(i%3)*.30;to=from+(i<2?-.035:.035);delay=i<2?0:.22;apex=i<2?.48:.22;}
  if(pattern==='fountain'){from=.40+(lane-.5)*.18;to=.08+lane*.84;delay=i*.13;apex=.23+(i%3)*.065;}
  if(pattern==='leader'){from=i===0?.50:.13+lane*.74;to=from;delay=i===0?0:.30+i*.06;apex=i===0?.22:.34;}
  if(pattern==='relay'){from=.14+lane*.74;to=from+(i%2===0?.05:-.05);delay=i*.20;apex=.26+(i%2)*.10;}
  if(pattern==='reward'){from=.50+(lane-.5)*.50;to=.50+(lane-.5)*.76;delay=i===0?0:.12;apex=.20+Math.abs(lane-.5)*.18;}
  if(mirrored){from=1-from;to=1-to;}
  const minY=bound+4,maxY=height-bound-200;
  let apexY=Math.max(minY,Math.min(maxY,height*apex));
  if(time>=85){delay=Math.min(.12,delay);apexY=Math.max(apexY,height+type.r+8-RULES.gravity*1.98**2/2);apexY=Math.min(maxY,apexY);}
  const x=lo+(hi-lo)*Math.max(0,Math.min(1,from)),endX=lo+(hi-lo)*Math.max(0,Math.min(1,to)),y=height+type.r+8,vy=-Math.sqrt(2*RULES.gravity*(y-apexY));
  const entry={type,x,y,r:type.r,vy,vx:0,delay,angle:(random()-.5)*.7,spin:(random()-.5)*2.4};entry.vx=(endX-x)/flightEnd(entry,height);entries.push(entry);
 }
 const candidate=bomb&&time>=30&&pattern!=='reward'&&time<82?bombCandidate({width,height,time,random,lastBombZone,obstacles}):null;
 const hazards=[...obstacles.filter(o=>o.type.group==='bomb'&&o.delay+flightEnd(o,height)>0),...(candidate?[candidate]:[])];
 const mapped=hazards.length?mapAroundBombs(entries,hazards,height,width):entries;
 const separated=spreadOccluded(mapped,height,width,time>=85);entries.splice(0,entries.length,...separated);
 if(candidate)entries.push(candidate);
 return {pattern,name:PATTERNS.find(p=>p.id===pattern).name,entries,interval:time<30?2.7+random()*.3:time<60?2.5+random()*.3:2.5+random()*.2};
}
