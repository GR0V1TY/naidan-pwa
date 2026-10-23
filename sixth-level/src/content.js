export const VERSION='0.37.0';
export const RELEASE_PATH=`/slice-v${VERSION}/`;
export const RULES=Object.freeze({duration:90,goal:800,maxMistakes:3,gravity:780,minSwipe:4,bombPenalty:50,stainLifetime:8,maxStains:72,combo:{3:20,4:40,5:80}});
const fruitNames=['葡萄','樱桃','橘子','柠檬','猕猴桃','番茄','桃子','菠萝','椰子','半奶蛙','神奶蛙'];
const files=['01-grape','02-cherry','03-orange','04-lemon','05-kiwi','06-tomato','07-peach','08-pineapple','09-coconut','10-halfmelon','11-watermelon'];
const colors=['#bd91e3','#f27f97','#ffb058','#f3df77','#a0c879','#f77d6e','#ffb8ca','#ffd067','#cfb392','#a8d78c','#c0e3a0'];
const fruitRadii=[29,33,37,40,43,46,49,53,57,62,68];
const modelRadii=[35,40,45,50,56];
export const TARGETS=Object.freeze([
 ...fruitNames.map((name,i)=>({id:files[i],name,group:'fruit',file:`assets/fruits/${files[i]}.webp`,points:i<9?10:50,color:colors[i],r:fruitRadii[i],rare:i>=9})),
 ...['奶蛋','奶娃·萌芽','奶娃·幼年','奶娃·少年','奶娃·完全体'].map((name,stage)=>({id:`model-${stage}`,name,group:'model',stage,points:20,color:'#ffe2a1',r:modelRadii[stage]})),
 {id:'bomb',name:'炸弹',group:'bomb',points:0,color:'#ee735f',r:38}
]);
export const BY_ID=Object.fromEntries(TARGETS.map(t=>[t.id,t]));
export function stageAt(time){return time<30?1:time<60?2:3;}
export function comboBonus(n){return n>=5?80:n===4?40:n===3?20:0;}
