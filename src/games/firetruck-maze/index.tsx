import { useContext, useRef, useState } from 'react'
import { GameHomeContext, SoundContext } from '../GameSettings'
import { Truck } from './Art'
import { useMazeAudio } from './audio'
import { depart, load, save, type Run } from './progress'
import { Play } from './Play'
import './maze.css'

export default function FiretruckMaze() {
  const [saved] = useState(load)
  const [session, setSession] = useState<{ run: Run; attempt: number } | null>(null)
  const confirm = useRef<HTMLDialogElement>(null)
  const home = useContext(GameHomeContext)
  const audio = useMazeAudio(useContext(SoundContext))
  function start(previous?: Run) {
    const run = depart(previous)
    save(run)
    audio.play('depart')
    setSession(old => ({ run, attempt: (old?.attempt ?? 0) + 1 }))
  }

  return <div className="fire-maze">
    {session ? <Play key={session.attempt} initial={session.run} home={home} again={start} audio={audio} /> :
      <div className="maze-welcome">
        <div>
          <h2>출동! 소방차 미로</h2>
          <p>불을 끄고 소방서로 돌아와요!</p>
          <div className="maze-start-actions">
            {saved ? <>
              <button className="maze-primary" onClick={() => setSession({ run: saved, attempt: 1 })}>이어하기</button>
              <button onClick={() => confirm.current?.showModal()}>새로 시작하기</button>
            </> : <button className="maze-primary" onClick={() => start()}>출동하기</button>}
          </div>
        </div>
        <svg viewBox="0 0 470 290" aria-hidden="true">
          <rect width="470" height="290" rx="28" fill="#cdeffd" />
          <path d="M0 185Q120 124 242 177T470 179V290H0z" fill="#afdc91" />
          <path d="M35 67h59m233-16h52" stroke="#f4fcff" strokeWidth="16" strokeLinecap="round" />
          <g fill="#a2b4e9"><rect x="45" y="110" width="69" height="96" rx="6" /><rect x="139" y="87" width="75" height="112" rx="6" /></g>
          <g fill="#e8d8ed"><rect x="257" y="119" width="64" height="79" rx="6" /><rect x="350" y="93" width="71" height="115" rx="6" /></g>
          <path d="M61 132h35m-35 20h35m58-39h44m-44 22h44m75 6h31m-31 19h31m62-42h37m-37 23h37" stroke="#f9f2d8" strokeWidth="8" strokeDasharray="10 5" />
          <rect y="211" width="470" height="66" fill="#788998" /><path d="M0 244h470" stroke="#fff1bd" strokeWidth="3" strokeDasharray="18 14" />
          <g transform="translate(231 235) rotate(-6)"><Truck scale={3.8} /></g>
        </svg>
        <dialog ref={confirm} aria-labelledby="maze-reset-title">
          <h3 id="maze-reset-title">처음부터 다시 출동할까요?</h3>
          <button autoFocus onClick={() => confirm.current?.close()}>계속하기</button>
          <button className="maze-primary" onClick={() => { confirm.current?.close(); start(saved ?? undefined) }}>새로 출동</button>
        </dialog>
      </div>}
  </div>
}
