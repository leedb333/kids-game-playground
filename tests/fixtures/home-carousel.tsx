import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import {GameCarousel} from '../../src/components/GameCarousel'
import type {GameDefinition} from '../../src/games/registry'
import '../../src/styles.css'

// A test-only catalog exercises the production component; it is not shipped by Vite's app build.
const initial=JSON.parse(document.querySelector('#catalog')!.textContent!) as GameDefinition[]
function Fixture(){
 const [games,setGames]=useState(initial),[chosen,setChosen]=useState('')
 return <div className="playground"><button onClick={()=>setGames(list=>[...list,{...list[0],id:`extra-${list.length}` as GameDefinition['id'],title:`추가 게임 ${list.length+1}`}])}>게임 등록</button><p data-chosen={chosen}>선택: {chosen||'없음'}</p><GameCarousel games={games} onChoose={game=>setChosen(game.id)}/></div>
}
createRoot(document.getElementById('root')!).render(<Fixture/> )
