import {emptyOutfits,itemById,availableItems,type CharacterId,type Outfit,type Slot,type SeasonId} from './data'
export type Looks=Record<CharacterId,Outfit>
export type DressState={version:4;season:SeasonId;looks:Looks;selected:CharacterId;history:Looks[];photo:boolean}
export const dressKey='game:dressup:spring:r1'
export const freshDress=():DressState=>({version:4,season:'spring',looks:emptyOutfits(),selected:'girl',history:[],photo:false})
export type DressAction={type:'season';season:SeasonId}|{type:'select';character:CharacterId}|{type:'equip';character:CharacterId;itemId:string}|{type:'remove';character:CharacterId;slot:Slot}|{type:'undo'}|{type:'reset';character?:CharacterId}|{type:'random';character:CharacterId;random?:()=>number}|{type:'photo';value:boolean}
export function equip(outfit:Outfit,itemId:string,character:CharacterId):Outfit{
 const item=itemById[itemId];if(!item||!item.compatibleCharacters.includes(character))return outfit
 const next={...outfit};for(const slot of item.conflictsWith)delete next[slot];next[item.equipSlot]=itemId;return next
}
export function dressReducer(s:DressState,a:DressAction):DressState{
 if(a.type==='season')return {...s,season:a.season,photo:false}
 if(a.type==='select')return {...s,selected:a.character}
 if(a.type==='photo')return {...s,photo:a.value}
 if(a.type==='undo')return s.history.length?{...s,looks:s.history.at(-1)!,history:s.history.slice(0,-1)}:s
 let looks=s.looks
 if(a.type==='equip'){const outfit=equip(s.looks[a.character],a.itemId,a.character);if(outfit===s.looks[a.character]||JSON.stringify(outfit)===JSON.stringify(s.looks[a.character]))return s;looks={...looks,[a.character]:outfit}}
 if(a.type==='remove'){if(!looks[a.character][a.slot])return s;const outfit={...looks[a.character]};delete outfit[a.slot];looks={...looks,[a.character]:outfit}}
 if(a.type==='reset')looks=a.character?{...looks,[a.character]:{}}:emptyOutfits()
 if(a.type==='random'){
  const random=a.random??Math.random;let outfit:Outfit={}
  const full=availableItems(a.character,undefined,s.season).filter(item=>item.equipSlot==='onepiece'&&item.season.includes(s.season))
  if(full.length&&random()<.3)outfit=equip(outfit,full[Math.min(full.length-1,Math.floor(random()*full.length))].itemId,a.character)
  for(const category of (a.character==='dog'?['outfit','shoes','head'] as const:['bottom','top','shoes','head'] as const)){if((outfit.onepiece||outfit.dogOutfit)&&(category==='bottom'||category==='top'))continue;const pool=availableItems(a.character,category,s.season).filter(item=>item.season.includes(s.season)).filter(item=>a.character==='dog'||!['onepiece','dogOutfit'].includes(item.equipSlot));const picked=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];if(picked)outfit=equip(outfit,picked.itemId,a.character)}
  looks={...looks,[a.character]:outfit}
 }
 if(JSON.stringify(looks)===JSON.stringify(s.looks))return s
 return {...s,looks,history:[...s.history,s.looks].slice(-30)}
}
function validLooks(value:unknown):value is Looks{
 if(!value||typeof value!=='object')return false
 return (['boy','girl','dog'] as const).every(character=>{const look=(value as Looks)[character];return !!look&&typeof look==='object'&&!Array.isArray(look)&&Object.entries(look).every(([slot,id])=>typeof id==='string'&&itemById[id]?.equipSlot===slot&&itemById[id].compatibleCharacters.includes(character))&&!((look.onepiece||look.dogOutfit)&&(look.top||look.bottom))&&!(look.onepiece&&look.dogOutfit)})
}
export function validDress(value:unknown):value is DressState{const s=value as DressState;return !!s&&s.version===4&&['spring','summer','autumn','winter'].includes(s.season)&&['boy','girl','dog'].includes(s.selected)&&typeof s.photo==='boolean'&&validLooks(s.looks)&&Array.isArray(s.history)&&s.history.length<=30&&s.history.every(validLooks)}
/** Keep the original save key and IDs; migrate old slots and undo snapshots without erasing a look. */
export function restoreDress(value:unknown):DressState{
 if(validDress(value))return value
 if(!value||typeof value!=='object')return freshDress()
 const old=value as Record<string,unknown>
 if((old.version!==1&&old.version!==2&&old.version!==3)||!['spring','summer','autumn','winter'].includes(String(old.season))||!['boy','girl','dog'].includes(String(old.selected))||typeof old.photo!=='boolean'||!Array.isArray(old.history)||old.history.length>30)return freshDress()
 function convert(looks:unknown):Looks|null{
  if(!looks||typeof looks!=='object')return null
  const next=emptyOutfits()
  for(const character of ['boy','girl','dog'] as const){
   const look:unknown=(looks as Record<string,unknown>)[character];if(!look||typeof look!=='object'||Array.isArray(look))return null
   for(const [slot,id] of Object.entries(look)){
    if(character==='boy'&&['hat','headwear'].includes(slot)&&['flower-band','ribbon-hat'].includes(String(id)))continue
    const aliases:Record<string,Slot>=character==='dog'?{hat:'dogHeadwear',headwear:'dogHeadwear',dogHeadwear:'dogHeadwear',glasses:'dogEyewear',eyewear:'dogEyewear',dogEyewear:'dogEyewear',shoes:'dogFootwear',footwear:'dogFootwear',dogFootwear:'dogFootwear',full:'dogOutfit',dogOutfit:'dogOutfit',top:'dogOutfit',dogTop:'dogOutfit',bottom:'dogOutfit',dogBottom:'dogOutfit'}:{hat:'headwear',glasses:'eyewear',shoes:'footwear',full:'onepiece',headwear:'headwear',eyewear:'eyewear',top:'top',bottom:'bottom',footwear:'footwear',onepiece:'onepiece',handbag:'handbag'}
    const migrated=aliases[slot],mapped=id==='dog-shorts'?'dog-allinone':id==='dog-waist'?'dog-harness':id
    if(!migrated||typeof mapped!=='string'||itemById[mapped]?.equipSlot!==migrated||!itemById[mapped].compatibleCharacters.includes(character))return null
    if(character==='dog'&&migrated==='dogOutfit')continue
    next[character][migrated]=mapped
   }
   if(character==='dog'){
    // Prefer a full outfit, then a top, then a retired bottom; migrate undo snapshots identically.
    const source=look as Record<string,string>,id=source.dogOutfit??source.full??source.dogTop??source.top??source.dogBottom??source.bottom
    if(id)next.dog.dogOutfit=id==='dog-shorts'?'dog-allinone':id==='dog-waist'?'dog-harness':id
   }
  }
  return validLooks(next)?next:null
 }
 const looks=convert(old.looks),history=old.history.map(convert)
 if(!looks||history.some(look=>!look))return freshDress()
 return {version:4,season:old.season as SeasonId,selected:old.selected as CharacterId,photo:old.photo,looks,history:history as Looks[]}
}
export const hasLooks=(s:DressState)=>Object.values(s.looks).some(look=>Object.keys(look).length>0)
