import React, { Component, Suspense, lazy, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { games, type GameDefinition } from './games/registry'
import { read, write } from './storage'
import { Child, GameArt } from './Art'
import './styles.css'

class GameBoundary extends Component<{children:React.ReactNode;onHome:()=>void},{failed:boolean}> {
  state={failed:false}
  static getDerivedStateFromError(){return {failed:true}}
  render(){return this.state.failed?<section role="alert"><h2>놀이를 불러오지 못했어요</h2><p>인터넷에 연결한 뒤 다시 열어 주세요. 저장한 그림은 그대로 있어요.</p><button onClick={this.props.onHome}>놀이터로 돌아가기</button></section>:this.props.children}
}
function App(){
  const [sound,setSound]=useState(()=>read<unknown>('sound',true)!==false)
  const [notice,setNotice]=useState('')
  const [active,setActive]=useState<GameDefinition|null>(null)
  const [Game,setGame]=useState<React.LazyExoticComponent<React.ComponentType>|null>(null)
  function open(game:GameDefinition){if(game.status!=='ready')return;setGame(lazy(game.load));setActive(game)}
  function home(){setActive(null);setGame(null);requestAnimationFrame(()=>document.querySelector<HTMLElement>('h1')?.focus())}
  function toggleSound(){const next=!sound;setSound(next);setNotice(write('sound',next)?`소리를 ${next?'켰어요':'껐어요'}.`:'지금은 설정을 저장할 수 없어요. 이 화면에서만 적용돼요.')}
  return <div className={`playground${active ? ' is-playing' : ''}`}>
    <a className="skip" href="#games">게임 목록으로 건너뛰기</a>
    <div className="cloud cloud-one" aria-hidden="true"/><div className="cloud cloud-two" aria-hidden="true"/><div className="cloud cloud-three" aria-hidden="true"/>
    <div className="hill hill-left" aria-hidden="true"/><div className="hill hill-right" aria-hidden="true"/>
    <nav className="toolbar" aria-label="공통 메뉴"><button className="home" onClick={home} aria-label="홈으로 이동"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="m3 15 13-12 13 12M7 13v16h7v-9h5v9h7V13" fill="white" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/></svg><span>홈</span></button>{active&&<span className="playing-name">✦ 나의 색칠 놀이터</span>}<button className="sound" aria-pressed={sound} onClick={toggleSound}><span aria-hidden="true">{sound?'◖))':'◖×'}</span> 소리 {sound?'ON':'OFF'}</button></nav>
    {!active&&<header className="hero"><div className="child boy"><Child/></div><div className="hero-copy"><h1 tabIndex={-1}><span>어린이</span> <span>게임</span> <span>놀이터</span></h1><p className="welcome"><span aria-hidden="true">★</span> 매일 즐겁게 놀아요! <span className="stars" aria-hidden="true">★★★</span></p></div><div className="child girl"><Child girl/></div></header>}
    <main id="games" tabIndex={-1}>
      {active&&Game?<section className="game-shell" aria-label={active.title}><GameBoundary key={active.id} onHome={home}><Suspense fallback={<p role="status">놀이를 불러오고 있어요…</p>}><Game/></Suspense></GameBoundary></section>:<><h2 className="sr-only">게임 목록</h2><div className="game-grid">
        {games.map((game,index)=><button key={game.id} className={`card ${game.color}`} disabled={game.status==='coming-soon'} aria-label={`${game.title}${game.status==='coming-soon'?' · 준비 중':''}`} onClick={()=>open(game)}><span className="card-number" aria-hidden="true">0{index+1}</span><GameArt id={game.id}/><span className="game-title">{game.id==='coloring'?<>순서대로<br/>색칠놀이</>:game.title}</span><span className="caption">{game.caption}</span>{game.status==='coming-soon'&&<span className="badge"><span aria-hidden="true">◷</span> 준비 중</span>}</button>)}
        <div className="future-cards"><button className="card blue mini" disabled aria-label="새 게임 · 준비 중"><GameArt id="new"/><span className="game-title">새<br/>게임</span><span className="badge">준비 중</span></button><button className="card gray mini" disabled aria-label="준비 중인 게임"><GameArt id="locked"/><span className="game-title">준비 중</span><span className="mini-dots" aria-hidden="true">● ● ●</span></button></div>
      </div><p className="preparing"><span aria-hidden="true">✦</span> 색칠놀이가 열렸어요! 다른 놀이도 차근차근 준비하고 있어요.</p></>}
    </main><footer>광고 없이 · 회원가입 없이 · 안심하고 놀아요</footer><span role="status" className="sr-only">{notice}</span>
  </div>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)
if(import.meta.env.PROD&&'serviceWorker' in navigator) window.addEventListener('load',()=>{navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(()=>{/* Online home stays usable when offline storage is unavailable. */})})
