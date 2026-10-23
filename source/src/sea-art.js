// Deterministic, resolution-independent artwork. Geometry and rules stay in SeaGame.
const TAU=Math.PI*2;
const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v)};
function oval(c,x,y,rx,ry,fill,rot=0){c.beginPath();c.ellipse(x,y,rx,ry,rot,0,TAU);c.fillStyle=fill;c.fill()}
function path(c,d,fill,stroke){const p=new Path2D(d);if(fill){c.fillStyle=fill;c.fill(p)}if(stroke){c.strokeStyle=stroke;c.stroke(p)}return p}
function gradient(c,top,bottom){const g=c.createLinearGradient(0,-1,0,1);g.addColorStop(0,top);g.addColorStop(.48,bottom);g.addColorStop(1,top);return g}
function eye(c,x,y,r){oval(c,x,y,r,r,'#a8b68b');oval(c,x,y-.015,r*.88,r*.88,'#d8e3af');oval(c,x+r*.13,y,r*.57,r*.62,'#121d19');oval(c,x+r*.29,y-r*.29,r*.13,r*.13,'#f9fff0')}
function tail(c,x,wob,color){c.save();c.translate(x,0);c.rotate(wob);path(c,'M .13 0 C -.15 -.12 -.58 -.88 -.76 -.66 C -.94 -.42 -.55 -.12 -.43 0 C -.61 .18 -.96 .5 -.72 .69 C -.5 .86 -.12 .15 .13 0 Z',color,'#b68f42');c.strokeStyle='#d3aa58';for(let i=0;i<3;i++){c.beginPath();c.moveTo(0,0);c.lineTo(-.65,-.5+i*.5);c.stroke()}c.restore()}
export function goldfish(c,r,t,wob,chomp){
 c.save();c.scale(r,r);c.lineWidth=.025;c.lineJoin='round';
 tail(c,-1,wob,'#edc966');
 path(c,'M -.72 -.57 C -.7 -1.32 -.25 -1.43 -.02 -1.13 C .32 -1.28 .62 -.97 .63 -.65 Z','#e8bc59','#bf984b');
 c.strokeStyle='#c9a451';for(let i=0;i<6;i++){c.beginPath();c.moveTo(-.57+i*.17,-.62);c.lineTo(-.53+i*.16,-1.04-Math.sin(i)*.09);c.stroke()}
 const body=path(c,'M 1.13 -.08 C 1.17 -.7 .59 -1.02 -.15 -.93 C -.85 -.89 -1.17 -.47 -1.12 .12 C -1.06 .74 -.46 1.02 .29 .88 C .84 .8 1.15 .43 1.13 -.08 Z',gradient(c,'#fff0ad','#edcb65'),'#bc984b');
 c.save();c.clip(body);oval(c,.27,.5,.86,.34,'#ffedb3');
 c.strokeStyle='rgba(163,129,54,.25)';c.lineWidth=.018;
 for(let row=0;row<5;row++)for(let col=0;col<4;col++){c.beginPath();c.arc(-1.02+col*.22+(row%2)*.11,-.55+row*.24,.14,-1.1,1.1);c.stroke()}
 oval(c,.05,-.65,.57,.12,'rgba(255,255,222,.25)',-.18);c.restore();
 path(c,'M -.45 -.04 C -.99 -.08 -1.01 .38 -.58 .55 C -.24 .59 -.22 .18 -.45 -.04 Z','#e9bc59','#c69d49');
 c.strokeStyle='#d2aa52';for(let i=0;i<3;i++){c.beginPath();c.moveTo(-.4,.02);c.lineTo(-.76+i*.13,.38);c.stroke()}
 c.strokeStyle='rgba(145,111,51,.3)';c.beginPath();c.moveTo(.08,-.62);c.quadraticCurveTo(-.13,.02,.13,.57);c.stroke();
 eye(c,.56,-.22,.29);c.lineWidth=.034;c.lineCap='round';
 if(chomp)oval(c,1.025,.17,.095,.06+chomp*.08,'#785331');else path(c,'M .83 .15 Q 1.01 .25 1.11 .12',null,'#785c31');
 c.restore();
}
export function seaBeast(c,r,t,wob,chomp){
 c.save();c.scale(r,r);c.lineWidth=.023;c.lineJoin='round';tail(c,-1.93,wob*.7,'#eac361');
 path(c,'M .35 -.53 C .02 -1.02 -.48 -.85 -.42 -.59 C -.28 -.36 .12 -.22 .35 -.53 Z','#dcb051','#b69248');
 const body=path(c,'M 1.55 -.04 C 1.61 -.58 1.27 -.96 .81 -.96 C .35 -.98 .09 -.72 -.26 -.63 C -.84 -.49 -1.37 -.28 -1.93 -.13 Q -2.08 .02 -1.91 .19 C -1.34 .3 -.98 .61 -.39 .73 C .18 .91 .85 .91 1.26 .52 C 1.48 .33 1.56 .15 1.55 -.04 Z',gradient(c,'#ffec9b','#edc763'),'#b89547');
 c.save();c.clip(body);oval(c,.02,.39,1.09,.41,'#fff0c8',-.16);oval(c,.62,-.72,.46,.12,'rgba(255,255,217,.27)',-.16);c.restore();
 path(c,'M .28 .3 C -.16 .25 -.34 .55 -.06 .7 C .18 .82 .61 .73 .61 .59 C .58 .47 .46 .35 .28 .3 Z',gradient(c,'#ffe296','#e2b653'),'#c29a49');
 eye(c,1.04,-.28,.27);c.lineWidth=.03;c.lineCap='round';
 if(chomp)oval(c,1.45,.09,.1,.055+chomp*.07,'#805b36');else path(c,'M 1.24 .09 Q 1.42 .2 1.53 .07',null,'#785c31');
 c.restore();
}
export function creatureArt(c,creature,size,t){
 c.save();c.scale(size,size);c.lineWidth=.035;c.lineJoin='round';const type=creature.type,wob=Math.sin(t*7+(creature.phase||0))*.18;
 if(type==='shrimp'){
  path(c,'M -.9 .19 Q -1.05 -.04 -.83 -.39 Q -.53 -.76 .19 -.51 Q .68 -.46 .85 -.08 L .61 .24 Q .13 .02 -.21 .04 Q -.68 -.09 -.9 .19 Z',gradient(c,'#ffe0b4','#ef8e69'),'#b65e4e');
  path(c,'M -.79 .11 L -1.23 .11 L -1.17 .45 L -.76 .31 Z','#ef9978','#b65e4e');
  for(let i=0;i<5;i++){const x=-.65+i*.24;path(c,`M ${x} -.48 Q ${x+.18} -.21 ${x+.12} .04`,null,'#c66d55');path(c,`M ${x+.1} .07 L ${x+.16} .43 L ${x-.02} .57`,null,'#f0b99a')}
  path(c,'M .53 -.25 Q 1.08 -1.1 1.85 -.77 M .63 -.16 Q 1.24 -.67 1.93 -.22',null,'#ffddbc');oval(c,.69,-.32,.095,.11,'#26332c');oval(c,.71,-.35,.025,.025,'#fff5d8');
 }else if(['fry','small','mid'].includes(type)){
  const colors=type==='small'?['#fff0b2','#efae58','#b88044']:type==='mid'?['#c2f0e4','#54aab7','#346b80']:['#e0fff1','#8accc3','#508e94'];
  tail(c,-1.1,wob,colors[1]);path(c,'M -.5 -.43 Q -.35 -1.1 .35 -.61 L .55 -.38 Z',colors[1],colors[2]);
  const body=path(c,'M 1.3 0 C 1.06 -.8 -.29 -1.04 -1.2 -.1 C -.5 .97 .69 .79 1.3 0 Z',gradient(c,colors[0],colors[1]),colors[2]);
  c.save();c.clip(body);oval(c,.1,.4,.94,.22,'rgba(255,255,230,.45)');
  for(let i=0;i<4;i++)path(c,`M ${-.68+i*.3} -.6 Q ${-.37+i*.3} 0 ${-.72+i*.3} .5`,null,'rgba(35,104,115,.22)');c.restore();
  path(c,'M -.05 -.02 Q -.55 .4 -.29 .45 Q .15 .32 -.05 -.02 Z',colors[0],colors[2]);
  oval(c,.81,-.14,.16,.18,'#f6f3d6');oval(c,.85,-.13,.09,.11,'#152c31');oval(c,.87,-.17,.025,.025,'white');path(c,'M .45 -.3 Q .29 0 .48 .25 M 1.07 .12 L 1.24 .08',null,colors[2]);
 }else{
  const boss=creature.boss;
  path(c,`M -1.15 -.05 Q -1.58 -.3 -1.83 ${-.91+wob} L -1.98 -.86 L -1.82 -.02 L -2.02 .59 Q -1.63 .54 -1.23 .13 Z`,'#638593','#365768');
  path(c,'M -.42 -.36 Q -.38 -.83 -.04 -1.04 Q -.03 -.59 .37 -.43 Z','#638593','#365768');
  const body=path(c,'M 1.26 -.08 C .77 -.68 -.27 -.67 -1.33 -.15 L -1.4 .05 C -.58 .46 .37 .65 1.18 .24 Q 1.43 .12 1.26 -.08 Z',gradient(c,boss?'#aac2c7':'#c2d6d5',boss?'#547482':'#7699a5'),'#365768');
  c.save();c.clip(body);path(c,'M -1.4 .08 Q -.12 .18 .77 .03 Q 1.15 .12 1.4 .03 L 1.5 .6 L -.9 .7 Z','#d3e3dc');c.restore();
  path(c,'M -.05 .12 Q -.3 .59 -.77 .69 Q -.42 .29 -.48 .12 Z','#577e8d','#365768');
  for(let i=0;i<3;i++)path(c,`M ${.13+i*.12} -.23 Q ${.04+i*.12} -.01 ${.13+i*.12} .17`,null,'#3c606b');
  oval(c,.82,-.16,.095,.085,'#102b34');oval(c,.84,-.18,.024,.024,'#dffbfa');
  path(c,'M .65 .16 Q .98 .14 1.26 .06 L 1.2 .25 Q .91 .33 .65 .16 Z','#27434b');
  for(let i=0;i<4;i++)path(c,`M ${.78+i*.105} .16 l .035 .075 l .045 -.09 Z`,'#fff5dc');
  if(boss)path(c,'M -.65 -.31 L -.4 -.18 M -.58 -.34 L -.48 -.16',null,'#bad1cf');
 }
 c.restore();
}
export function seabed(c,renderer,game,cam){
 const left=Math.max(0,Math.floor((cam.x-cam.vw/2-200)/90)*90),right=Math.min(7000,cam.x+cam.vw/2+200);
 c.save();c.translate(renderer.sx(0,cam),renderer.sy(0,cam));c.scale(cam.scale,cam.scale);
 const g=c.createLinearGradient(0,920,0,1100);g.addColorStop(0,'rgba(113,179,163,.15)');g.addColorStop(.45,'rgba(18,63,77,.8)');g.addColorStop(1,'#102b40');
 c.beginPath();c.moveTo(left,1100);for(let x=left;x<=right+90;x+=30)c.lineTo(x,964+Math.sin(x*.013)*15+Math.sin(x*.037)*7);c.lineTo(right+90,1100);c.closePath();c.fillStyle=g;c.fill();
 for(let x=left;x<right;x+=90){const n=noise(x),base=970+Math.sin(x*.013)*12;
  for(let k=0;k<7;k++)oval(c,x+k*12,base+noise(x+k)*45,2+noise(x+k*7)*5,1.4,'rgba(174,211,185,.18)');
  for(let j=0;j<4;j++){const bx=x+j*9,ht=22+noise(x+j)*46,wave=Math.sin(game.elapsed*.8+x+j)*7;c.lineWidth=1;path(c,`M ${bx} ${base} Q ${bx-14+wave} ${base-ht*.6} ${bx+wave} ${base-ht} Q ${bx+12+wave} ${base-ht*.5} ${bx} ${base} Z`,j%2?'#438e88':'#327772')}
  if(n>.42){c.save();c.translate(x+53,base+7);c.lineWidth=1;path(c,'M 0 0 C -18 -13 -12 -23 0 -20 C 13 -24 20 -12 0 0 Z','#a9bcaa','#638f8c');for(let k=-2;k<3;k++)path(c,`M 0 0 L ${k*4} -17`,null,'#719a93');c.restore()}
 }
 c.restore();
}
export function stoneDetail(c,p,renderer,cam){
 const x=renderer.sx(p.x,cam),y=renderer.sy(p.y,cam),w=p.w*cam.scale,h=p.h*cam.scale;
 c.save();c.translate(x,y);c.lineWidth=Math.max(.6,cam.scale);c.lineCap='round';
 const pier=(px,pw,top,height)=>{
  for(let row=0;row<7;row++){const yy=top+height*(row+.4)/7;path(c,`M ${px-pw/2} ${yy} L ${px+pw/2} ${yy}`,null,'rgba(5,23,34,.36)');path(c,`M ${px-pw/2} ${yy+1.5} L ${px+pw/2} ${yy+1.5}`,null,'rgba(196,231,209,.16)');const xx=px+pw*(noise(row+p.x)-.5)*.7;path(c,`M ${xx} ${yy} l ${pw*.12} ${height*.04} l ${-pw*.17} ${height*.03}`,null,'rgba(9,32,42,.4)')}
  for(let i=0;i<15;i++){const xx=px+(noise(i+p.x)-.5)*pw,yy=top+noise(i*8+p.x)*height;oval(c,xx,yy,1+cam.scale*2,cam.scale*1.2,'rgba(144,199,158,.22)')}
 };
 if(p.kind==='column')pier(0,w,-h/2,h);
 if(p.kind==='arch'||p.kind==='gate'){for(const sign of [-1,1])pier(sign*w*.38,w*.15,-h*.36,h*.86);for(let i=-4;i<=4;i++){const xx=i*w*.09,yy=-h*.48+Math.abs(i)*h*.008;path(c,`M ${xx} ${yy} l ${i*w*.003} ${h*.095}`,null,'rgba(7,29,40,.45)')}}
 if(p.kind==='wreck'){
  c.scale(p.flip?-1:1,1);for(let i=0;i<5;i++){const yy=h*(-.06+i*.09);path(c,`M ${-w*.39} ${yy} Q 0 ${yy+h*.06} ${w*.43} ${yy}`,null,'rgba(191,161,111,.24)');for(let j=0;j<7;j++)oval(c,w*(-.34+j*.11),yy+3,1,1,'#233c40')}
  for(let i=0;i<4;i++){c.strokeStyle='#8d9e8d';c.lineWidth=2; c.beginPath();c.arc(-w*.24+i*w*.17,h*.1,w*.027,0,TAU);c.stroke()}
  path(c,`M ${-w*.36} ${-h*.18} L ${-w*.02} ${-h*.87} L ${w*.35} ${-h*.18}`,null,'rgba(179,202,176,.4)');
 }
 if(p.kind==='throne'){for(let i=0;i<4;i++){const yy=-h*.31+i*h*.11;path(c,`M ${-w*.22} ${yy} L ${w*.22} ${yy}`,null,'rgba(151,210,206,.15)')}for(const sign of [-1,1]){path(c,`M ${sign*w*.19} ${-h*.3} L ${sign*w*.19} ${h*.04} L ${sign*w*.08} ${h*.04}`,null,'rgba(147,237,230,.4)')}}
 c.restore();
}
export function coralGarden(c,p,renderer,cam){
 c.save();c.translate(renderer.sx(p.x,cam),renderer.sy(p.y,cam));const s=p.w*cam.scale*.5;c.scale(s,s);c.lineCap='round';
 oval(c,0,.27,1.05,.32,'#365c6a');oval(c,-.2,.15,.66,.2,'#527e7f');
 const branch=(x,y,a,len,width,depth,seed)=>{
  const ex=x+Math.cos(a)*len,ey=y+Math.sin(a)*len;
  c.strokeStyle=seed%2?'#d67983':'#ecaa8b';c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.cos(a+.15)*len*.6,y+Math.sin(a+.15)*len*.6,ex,ey);c.stroke();
  c.strokeStyle='rgba(255,222,185,.38)';c.lineWidth=width*.25;c.beginPath();c.moveTo(x-width*.18,y);c.lineTo(ex-width*.18,ey);c.stroke();
  if(depth){branch(ex,ey,a-.48,len*.62,width*.64,depth-1,seed+1);branch(ex,ey,a+.48,len*.59,width*.6,depth-1,seed+2)}else oval(c,ex,ey,width*.7,width*.8,'#ffd6b5');
 };
 for(let i=0;i<3;i++)branch((i-1)*.52,.16,-Math.PI/2+(i-1)*.12,.55+noise(p.x+i)*.28,.12,3,i);
 for(let i=0;i<5;i++){const xx=-.7+i*.33,yy=.23+Math.sin(i)*.06;c.lineWidth=.018;path(c,`M ${xx-.17} ${yy} Q ${xx-.23} ${yy-.42} ${xx} ${yy-.48} Q ${xx+.24} ${yy-.4} ${xx+.17} ${yy} Z`,i%2?'#9291af':'#dba49f','#587d87');oval(c,xx,yy-.39,.11,.04,'#675b81');oval(c,xx-.025,yy-.42,.075,.018,'#ddc6c1')}
 c.restore();
}
export function statue(c,p,renderer,cam,pal){
 const w=p.w*cam.scale,h=p.h*cam.scale;c.save();c.translate(renderer.sx(p.x,cam),renderer.sy(p.y,cam));
 c.fillStyle=pal.rock;c.fillRect(-w*.34,h*.25,w*.68,h*.24);c.fillStyle='#416879';c.fillRect(-w*.42,h*.44,w*.84,h*.06);
 c.save();c.scale(w*.32,h*.38);c.lineWidth=.035;
 path(c,'M -.8 .6 C -.75 .05 -.42 -.25 -.39 -.65 C -.49 -1.16 -.06 -1.43 .3 -1.21 C .71 -.97 .52 -.7 .38 -.48 C .58 .02 .81 .42 .67 .79 Q .03 1.13 -.8 .6 Z',gradient(c,'#73968e','#456d77'),'#294f63');
 path(c,'M -.5 -.12 C -1.02 .03 -1.25 .43 -1.04 .58 Q -.68 .3 -.32 .23 M .35 -.22 Q .99 .14 .9 .52 Q .69 .43 .47 .31',null,'#a3b9a1');
 path(c,'M -.15 -.2 Q -.46 .49 -.04 .75 Q .42 .65 .25 -.14 Z',null,'rgba(186,201,161,.3)');
 eye(c,.27,-.86,.09);path(c,'M .17 -.65 Q .37 -.57 .46 -.65 M -.18 -.91 L -.05 -.56 L -.23 -.3 M .12 .31 L -.07 .43 L .05 .69',null,'#294c5c');
 for(let i=0;i<15;i++)oval(c,(noise(i+p.x)-.5)*1.1,noise(i*7+p.x)*1.65-.8,.055,.025,'rgba(152,183,123,.42)');
 c.restore();c.restore();
}
