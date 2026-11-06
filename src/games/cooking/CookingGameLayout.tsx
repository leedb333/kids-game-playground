import {useEffect,useRef,useState} from 'react'
import type {Recipe} from './types'
import {useCooking} from './hooks/useCooking'
import {FoodScene} from './components/FoodScene'
import {IngredientPanel} from './components/IngredientPanel'
import {StepProgress} from './components/StepProgress'
import {Completion} from './components/Completion'

export function CookingGameLayout({recipe,onBack}:{recipe:Recipe;onBack:()=>void}){
 const game=useCooking(recipe),{state,step,ready,heating}=game
 const [resetOpen,setResetOpen]=useState(false)
 const board=useRef<HTMLDivElement>(null),dialog=useRef<HTMLDialogElement>(null),heading=useRef<HTMLHeadingElement>(null)
 const drag=useRef<string|null>(null)
 const finished=step.kind==='finish'
 useEffect(()=>{heading.current?.focus()},[state.step])
 useEffect(()=>{if(resetOpen)dialog.current?.showModal()},[resetOpen])
 function boardPoint(clientX:number,clientY:number){
  const svg=board.current?.querySelector('svg'),matrix=svg?.getScreenCTM()
  if(!matrix)return null
  const p=new DOMPoint(clientX,clientY).matrixTransform(matrix.inverse())
  return Math.hypot(p.x-recipe.placementArea.cx,p.y-recipe.placementArea.cy)<=recipe.placementArea.hitRadius?{x:p.x,y:p.y}:null
 }
 function release(event:React.PointerEvent){
  const ingredient=drag.current;drag.current=null
  if(step.kind!=='place'||!ingredient)return
  const point=boardPoint(event.clientX,event.clientY)
  if(point)game.place(point.x,point.y,ingredient)
 }
 function touchBoard(event:React.MouseEvent){
  if(heating||finished)return
  if(step.kind==='place'){
   // Pointer drops are handled by release; regular taps place the selected ingredient.
   const p=boardPoint(event.clientX,event.clientY)
   if(p)game.place(p.x,p.y)
   else if(event.detail===0){const angle=state.placements.length*2.4,r=Math.min(recipe.placementArea.radius*.8,50+state.placements.length*9);game.place(recipe.placementArea.cx+Math.cos(angle)*r,recipe.placementArea.cy+Math.sin(angle)*r)}
  } else game.act()
 }
 return <section className="cook-workshop" onPointerUp={release} onPointerLeave={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}} aria-label={recipe.title}>
  <header className="cook-heading"><button onClick={onBack}>← 요리 선택</button><div><span>요리놀이</span><h1 tabIndex={-1} ref={heading}>{recipe.title}</h1></div><p className="cook-save" role="status">{game.storageOk?'✓ 이 기기에 자동 저장':'지금은 저장할 수 없어요'}</p></header>
  <StepProgress recipe={recipe} current={state.step}/>
  <div className="cook-workspace">
   <section className="cook-kitchen" aria-label="요리 공간"><div className="cook-instruction" role="status"><span>{state.step+1}</span><p>{heating?'노릇노릇! 맛있는 냄새가 나요.':ready&&step.kind!=='place'&&!finished?'잘했어요! 다음 단계로 가 볼까요?':step.instruction}</p></div>
    <div className="cook-kitchen-wall" aria-hidden="true"><div className="cook-shelf"><span>✿</span><i/><i/><i/></div><div className="cook-window"><span/></div></div>
    <div className="cook-counter"><div className={`cook-board${finished?' finished':''}`} ref={board}>
     <FoodScene recipe={recipe} state={state} heating={heating}/>
     {!finished&&<button className="cook-board-hit" aria-label={step.kind==='place'?'선택한 재료 올리기':step.actionLabel??'요리하기'} onClick={touchBoard} disabled={heating||(ready&&step.kind!=='place')}/>}
    </div></div>
    {finished?<Completion recipe={recipe}/>:<p className="cook-board-caption">{step.kind==='place'?state.placements.length>=90?'토핑이 가득해요! 다음을 눌러 구워 볼까요?':'누르기 또는 끌어 놓기 · 토핑은 자유롭게!':heating?'잠깐 기다리면 오븐이 자동으로 열려요.':'큰 요리 공간을 톡 눌러도 좋아요.'}</p>}
   </section>
   <IngredientPanel recipe={recipe} step={step} selected={state.selected} count={state.placements.length} heating={heating} done={ready} onSelect={game.select} onDrag={id=>{drag.current=id}} onAct={game.act} onUndo={game.undo}/>
  </div>
  <nav className="cook-bottom" aria-label="요리 단계 이동"><button onClick={()=>setResetOpen(true)}>↻ 다시 만들기</button><span>{finished?'다시 만들어도 좋아요!':!ready?'재료나 도구를 사용해 보세요.':'준비됐어요! 다음으로 가요.'}</span><div><button onClick={game.previous} disabled={state.step===0||heating}>← 이전</button><button className="cook-primary" onClick={finished?onBack:game.next} disabled={!finished&&(!ready||heating)}>{finished?'요리 선택':'다음 →'}</button></div></nav>
  {resetOpen&&<dialog className="cook-reset" ref={dialog} onCancel={e=>{e.preventDefault();setResetOpen(false)}} aria-labelledby="cook-reset-title"><h2 id="cook-reset-title">처음부터 만들까요?</h2><p>지금 만든 요리를 지우고 새로 시작해요.</p><button autoFocus onClick={()=>setResetOpen(false)}>계속 만들기</button><button className="cook-primary" onClick={()=>{game.reset();setResetOpen(false)}}>처음부터 만들기</button></dialog>}
 </section>
}
