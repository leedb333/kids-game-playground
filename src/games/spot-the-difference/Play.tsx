import { useContext, useEffect, useRef, useState, type PointerEvent } from 'react'
import { SoundContext } from '../GameSettings'
import type { Picture } from './catalog'
import { answerAt, display, progress, regionBounds, save, type Data, type Point, type Progress, type Region, type Side } from './model'

const sides = ['original', 'modified'] as const
const scales = [1, 1.5, 2]
const centered: Point = [.5, .5]
const names = { original: '원본 그림', modified: '변경 그림' }
const toolNames = { home: '홈으로', hint: '힌트', picture: '그림 선택', zoom: '확대·축소' }
type Tool = keyof typeof toolNames

function clampCenter(value: number, scale: number) {
  return Math.max(.5 / scale, Math.min(1 - .5 / scale, value))
}

export function Play({ picture, data, urls, restart, home, gallery, onProgress, onReady, onRetry }: {
  picture: Picture; data: Data; urls: Record<Side, string>; restart: boolean
  home: () => void; gallery: () => void; onProgress: (progress: Progress) => void
  onReady?: () => Promise<void>; onRetry?: () => void
}) {
  const [entry] = useState(() => progress(picture, data.answers))
  const [state, setState] = useState(() => restart ? { ...entry, found: [] } : entry)
  const live = useRef(state)
  const [loaded, setLoaded] = useState<Partial<Record<Side, boolean>>>({})
  const [imageError, setImageError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [zoom, setZoom] = useState(0)
  const [center, setCenter] = useState<Point>(centered)
  const [hint, setHint] = useState<string>()
  const [flash, setFlash] = useState<string>()
  const [miss, setMiss] = useState<{ side: Side; point: Point }>()
  const [completeScreen, setCompleteScreen] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const sound = useContext(SoundContext)
  const audio = useRef<AudioContext | null>(null)
  const timers = useRef<Partial<Record<'hint' | 'flash' | 'miss', ReturnType<typeof setTimeout>>>>({})
  const active = useRef(new Set<number>())
  const gesture = useRef<{ id: number; x: number; y: number; center: Point; moved: boolean } | null>(null)
  const started = useRef(false)
  const ready = !!loaded.original && !!loaded.modified && !imageError
  const done = state.found.length === picture.count
  const scale = scales[zoom]

  useEffect(() => () => {
    for (const timer of Object.values(timers.current)) clearTimeout(timer)
    void audio.current?.close().catch(() => {})
    audio.current = null
  }, [])

  useEffect(() => {
    if (!sound) {
      void audio.current?.close().catch(() => {})
      audio.current = null
    }
  }, [sound])

  useEffect(() => {
    if (!ready || started.current) return
    started.current = true
    if (restart) setStorageError(!save(live.current))
    onProgress(live.current)
    void onReady?.()
  }, [ready, restart, onProgress, onReady])

  useEffect(() => {
    if (!ready || !done) return
    const timer = setTimeout(() => setCompleteScreen(true), 1500)
    return () => clearTimeout(timer)
  }, [ready, done])

  function cue(completed: boolean) {
    if (!sound) return
    try {
      const engine = audio.current ??= new AudioContext()
      void engine.resume().catch(() => {})
      const notes = completed ? [659, 784, 988] : [784, 1046]
      notes.forEach((frequency, index) => {
        const at = engine.currentTime + index * .075
        const tone = engine.createOscillator(), volume = engine.createGain()
        tone.frequency.value = frequency
        volume.gain.setValueAtTime(.001, at)
        volume.gain.exponentialRampToValueAtTime(.035, at + .025)
        volume.gain.exponentialRampToValueAtTime(.001, at + .18)
        tone.connect(volume).connect(engine.destination)
        tone.start(at)
        tone.stop(at + .2)
      })
    } catch { /* The visual game works when audio is unavailable. */ }
  }

  function moment(name: 'hint' | 'flash' | 'miss', duration: number, clear: () => void) {
    clearTimeout(timers.current[name])
    timers.current[name] = setTimeout(clear, duration)
  }

  function discover(side: Side, point: Point) {
    if (live.current.found.length === picture.count) return
    const answer = answerAt(data.answers, side, point)
    if (!answer) {
      setMiss({ side, point })
      moment('miss', 480, () => setMiss(undefined))
      return
    }
    if (live.current.found.includes(answer.id)) return
    const found = [...live.current.found, answer.id]
    const completed = found.length === picture.count
    const next = { ...live.current, found, completedEver: live.current.completedEver || completed }
    live.current = next
    setState(next)
    setStorageError(!save(next))
    onProgress(next)
    if (hint === answer.id || completed) setHint(undefined)
    setMiss(undefined)
    setFlash(answer.id)
    moment('flash', 420, () => setFlash(undefined))
    cue(completed)
  }

  function requestHint() {
    const next = data.answers.find(answer => !live.current.found.includes(answer.id))
    if (!ready || !next) return
    setHint(next.id)
    moment('hint', 3000, () => setHint(undefined))
  }

  function down(event: PointerEvent<HTMLDivElement>) {
    if (!ready || done || event.button !== 0) return
    active.current.add(event.pointerId)
    event.currentTarget.setPointerCapture(event.pointerId)
    if (!event.isPrimary || active.current.size > 1) {
      gesture.current = null
      return
    }
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, center, moved: false }
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const drag = gesture.current
    if (!drag || drag.id !== event.pointerId) return
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y
    if (Math.hypot(dx, dy) >= 8) drag.moved = true
    if (!drag.moved || scale === 1) return
    const box = event.currentTarget.getBoundingClientRect()
    setCenter([
      clampCenter(drag.center[0] - dx / (scale * box.width), scale),
      clampCenter(drag.center[1] - dy / (scale * box.height), scale),
    ])
  }

  function cancel(event: PointerEvent<HTMLDivElement>) {
    active.current.delete(event.pointerId)
    if (gesture.current?.id === event.pointerId) gesture.current = null
  }

  function up(event: PointerEvent<HTMLDivElement>, side: Side) {
    const down = gesture.current
    cancel(event)
    if (down?.id !== event.pointerId || down.moved || Math.hypot(event.clientX - down.x, event.clientY - down.y) >= 8) return
    const frame = event.currentTarget.getBoundingClientRect()
    if (event.clientX < frame.left || event.clientX >= frame.right || event.clientY < frame.top || event.clientY >= frame.bottom) return
    const image = event.currentTarget.querySelector('img')!.getBoundingClientRect()
    discover(side, [(event.clientX - image.left) / image.width, (event.clientY - image.top) / image.height])
  }

  function changeZoom() {
    const next = (zoom + 1) % scales.length
    setZoom(next)
    setCenter(point => [clampCenter(point[0], scales[next]), clampCenter(point[1], scales[next])])
  }

  if (completeScreen) return <section className="spot-complete">
    <SymbolIcon kind="picture" />
    <h2 tabIndex={-1} ref={element => element?.focus()}>모두 찾았어요!</h2>
    <p>{picture.count} / {picture.count}개를 발견했어요!</p>
    {storageError && <p role="status">이 기기에 진행을 저장할 수 없어요.</p>}
    <button onClick={gallery}>다시 하기</button><button onClick={home}>홈으로</button>
  </section>

  return <section className="spot-session" aria-label={picture.title}>
    <header className="spot-progress"><span>{picture.title}</span>
      <strong role="status">{state.found.length} / {picture.count}개 찾았어요!</strong>
    </header>
    {!ready && <div className="spot-loading">
      <p role={imageError ? 'alert' : 'status'}>{imageError ? '그림을 열지 못했어요.' : '두 그림을 준비하고 있어요…'}</p>
      {imageError && <button onClick={onRetry ?? (() => { setLoaded({}); setImageError(false); setAttempt(value => value + 1) })}>다시 불러오기</button>}
      <button onClick={gallery}>그림 선택</button>
    </div>}
    <div className={`spot-workspace${ready ? '' : ' spot-awaiting'}`} aria-hidden={!ready} inert={!ready}>
      {sides.map(side => <figure key={side} data-side={side} className="spot-figure">
        <figcaption>{names[side]}</figcaption>
        <div className={`spot-view${scale > 1 ? ' spot-zoomed' : ''}`} onPointerDown={down}
          onPointerMove={move} onPointerCancel={cancel} onLostPointerCapture={cancel} onPointerUp={event => up(event, side)}>
          <div className="spot-layer" style={{ transform: `translate(${(0.5 - center[0] * scale) * 100}%, ${(0.5 - center[1] * scale) * 100}%) scale(${scale})` }}>
            <img key={attempt} src={urls[side]} alt={names[side]} draggable={false} onError={() => setImageError(true)}
              onLoad={event => {
                const image = event.currentTarget
                if (image.naturalWidth !== data.width || image.naturalHeight !== data.height) {
                  setImageError(true)
                  return
                }
                void image.decode().then(() => {
                  if (image.isConnected) setLoaded(previous => ({ ...previous, [side]: true }))
                }).catch(() => { if (image.isConnected) setImageError(true) })
              }} />
            <svg viewBox="0 0 1 1" aria-hidden="true">
              {data.answers.map(answer => state.found.includes(answer.id)
                ? <Outline key={answer.id} region={display(answer, side)} className={flash === answer.id ? 'spot-mark spot-flash' : 'spot-mark'} id={answer.id} />
                : hint === answer.id && <Outline key={answer.id} region={answer.hintRegion ?? display(answer, side)} className="spot-hint" expanded />)}
              {miss?.side === side && <circle className="spot-miss" cx={miss.point[0]} cy={miss.point[1]} r=".018" />}
            </svg>
          </div>
        </div>
      </figure>)}
      <aside className="spot-tools" aria-label="그림 조작">
        <ToolButton kind="home" action={home} />
        <ToolButton kind="hint" action={requestHint} disabled={done} />
        <ToolButton kind="picture" action={gallery} />
        <ToolButton kind="zoom" action={changeZoom} scale={scale} />
      </aside>
    </div>
    {storageError && <p className="spot-storage" role="status">이 기기에 진행을 저장할 수 없어요.</p>}
  </section>
}

