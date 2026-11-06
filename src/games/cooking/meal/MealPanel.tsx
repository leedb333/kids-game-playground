import type {Recipe} from '../types'
import type {MealState} from './model'
import {FoodGlyph,MealToolArt} from './FoodAssets'
export function MealPanel({recipe,state:s,arm,select,sauce,chooseCount,undo}:{recipe:Recipe;state:MealState;arm:(kind:string)=>void;select:(id:string)=>void;sauce:(sauce:'tomato'|'cream')=>void;chooseCount:(n:number)=>void;undo:()=>void}){
 const spag=s.recipeId==='spaghetti',heating=s.heatUntil!==null
 const visible=spag?(s.step===0?['noodle']:s.step===1?['onion','tomato']:s.step===2?['noodle','onion','tomato']:['parsley','powder','pepper']):recipe.ingredients.map(i=>i.id)
 const tool=spag&&s.step<3?(s.step===1?'knife':'chopsticks'):null
 return <aside className="cook-panel meal-panel" aria-label="재료와 도구"><h2>{s.done?'꼬마 요리사 최고!':'재료 · 도구'} <span aria-hidden="true">✦</span></h2>
 {s.done?<div className="meal-done-panel"><span aria-hidden="true">🏅</span><strong>정말 맛있겠어요!</strong><p>요리 선택으로 돌아가면<br/>새 요리를 만들 수 있어요.</p></div>:!spag&&s.count===0?<><h3>몇 개 만들까요?</h3><div className="meal-count-options">{[1,2,3].map(n=><button key={n} onClick={()=>chooseCount(n)} aria-label={`${n}개 만들기`}><span>{n}개</span><svg viewBox="0 0 110 50" aria-hidden="true">{Array.from({length:n},(_,i)=><g key={i} transform={`translate(${(110-n*27)/2+i*27} 5)`}>{s.recipeId==='sandwich'?<path d="M0 14Q-3-1 12 0Q26-3 25 14V37H0Z" fill="#f1d397" stroke="#b4804b" strokeWidth="2"/>:<g><path d="M13 1V40" stroke="#ad8351" strokeWidth="3"/><rect x="3" y="5" width="20" height="12" rx="4" fill="#d99777"/><rect x="3" y="21" width="20" height="12" rx="4" fill="#8baa60"/></g>}</g>)}</svg></button>)}</div><p className="meal-panel-note">원하는 재료를 골라<br/>각 요리에 자유롭게 넣어요.</p></>:<>
 <div className="meal-ingredient-grid">{recipe.ingredients.filter(i=>visible.includes(i.id)).map(item=><button key={item.id} className="meal-ingredient" disabled={heating} aria-pressed={s.selected===item.id} onPointerDown={()=>{select(item.id);arm('item:'+item.id)}} onClick={e=>{select(item.id);if(e.detail===0&&spag)arm('choose-item:'+item.id)}}><FoodGlyph kind={item.icon}/><span>{item.name}</span></button>)}</div>
 {tool&&<button className="meal-tool-card" disabled={heating} aria-label={`${tool==='knife'?'칼':'젓가락'} 가져오기`} aria-pressed={s.tool===tool} onPointerDown={()=>arm('tool:'+tool)} onClick={()=>arm('choose:'+tool)}><MealToolArt tool={tool}/><strong>{tool==='knife'?'칼':'젓가락'}</strong><small>끌어 놓기 · 선택 후 요리판 터치</small></button>}
 {spag&&s.step===2&&<div className="meal-sauce-options" aria-label="소스 선택">{(['tomato','cream'] as const).map(kind=><button key={kind} disabled={!s.sauteReady||heating} aria-pressed={s.sauce===kind} onClick={()=>sauce(kind)}><span className={'sauce-bowl '+kind} aria-hidden="true"/>{kind==='tomato'?'토마토 소스':'크림소스'}</button>)}</div>}
 <p className="meal-panel-note" role="status">{heating?'노릇노릇! 잠깐 기다려요.':spag?s.step===0?`면을 넣고 ${s.boilStirs}/5회 저어요`:s.step===1?`양파 ${s.cuts.onion}/2 · 토마토 ${s.cuts.tomato}/2번 칼질`:s.step===2?!s.sauteReady?'세 재료를 넣고 젓가락으로 볶아요.':!s.sauce?'이제 소스를 골라요!':`소스와 함께 ${s.sauceStirs}/3회 볶아요`:'원하는 만큼 톡톡! 뿌려요.':`${s.activeUnit+1}번 ${s.recipeId==='sandwich'?'샌드위치':'꼬치'} · ${s.units[s.activeUnit]?.length??0}/${s.recipeId==='sandwich'?7:5}개`}</p>
 {(!spag||s.step===3)&&<button className="meal-undo" disabled={heating||(!spag?!s.units[s.activeUnit]?.length:!s.garnish.length)} onClick={undo}>↶ 마지막 재료 빼기</button>}
 {!spag&&<p className="meal-panel-note">{s.units[s.activeUnit]?.length===(s.recipeId==='sandwich'?7:5)?'가득 채웠어요! 다른 곳도 골라 봐요.':'재료를 골라 요리를 톡! 끌어 놓아도 좋아요.'}</p>}
 </>}
 </aside>
}
