import type { Drawing } from './types'
import police from './scenes/police-car-robot.json' with { type: 'json' }
import fire from './scenes/fire-robot.json' with { type: 'json' }
import dinosaur from './scenes/baby-dinosaur.json' with { type: 'json' }
import butterfly from './scenes/garden-butterfly.json' with { type: 'json' }
export type { Drawing, Region, PaintColor } from './types'
export const revisedDrawings = [police, fire, dinosaur, butterfly] as Drawing[]
const tints=['mint','pink','lemon','lavender'] as const
export const officialCatalog=revisedDrawings.map((drawing,index)=>({id:drawing.id,title:drawing.title,colorCount:drawing.colors.length,tint:tints[index]}))
export const featuredDrawing = revisedDrawings[0]
export const drawings:Record<string,Drawing>=Object.fromEntries(revisedDrawings.map(d=>[d.id,d]))
