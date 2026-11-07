import type {CharacterId,Outfit,Slot} from './data'
export type Anchor={x:number;y:number}
export type Foot=Anchor&{width:number;depth:'far'|'near';facing:1|-1}
export type FittingRig={anchors:Partial<Record<Slot,Anchor>>;headWidth:number;hairSeat:number;waist:number;feet:Foot[];preview:Partial<Record<Slot,string>>}
const human: FittingRig={
 anchors:{headwear:{x:160,y:98},eyewear:{x:160,y:139},top:{x:160,y:220},bottom:{x:160,y:330},onepiece:{x:160,y:220},footwear:{x:160,y:470}},
 headWidth:132,hairSeat:111,waist:330,
 feet:[{x:139,y:470,width:1,depth:'near',facing:-1},{x:181,y:470,width:1,depth:'near',facing:1}],
 preview:{headwear:'65 28 190 118',eyewear:'99 112 122 61',top:'72 192 176 164',bottom:'92 316 136 156',onepiece:'65 205 190 250',footwear:'95 417 130 80'},
}
export const fittingRigs:Record<CharacterId,FittingRig>={boy:human,girl:{...human},dog:{
 anchors:{dogHeadwear:{x:108,y:276},dogEyewear:{x:109,y:310},dogOutfit:{x:190,y:355},dogFootwear:{x:190,y:474}},
 headWidth:110,hairSeat:285,waist:389,
 feet:[{x:138,y:456,width:.64,depth:'far',facing:-1},{x:257,y:456,width:.64,depth:'far',facing:-1},{x:112,y:474,width:.8,depth:'near',facing:-1},{x:231,y:474,width:.8,depth:'near',facing:-1}],
 preview:{dogHeadwear:'40 235 142 80',dogEyewear:'51 284 118 56',dogOutfit:'86 327 213 147',dogFootwear:'82 427 200 65'},
}}
export function layerPlan(character:CharacterId,outfit:Outfit){
 const full=character==='dog'?outfit.dogOutfit:outfit.onepiece
 return {full,baseTop:character!=='dog'&&!full&&!outfit.top,baseBottom:character!=='dog'&&!full&&!outfit.bottom,baseFootwear:character==='dog'?!outfit.dogFootwear:!outfit.footwear,tuckBaseTop:!!outfit.bottom,
  order:(character==='dog'?['dogOutfit','dogFootwear','dogEyewear','dogHeadwear']:['bottom','top','onepiece','footwear','eyewear','headwear']) as Slot[]}
}
