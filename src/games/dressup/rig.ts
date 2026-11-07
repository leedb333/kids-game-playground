import type {CharacterId,Outfit,Slot} from './data'
export type Anchor={x:number;y:number}
export type Foot=Anchor&{width:number;depth:'far'|'near';facing:1|-1}
export type FittingRig={anchors:Record<Slot,Anchor>;headWidth:number;hairSeat:number;waist:number;feet:Foot[];preview:Record<Slot,string>}
const human: FittingRig={
 anchors:{headwear:{x:160,y:98},eyewear:{x:160,y:139},top:{x:160,y:220},bottom:{x:160,y:330},onepiece:{x:160,y:220},dogOutfit:{x:160,y:220},footwear:{x:160,y:470}},
 headWidth:132,hairSeat:111,waist:330,
 feet:[{x:139,y:470,width:1,depth:'near',facing:-1},{x:181,y:470,width:1,depth:'near',facing:1}],
 preview:{headwear:'65 28 190 118',eyewear:'99 112 122 61',top:'72 192 176 164',bottom:'92 316 136 156',onepiece:'65 205 190 250',dogOutfit:'65 205 190 250',footwear:'95 417 130 80'},
}
export const fittingRigs:Record<CharacterId,FittingRig>={boy:human,girl:{...human},dog:{
 anchors:{headwear:{x:110,y:256},eyewear:{x:110,y:291},top:{x:190,y:350},bottom:{x:248,y:389},onepiece:{x:190,y:350},dogOutfit:{x:190,y:350},footwear:{x:190,y:470}},
 headWidth:116,hairSeat:264,waist:389,
 feet:[{x:137,y:442,width:.62,depth:'far',facing:-1},{x:250,y:442,width:.62,depth:'far',facing:1},{x:109,y:470,width:.8,depth:'near',facing:-1},{x:229,y:470,width:.8,depth:'near',facing:1}],
 preview:{headwear:'29 209 167 88',eyewear:'58 267 108 51',top:'80 315 218 122',bottom:'192 359 112 104',onepiece:'80 316 218 155',dogOutfit:'80 316 218 155',footwear:'76 416 208 83'},
}}
export function layerPlan(character:CharacterId,outfit:Outfit){
 const full=character==='dog'?outfit.dogOutfit:outfit.onepiece
 return {full,baseTop:character!=='dog'&&!full&&!outfit.top,baseBottom:character!=='dog'&&!full&&!outfit.bottom,baseFootwear:!outfit.footwear,tuckBaseTop:!!outfit.bottom,
  order:['bottom','top','onepiece','dogOutfit','footwear','eyewear','headwear'] as Slot[]}
}
