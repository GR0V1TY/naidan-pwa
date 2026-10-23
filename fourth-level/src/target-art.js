// Measured from the complete visible silhouette of the generated transparent PNG.
// The sprite fits the existing circular proxy without changing physical geometry.
export const TARGET_ART=Object.freeze({
 sourceRect:Object.freeze([125,144,1100,1113]),
 center:Object.freeze([612.5,628.5]),fitRadius:597.9044535950206,
 width:1254,height:1254,hitSeconds:.16
});
export function targetPose(entity){
 const radius=entity.boss?29:23,hit=Math.max(0,Math.min(1,(entity.hitFlash||0)/TARGET_ART.hitSeconds));
 return {x:entity.body.position.x,y:entity.body.position.y,angle:entity.body.angle,radius,hit,boss:Boolean(entity.boss),scale:radius/(TARGET_ART.fitRadius*1.06),squashX:1+.055*hit,squashY:1-.05*hit};
}
