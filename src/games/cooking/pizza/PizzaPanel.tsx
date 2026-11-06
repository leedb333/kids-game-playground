import type {Recipe} from '../types'
import {IngredientPanel} from '../components/IngredientPanel'
import {ToolArt} from '../components/ToolArt'
import type {PizzaTool} from './types'
import type {usePizzaWorkshop} from './usePizzaWorkshop'
export function PizzaPanel({recipe,game,onDrag,onEquip}:{recipe:Recipe;game:ReturnType<typeof usePizzaWorkshop>;onDrag:(id:string)=>void;onEquip:(tool:PizzaTool)=>void}){
 const {state,p,rolled,sauced,complete}=game
 if(state.step===2)return <IngredientPanel recipe={recipe} step={game.step} selected={state.selected} count={state.placements.length} heating={false} done={false} onSelect={game.select} onDrag={id=>onDrag('ingredient:'+id)} onAct={()=>{}} onUndo={game.undo}/>
 const tool:PizzaTool=state.step===0?'rolling-pin':state.step===1?'spoon':'cutter'
 const name=tool==='rolling-pin'?'밀대':tool==='spoon'?'숟가락':'피자 칼'
 const enabled=state.step!==1||p.sauce!==null
 return <aside className="cook-panel pizza-panel" aria-label="재료와 도구"><h2>재료 · 도구 <span aria-hidden="true">✦</span></h2>
 {state.step===1&&<><h3>소스 하나를 골라요</h3><div className="sauce-options">{(['tomato','cream'] as const).map(sauce=><button key={sauce} aria-pressed={p.sauce===sauce} onClick={()=>game.chooseSauce(sauce)}><span className={'sauce-bowl '+sauce} aria-hidden="true"/>{sauce==='tomato'?'토마토 소스':'크림소스'}</button>)}</div></>}
 {state.step===3?<div className="oven-instructions"><span aria-hidden="true">♨</span><ol><li className={p.oven!=='closed'?'done':''}>오븐 문을 톡! 열어요.</li><li className={['loaded','baking','done'].includes(p.oven)?'done':''}>피자를 끌어 넣어요.</li><li className={['baking','done'].includes(p.oven)?'done':''}>문을 닫고 3초 기다려요.</li></ol><p>게임 속 오븐에서<br/>안전하게 구워요.</p></div>:complete?<div className="cook-finish-note"><span aria-hidden="true">🏅</span><strong>8조각 완성!</strong><p>꼬마 요리사 최고!</p></div>:<><h3>{p.tool===tool?'도구를 가져왔어요':'도구를 요리 위로 끌어와요'}</h3><button className="pizza-tool-card" disabled={!enabled} aria-label={`${name} 가져오기`} aria-pressed={p.tool===tool} onPointerDown={()=>onDrag(tool)} onClick={()=>onEquip(tool)}><ToolArt tool={tool}/><strong>{name}</strong><span>끌어 놓기 · 누르고 요리 선택</span></button><p className="cook-panel-note">{state.step===0?'밀대를 끌어와 위아래·좌우로 밀어요.':state.step===1?'숟가락으로 톡톡 누르거나 문질러요.':'점선을 톡! 8개의 선을 잘라요.'}</p><p className="pizza-action-count" role="status">{state.step===0?`${Math.min(6,p.horizontal+p.vertical)}/6번 · 가로 ${p.horizontal} · 세로 ${p.vertical}`:state.step===1?`${Math.round(Math.min(8,p.sauceCells.length)/8*100)}% 바른 모습`: `${p.cuts.length}/8개 선`}</p><p className="cook-panel-note">{state.step===0?rolled?'반죽이 넓어졌어요!':'가로와 세로를 모두 움직여요.':state.step===1?sauced?'소스가 골고루 발렸어요!':'넓은 곳을 여러 번 발라 봐요.':'모두 자르면 조각이 살짝 벌어져요.'}</p></>}
 </aside>
}
