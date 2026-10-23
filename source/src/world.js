// One continuous town: a central plaza and avenues connect four enlarged districts.
export const TOWN_SIZE=108,TOWN_HALF=54;
export const AREAS=Object.freeze([
 {id:0,x:0,z:0,name:'城堡广场',unlock:1,color:'#f4e6c8'},
 {id:1,x:-30,z:-30,name:'住宅菜园',unlock:2,color:'#d9e8b1'},
 {id:2,x:-30,z:30,name:'甜品商业街',unlock:3,color:'#f4dfc4'},
 {id:3,x:30,z:-30,name:'彩虹游乐场',unlock:4,color:'#e8ddec'},
 {id:4,x:30,z:30,name:'湖畔公园',unlock:5,color:'#cce4ba'}
]);
export function areaAt(x,z){
 if(Math.abs(x)>54||Math.abs(z)>54)return undefined;
 if(Math.abs(x)<=6||Math.abs(z)<=6||Math.max(Math.abs(x),Math.abs(z))<=12)return AREAS[0];
 return AREAS[x<0?(z<0?1:2):(z<0?3:4)];
}
// Avenues are introduced together with the adjoining district, not visible arms at level one.
export function landAreaId(x,z){
 if(Math.max(Math.abs(x),Math.abs(z))<=12)return 0;
 if(Math.abs(x)<=6)return z<0?1:2;
 if(Math.abs(z)<=6)return x<0?1:3;
 return x<0?(z<0?1:2):(z<0?3:4);
}
export const WORLD_SIDES=Object.freeze([24,45,66,87,108]);
export const WATER_SPEED=.75;
export function worldHalf(open=5,expansion=null){
 const base=WORLD_SIDES[Math.max(0,Math.min(4,open-1))]/2;
 if(!expansion)return base;
 const from=expansion.fromHalf??base;
 const t=Math.max(0,Math.min(1,expansion.elapsed)),smooth=t*t*(3-2*t);
 return from+(WORLD_SIDES[expansion.stage]/2-from)*smooth;
}
export function worldLand(open=5,expansion=null){const h=worldHalf(open,expansion);return {rects:[{x0:-h,x1:h,z0:-h,z1:h}],edges:[{axis:'x',fixed:-h,lo:-h,hi:h},{axis:'x',fixed:h,lo:-h,hi:h},{axis:'z',fixed:-h,lo:-h,hi:h},{axis:'z',fixed:h,lo:-h,hi:h}]}}
export function canWalkWorld(x,z,r,open,expansion=null){const h=worldHalf(open,expansion);return Number.isFinite(x+z+r)&&r>=0&&Math.max(Math.abs(x),Math.abs(z))+r<=h+1e-8}
export function worldExtent(open=5,expansion=null){const h=worldHalf(open,expansion);return {minX:-h,maxX:h,minZ:-h,maxZ:h}}
export const LAKE=Object.freeze({x:35,z:35,w:20,d:18});
export function inShallows(x,z){return Math.abs(x-LAKE.x)<LAKE.w/2&&Math.abs(z-LAKE.z)<LAKE.d/2}
// Shallows are traversable; buildings and the moving outer walls still collide.
export function canWalkTownTerrain(x,z,r){return Number.isFinite(x+z+r)&&r>=0}
export const RESIDENT_ROUTES=Object.freeze([
 [[-9,-5],[-9,9],[9,9],[9,-9]],
 [[-15,-16],[-32,-15],[-48,-30],[-15,-48]],
 [[-31,16],[-31,30],[-31,46],[-15,30]],
 [[16,-16],[32,-15],[47,-31],[30,-48]],
 [[16,16],[47,16],[48,48],[16,48]]
]);
