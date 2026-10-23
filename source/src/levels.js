export const LEVELS=Object.freeze([
 {id:0,name:'奶油城堡小镇',landmark:'奶油皇冠城堡',areas:['城堡广场','住宅菜园','甜品商业街','彩虹游乐场','湖畔公园']},
 {id:1,name:'糖果森林遗迹',landmark:'糖晶古代遗迹',areas:['遗迹营地','蘑菇林地','森林集市','水晶游园','精灵湖畔']},
 {id:2,name:'海底遗迹',landmark:'王座深渊巨鲨',areas:['珊瑚浅湾','沉没回廊','古代神殿','沉船裂谷','王座深渊'],scene:'sea'}
]);
export const PORTAL_SECONDS=2;
export function toLevel(x,z,level){return level===1?{x:-z,z:x}:{x,z}}
export function fromLevel(x,z,level){return level===1?{x:z,z:-x}:{x,z}}
export function levelExtent(e,level){if(level!==1)return e;return {minX:-e.maxZ,maxX:-e.minZ,minZ:e.minX,maxZ:e.maxX}}
export function levelColor(color,level){if(level!==1)return color;return ({'#c9dfa9':'#b4d4be','#d9e8b1':'#b8ddce','#f4dfc4':'#e1d6ed','#e8ddec':'#cde6d8','#cce4ba':'#bddbd6','#f4e6c8':'#eadff0','#eee6cf':'#e3ddd0','#e8a2b3':'#c29ed4','#8fcddf':'#91cccb','#c7a181':'#b2a38c'})[color]||color}
