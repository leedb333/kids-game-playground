import { memo, useContext, useEffect, useId, useMemo, useRef, useState, type PointerEvent, type CSSProperties } from 'react'
import { SoundContext } from '../GameSettings'
import type { Level, Picture } from './catalog'
import { fits, makePieces, size, type Piece } from './geometry'
import { pictureURL } from './images'
import { fresh, place, saveProgress, undo } from './progress'

const PieceImage = memo(function PieceImage({ piece, url }: { piece: Piece; url: string }) {
  const clip = useId()
  const { x, y, width, height } = piece.bounds
  return <svg aria-hidden="true" viewBox={`${x - 3} ${y - 3} ${width + 6} ${height + 6}`}>
    <clipPath id={clip}><path d={piece.path} /></clipPath>
    <image href={url} width={size} height={size} clipPath={`url(#${clip})`} />
    <path d={piece.path} fill="none" stroke="#4f5579" strokeWidth="1" vectorEffect="non-scaling-stroke" />
  </svg>
})

type Drag = {
  id: number; pointer: number; fromX: number; fromY: number
  grabX: number; grabY: number; touch: boolean; scale: number; moved: boolean
}

type Ghost = { id: number; x: number; y: number; scale: number }

function liftedY(current: Drag, event: PointerEvent<HTMLButtonElement>) {
  const distance = Math.hypot(event.clientX - current.fromX, event.clientY - current.fromY)
  return event.clientY - (current.touch ? Math.min(24, Math.max(0, distance - 8) / 3) : 0)
}

