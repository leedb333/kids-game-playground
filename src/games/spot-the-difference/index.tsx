import { useContext, useEffect, useState } from 'react'
import { GameHomeContext } from '../GameSettings'
import { pictures, pictureFiles, type Picture } from './catalog'
import { parseData, progress, type Data, type Progress } from './model'
import { Play, SymbolIcon } from './Play'
import './spot.css'

const available = pictures.filter(picture => picture.enabled)
const base = import.meta.env.BASE_URL

export default function SpotTheDifference() {
  const home = useContext(GameHomeContext)
  const [records, setRecords] = useState<Record<string, Progress>>(() =>
    Object.fromEntries(available.map(picture => [picture.id, progress(picture)])),
  )
  const [selection, setSelection] = useState<{ picture: Picture; restart: boolean }>()
  const [confirm, setConfirm] = useState<Picture>()

  function remember(state: Progress) {
    setRecords(previous => ({ ...previous, [state.imageId]: state }))
  }

  return <div className={`spot-game${selection ? ' spot-playing' : ''}`}>
    {selection ? <PictureLoader
      picture={selection.picture} restart={selection.restart} home={home}
      gallery={() => setSelection(undefined)} onProgress={remember}
    /> : <section className="spot-gallery" aria-label="그림 선택">
      <h2 tabIndex={-1} ref={element => element?.focus()}>그림을 골라요</h2>
      <div className="spot-cards">
        {available.map(picture => {
          const saved = records[picture.id]
          const complete = saved.found.length === picture.count
          const partial = !complete && saved.found.length > 0
          return <article key={picture.id} className="spot-card">
            <button className="spot-card-main" type="button" onClick={() => setSelection({ picture, restart: complete })}>
              <img src={base + pictureFiles(picture.id).thumb} alt="" draggable={false} />
              <strong>{picture.title}</strong>
              <span>{complete ? '모두 찾았어요' : partial ? `${saved.found.length} / ${picture.count}개 발견` : saved.completedEver ? '완료 기록 있음' : `${picture.count}개 찾기`}</span>
              {partial && <progress value={saved.found.length} max={picture.count} aria-label="발견 진행률" />}
              <b>{partial ? '이어하기' : saved.completedEver ? '다시 도전' : '게임 시작'}</b>
            </button>
            {partial && <button type="button" className="spot-restart" onClick={() => setConfirm(picture)}>새로 시작하기</button>}
          </article>
        })}
        {Array.from({ length: Math.max(0, 10 - available.length) }, (_, index) =>
          <article key={index} className="spot-card spot-pending" aria-disabled="true">
            <span><SymbolIcon kind="picture" /></span><strong>준비 중</strong>
          </article>,
        )}
      </div>
    </section>}
    {confirm && <dialog ref={element => { if (element && !element.open) element.showModal() }}
      onCancel={() => setConfirm(undefined)} aria-labelledby="spot-reset">
      <h2 id="spot-reset">이 그림을 처음부터 다시 찾을까요?</h2>
      <button type="button" autoFocus onClick={() => setConfirm(undefined)}>취소</button>
      <button type="button" onClick={() => {
        setSelection({ picture: confirm, restart: true })
        setConfirm(undefined)
      }}>새로 시작하기</button>
    </dialog>}
  </div>
}

function PictureLoader({ picture, restart, home, gallery, onProgress }: {
  picture: Picture; restart: boolean; home: () => void; gallery: () => void; onProgress: (progress: Progress) => void
}) {
  const [retry, setRetry] = useState(0)
  const [data, setData] = useState<Data>()
  const [failed, setFailed] = useState(false)
  const files = pictureFiles(picture.id)
  useEffect(() => {
    const controller = new AbortController()
    fetch(base + pictureFiles(picture.id).data, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Picture data unavailable')
        return response.json()
      })
      .then(raw => parseData(raw, picture))
      .then(result => { if (!controller.signal.aborted) setData(result) })
      .catch(() => { if (!controller.signal.aborted) setFailed(true) })
    return () => controller.abort()
  }, [picture, retry])

  if (failed) return <section className="spot-loading">
    <p role="alert">그림을 열지 못했어요.</p>
    <button onClick={() => { setFailed(false); setRetry(value => value + 1) }}>다시 불러오기</button>
    <button onClick={gallery}>그림 선택</button>
  </section>
  if (!data) return <section className="spot-loading"><p role="status">그림을 준비하고 있어요…</p><button onClick={gallery}>그림 선택</button></section>
  return <Play picture={picture} data={data} urls={{ original: base + files.original, modified: base + files.modified }}
    restart={restart} home={home} gallery={gallery} onProgress={onProgress} />
}
