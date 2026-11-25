import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { Building, City, Flame, Truck, Water, flamePoint } from './Art'
import type { Point } from './maps'
import { graphs, nextTarget, save, type Run } from './progress'
import { adjacentStops, distance, hintRoute, position, remember, stepTo, travel, type Pose } from './roads'
import type { useMazeAudio } from './audio'

const sprayDuration = 2350
const vectors: Record<string, Point> = {
  ArrowRight: { x: 1, y: 0 }, ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 }, ArrowUp: { x: 0, y: -1 },
}
const points = (path: Point[]) => path.map(({ x, y }) => `${x},${y}`).join(' ')

export function Play({ initial, home, again, audio }: {
  initial: Run; home: () => void; again: (previous: Run) => void
  audio: ReturnType<typeof useMazeAudio>
}) {
  const [run, setRun] = useState(initial)
  const [stored, setStored] = useState(true)
  const [spray, setSpray] = useState<string | null>(null)
  const [hint, setHint] = useState<Point[]>([])
  const [radius, setRadius] = useState(30)
  const live = useRef(initial)
  const lock = useRef(false)
  const drag = useRef<{ id: number; dx: number; dy: number } | null>(null)
  const truckClick = useRef(false)
  const replaced = useRef(false)
  const sprayTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const hintTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const svg = useRef<SVGSVGElement>(null)
  const finishHeading = useRef<HTMLHeadingElement>(null)
  const arrow = useId()
  const graph = graphs.get(run.mazeId)!
  const { maze } = graph
  const at = position(graph, run.pose)
  const active = maze.fires.find(fire => fire.id === run.target)
  const goal = active?.stop ?? maze.station.stop
  const ready = run.pose.from === goal && run.pose.to === null
  const premature = !run.complete && run.target !== 'station' && run.pose.from === maze.station.stop && !run.pose.to
  const other = maze.fires.find(fire => fire.stop === run.pose.from && !run.pose.to && !run.extinguished.includes(fire.id))
  const trail = run.trail.map(id => maze.nodes[id])
  if (run.pose.to) trail.push(at)

  useEffect(() => {
    const flush = () => { drag.current = null; if (!replaced.current) save(live.current) }
    const visibility = () => { if (document.hidden) flush() }
    window.addEventListener('pagehide', flush)
    window.addEventListener('blur', flush)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      clearTimeout(sprayTimer.current)
      clearTimeout(hintTimer.current)
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('blur', flush)
      document.removeEventListener('visibilitychange', visibility)
      flush()
    }
  }, [])

  useEffect(() => {
    const board = svg.current
    if (!board) { finishHeading.current?.focus(); return }
    const observer = new ResizeObserver(([entry]) => {
      const scale = entry.contentRect.width / maze.width
      if (scale > 0) setRadius(Math.min(70, Math.max(28, 22 / scale)))
    })
    observer.observe(board)
    return () => observer.disconnect()
  }, [maze.width, run.complete])

  function persist() { setStored(save(live.current)) }
  function update(next: Run) { live.current = next; setRun(next) }

  function clearHint() {
    clearTimeout(hintTimer.current)
    if (hint.length) setHint([])
  }

  function move(pose: Pose, visited: string[], saveNow = false) {
    const current = live.current
    if (lock.current || current.complete) return
    const before = current.pose
    if (pose.from === before.from && pose.to === before.to && pose.offset === before.offset) return
    clearHint()
    const reached = pose.from === goal && !pose.to
    const complete = current.target === 'station' && reached
    update({ ...current, pose, trail: remember(current.trail, visited), complete })
    if (complete) audio.play('complete')
    else if (reached && (before.from !== goal || before.to)) audio.play('arrived')
    if (saveNow || complete) persist()
  }

  function showHint() {
    clearTimeout(hintTimer.current)
    setHint(hintRoute(graph, live.current.pose, goal))
    hintTimer.current = setTimeout(() => setHint([]), 5_000)
  }

  function extinguish() {
    const current = live.current
    const fire = maze.fires.find(f => f.id === current.target)
    if (lock.current || !fire || current.pose.from !== fire.stop || current.pose.to) return
    lock.current = true
    drag.current = null
    clearHint()
    setSpray(fire.id)
    audio.play('spray')
    sprayTimer.current = setTimeout(() => {
      const extinguished = [...live.current.extinguished, fire.id]
      update({ ...live.current, extinguished, target: nextTarget(maze.id, extinguished) })
      persist()
      setSpray(null)
      lock.current = false
      audio.play('clear')
    }, sprayDuration)
  }

  function local(x: number, y: number): Point | null {
    const matrix = svg.current?.getScreenCTM()
    return matrix ? new DOMPoint(x, y).matrixTransform(matrix.inverse()) : null
  }

  function hold(event: PointerEvent<SVGSVGElement>) {
    if (!event.isPrimary || event.button !== 0) return
    truckClick.current = (event.target as Element).closest('[data-truck]') !== null
    if (!truckClick.current || lock.current || drag.current) return
    const p = local(event.clientX, event.clientY)
    if (!p) return
    const truck = position(graph, live.current.pose)
    drag.current = { id: event.pointerId, dx: truck.x - p.x, dy: truck.y - p.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function pull(event: PointerEvent<SVGSVGElement>) {
    const held = drag.current
    if (!held || held.id !== event.pointerId || lock.current) return
    const p = local(event.clientX, event.clientY)
    if (!p) return
    const result = travel(graph, live.current.pose, { x: p.x + held.dx, y: p.y + held.dy }, goal)
    move(result.pose, result.visited)
  }

  function release(event: PointerEvent<SVGSVGElement>) {
    if (drag.current?.id !== event.pointerId) return
    drag.current = null
    persist()
  }

  function step(node: string) {
    const next = stepTo(graph, live.current.pose, node)
    move(next, [next.from], true)
  }

  function tapRoad(event: MouseEvent<SVGSVGElement>) {
    if (truckClick.current || drag.current || lock.current) return
    const p = local(event.clientX, event.clientY)
    if (!p) return
    const neighbor = adjacentStops(graph, live.current.pose).find(id => distance(p, maze.nodes[id]) <= Math.min(radius, 34))
    if (neighbor) step(neighbor)
  }

  function keyboard(event: KeyboardEvent<SVGSVGElement>) {
    const vector = vectors[event.key]
    if (!vector) return
    event.preventDefault()
    if (lock.current || drag.current) return
    const truck = position(graph, live.current.pose)
    const neighbor = adjacentStops(graph, live.current.pose).find(id => {
      const node = maze.nodes[id]
      return Math.sign(node.x - truck.x) === vector.x && Math.sign(node.y - truck.y) === vector.y
    })
    if (neighbor) step(neighbor)
  }

  function goHome() {
    persist()
    audio.stop()
    home()
  }

  if (run.complete) return <section className="maze-finished">
    <svg viewBox="0 0 240 128" aria-hidden="true">
      <path d="M15 108h210" stroke="#a6cc97" strokeWidth="12" strokeLinecap="round" />
      <Building lot={{ x: 145, y: 52, width: 112, height: 78, style: 0 }} station />
      <g transform="translate(78 101)"><Truck scale={1.7} /></g>
      <path d="m36 46 8 8 14-15m148 14 8 8 14-15" stroke="#54a774" fill="none" strokeWidth="5" strokeLinecap="round" />
    </svg>
    <h2 ref={finishHeading} tabIndex={-1}>출동 완료!</h2>
    <p>불을 모두 끄고 안전하게 돌아왔어요!</p>
    <strong>화재 진압 {run.extinguished.length} / {maze.fires.length}</strong>
    <div className="maze-start-actions">
      <button className="maze-primary" onClick={() => { replaced.current = true; audio.stop(); again(live.current) }}>다시 하기</button>
      <button onClick={goHome}>홈으로</button>
    </div>
  </section>

  const radians = run.pose.heading * Math.PI / 180
  const nozzle = { x: at.x + 7 * Math.cos(radians), y: at.y + 7 * Math.sin(radians) }

  return <div className="fire-maze-play">
    <header className="maze-dashboard"><strong role="status" aria-label="진압 수량">화재 진압 {run.extinguished.length} / {maze.fires.length}</strong></header>
    <div className="maze-workspace">
      <svg ref={svg} className="maze-board" viewBox={`0 0 ${maze.width} ${maze.height}`}
        role="group" aria-label="도시 미로판. 소방차를 끌거나 방향키를 사용해요."
        tabIndex={0} onKeyDown={keyboard} onPointerDown={hold} onPointerMove={pull}
        onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onClick={tapRoad}>
        <defs>
          <marker id={arrow} viewBox="0 0 10 10" markerWidth="3" markerHeight="3" refX="8" refY="5" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10z" fill="#fff28b" />
          </marker>
        </defs>
        <City maze={maze} />
        {trail.length > 1 && <polyline className="maze-trail" data-trail points={points(trail)} />}
        {hint.length > 1 && <polyline className="maze-hint" data-hint points={points(hint)} markerEnd={`url(#${arrow})`} />}
        {run.target === 'station' && <rect x={maze.station.x - maze.station.width / 2 - 5}
          y={maze.station.y - maze.station.height / 2 - 5} width={maze.station.width + 10} height={maze.station.height + 10}
          rx="12" className="maze-target-outline" data-target="station" />}
        {maze.fires.map(fire => {
          const done = run.extinguished.includes(fire.id)
          const goalStop = maze.nodes[fire.stop]
          return <g key={fire.id} data-building={fire.id} data-fire={!done} data-target={run.target === fire.id ? fire.id : undefined}>
            {run.target === fire.id && <>
              <rect x={fire.x-fire.width/2-5} y={fire.y-fire.height/2-5} width={fire.width+10} height={fire.height+10} rx="12" className="maze-target-outline" />
              <circle cx={goalStop.x} cy={goalStop.y} r="14" fill="none" stroke="#ffde61" strokeWidth="3" strokeDasharray="5 4" />
            </>}
            <Building lot={fire} />
            {!done && <Flame at={flamePoint(fire)} active={spray === fire.id} />}
            <g transform={`translate(${fire.x + fire.width/2 - 7} ${fire.y - fire.height/2 + 3})`}>
              <circle r="12" fill={done ? '#438865' : '#675278'} stroke="#fffaf0" strokeWidth="2" />
              {done ? <path className="maze-clear-check" d="m-5 0 4 4 6-8" stroke="white" strokeWidth="2.5" fill="none" />
                : <text y="5" textAnchor="middle" fill="white" fontSize="15" fontWeight="800">{fire.id}</text>}
            </g>
          </g>
        })}
        {spray && active && <Water nozzle={nozzle} fire={flamePoint(active)} />}
        <g transform={`translate(${at.x} ${at.y})`} data-truck data-node={run.pose.to ? undefined : run.pose.from}
          data-x={at.x} data-y={at.y} data-heading={run.pose.heading} aria-hidden="true">
          <circle r={radius} fill="transparent" />
          <g transform={`rotate(${run.pose.heading})`} pointerEvents="none"><Truck /></g>
        </g>
      </svg>
      <aside className="maze-controls" aria-label="소방차 조작">
        <p className="maze-objective">현재 목표 <strong>{active ? `${active.id}번 건물` : '소방서'}</strong></p>
        <button onClick={goHome}><Icon kind="home" />홈으로</button>
        <button onClick={showHint} disabled={!!spray}><Icon kind="hint" />힌트</button>
        <button className="maze-extinguish" onClick={extinguish} disabled={!active || !ready || !!spray}><Icon kind="water" />불끄기</button>
      </aside>
    </div>
    <p className="maze-message" role="status">
      {!stored ? '이 기기에 진행을 저장할 수 없어요.' :
        premature ? '아직 불이 난 건물이 있어요!' :
        other && active && other.id !== active.id ? `먼저 ${active.id}번 건물로 가요!` :
        spray ? '물을 뿌리고 있어요!' : ''}
    </p>
  </div>
}

function Icon({ kind }: { kind: 'home' | 'hint' | 'water' }) {
  const path = {
    home: 'M3 12 12 4l9 8M6 10v10h12V10M10 20v-5h4v5',
    hint: 'M3 13h15m-5-5 5 5-5 5',
    water: 'M12 3c2 4 7 8 7 12a7 7 0 0 1-14 0c0-4 5-8 7-12Z',
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={path[kind]} stroke="currentColor" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
