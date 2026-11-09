import {useEffect,useRef,useState} from 'react'
import {GameArt} from '../Art'
import type {GameDefinition} from '../games/registry'
import './game-carousel.css'

type Props={games:readonly GameDefinition[];onChoose:(game:GameDefinition)=>void}
export function GameCarousel({games,onChoose}:Props){
 const rail=useRef<HTMLDivElement>(null)
 const gesture=useRef<{id:number;x:number;y:number;scroll:number;mouse:boolean;moved:boolean;active:boolean}|null>(null)
 const [scroll,setScroll]=useState({overflow:false,left:false,right:false})
 useEffect(()=>{
  const el=rail.current;if(!el)return
  function measure(){if(!el)return;const max=el.scrollWidth-el.clientWidth;const next={overflow:max>2,left:el.scrollLeft>2,right:el.scrollLeft<max-2};setScroll(old=>old.overflow===next.overflow&&old.left===next.left&&old.right===next.right?old:next)}
  const observer=new ResizeObserver(measure);observer.observe(el);for(const child of el.children)observer.observe(child)
  el.addEventListener('scroll',measure,{passive:true});measure()
  return()=>{observer.disconnect();el.removeEventListener('scroll',measure)}
 },[games])
 function move(direction:number){const el=rail.current;if(!el)return;el.scrollBy({left:direction*(el.firstElementChild?.getBoundingClientRect().width??200)+direction*parseFloat(getComputedStyle(el).columnGap),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
 return <section className="home-games" aria-label="게임 고르기">
  <h2 className="sr-only">게임 목록</h2>
  <div ref={rail} className="game-grid home-game-rail" role="group" aria-label="게임 카드 목록" tabIndex={0}
   onPointerDownCapture={e=>{if(e.button!==0||!e.isPrimary)return;gesture.current={id:e.pointerId,x:e.clientX,y:e.clientY,scroll:e.currentTarget.scrollLeft,mouse:e.pointerType==='mouse',moved:false,active:true}}}
   onPointerMoveCapture={e=>{const g=gesture.current;if(!g||!g.active||g.id!==e.pointerId)return;const dx=e.clientX-g.x,dy=e.clientY-g.y;if(Math.hypot(dx,dy)>8)g.moved=true;if(g.mouse&&g.moved&&Math.abs(dx)>Math.abs(dy)){e.preventDefault();e.currentTarget.dataset.dragging='true';if(!e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.setPointerCapture(e.pointerId);e.currentTarget.scrollLeft=g.scroll-dx}}}
   onPointerUpCapture={e=>{if(gesture.current)gesture.current.active=false;delete e.currentTarget.dataset.dragging;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}}
   onPointerCancelCapture={e=>{delete e.currentTarget.dataset.dragging;if(gesture.current){gesture.current.moved=true;gesture.current.active=false}}}
   onClickCapture={e=>{if(e.detail!==0&&gesture.current?.moved){e.preventDefault();e.stopPropagation()}}}
   onDragStart={e=>e.preventDefault()}
   onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1)}else if(e.key==='Home'||e.key==='End'){e.preventDefault();e.currentTarget.scrollTo({left:e.key==='Home'?0:e.currentTarget.scrollWidth,behavior:'instant'})}}}>
   {games.map((game,index)=><button key={game.id} className={`card ${game.color}`} disabled={game.status!=='ready'} aria-label={`${game.title}${game.status!=='ready'?' · 준비 중':''}`} onClick={()=>onChoose(game)}>
    <span className="card-number" aria-hidden="true">{String(index+1).padStart(2,'0')}</span><GameArt id={game.id}/><span className="game-title">{game.title}</span><span className="caption">{game.caption}</span>
   </button>)}
  </div>
  {scroll.overflow&&<div className="home-scroll-controls"><button aria-label="이전 게임 보기" disabled={!scroll.left} onClick={()=>move(-1)}><span aria-hidden="true">←</span></button><p>옆으로 넘겨서 골라요 <span aria-hidden="true">↔</span></p><button aria-label="다음 게임 보기" disabled={!scroll.right} onClick={()=>move(1)}><span aria-hidden="true">→</span></button></div>}
 </section>
}
