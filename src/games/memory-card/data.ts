export type Theme='animals'|'fruits'|'vehicles'|'dinosaurs'
export type Picture={id:string;name:string;theme:Theme}
const groups:Record<Theme,string[][]>={
 animals:[['rabbit','토끼'],['bear','곰'],['cat','고양이'],['dog','강아지'],['fox','여우'],['chick','병아리'],['penguin','펭귄'],['panda','판다'],['elephant','코끼리'],['lion','사자']],
 fruits:[['apple','사과'],['strawberry','딸기'],['banana','바나나'],['grapes','포도'],['watermelon','수박'],['orange','오렌지'],['peach','복숭아'],['pineapple','파인애플'],['cherry','체리'],['pear','배']],
 vehicles:[['police','경찰차'],['fire','소방차'],['bus','버스'],['train','기차'],['plane','비행기'],['helicopter','헬리콥터'],['excavator','굴착기'],['boat','배'],['truck','트럭'],['bicycle','자전거']],
 dinosaurs:[['trex','티라노사우루스'],['bronto','브라키오사우루스'],['stego','스테고사우루스'],['tricera','트리케라톱스'],['ptero','프테라노돈'],['ankylo','안킬로사우루스'],['para','파라사우롤로푸스'],['spino','스피노사우루스'],['plesio','플레시오사우루스'],['raptor','벨로키랍토르']],
}
export const pictures:Picture[]=Object.entries(groups).flatMap(([theme,list])=>list.map(([id,name])=>({id,name,theme:theme as Theme})))
export const pictureById=Object.fromEntries(pictures.map(p=>[p.id,p])) as Record<string,Picture>
export const themeNames:Record<Theme,string>={animals:'동물 친구들',fruits:'알록달록 과일',vehicles:'신나는 탈것',dinosaurs:'공룡 친구들'}
export type Stage={id:number;theme:Theme;pairs:number;columns:number}
const themes:Theme[]=['animals','animals','fruits','vehicles','dinosaurs','fruits','vehicles','animals','dinosaurs','fruits','vehicles','animals','fruits','vehicles','dinosaurs']
export const stages:Stage[]=themes.map((theme,i)=>({id:i+1,theme,pairs:[3,4,6,8,10][Math.floor(i/3)],columns:i<3?3:i<12?4:5}))
export type Card={uid:string;picture:string}
export function makeDeck(stage:Stage,random:()=>number=Math.random,previous:Card[]=[]):Card[]{
 const pool=pictures.filter(p=>p.theme===stage.theme),offset=stage.id===12?2:stage.id===2||stage.id===8?0:(stage.id-1)%pool.length
 const selected=Array.from({length:stage.pairs},(_,i)=>pool[(offset+i)%pool.length])
 const deck=selected.flatMap(p=>['a','b'].map(copy=>({uid:p.id+':'+copy,picture:p.id})))
 for(let i=deck.length-1;i>0;i--){const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));[deck[i],deck[j]]=[deck[j],deck[i]]}
 if(deck.every((c,i)=>c.picture===previous[i]?.picture))deck.push(deck.shift()!)
 return deck
}
