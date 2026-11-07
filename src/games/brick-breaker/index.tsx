import {useContext,useEffect,useId,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {SoundContext} from '../GameSettings'
import {read,write} from '../../storage'
import {stages} from './stages'
import {createEngine,launch,movePaddle,step,togglePause} from './engine'
import {completeStage,progressKey,restoreProgress,type Progress} from './progress'
import {colors,render} from './render'
import {createChime} from './audio'
import {NightSky,Star} from './Backdrop'
import type {Phase,Stage} from './types'
import './brick-breaker.css'

function Preview({stage}:{stage:Stage}){const id=useId().replace(/:/g,'');return <svg viewBox="0 0 1000 400" aria-hidden="true"><defs>{Object.entries(colors).map(([key,c])=><linearGradient key={key} id={id+key} x2="0" y2="1"><stop stopColor={c.top}/><stop offset="1" stopColor={c.bottom}/></linearGradient>)}</defs>{stage.bricks.map(b=><g key={b.id}><rect x={b.x} y={b.y} width={b.w} height={b.h} rx="8" fill={`url(#${id+b.color})`} stroke={b.gold?'#fff8ac':'#ffffff91'} strokeWidth={b.gold?4:1.7}/>{b.gold&&<Star x={b.x+b.w/2} y={b.y+b.h/2} r={14} fill="#fffac3"/>}</g>)}</svg>}
function Medal(){return <svg viewBox="0 0 180 160" aria-hidden="true"><defs><linearGradient id="brick-medal" x2=".3" y2="1"><stop stopColor="#fff5a1"/><stop offset="1" stopColor="#ffc61b"/></linearGradient></defs><g stroke="#fff5b5" strokeWidth="3"><Star x={90} y={74} r={62} fill="url(#brick-medal)"/></g><g fill="#795020"><circle cx="72" cy="69" r="4"/><circle cx="108" cy="69" r="4"/></g><path d="M78 85Q90 101 102 85" stroke="#795020" strokeWidth="4" fill="none" strokeLinecap="round"/><Star x={22} y={26} r={8}/><Star x={156} y={112} r={9}/></svg>}
export default function BrickBreaker(){
 const sound=useContext(SoundContext),soundRef=useRef(sound);soundRef.current=sound
 const [progress,setProgress]=useState(()=>restoreProgress(read<unknown>(progressKey,null))),progressRef=useRef(progress)
 const [active,setActive]=useState(progress.current),[phase,setPhase]=useState<Phase>('ready'),[menu,setMenu]=useState(false),[worldHeight,setWorldHeight]=useState(620),[storageOk,setStorageOk]=useState(true),[misses,setMisses]=useState(0)
 const engine=useRef(createEngine(stages[progress.current-1],620,progress.boards[progress.current]??[])),canvas=useRef<HTMLCanvasElement>(null),host=useRef<HTMLDivElement>(null),size=useRef({w:1000,h:620,dpr:1}),menuRef=useRef(false),keys=useRef(new Set<string>()),drag=useRef<{id:number;start:number;startY:number;offset:number;moved:boolean}|null>(null),chime=useRef<ReturnType<typeof createChime>|null>(null),uiPhase=useRef<Phase>('ready')
 menuRef.current=menu
 function save(next:Progress){progressRef.current=next;setProgress(next);setStorageOk(write(progressKey,next))}
 function publish(){const e=engine.current;if(uiPhase.current!==e.phase){uiPhase.current=e.phase;setPhase(e.phase)}setMisses(e.misses)}
 function start(id:number){const next={...progressRef.current,current:id};save(next);engine.current=createEngine(stages[id-1],worldHeight,next.boards[id]??[]);setActive(id);setMenu(false);keys.current.clear();publish();requestAnimationFrame(()=>canvas.current?.focus({preventScroll:true}))}
 function sendBall(){launch(engine.current);publish();canvas.current?.focus({preventScroll:true})}
 function pause(){togglePause(engine.current);keys.current.clear();publish()}
 useEffect(()=>{
  const element=host.current;if(!element)return
  const observer=new ResizeObserver(([entry])=>{const w=entry.contentRect.width,h=entry.contentRect.height;if(w<1||h<1)return;const height=1000*h/w;size.current={w,h,dpr:Math.min(window.devicePixelRatio||1,2)};const node=canvas.current;if(node){node.width=Math.round(w*size.current.dpr);node.height=Math.round(h*size.current.dpr)}
   const old=engine.current,next=createEngine(stages[old.stage-1],height,old.removed);next.misses=old.misses;if(old.phase==='playing'||old.phase==='paused'){next.phase='paused';next.pausedFrom='ready'}else if(old.phase==='cleared'){next.phase='cleared';next.clearReason=old.clearReason}engine.current=next;setWorldHeight(next.height);publish()
  });observer.observe(element);return()=>observer.disconnect()
 },[])
 useEffect(()=>{
  const audio=createChime();chime.current=audio;let frame=0,last=0,accumulator=0,lastRender=0,lastData=0
  function animate(now:number){frame=requestAnimationFrame(animate);const dt=last?Math.min(.1,(now-last)/1000):0;last=now;if(menuRef.current){accumulator=0;return}accumulator+=dt;const e=engine.current
   while(accumulator>=1/120){if(e.phase==='playing'||e.phase==='ready'){const direction=Number(keys.current.has('ArrowRight'))-Number(keys.current.has('ArrowLeft'));if(direction)movePaddle(e,e.paddle.x+direction*850/120)}const before=e.phase;step(e,1/120);for(const event of e.events)audio.play(event,soundRef.current)
    if(before!=='cleared'&&e.phase==='cleared')save(completeStage(progressRef.current,e.stage))
    else if(e.events.includes('brick'))save({...progressRef.current,current:e.stage,boards:{...progressRef.current.boards,[e.stage]:[...e.removed]}})
    if(before!==e.phase)publish();accumulator-=1/120
   }
   const node=canvas.current,ctx=node?.getContext('2d');if(ctx&&now-lastRender>=15){lastRender=now;const s=size.current;render(ctx,e,s.w,s.h,s.dpr,now/1000,window.matchMedia('(prefers-reduced-motion: reduce)').matches)}
   if(node&&now-lastData>=100){lastData=now;node.dataset.ballX=e.ball.x.toFixed(2);node.dataset.ballY=e.ball.y.toFixed(2);node.dataset.paddleX=e.paddle.x.toFixed(2);node.dataset.remaining=String(e.bricks.length);node.dataset.worldHeight=String(e.height)}
  }
  frame=requestAnimationFrame(animate)
  function stop(){keys.current.clear();if(engine.current.phase==='playing'){togglePause(engine.current);publish()}}
  function hidden(){if(document.hidden)stop()}
  document.addEventListener('visibilitychange',hidden);window.addEventListener('blur',stop)
  return()=>{cancelAnimationFrame(frame);audio.close();chime.current=null;document.removeEventListener('visibilitychange',hidden);window.removeEventListener('blur',stop)}
 },[])
 function dialogKeys(e:React.KeyboardEvent<HTMLDivElement>){if(e.key==='Tab'){const buttons=[...e.currentTarget.querySelectorAll<HTMLButtonElement>('button')],index=buttons.indexOf(document.activeElement as HTMLButtonElement);e.preventDefault();buttons[(index+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus()}if(e.key==='Escape'){e.preventDefault();if(engine.current.phase==='paused'){pause();canvas.current?.focus({preventScroll:true})}else setMenu(true)}}
 function position(e:React.PointerEvent<HTMLCanvasElement>){const r=e.currentTarget.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*1000,y:(e.clientY-r.top)/r.height*engine.current.height}}
 function down(e:React.PointerEvent<HTMLCanvasElement>){if(drag.current||e.button!==0||!['ready','playing'].includes(engine.current.phase))return;e.preventDefault();e.currentTarget.focus({preventScroll:true});const p=position(e),pad=engine.current.paddle,offset=Math.abs(p.x-pad.x)<=pad.w/2&&p.y>=pad.y-20?p.x-pad.x:0;drag.current={id:e.pointerId,start:e.clientX,startY:e.clientY,offset,moved:false};e.currentTarget.setPointerCapture(e.pointerId);movePaddle(engine.current,p.x-offset)}
 function move(e:React.PointerEvent<HTMLCanvasElement>){if(!['ready','playing'].includes(engine.current.phase))return;const d=drag.current;if(d&&d.id===e.pointerId){if(Math.hypot(e.clientX-d.start,e.clientY-d.startY)>8)d.moved=true;movePaddle(engine.current,position(e).x-d.offset)}else if(!d&&e.pointerType==='mouse')movePaddle(engine.current,position(e).x)}
 function up(e:React.PointerEvent<HTMLCanvasElement>){const d=drag.current;if(!d||d.id!==e.pointerId)return;drag.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);if(d&&!d.moved&&engine.current.phase==='ready')sendBall()}
 const stage=stages[active-1],toolbar=document.querySelector('.toolbar'),finished=active===stages.length&&phase==='cleared'
 return <section className="brick-game" aria-label="별빛 벽돌깨기">
 {toolbar&&createPortal(<div className="brick-toolbar"><span className="brick-stage-badge" aria-label={`현재 ${active}단계, 전체 ${stages.length}단계`}><span>단계</span> <strong>{active}</strong><small>/ {stages.length}</small></span><button className="brick-pause" onClick={pause} disabled={menu||phase==='cleared'} aria-label={phase==='paused'?'게임 재개':'일시정지'} aria-pressed={phase==='paused'}><svg viewBox="0 0 24 24" aria-hidden="true">{phase==='paused'?<path d="m7 3 15 9-15 9Z"/>:<path d="M5 3h5v18H5ZM15 3h5v18h-5Z"/>}</svg><span>{phase==='paused'?'계속':'멈춤'}</span></button></div>,toolbar)}
 <div className="brick-field" ref={host}><NightSky height={worldHeight}/><canvas ref={canvas} hidden={menu} tabIndex={menu?-1:0} role="application" aria-label={`${active}단계 ${stage.name}. 좌우 화살표로 곰을 움직이고 스페이스로 공을 보내요.`} aria-describedby="brick-instructions" data-stage={active} data-phase={phase} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={e=>{if(drag.current?.id===e.pointerId)drag.current=null}} onKeyDown={e=>{if(['ArrowLeft','ArrowRight',' ','Escape'].includes(e.key)){e.preventDefault();if(e.key.startsWith('Arrow'))keys.current.add(e.key);else if(!e.repeat){if(e.key==='Escape'||engine.current.phase==='paused')pause();else sendBall()}}}} onKeyUp={e=>keys.current.delete(e.key)} onBlur={()=>keys.current.clear()}/>
 {menu?<div className="brick-selection"><header><div className="brick-logo-star"><Medal/></div><div><h1>별빛 벽돌깨기</h1><p>좋아하는 별빛길을 골라요</p></div></header><button autoFocus className="brick-primary brick-continue" onClick={()=>start(progress.current)}>{progress.completed.length===stages.length?'다시 별빛 여행':Object.values(progress.boards).some(ids=>ids.length)||progress.completed.length?'이어서 하기':'처음 시작하기'} · {progress.current}단계</button><div className="brick-stage-grid">{stages.map(s=><button key={s.id} className={'brick-stage-card'+(progress.completed.includes(s.id)?' completed':'')} onClick={()=>start(s.id)} aria-label={`${s.id}단계 ${s.name}${progress.completed.includes(s.id)?' · 완료':''}`}><span className="brick-card-number">{s.id}</span><Preview stage={s}/><strong>{s.name}</strong><small>{progress.completed.includes(s.id)?'별을 모았어요':s.difficulty}</small></button>)}</div><p className="brick-selection-note">황금별 벽돌을 맞히면 바로 완료! · 모든 단계를 골라 놀 수 있어요.</p>{!storageOk&&<p className="brick-storage-warning">지금은 기록을 저장할 수 없어요. 놀이는 계속할 수 있어요.</p>}</div>:
 <>
 {phase==='ready'&&<div className="brick-launch"><p>{misses?'괜찮아요! 한 번 더 통통!':'곰을 좌우로 움직여 황금별을 찾아요'}</p><div><button className="brick-primary" onClick={sendBall}>공 보내기</button><button className="brick-secondary" onClick={()=>setMenu(true)}>단계 선택</button></div></div>}
 {phase==='paused'&&<div className="brick-shade"><div className="brick-dialog" onKeyDown={dialogKeys} role="dialog" aria-modal="true" aria-labelledby="brick-pause-title"><Medal/><h2 id="brick-pause-title">잠깐 쉬어 가요</h2><button autoFocus className="brick-primary" onClick={()=>{pause();canvas.current?.focus({preventScroll:true})}}>계속하기</button><button className="brick-secondary" onClick={()=>setMenu(true)}>단계 선택</button></div></div>}
 {phase==='cleared'&&<div className="brick-shade"><div className={'brick-dialog brick-celebration'+(finished?' finale':'')} onKeyDown={dialogKeys} role="dialog" aria-modal="true" aria-labelledby="brick-clear-title"><div className="brick-confetti" aria-hidden="true">{Array.from({length:16},(_,i)=><i key={i} style={{left:`${i*6+2}%`,animationDelay:`${i%4*.1}s`,background:['#ffe575','#ff9dd5','#8dffe1','#c2a0ff'][i%4]}}/>)}</div><Medal/>{finished&&<div className="brick-final-stars" aria-label={`${progress.completed.length}개의 단계를 완료했어요`}>{stages.map(s=><svg key={s.id} viewBox="0 0 24 24" aria-hidden="true"><Star x={12} y={12} r={10} fill={progress.completed.includes(s.id)?'#ffdf64':'#6877af'}/></svg>)}</div>}<h2 id="brick-clear-title">{finished?'마지막 별에 닿았어요!':'황금별을 찾았어요!'}</h2><p>{finished?'별빛 왕국에서 즐거운 여행을 했어요.':`${active}단계 완료! 다음 별도 만나 볼까요?`}</p>{finished?<button autoFocus className="brick-primary" onClick={()=>start(1)}>처음부터 다시 놀기</button>:<button autoFocus className="brick-primary" onClick={()=>start(active+1)}>다음 단계</button>}<button className="brick-secondary" onClick={()=>setMenu(true)}>단계 선택</button></div></div>}
 </>}
 </div>
 <p className="sr-only" id="brick-instructions">화면을 좌우로 끌면 곰이 움직여요. 공을 놓쳐도 다시 보낼 수 있어요. 키보드 좌우 화살표, 스페이스, Escape 키로도 놀 수 있어요.</p><span className="sr-only" role="status">{phase==='cleared'?`${active}단계를 완료했어요.`:phase==='paused'?'잠깐 멈췄어요.':misses&&phase==='ready'?'괜찮아요. 공을 다시 보내요.':''}{!storageOk?' 지금은 기록을 저장할 수 없어요.':''}</span>
 </section>
}
