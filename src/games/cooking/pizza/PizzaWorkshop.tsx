import {useEffect,useRef,useState} from 'react'
import type {Recipe} from '../types'
import {StepProgress} from '../components/StepProgress'
import {FoodScene} from '../components/FoodScene'
import {Completion} from '../components/Completion'
import {ToolArt} from '../components/ToolArt'
import {IngredientArt} from '../components/IngredientArt'
import {PizzaPanel} from './PizzaPanel'
import {usePizzaWorkshop} from './usePizzaWorkshop'
import {useOvenChime} from './useOvenChime'
import {cutAngles,type PizzaTool} from './types'
type Point={x:number;y:number}
type Gesture={id:number;kind:string;last:Point;axis:string;direction:number;distance:number;awarded:string}
export function PizzaWorkshop({recipe,onBack}:{recipe:Recipe;onBack:()=>void}){
 const game=usePizzaWorkshop(recipe),{state,p,step,heating,complete,ready}=game
 const unlock=useOvenChime(heating,p.oven==='done')
 const surface=useRef<HTMLDivElement>(null),counter=useRef<HTMLDivElement>(null),gesture=useRef<Gesture|null>(null),drag=useRef<string|null>(null)
 const dialog=useRef<HTMLDialogElement>(null),heading=useRef<HTMLHeadingElement>(null)
 const [width,setWidth]=useState(400),[pending,setPending]=useState<PizzaTool|null>(null),[cursor,setCursor]=useState<Point>({x:300,y:240}),[ghost,setGhost]=useState<{kind:string;x:number;y:number}|null>(null),[reset,setReset]=useState(false)
 useEffect(()=>{const el=counter.current!;const observer=new ResizeObserver(([entry])=>setWidth(Math.min(entry.contentRect.width,entry.contentRect.height*1.25)));observer.observe(el);return()=>observer.disconnect()},[])
 useEffect(()=>{heading.current?.focus();setPending(null);setGhost(null);gesture.current=null;drag.current=null},[state.step])
 useEffect(()=>{if(reset)dialog.current?.showModal()},[reset])
 function point(x:number,y:number):Point|null{const svg=surface.current?.querySelector('svg'),matrix=svg?.getScreenCTM();if(!matrix)return null;const result=new DOMPoint(x,y).matrixTransform(matrix.inverse());return {x:result.x,y:result.y}}
 const onFood=(q:Point)=>Math.hypot(q.x-300,q.y-240)<=205
 const onOven=(q:Point)=>q.x>=300&&q.x<=590&&q.y>=90&&q.y<=420
 function start(event:React.PointerEvent<HTMLElement>){
  if(event.button!==0||heating||complete)return
  unlock()
  const q=point(event.clientX,event.clientY);if(!q)return
  let kind=drag.current
  if(!kind&&!(event.target as Element).closest('[data-pizza-surface]'))return
  if(!kind&&(event.target as Element).closest('[data-cut],.pizza-door-hit'))return
  if(!kind){
   if(state.step===3){if(Math.hypot(q.x-135,q.y-252)>135)return;kind='pizza'}
   else if(pending&&onFood(q)){game.equip(pending);setPending(null);return}
   else if(state.step===0&&p.tool==='rolling-pin'&&onFood(q))kind='roll'
   else if(state.step===1&&p.tool==='spoon'&&onFood(q)){kind='brush';game.brush(q.x,q.y)}
   else if(state.step===2&&onFood(q)){kind='tap-topping'}
   else if(state.step===4&&p.tool==='cutter'&&onFood(q)&&Math.hypot(q.x-300,q.y-240)>35){setCursor(q);const angle=(Math.atan2(q.y-240,q.x-300)+Math.PI/2+Math.PI*2)%(Math.PI*2);game.cut(Math.round(angle/(Math.PI/4))%8);return}
   else return
  }
  gesture.current={id:event.pointerId,kind,last:q,axis:'',direction:0,distance:0,awarded:''}
  event.currentTarget.setPointerCapture(event.pointerId)
  if(kind!=='roll'&&kind!=='brush'&&kind!=='tap-topping')setGhost({kind,x:event.clientX,y:event.clientY})
  setCursor(q)
 }
 function move(event:React.PointerEvent){
  const g=gesture.current;if(!g||g.id!==event.pointerId)return
  const q=point(event.clientX,event.clientY);if(!q)return
  setCursor(q)
  if(!['roll','brush','tap-topping'].includes(g.kind))setGhost({kind:g.kind,x:event.clientX,y:event.clientY})
  if(g.kind==='brush'&&onFood(q))game.brush(q.x,q.y)
  if(g.kind==='roll'&&onFood(q)){
   const dx=q.x-g.last.x,dy=q.y-g.last.y
   if(Math.hypot(dx,dy)>1){const axis=Math.abs(dx)>Math.abs(dy)?'horizontal':'vertical',direction=Math.sign(axis==='horizontal'?dx:dy);if(axis!==g.axis||direction!==g.direction){g.axis=axis;g.direction=direction;g.distance=0}g.distance+=Math.hypot(dx,dy);const key=axis+direction;if(g.distance>=35&&key!==g.awarded){game.roll(axis);g.awarded=key;g.distance=0}}
  }
  g.last=q
 }
 function end(event:React.PointerEvent){
  const g=gesture.current;gesture.current=null;drag.current=null;setGhost(null)
  if(!g||g.id!==event.pointerId)return
  if(surface.current&&event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)
  const q=point(event.clientX,event.clientY);if(!q)return
  if(['rolling-pin','spoon','cutter'].includes(g.kind)&&onFood(q)){game.equip(g.kind as PizzaTool);setPending(null)}
  else if(g.kind.startsWith('ingredient:')&&onFood(q))game.place(q.x,q.y,g.kind.slice(11))
  else if(g.kind==='tap-topping'&&onFood(q))game.place(q.x,q.y)
  else if(g.kind==='pizza'&&onOven(q))game.loadOven()
 }
 function keyboardBoard(){unlock();if(pending){game.equip(pending);setPending(null)}else if(state.step===0)game.roll(p.horizontal<=p.vertical?'horizontal':'vertical');else if(state.step===1){const i=p.sauceCells.length;const angle=i*Math.PI/6;game.brush(300+Math.cos(angle)*95,240+Math.sin(angle)*95)}else if(state.step===2){const i=state.placements.length;game.place(300+Math.cos(i*2.4)*120,240+Math.sin(i*2.4)*120)}}
 const instruction=complete?'모두 잘랐어요! 나만의 피자 완성!':heating?'오븐에 불이 켜졌어요. 3초만 기다려요.':pending?'선택한 도구를 요리 위에 놓아 주세요.':state.step===3?p.oven==='closed'?'오븐 문을 톡! 열어 주세요.':p.oven==='open'?'왼쪽 피자를 오른쪽 오븐으로 끌어 넣어요.':'피자를 넣었어요. 오븐 문을 닫아 주세요.':step.instruction
 return <section className="cook-workshop pizza-workshop" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>{gesture.current=null;drag.current=null;setGhost(null)}} onPointerDownCapture={unlock}>
  <header className="cook-heading"><button onClick={onBack}>← 요리 선택</button><div><span>요리놀이</span><h1 ref={heading} tabIndex={-1}>{recipe.title}</h1></div><p className="cook-save" role="status">{game.storageOk?'✓ 이 기기에 자동 저장':'지금은 저장할 수 없어요'}</p></header>
  <StepProgress recipe={recipe} current={state.step}/>
  <div className="cook-workspace"><section className="cook-kitchen italian-restaurant" aria-label="이탈리안 식당 요리 테이블"><div className="cook-instruction" role="status"><span>{state.step+1}</span><p>{instruction}</p></div><div className="restaurant-wall" aria-hidden="true"><div className="restaurant-awning"/><div className="restaurant-sign">PICCOLO · PIZZA</div><div className="restaurant-window"/><div className="restaurant-herbs">❧</div></div>
   <div className="cook-counter pizza-counter" ref={counter}><div className="pizza-surface" data-pizza-surface ref={surface} style={{width}}>
    <FoodScene recipe={recipe} state={state} heating={heating} interaction={p}/>
    {state.step!==3&&!complete&&<button className="pizza-surface-hit" aria-label={state.step===0?'밀대로 반죽 밀기':state.step===1?'숟가락으로 소스 바르기':'선택한 재료 올리기'} onClick={e=>{if(e.detail===0)keyboardBoard()}}/>}
    {state.step===3&&<><button className="pizza-move-hit" aria-label="피자를 오븐에 넣기" disabled={p.oven!=='open'} onClick={e=>{if(e.detail===0)game.loadOven()}}/><button className="pizza-door-hit" aria-label={p.oven==='closed'?'오븐 문 열기':p.oven==='loaded'?'오븐 문 닫기':'열린 오븐'} disabled={heating||p.oven==='open'} onClick={()=>{unlock();game.ovenDoor()}}/></>}
    {state.step===4&&!complete&&cutAngles.map((angle,i)=><button data-cut={i} key={i} className={'pizza-cut-target'+(p.cuts.includes(i)?' cut-done':'')} aria-label={`${i+1}번 자르기 선`} aria-pressed={p.cuts.includes(i)} disabled={p.tool!=='cutter'} style={{left:`${(300+Math.cos(angle)*155)/6}%`,top:`${(240+Math.sin(angle)*155)/4.8}%`}} onClick={()=>game.cut(i)}>{p.cuts.includes(i)?'✓':i+1}</button>)}
    {p.tool&&!complete&&state.step!==2&&state.step!==3&&<div className="pizza-equipped" data-tool={p.tool} style={{left:`${cursor.x/6}%`,top:`${cursor.y/4.8}%`}}><ToolArt tool={p.tool}/></div>}
   </div></div>
   {complete?<Completion recipe={recipe}/>:<p className="cook-board-caption">{state.step===0?`가로·세로로 밀기 ${Math.min(6,p.horizontal+p.vertical)}/6`:state.step===1?'소스를 선택한 뒤 숟가락을 가져와요':state.step===2?'토핑을 고르고 톡! 끌어 놓아도 좋아요':state.step===3?'문 열기 → 피자 넣기 → 문 닫기':'피자 칼을 가져와 1~8번 선을 잘라요'}</p>}
  </section><PizzaPanel recipe={recipe} game={game} onDrag={id=>{drag.current=id;if(id.startsWith('ingredient:'))game.select(id.slice(11));else setPending(id as PizzaTool)}} onEquip={tool=>{unlock();setPending(tool)}}/></div>
  <nav className="cook-bottom" aria-label="요리 단계 이동"><button onClick={()=>setReset(true)}>↻ 다시 만들기</button><span>{complete?'함께 나눠 먹어요!':ready?'잘했어요! 다음으로 가요.':'도구를 움직여 직접 만들어요.'}</span><div><button onClick={game.previous} disabled={state.step===0||heating||complete}>← 이전</button><button className="cook-primary" disabled={!complete&&(!ready||heating||state.step===4)} onClick={complete?onBack:game.next}>{complete?'요리 선택':'다음 →'}</button></div></nav>
  {ghost&&<div className="pizza-drag-ghost" style={{left:ghost.x,top:ghost.y}} aria-hidden="true">{['rolling-pin','spoon','cutter'].includes(ghost.kind)?<ToolArt tool={ghost.kind as PizzaTool}/>:ghost.kind==='pizza'?<FoodScene recipe={recipe} state={{...state,step:2}} heating={false} interaction={p}/>:<IngredientArt kind={recipe.ingredients.find(i=>i.id===ghost.kind.slice(11))?.icon??'cheese'}/>}</div>}
  {reset&&<dialog className="cook-reset" ref={dialog} onCancel={e=>{e.preventDefault();setReset(false)}} aria-labelledby="pizza-reset-title"><h2 id="pizza-reset-title">처음부터 만들까요?</h2><p>지금 만든 요리를 지우고 새로 시작해요.</p><button autoFocus onClick={()=>setReset(false)}>계속 만들기</button><button className="cook-primary" onClick={()=>{gesture.current=null;drag.current=null;setPending(null);setGhost(null);game.reset();setReset(false)}}>처음부터 만들기</button></dialog>}
 </section>
}
