import {fittingRigs} from './rig'
export type CharacterId = 'boy' | 'girl' | 'dog'
export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter'
export type Category = 'head' | 'top' | 'bottom' | 'shoes' | 'outfit'
export type Slot = 'headwear' | 'eyewear' | 'top' | 'bottom' | 'onepiece' | 'footwear' | 'dogHeadwear' | 'dogEyewear' | 'dogOutfit' | 'dogFootwear'
export type Outfit = Partial<Record<Slot,string>>
export type Item = {
 itemId:string; name:string; season:SeasonId[]; category:Category; compatibleCharacters:CharacterId[];
 equipSlot:Slot; image:string; color:string; accent:string;
 anchorPosition:Partial<Record<CharacterId,{x:number;y:number}>>; scale:number; layerOrder:number; conflictsWith:Slot[]
}
export const characters: {id:CharacterId;name:string;subtitle:string}[] = [
 {id:'boy',name:'하루',subtitle:'남자아이'},{id:'girl',name:'보미',subtitle:'여자아이'},{id:'dog',name:'두부',subtitle:'강아지'},
]
export const seasons:{id:SeasonId;name:string;title:string;ready:boolean;color:string}[]=[
 {id:'spring',name:'봄',title:'꽃길을 걸어요',ready:true,color:'#dce9ce'},
 {id:'summer',name:'여름',title:'햇살 가득한 날',ready:false,color:'#d7eaf1'},
 {id:'autumn',name:'가을',title:'낙엽 소풍',ready:false,color:'#f0dfc7'},
 {id:'winter',name:'겨울',title:'포근한 눈꽃',ready:false,color:'#e2e7f2'},
]
export const categories:{id:Category;name:string;short:string}[]=[{id:'head',name:'모자·안경',short:'모자·안경'},{id:'top',name:'상의·세트',short:'상의'},{id:'bottom',name:'하의',short:'하의'},{id:'shoes',name:'신발',short:'신발'}]
export const dogCategories:typeof categories=[{id:'head',name:'모자·안경',short:'모자·안경'},{id:'outfit',name:'강아지 옷',short:'강아지 옷'},{id:'shoes',name:'신발',short:'신발'}]
export const categoriesFor=(character:CharacterId)=>character==='dog'?dogCategories:categories
const human:CharacterId[]=['boy','girl']
function item(itemId:string,name:string,category:Category,equipSlot:Slot,image:string,color:string,accent:string,compatibleCharacters:CharacterId[]=human):Item{
 return {itemId,name,season:['spring'],category,compatibleCharacters,equipSlot,image,color,accent,anchorPosition:Object.fromEntries(compatibleCharacters.map(id=>[id,fittingRigs[id].anchors[equipSlot]])),scale:1,layerOrder:['eyewear','dogEyewear'].includes(equipSlot)?80:['headwear','dogHeadwear'].includes(equipSlot)?90:['footwear','dogFootwear'].includes(equipSlot)?60:equipSlot==='bottom'?20:30,conflictsWith:equipSlot==='onepiece'?['top','bottom']:equipSlot==='top'||equipSlot==='bottom'?['onepiece']:[]}
}
export const items:Item[]=[
 item('mint-cap','민트 야구모자','head','headwear','cap','#92beb2','#e6f0d6'),
 item('peach-bucket','복숭아 벙거지','head','headwear','bucket','#e9b5a2','#fff1d5'),
 item('straw-hat','산책 밀짚모자','head','headwear','straw','#e7ca8e','#b77e83'),
 item('berry-beret','딸기 베레모','head','headwear','beret','#c98193','#f1bec5'),
 item('round-glasses','동그란 선글라스','head','eyewear','glasses','#817e9f','#c1cbd9'),
 item('flower-band','꽃 헤어밴드','head','headwear','band','#a6b596','#f6cbd0'),
 item('ribbon-hat','체리 리본','head','headwear','bow','#bf7b85','#e9b0b4'),
 item('striped-tee','산뜻한 줄무늬 티','top','top','tee','#f4ead3','#86b1a5'),
 item('sky-shirt','하늘빛 셔츠','top','top','shirt','#b7d0df','#eff1e8'),
 item('rose-cardigan','장미 카디건','top','top','cardigan','#dca5ab','#f7ead8'),
 item('sage-hoodie','새싹 후드티','top','top','hoodie','#aabca0','#e2e7cf'),
 item('denim-jacket','소풍 청재킷','top','top','jacket','#92a9bf','#e2c3a1'),
 item('flower-dress','꽃송이 원피스','top','onepiece','dress','#e4b3be','#fff0d1',['girl']),
 item('picnic-set','피크닉 투피스','top','onepiece','set','#aaa3c5','#ece4d6',['girl']),
 item('blue-jeans','스티치 청바지','bottom','bottom','jeans','#8faac1','#dce6e7'),
 item('sand-chinos','모래빛 면바지','bottom','bottom','chinos','#d3bd9c','#f3dfb9'),
 item('garden-shorts','정원 반바지','bottom','bottom','shorts','#adc4a1','#edf0d3'),
 item('rose-skirt','꽃잎 치마','bottom','bottom','skirt','#d9a1ab','#efc7ca',['girl']),
 item('lilac-pleats','라일락 주름치마','bottom','bottom','pleats','#aea8c6','#d8d0e3',['girl']),
 item('cream-sneakers','크림 운동화','shoes','footwear','sneakers','#eee7d5','#89aba0'),
 item('yellow-boots','노란 장화','shoes','footwear','boots','#dec080','#f4db9d'),
 item('rose-sandals','산책 샌들','shoes','footwear','sandals','#c89088','#f1d0b4'),
 item('dog-cap','두부의 야구모자','head','dogHeadwear','cap','#a2bca1','#e9edce',['dog']),
 item('dog-beret','두부의 베레모','head','dogHeadwear','beret','#c89394','#f3c7bd',['dog']),
 item('dog-glasses','두부의 선글라스','head','dogEyewear','glasses','#7e91a2','#bdd8df',['dog']),
 item('dog-bow','두부의 리본','head','dogHeadwear','bow','#d3a2b0','#f7d6cc',['dog']),
 item('dog-tee','산책 티셔츠','outfit','dogOutfit','tee','#adbfab','#f0e5cb',['dog']),
 item('dog-vest','포켓 조끼','outfit','dogOutfit','vest','#b5a3bd','#e6c9d3',['dog']),
 item('dog-knit','꽃무늬 니트','outfit','dogOutfit','knit','#e4b4a0','#fff0d0',['dog']),
 item('dog-harness','튼튼한 하네스','outfit','dogOutfit','harness','#a0bac7','#ede8cd',['dog']),
 item('dog-allinone','데이지 올인원','outfit','dogOutfit','allinone','#c5b4d1','#f5e7b8',['dog']),
 item('dog-sneakers','네 발 운동화','shoes','dogFootwear','sneakers','#e4ddc5','#a4b8a2',['dog']),
 item('dog-boots','네 발 장화','shoes','dogFootwear','boots','#d9b576','#f4dca7',['dog']),
 item('dog-socks','네 발 양말','shoes','dogFootwear','socks','#bcaac7','#f5e0da',['dog']),
]
export const itemById=Object.fromEntries(items.map(i=>[i.itemId,i])) as Record<string,Item>
export const emptyOutfits=():Record<CharacterId,Outfit>=>({boy:{},girl:{},dog:{}})
export function availableItems(character:CharacterId,category?:Category,season:SeasonId='spring'){return items.filter(i=>i.compatibleCharacters.includes(character)&&(!category||i.category===category)).sort((a,b)=>Number(b.season.includes(season))-Number(a.season.includes(season)))}
