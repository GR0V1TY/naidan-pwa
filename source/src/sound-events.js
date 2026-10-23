// Semantic sound events carry positions; synthesis stays outside the gameplay core.
export function soundEvent(game,prop,cue,extra={}){game.events.push({kind:'sound',cue,id:prop.id,x:prop.x,z:prop.z,...extra})}