function Outline({ region, className, id, expanded }: { region: Region; className: string; id?: string; expanded?: boolean }) {
  const box = regionBounds(region)
  const x = (box.left + box.right) / 2, y = (box.top + box.bottom) / 2
  const props = { className, 'data-answer': id, vectorEffect: 'non-scaling-stroke' }
  const shape = region.shape === 'polygon' ? <polygon {...props} points={region.points.map(point => point.join(',')).join(' ')} />
    : region.shape === 'circle' ? <circle {...props} cx={region.cx} cy={region.cy} r={region.r} />
    : <ellipse {...props} cx={region.cx} cy={region.cy} rx={region.rx} ry={region.ry} />
  return expanded ? <g transform={`translate(${x} ${y}) scale(1.32) translate(${-x} ${-y})`}>{shape}</g> : shape
}

function ToolButton({ kind, action, disabled, scale }: { kind: Tool; action: () => void; disabled?: boolean; scale?: number }) {
  return <button type="button" onClick={action} disabled={disabled}>
    <SymbolIcon kind={kind} /><span>{toolNames[kind]}</span>{scale && <small>{scale}배</small>}
  </button>
}

export function SymbolIcon({ kind }: { kind: Tool }) {
  const paths = {
    home: 'M3 12 12 4l9 8M6 11v9h12v-9m-8 9v-5h4v5',
    hint: 'M9 18h6m-5 3h4m-6-7a6 6 0 1 1 8 0l-1 2H9z',
    picture: 'M3 5h18v14H3zM4 17l5-5 4 3 3-5 4 6m-9-7h.1',
    zoom: 'M15 15l6 6M7 10h6m-3-3v6m7-3a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]} /></svg>
}
