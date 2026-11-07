import {fittingRigs} from './rig'
export type CharacterId = 'boy' | 'girl' | 'dog'
export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter'
export type Category = 'head' | 'top' | 'bottom' | 'shoes' | 'outfit'
export type Slot = 'headwear' | 'eyewear' | 'top' | 'bottom' | 'onepiece' | 'footwear' | 'dogHeadwear' | 'dogEyewear' | 'dogOutfit' | 'dogFootwear' | 'handbag'
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
 {id:'summer',name:'여름',title:'햇살 가득한 날',ready:true,color:'#d7eaf1'},
 {id:'autumn',name:'가을',title:'낙엽 소풍',ready:true,color:'#f0dfc7'},
 {id:'winter',name:'겨울',title:'포근한 눈꽃',ready:true,color:'#e2e7f2'},
]
export const categories:{id:Category;name:string;short:string}[]=[{id:'head',name:'모자·안경',short:'모자·안경'},{id:'top',name:'상의·세트',short:'상의'},{id:'bottom',name:'하의',short:'하의'},{id:'shoes',name:'신발',short:'신발'}]
export const dogCategories:typeof categories=[{id:'head',name:'모자·안경',short:'모자·안경'},{id:'outfit',name:'강아지 옷',short:'강아지 옷'},{id:'shoes',name:'신발',short:'신발'}]
export const categoriesFor=(character:CharacterId)=>character==='dog'?dogCategories:categories
const human:CharacterId[]=['boy','girl']
function item(itemId:string,name:string,category:Category,equipSlot:Slot,image:string,color:string,accent:string,compatibleCharacters:CharacterId[]=human,season:SeasonId[]=['spring']):Item{
 return {itemId,name,season,category,compatibleCharacters,equipSlot,image,color,accent,anchorPosition:Object.fromEntries(compatibleCharacters.map(id=>[id,fittingRigs[id].anchors[equipSlot]])),scale:1,layerOrder:['eyewear','dogEyewear'].includes(equipSlot)?80:['headwear','dogHeadwear'].includes(equipSlot)?90:['footwear','dogFootwear'].includes(equipSlot)?60:equipSlot==='bottom'?20:30,conflictsWith:equipSlot==='onepiece'?['top','bottom']:equipSlot==='top'||equipSlot==='bottom'?['onepiece']:[]}
}
export const items:Item[]=[
 item('mint-cap','민트 야구모자','head','headwear','cap','#92beb2','#e6f0d6'),
 item('peach-bucket','복숭아 벙거지','head','headwear','bucket','#e9b5a2','#fff1d5'),
 item('straw-hat','산책 밀짚모자','head','headwear','straw','#e7ca8e','#b77e83',human,['spring','summer']),
 item('berry-beret','딸기 베레모','head','headwear','beret','#c98193','#f1bec5'),
 item('round-glasses','동그란 선글라스','head','eyewear','glasses','#817e9f','#c1cbd9',human,['spring','summer']),
 item('flower-band','꽃 헤어밴드','head','headwear','band','#a6b596','#f6cbd0',['girl']),
 item('ribbon-hat','체리 리본','head','headwear','bow','#bf7b85','#e9b0b4',['girl']),
 item('striped-tee','산뜻한 줄무늬 티','top','top','tee','#f4ead3','#86b1a5'),
 item('sky-shirt','하늘빛 셔츠','top','top','shirt','#b7d0df','#eff1e8'),
 item('rose-cardigan','장미 카디건','top','top','cardigan','#dca5ab','#f7ead8',human,['spring','autumn']),
 item('sage-hoodie','새싹 후드티','top','top','hoodie','#aabca0','#e2e7cf',human,['spring','autumn']),
 item('denim-jacket','소풍 청재킷','top','top','jacket','#92a9bf','#e2c3a1'),
 item('flower-dress','꽃송이 원피스','top','onepiece','dress','#e4b3be','#fff0d1',['girl']),
 item('picnic-set','피크닉 투피스','top','onepiece','set','#aaa3c5','#ece4d6',['girl']),
 item('blue-jeans','스티치 청바지','bottom','bottom','jeans','#8faac1','#dce6e7',human,['spring','autumn','winter']),
 item('sand-chinos','모래빛 면바지','bottom','bottom','chinos','#d3bd9c','#f3dfb9',human,['spring','autumn']),
 item('garden-shorts','정원 반바지','bottom','bottom','shorts','#adc4a1','#edf0d3'),
 item('rose-skirt','꽃잎 치마','bottom','bottom','skirt','#d9a1ab','#efc7ca',['girl']),
 item('lilac-pleats','라일락 주름치마','bottom','bottom','pleats','#aea8c6','#d8d0e3',['girl']),
 item('cream-sneakers','크림 운동화','shoes','footwear','sneakers','#eee7d5','#89aba0'),
 item('yellow-boots','노란 장화','shoes','footwear','boots','#dec080','#f4db9d'),
 item('rose-sandals','산책 샌들','shoes','footwear','sandals','#c89088','#f1d0b4',human,['spring','summer']),
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

 item('navy-suit','꼬마 신사 정장','top','top','suit','#596b85','#eff0e7',['boy'],['spring','autumn','winter']),
 item('navy-trousers','꼬마 신사 정장 바지','bottom','bottom','formal','#596b85','#c4cfdd',['boy'],['spring','autumn','winter']),
 item('satin-dress','리본 파티 드레스','top','onepiece','gown','#bd9ec5','#f5dece',['girl'],['spring','summer','autumn','winter']),
 item('rose-handbag','작은 장미 핸드백','head','handbag','handbag','#bd7d8d','#efc9c6',['girl'],['spring','autumn']),
 item('linen-tee','바닷바람 반팔','top','top','polo','#b2d8d9','#f5efda',human,['summer']),
 item('sun-tee','햇살 반팔','top','top','tee','#f0d08a','#fff1cd',human,['summer']),
 item('linen-shirt','여름 리넨 셔츠','top','top','shirt','#f2e4c8','#b7cbbc',human,['summer']),
 item('sailor-top','파도 세일러 셔츠','top','top','sailor','#d9e8ed','#6d92b1',human,['summer']),
 item('summer-shorts','바다 반바지','bottom','bottom','shorts','#8db9c8','#dce8df',human,['summer']),
 item('linen-shorts','리넨 반바지','bottom','bottom','shorts','#dec99f','#f4e9cb',human,['summer']),
 item('summer-skirt','산들 주름치마','bottom','bottom','pleats','#9fcac0','#e1eeda',['girl'],['summer']),
 item('summer-dress','레몬 산책 원피스','top','onepiece','sundress','#edd489','#fff3cd',['girl'],['summer']),
 item('straw-bag','여름 피크닉 가방','head','handbag','basket','#d7b78a','#fff1ce',['girl'],['summer']),
 item('ocean-bucket','바닷빛 벙거지','head','headwear','bucket','#9cc5d0','#e5f1eb',human,['summer']),
 item('coral-sandals','산호빛 샌들','shoes','footwear','sandals','#d69a88','#f8e0b9',human,['summer']),
 item('summer-canvas','파도 캔버스화','shoes','footwear','sneakers','#aec9d4','#fff2d8',human,['summer']),
 item('maple-beret','단풍 베레모','head','headwear','beret','#b67e56','#ead1ab',human,['autumn']),
 item('forest-cap','숲길 야구모자','head','headwear','cap','#899c7d','#e8dfc5',human,['autumn']),
 item('cable-knit','도토리 꽈배기 니트','top','top','knit','#d5b68b','#f1ddbd',human,['autumn']),
 item('autumn-cardigan','숲길 카디건','top','top','cardigan','#a2ae90','#eee6cc',human,['autumn']),
 item('ochre-jacket','낙엽 소풍 재킷','top','top','jacket','#bc9877','#ecdbb9',human,['autumn']),
 item('corduroy-pants','도토리 골덴 바지','bottom','bottom','corduroy','#af9475','#e1c9a5',human,['autumn']),
 item('autumn-pleats','단풍 주름치마','bottom','bottom','pleats','#ba8d7b','#e7c6ac',['girl'],['autumn']),
 item('autumn-dress','가을 체크 드레스','top','onepiece','pinafore','#b49a90','#efe0c7',['girl'],['autumn']),
 item('chestnut-boots','밤색 워커','shoes','footwear','boots','#a98368','#e0c6a0',human,['autumn']),
 item('autumn-loafers','도토리 로퍼','shoes','footwear','loafers','#b18b79','#edd5b8',human,['autumn']),
 item('snow-beanie','눈송이 털모자','head','headwear','beanie','#a8b8cf','#edf0e7',human,['winter']),
 item('berry-beanie','딸기 우유 털모자','head','headwear','beanie','#d3a3ad','#fff0e3',human,['winter']),
 item('winter-puffer','포근한 누빔 패딩','top','top','puffer','#a3b9c1','#e9eee8',human,['winter']),
 item('winter-coat','목도리 겨울 코트','top','top','coat','#bb9e88','#e9d8bd',human,['winter']),
 item('winter-knit','눈꽃 맨투맨','top','top','sweatshirt','#c5bbd2','#f3e7dd',human,['winter']),
 item('fleece-pants','따뜻한 기모 바지','bottom','bottom','fleece','#979eaf','#d9e0e5',human,['winter']),
 item('winter-pleats','겨울 울 치마','bottom','bottom','pleats','#aaa2b7','#ded7e4',['girl'],['winter']),
 item('velvet-dress','겨울 벨벳 드레스','top','onepiece','winterdress','#ac859c','#f4e5d5',['girl'],['winter']),
 item('winter-bag','포근한 겨울 핸드백','head','handbag','handbag','#b0a2bd','#efe3df',['girl'],['winter']),
 item('snow-boots','눈꽃 털부츠','shoes','footwear','furboots','#a0aabe','#f1ecdf',human,['winter']),
 item('winter-boots','겨울 방한 부츠','shoes','footwear','boots','#ae8e86','#ecddce',human,['winter']),
 item('dog-summer-hat','두부의 밀짚모자','head','dogHeadwear','straw','#dec18e','#a1c4b8',['dog'],['summer']),
 item('dog-summer-glasses','두부의 바다 안경','head','dogEyewear','glasses','#6e98aa','#bfe0e2',['dog'],['summer']),
 item('dog-summer-tee','시원한 마린 티','outfit','dogOutfit','tee','#a5cdd3','#f5eed9',['dog'],['summer']),
 item('dog-summer-vest','가벼운 여름 조끼','outfit','dogOutfit','vest','#edd6a0','#faf0d6',['dog'],['summer']),
 item('dog-summer-shoes','네 발 여름 운동화','shoes','dogFootwear','sneakers','#bdcfd4','#fff0ce',['dog'],['summer']),
 item('dog-summer-socks','시원한 줄무늬 양말','shoes','dogFootwear','socks','#a6cbbf','#f4edd7',['dog'],['summer']),
 item('dog-maple-beret','두부의 단풍 베레모','head','dogHeadwear','beret','#bd916c','#f1d8b7',['dog'],['autumn']),
 item('dog-autumn-bow','도토리 리본','head','dogHeadwear','bow','#a39078','#e5d3b0',['dog'],['autumn']),
 item('dog-autumn-knit','도토리 산책 니트','outfit','dogOutfit','knit','#c7ae8a','#f6e4c3',['dog'],['autumn']),
 item('dog-autumn-coat','숲길 포켓 조끼','outfit','dogOutfit','vest','#9faa8e','#e5dfc8',['dog'],['autumn']),
 item('dog-autumn-boots','네 발 단풍 장화','shoes','dogFootwear','boots','#c09e77','#ecdbb7',['dog'],['autumn']),
 item('dog-autumn-shoes','네 발 숲길 운동화','shoes','dogFootwear','sneakers','#acae95','#f3e7cf',['dog'],['autumn']),
 item('dog-snow-beanie','두부의 눈꽃 털모자','head','dogHeadwear','beanie','#b3b7d0','#f3eddf',['dog'],['winter']),
 item('dog-winter-glasses','두부의 겨울 안경','head','dogEyewear','glasses','#939cac','#dbe4e9',['dog'],['winter']),
 item('dog-winter-puffer','포근한 강아지 패딩','outfit','dogOutfit','puffer','#a2b7c2','#edf0e6',['dog'],['winter']),
 item('dog-winter-coat','목도리 강아지 코트','outfit','dogOutfit','coat','#bf9d9c','#f6e6d8',['dog'],['winter']),
 item('dog-snow-boots','네 발 눈꽃 털부츠','shoes','dogFootwear','furboots','#a3adbf','#f6f0e3',['dog'],['winter']),
 item('dog-winter-boots','네 발 겨울 장화','shoes','dogFootwear','boots','#b69caa','#eae0dd',['dog'],['winter']),
]
export const itemById=Object.fromEntries(items.map(i=>[i.itemId,i])) as Record<string,Item>
export const emptyOutfits=():Record<CharacterId,Outfit>=>({boy:{},girl:{},dog:{}})
export function availableItems(character:CharacterId,category?:Category,season:SeasonId='spring'){return items.filter(i=>i.compatibleCharacters.includes(character)&&(!category||i.category===category)).sort((a,b)=>Number(b.season.includes(season))-Number(a.season.includes(season)))}
