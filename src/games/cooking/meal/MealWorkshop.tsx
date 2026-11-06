import {useEffect,useRef,useState} from 'react'
import type {Recipe} from '../types'
import {useMeal} from './useMeal'
import {MealScene,unitX} from './MealScene'
import {MealPanel} from './MealPanel'
import {FoodGlyph,MealToolArt} from './FoodAssets'
import {StepProgress} from '../components/StepProgress'
import {Completion} from '../components/Completion'
import {useOvenChime as useCookingChime} from '../pizza/useOvenChime'
type Point={x:number;y:number}
type Drag={id:number;kind:string;last:Point;length:number;total:number;angle:number;awards:number;unit:number}
export function MealWorkshop({recipe,onBack}:{recipe:Recipe;onBack:()=>void}){
 const game=useMeal(recipe),{state:s,heating}=game,spag=s.recipeId==='spaghetti'
 const unlock=useCookingChime(heating,s.done)
 const surface=useRef<HTMLDivElement>(null),counter=useRef<HTMLDivElement>(null),heading=useRef<HTMLHeadingElement>(null),dialog=useRef<HTMLDialogElement>(null),drag=useRef<Drag|null>(null),armed=useRef<string|null>(null)
 const [width,setWidth]=useState(400),[pendingItem,setPendingItem]=useState<string|null>(null),[pending,setPending]=useState<'knife'|'chopsticks'|null>(null),[cursor,setCursor]=useState<Point>({x:380,y:235}),[ghost,setGhost]=useState<{kind:string;x:number;y:number}|null>(null),[reset,setReset]=useState(false)
 useEffect(()=>{const el=counter.current!;const observer=new ResizeObserver(([entry])=>setWidth(Math.min(entry.contentRect.width,entry.contentRect.height*760/480)));observer.observe(el);return()=>observer.disconnect()},[])
 useEffect(()=>{heading.current?.focus();setPending(null);setPendingItem(null);drag.current=null;armed.current=null;setGhost(null)},[s.step,s.done,s.count])
 useEffect(()=>{if(reset)dialog.current?.showModal()},[reset])
 const point=(x:number,y:number)=>{const svg=surface.current?.querySelector('svg'),matrix=svg?.getScreenCTM();if(!matrix)return null;const p=new DOMPoint(x,y).matrixTransform(matrix.inverse());return {x:p.x,y:p.y}}
 const inside=(q:Point)=>q.x>=70&&q.x<=690&&q.y>=65&&q.y<=425
 const unitAt=(q:Point)=>Math.max(0,Math.min(s.count-1,Math.floor(q.x*s.count/760)))
 function arm(kind:string){if(kind.startsWith('choose-item:')){setPending(null);setPendingItem(kind.slice(12));return}if(kind.startsWith('item:')&&spag){setPending(null);setPendingItem(kind.slice(5))}if(kind.startsWith('tool:')||kind.startsWith('choose:'))setPendingItem(null);if(kind.startsWith('choose:')){setPending(kind.slice(7) as 'knife'|'chopsticks');return}armed.current=kind;if(kind.startsWith('tool:'))setPending(kind.slice(5) as 'knife'|'chopsticks')}
 function act(kind:string,q:Point,unit=unitAt(q)){
  if(kind.startsWith('item:'))game.dispatch({type:'place',id:kind.slice(5),unit,x:q.x,y:q.y})
  else if(kind==='cut')game.dispatch({type:'cut',id:q.x<380?'onion':'tomato'})
  else if(kind==='stir')game.dispatch({type:'stir',now:Date.now()})
 }
 function start(e:React.PointerEvent<HTMLElement>){
  if(e.button!==0||s.done||heating)return;unlock();const q=point(e.clientX,e.clientY);if(!q)return
  let kind=armed.current
  if(!kind&&!(e.target as Element).closest('[data-meal-surface]'))return
  if(!kind){if(!inside(q))return;if(pendingItem&&spag){act('item:'+pendingItem,q);setPendingItem(null);return}if(pending){game.dispatch({type:'tool',tool:pending});setPending(null);setCursor(q);return}if(spag){kind=s.step===0||s.step===2?(s.tool==='chopsticks'?'stir':''):s.step===1?(s.tool==='knife'?'cut':''):'item:'+s.selected}else kind=s.count?'item:'+s.selected:''}
  if(!kind)return
  drag.current={id:e.pointerId,kind,last:q,length:0,total:0,angle:0,awards:0,unit:unitAt(q)};e.currentTarget.setPointerCapture(e.pointerId);setCursor(q)
  if(kind.startsWith('tool:')||armed.current?.startsWith('item:'))setGhost({kind,x:e.clientX,y:e.clientY})
 }
 function move(e:React.PointerEvent){const d=drag.current;if(!d||d.id!==e.pointerId||heating)return;const q=point(e.clientX,e.clientY);if(!q)return;setCursor(q);if(ghost)setGhost({kind:d.kind,x:e.clientX,y:e.clientY});const distance=Math.hypot(q.x-d.last.x,q.y-d.last.y);d.length+=distance;d.total+=distance
  if(d.kind==='stir'&&inside(q)){let delta=Math.atan2(q.y-245,q.x-380)-Math.atan2(d.last.y-245,d.last.x-380);if(delta>Math.PI)delta-=Math.PI*2;if(delta<-Math.PI)delta+=Math.PI*2;d.angle+=Math.abs(delta);if(d.length>=160||d.angle>=4.5){act('stir',q);d.awards++;d.length=0;d.angle=0}}
  d.last=q
 }
 function end(e:React.PointerEvent<HTMLElement>){const d=drag.current;drag.current=null;armed.current=null;setGhost(null);if(!d||d.id!==e.pointerId)return;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);const q=point(e.clientX,e.clientY);if(!q||!inside(q))return;if(d.kind.startsWith('tool:')){game.dispatch({type:'tool',tool:d.kind.slice(5) as 'knife'|'chopsticks'});setPending(null)}else if(d.kind==='stir'){if(d.total>=35&&d.awards===0)act('stir',q)}else {act(d.kind,q,unitAt(q));if(d.kind.startsWith('item:'))setPendingItem(null)}}
 function keyboard(unit:number){unlock();if(pendingItem&&spag){act('item:'+pendingItem,{x:380,y:245},unit);setPendingItem(null);return}if(pending){game.dispatch({type:'tool',tool:pending});setPending(null);return}if(!spag){act('item:'+s.selected,{x:unitX(s.count,unit),y:250},unit);return}if(s.step===1)game.dispatch({type:'cut',id:unit===0?'onion':'tomato'});else if(s.step===3)act('item:'+s.selected,{x:280+s.garnish.length%5*43,y:200+s.garnish.length%3*35});else act('stir',{x:380,y:245})}
 const status=s.done?recipe.completion.message:heating?spag?'맛있는 냄새! 3초 동안 볶고 있어요.':'화로에 불이 켜졌어요. 잠깐 기다려요.':!spag?s.count===0?'먼저 만들 개수를 골라요.':`재료를 골라 각 ${s.recipeId==='sandwich'?'샌드위치':'꼬치'}에 자유롭게 넣어요.`:s.step===0?`면을 넣고 젓가락으로 ${s.boilStirs}/5회 저어요.`:s.step===1?'재료를 도마에 옮겨 칼로 각각 두 번 잘라요.':s.step===2?!s.sauteReady?'면·양파·토마토를 넣고 젓가락으로 볶아요.':!s.sauce?'이제 소스를 골라 다시 볶아요.':`소스와 함께 ${s.sauceStirs}/3회 볶아요.`:'파슬리·치즈가루·후추를 자유롭게 뿌려요.'
 const finishAllowed=spag?s.step===3:s.count>0&&(s.recipeId==='sandwich'||s.units.some(items=>items.length))
 const sceneState=!spag&&s.count===0?{...s,count:1,units:[s.recipeId==='sandwich'?['lettuce','ham','tomato','cheese']:['meat','leek','shrimp','red-pepper']]}:s
 return <section className={`cook-workshop meal-workshop meal-${s.recipeId}`} aria-label={recipe.title} onPointerDownCapture={unlock} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>{drag.current=null;armed.current=null;setGhost(null)}}>
 <header className="cook-heading"><button onClick={onBack}>← 요리 선택</button><div><span>요리놀이</span><h1 tabIndex={-1} ref={heading}>{recipe.title}</h1></div><p className="cook-save" role="status">{game.storageOk?'✓ 이 기기에 자동 저장':'지금은 저장할 수 없어요'}</p></header>
 {spag?<StepProgress recipe={recipe} current={s.step}/>:<div className="meal-free-banner"><strong>{s.count?`${s.count}개를 내 마음대로 만들어요`:'몇 개 만들까요?'}</strong><span>{s.recipeId==='sandwich'?'재료는 샌드위치마다 최대 7개':'재료는 꼬치마다 최대 5개'} · 순서는 자유롭게!</span></div>}
 <div className="cook-workspace"><section className="cook-kitchen meal-kitchen" aria-label="요리 공간"><div className="cook-instruction" role="status"><span aria-hidden="true">{spag?s.step+1:'✦'}</span><p>{pending?'선택한 도구를 요리 위로 가져와요.':status}</p></div>
 {spag?<div className="restaurant-wall" aria-hidden="true"><div className="restaurant-awning"/><div className="restaurant-sign">PICCOLO · PIZZA</div><div className="restaurant-window"/></div>:s.recipeId==='sandwich'?<div className="meal-home-wall" aria-hidden="true"><div className="meal-cabinet"/><div className="meal-home-window"/><span>❧</span></div>:<div className="meal-camp-wall" aria-hidden="true"><div className="meal-mountain"/><div className="meal-tree tree-one"/><div className="meal-tree tree-two"/><div className="meal-tent"/><div className="meal-moon"/></div>}
 <div className="cook-counter meal-counter" ref={counter}><div className="meal-surface" data-meal-surface style={{width}} ref={surface}><MealScene state={sceneState}/>
 {!s.done&&!heating&&(spag?s.step===1?(['onion','tomato'] as const).map((id,i)=><button key={id} className="meal-food-hit" data-meal-target={id} style={{left:i?'53%':'18%',width:'28%',top:'23%',height:'53%'}} aria-label={`${id==='onion'?'양파':'토마토'} 썰기`} onClick={e=>{if(e.detail===0)keyboard(i)}}/>):<button className="meal-food-hit meal-whole-hit" data-meal-target="dish" aria-label={s.step===3?'선택한 가루 뿌리기':'젓가락으로 젓기'} onClick={e=>{if(e.detail===0)keyboard(0)}}/>:s.count>0?s.units.map((items,i)=><button key={i} className={'meal-unit-hit'+(s.activeUnit===i?' active':'')} data-meal-target={i} style={{left:`${i/s.count*100}%`,width:`${100/s.count}%`}} aria-label={`${i+1}번 ${s.recipeId==='sandwich'?'샌드위치':'꼬치'}에 재료 넣기`} onClick={e=>{if(e.detail===0)keyboard(i)}}><span>{i+1}번 · {items.length}/{s.recipeId==='sandwich'?7:5}</span></button>):null)}
 {s.tool&&spag&&s.step<3&&!s.done&&<div className="meal-equipped" data-tool={s.tool} style={{left:`${cursor.x/7.6}%`,top:`${cursor.y/4.8}%`}}><MealToolArt tool={s.tool}/></div>}
 </div></div>{s.done?<Completion recipe={recipe}/>:<p className="cook-board-caption">{spag?(s.step===0||s.step===2?'도구를 가져와 빙글빙글! 손가락으로 저어요.':s.step===1?'칼을 가져온 뒤 양파·토마토를 두 번씩 잘라요.':'재료를 골라 톡! 뿌리고 완성을 눌러요.'):'재료를 고르고 원하는 요리를 톡! 끌어 놓기도 좋아요.'}</p>}</section>
 <MealPanel recipe={recipe} state={s} arm={arm} select={id=>game.dispatch({type:'select',id})} sauce={sauce=>game.dispatch({type:'sauce',sauce})} chooseCount={count=>game.dispatch({type:'count',count})} undo={()=>game.dispatch({type:'undo'})}/></div>
 <nav className="cook-bottom" aria-label="요리 진행"><button onClick={()=>setReset(true)}>↻ 다시 만들기</button><span>{s.done?'맛있게 나눠 먹어요!':'시간 제한 없이 즐겁게 만들어요.'}</span><div>{spag&&!s.done&&<button disabled={s.step===0||heating} onClick={()=>game.dispatch({type:'previous'})}>← 이전</button>}<button className="cook-primary" disabled={!s.done&&(heating||(!finishAllowed&&(!spag||!game.ready)))} onClick={()=>{if(s.done)onBack();else if(finishAllowed)game.dispatch({type:'finish',now:Date.now()});else game.dispatch({type:'next'})}}>{s.done?'요리 선택':heating?'조리 중…':finishAllowed?'완성하기':'다음 →'}</button></div></nav>
 {ghost&&<div className="meal-drag-ghost" style={{left:ghost.x,top:ghost.y}} aria-hidden="true">{ghost.kind.startsWith('tool:')?<MealToolArt tool={ghost.kind.slice(5) as 'knife'|'chopsticks'}/>:<FoodGlyph kind={recipe.ingredients.find(i=>i.id===ghost.kind.slice(5))?.icon??'noodle'}/>}</div>}
 {reset&&<dialog ref={dialog} className="cook-reset" aria-labelledby="meal-reset-title" onCancel={e=>{e.preventDefault();setReset(false)}}><h2 id="meal-reset-title">처음부터 만들까요?</h2><p>지금 만든 요리를 지우고 새로 시작해요.</p><button autoFocus onClick={()=>setReset(false)}>계속 만들기</button><button className="cook-primary" onClick={()=>{game.reset();setPending(null);setPendingItem(null);drag.current=null;armed.current=null;setGhost(null);setReset(false)}}>처음부터 만들기</button></dialog>}
 </section>
}
