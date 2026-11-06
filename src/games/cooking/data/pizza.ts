import type {Recipe} from '../types'
export const pizza:Recipe = {
 id:'pizza',title:'피자 만들기',subtitle:'내 마음대로 토핑을 올려요',icon:'🍕',ready:true,revision:2,scene:'pizza',placementArea:{cx:300,cy:240,radius:166,hitRadius:205},heatDurationMs:3000,
 ingredients:[{id:'cheese',name:'치즈',icon:'cheese',color:'#ffcf54'},{id:'tomato',name:'토마토',icon:'tomato',color:'#f27466'},{id:'mushroom',name:'버섯',icon:'mushroom',color:'#d5ad88'},{id:'olive',name:'올리브',icon:'olive',color:'#4b6654'},{id:'pepperoni',name:'페퍼로니',icon:'pepperoni',color:'#cf5650'},{id:'pepper',name:'피망',icon:'pepper',color:'#75aa62'},{id:'onion',name:'양파',icon:'onion',color:'#cf91ba'}],
 tools:[{id:'rolling-pin',name:'밀대',icon:'rolling-pin'},{id:'tomato-sauce',name:'토마토 소스',icon:'🥫'},{id:'cream-sauce',name:'크림소스',icon:'🥣'},{id:'spoon',name:'숟가락',icon:'spoon'},{id:'oven',name:'오븐',icon:'♨'},{id:'cutter',name:'피자 칼',icon:'cutter'}],
 steps:[{id:'dough',title:'반죽 준비',kind:'prepare',instruction:'밀대를 가져와 가로·세로로 모두 6번 밀어요.',actionLabel:'밀대로 반죽 밀기',toolIds:['rolling-pin']},{id:'sauce',title:'소스 바르기',kind:'spread',instruction:'소스를 고르고 숟가락을 가져와 골고루 발라요.',actionLabel:'숟가락으로 소스 바르기',toolIds:['tomato-sauce','cream-sauce','spoon']},{id:'toppings',title:'토핑 올리기',kind:'place',instruction:'재료를 고르고 피자를 톡! 끌어 놓아도 좋아요.',toolIds:[]},{id:'oven',title:'오븐에 굽기',kind:'heat',instruction:'문을 열고 피자를 넣은 뒤 문을 닫아요.',actionLabel:'오븐에 넣기',toolIds:['oven']},{id:'finish',title:'8조각 자르기',kind:'finish',instruction:'피자 칼을 가져와 8개의 선을 따라 잘라요.',toolIds:['cutter']}],
 completion:{title:'나만의 피자 완성!',message:'좋아하는 재료로 멋진 피자를 만들었어요.'}
}
