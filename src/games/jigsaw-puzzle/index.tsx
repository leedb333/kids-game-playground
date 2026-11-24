import { useEffect, useRef, useState } from 'react'
import { levels, type Level, type Picture } from './catalog'
import { fresh, loadProgress } from './progress'
import { Puzzle } from './Puzzle'
import { pictureURL } from './images'
import './jigsaw.css'

type Session = { picture: Picture; progress: ReturnType<typeof fresh> }

function PictureCard({ level, picture, onPlay }: {
  level: Level; picture: Picture; onPlay: (session: Session) => void
}) {
  const [failed, setFailed] = useState(false)
  const saved = loadProgress(level, picture)

  return <article className="jigsaw-picture">
    {failed
      ? <p className="jigsaw-image-error" role="status">그림을 불러오지 못했어요. 온라인에서 다시 열어 주세요.</p>
      : <img src={pictureURL(picture)} alt={picture.title} width={1254} height={1254} decoding="async" onError={() => setFailed(true)} />}
    <h3>{picture.title}</h3>
    {saved && <p>{saved.complete ? '완성!' : `${saved.placed.length} / ${level.rows * level.columns} 조각`}</p>}
    <div className="jigsaw-actions">
      {saved && <button onClick={() => onPlay({ picture, progress: saved })}>
        {saved.complete ? '완성 그림 보기' : '이어하기'}
      </button>}
      <button onClick={() => {
        const next = () => onPlay({ picture, progress: fresh(level, picture) })
        if (!saved || window.confirm('이 그림을 처음부터 다시 맞출까요?')) next()
      }}>{saved ? '새로 시작하기' : '퍼즐 시작'}</button>
    </div>
  </article>
}

export default function Jigsaw() {
  const [level, setLevel] = useState<Level | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { if (!session) heading.current?.focus({ preventScroll: true }) }, [level, session])

  return <div className="jigsaw">
    {level && session
      ? <Puzzle level={level} picture={session.picture} initial={session.progress} onBack={() => setSession(null)} />
      : level
        ? <>
          <div className="jigsaw-top">
            <button onClick={() => setLevel(null)}>← 난이도</button>
            <h2 ref={heading} tabIndex={-1}>{level.theme} · {level.rows * level.columns}조각</h2>
          </div>
          <div className="jigsaw-pictures">
            {level.pictures.map(picture => <PictureCard key={picture.id} level={level} picture={picture} onPlay={setSession} />)}
          </div>
        </>
        : <>
          <h2 ref={heading} tabIndex={-1}>몇 조각에 도전할까요?</h2>
          <div className="jigsaw-levels">
            {levels.map(level => <button key={level.id} onClick={() => setLevel(level)}>
              <span>{level.id}단계</span><strong>{level.theme}</strong><span>{level.rows * level.columns}조각</span>
            </button>)}
          </div>
        </>}
  </div>
}