export function Puzzle({ level, picture, initial, onBack }: {
  level: Level; picture: Picture; initial: ReturnType<typeof fresh>; onBack: () => void
}) {
  const [progress, setProgress] = useState(initial)
  const [saved, setSaved] = useState(true)
  const [selected, setSelected] = useState<number | null>(null)
  const [hint, setHint] = useState(false)
  const [status, setStatus] = useState('')
  const [image, setImage] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const [ghost, setGhost] = useState<Ghost | null>(null)
  const drag = useRef<Drag | null>(null)
  const board = useRef<HTMLDivElement>(null)
  const tray = useRef<HTMLDivElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const audio = useRef<AudioContext | null>(null)
  const sound = useContext(SoundContext)
  const pieces = useMemo(() => makePieces(level.rows, level.columns), [level.rows, level.columns])
  const maxWidth = Math.max(...pieces.map(piece => piece.bounds.width + 6))
  const maxHeight = Math.max(...pieces.map(piece => piece.bounds.height + 6))
  const url = pictureURL(picture)
  const clip = useId()

  useEffect(() => { setSaved(saveProgress(progress)) }, [progress])
  useEffect(() => { title.current?.focus({ preventScroll: true }) }, [])
  useEffect(() => () => { if (audio.current) void audio.current.close().catch(() => {}) }, [])
  useEffect(() => {
    function cancel() { drag.current = null; setGhost(null) }
    window.addEventListener('resize', cancel)
    window.addEventListener('blur', cancel)
    return () => {
      window.removeEventListener('resize', cancel)
      window.removeEventListener('blur', cancel)
    }
  }, [])

  function chime(complete: boolean) {
    if (!sound) return
    try {
      const ctx = audio.current ??= new AudioContext()
      void ctx.resume().catch(() => {})
      const now = ctx.currentTime
      for (const [index, tone] of (complete ? [523, 659, 784] : [523]).entries()) {
        const start = now + index * .11
        const note = ctx.createOscillator(), gain = ctx.createGain()
        note.frequency.value = tone
        gain.gain.setValueAtTime(.045, start)
        gain.gain.exponentialRampToValueAtTime(.001, start + .16)
        note.connect(gain).connect(ctx.destination)
        note.start(start)
        note.stop(start + .17)
      }
    } catch { /* Sound is optional. */ }
  }

  function tryPlace(id: number, x: number, y: number) {
    if (!fits(pieces[id], x, y)) {
      setStatus('다른 자리에 놓아 볼까요?')
      return
    }
    const next = place(progress, id)
    if (next === progress) return
    setProgress(next)
    setSelected(null)
    setStatus(next.complete ? '퍼즐 완성!' : '조각을 맞췄어요.')
    const focused = document.activeElement
    if (board.current?.contains(focused) || tray.current?.contains(focused)) {
      const destination = next.complete ? title : tray
      destination.current?.focus({ preventScroll: true })
    }
    chime(next.complete)
  }

  function start(event: PointerEvent<HTMLButtonElement>, id: number) {
    if (event.button !== 0 || !event.isPrimary || drag.current || !board.current) return
    const touch = event.pointerType === 'touch'
    // Native vertical panning starts in the tray lane and around the artwork.
    if (touch && !(event.target as Element).closest('.jigsaw-piece-grab')) return
    const piece = pieces[id]
    const matrix = event.currentTarget.querySelector('svg')?.getScreenCTM()
    const point = matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : null
    const { x, y, width, height } = piece.bounds
    const grabX = point ? Math.max(x, Math.min(x + width, point.x)) : piece.x + piece.width / 2
    const grabY = point ? Math.max(y, Math.min(y + height, point.y)) : piece.y + piece.height / 2
    drag.current = {
      id, pointer: event.pointerId, fromX: event.clientX, fromY: event.clientY, grabX, grabY,
      scale: board.current.getBoundingClientRect().width / size, touch, moved: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current
    if (!current || current.pointer !== event.pointerId) return
    if (!current.moved && Math.hypot(event.clientX - current.fromX, event.clientY - current.fromY) < 8) return
    current.moved = true
    const bounds = pieces[current.id].bounds
    setGhost({
      id: current.id, scale: current.scale,
      x: event.clientX - (current.grabX - bounds.x + 3) * current.scale,
      y: liftedY(current, event) - (current.grabY - bounds.y + 3) * current.scale,
    })
  }

  function finish(event: PointerEvent<HTMLButtonElement>, cancelled = false) {
    const current = drag.current
    if (!current || current.pointer !== event.pointerId) return
    drag.current = null
    setGhost(null)
    if (cancelled) return
    if (!current.moved && Math.hypot(event.clientX - current.fromX, event.clientY - current.fromY) < 8) {
      setSelected(current.id)
      setStatus('선택한 조각을 퍼즐판에 놓아 보세요.')
      return
    }
    const bounds = board.current?.getBoundingClientRect()
    if (!bounds) return
    const piece = pieces[current.id]
    const x = (event.clientX - bounds.left) / bounds.width * size - current.grabX + piece.x + piece.width / 2
    const y = (liftedY(current, event) - bounds.top) / bounds.height * size - current.grabY + piece.y + piece.height / 2
    tryPlace(current.id, x, y)
  }

  function restart() {
    dialog.current?.close()
    setProgress(fresh(level, picture))
    setSelected(null)
    setHint(false)
    setStatus('처음부터 다시 맞춰요.')
  }

  return <>
    <div className="jigsaw-top">
      <button onClick={onBack}>← 그림 선택</button>
      <h2 ref={title} tabIndex={-1}>{picture.title}</h2>
      <strong role="status" aria-label="진행 수량">{progress.placed.length} / {pieces.length}</strong>
      <div className="jigsaw-actions">
        <button aria-pressed={hint} onClick={() => setHint(!hint)} disabled={image !== 'ready' || progress.complete}>그림 힌트</button>
        <button disabled={!progress.placed.length} onClick={() => {
          setProgress(undo(progress))
          setStatus('마지막 조각을 되돌렸어요.')
        }}>되돌리기</button>
        <button onClick={() => dialog.current?.showModal()}>다시 시작</button>
      </div>
    </div>
    <span className="sr-only" role="status">{status}</span>
    {!saved && <p role="status">지금은 진행 기록을 이 기기에 저장할 수 없어요.</p>}
    {image !== 'ready' && <img key={attempt} className="sr-only" src={url} alt=""
      onLoad={() => setImage('ready')} onError={() => setImage('error')} />}
    {image === 'loading' && <p role="status">그림을 준비하고 있어요…</p>}
    {image === 'error' && <p role="alert">그림을 불러오지 못했어요. <button onClick={() => {
      setImage('loading')
      setAttempt(value => value + 1)
    }}>다시 불러오기</button></p>}
    {image === 'ready' && <div className={'jigsaw-workspace' + (progress.complete ? ' jigsaw-complete' : '')}>
      <div className="jigsaw-board" ref={board} aria-label="퍼즐판" role="group">
        <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          {progress.complete ? <image href={url} width={size} height={size} /> : <>
            {hint && <image href={url} width={size} height={size} opacity=".35" />}
            {pieces.map(piece => <path key={piece.id} d={piece.path} fill="none" stroke="#7d83a1" strokeOpacity=".45" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
            <clipPath id={clip}>{progress.placed.map(id => <path key={id} d={pieces[id].path} />)}</clipPath>
            {progress.placed.length > 0 && <image href={url} width={size} height={size} clipPath={`url(#${clip})`} />}
          </>}
        </svg>
        {selected !== null && !progress.complete && <div className="jigsaw-targets" style={{ gridTemplateColumns: `repeat(${level.columns}, 1fr)` }}>
          {pieces.map(piece => <button key={piece.id} aria-label={`${Math.floor(piece.id / level.columns) + 1}행 ${piece.id % level.columns + 1}열에 놓기`}
            disabled={progress.placed.includes(piece.id)}
            onClick={() => tryPlace(selected, piece.x + piece.width / 2, piece.y + piece.height / 2)} />)}
        </div>}
      </div>
      {progress.complete
        ? <div className="jigsaw-celebrate"><strong>퍼즐 완성!</strong><p>{picture.title} 그림을 모두 맞췄어요.</p><button onClick={onBack}>다음 그림 고르기</button></div>
        : <div className="jigsaw-tray-panel">
          <p id="jigsaw-tray-help">조각을 끌어서 맞춰요! <span>조각과 자리를 차례로 눌러도 돼요.</span><span className="sr-only"> 보관함 여백을 밀면 아래 조각을 볼 수 있어요.</span></p>
          <div className="jigsaw-tray" data-columns={level.trayColumns} data-level={level.id} ref={tray} tabIndex={0}
            style={{ '--piece-aspect': maxWidth / maxHeight } as CSSProperties}
            role="group" aria-label="조각 보관함" aria-describedby="jigsaw-tray-help">
            {progress.remaining.map(id => <button key={id} data-piece={id} type="button" aria-label={`조각 ${id + 1}`}
              aria-pressed={selected === id} onClick={event => {
                if (event.detail === 0) {
                  setSelected(id)
                  setStatus('선택한 조각을 퍼즐판에 놓아 보세요.')
                  requestAnimationFrame(() => board.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true }))
                }
              }}
              onPointerDown={event => start(event, id)} onPointerMove={move} onPointerUp={finish}
              onPointerCancel={event => finish(event, true)} onLostPointerCapture={event => finish(event, true)}>
              <span className="jigsaw-piece-envelope">
                <span className="jigsaw-piece-grab" style={{
                  width: `${(pieces[id].bounds.width + 6) / maxWidth * 100}%`,
                  height: `${(pieces[id].bounds.height + 6) / maxHeight * 100}%`,
                }}>
                  <PieceImage piece={pieces[id]} url={url} />
                </span>
              </span>
            </button>)}
          </div>
        </div>}
    </div>}
    {ghost && <div className="jigsaw-ghost" style={{
      left: ghost.x, top: ghost.y,
      width: (pieces[ghost.id].bounds.width + 6) * ghost.scale,
      height: (pieces[ghost.id].bounds.height + 6) * ghost.scale,
    }}><PieceImage piece={pieces[ghost.id]} url={url} /></div>}
    <dialog ref={dialog} aria-labelledby="jigsaw-confirm-title">
      <h3 id="jigsaw-confirm-title">이 그림을 다시 시작할까요?</h3>
      <div className="jigsaw-actions">
        <button autoFocus onClick={() => dialog.current?.close()}>계속 맞추기</button>
        <button onClick={restart}>처음부터 시작</button>
      </div>
    </dialog>
  </>
}
