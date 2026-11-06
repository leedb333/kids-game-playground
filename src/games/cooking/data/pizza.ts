import type {Recipe} from '../types'
export const pizza:Recipe = {
 id:'pizza',title:'피자 만들기',subtitle:'내 마음대로 토핑을 올려요',icon:'🍕',ready:true,revision:1,scene:'pizza',placementArea:{cx:300,cy:240,radius:166,hitRadius:205},heatDurationMs:4500,
 ingredients:[{id:'cheese',name:'치즈',icon:'cheese',color:'#ffcf54'},{id:'tomato',name:'토마토',icon:'tomato',color:'#f27466'},{id:'mushroom',name:'버섯',icon:'mushroom',color:'#d5ad88'},{id:'olive',name:'올리브',icon:'olive',color:'#4b6654'},{id:'pepperoni',name:'페퍼로니',icon:'pepperoni',color:'#cf5650'},{id:'pepper',name:'피망',icon:'pepper',color:'#75aa62'}],
 tools:[{id:'hands',name:'반죽 펴기',icon:'👐'},{id:'sauce',name:'토마토 소스',icon:'🥫'},{id:'spatula',name:'소스 주걱',icon:'🥄'},{id:'oven',name:'오븐',icon:'♨'}],
 steps:[{id:'dough',title:'반죽 준비',kind:'prepare',instruction:'동그란 반죽을 톡! 넓게 펴 주세요.',actionLabel:'반죽 펴기',toolIds:['hands']},{id:'sauce',title:'소스 바르기',kind:'spread',instruction:'피자를 톡톡! 빨간 소스를 발라요.',actionLabel:'소스 넓게 바르기',toolIds:['sauce','spatula']},{id:'toppings',title:'토핑 올리기',kind:'place',instruction:'재료를 고르고 피자를 톡! 끌어 놓아도 좋아요.',toolIds:[]},{id:'oven',title:'오븐에 굽기',kind:'heat',instruction:'오븐을 누르면 노릇노릇! 잠깐 기다려요.',actionLabel:'오븐에 넣기',toolIds:['oven']},{id:'finish',title:'완성 보기',kind:'finish',instruction:'내가 만든 피자예요. 정말 맛있겠어요!',toolIds:[]}],
 completion:{title:'나만의 피자 완성!',message:'좋아하는 재료로 멋진 피자를 만들었어요.'}
}
