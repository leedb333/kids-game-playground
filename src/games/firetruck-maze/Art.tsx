import { memo } from 'react'
import type { Maze, Park, Point, Waterway } from './maps'

// Centered around the truck, facing right. Can be replaced independently.
export function Truck({ scale = 1 }: { scale?: number }) {
  return <g transform={`scale(${scale})`} stroke="#672e45" strokeWidth="1.5">
    <rect x="-22" y="-12" width="35" height="24" rx="5" fill="#df3f4d" />
    <rect x="8" y="-12" width="15" height="24" rx="6" fill="#ff6166" />
    <path d="M12-8h6l3 5v6l-3 5h-6z" fill="#a9e6f7" />
    <rect x="-18" y="-8" width="21" height="16" rx="3" fill="#f8887f" />
    <path d="M-17-4H2M-17 4H2M-14-4v8m5-8v8m5-8v8" fill="none" stroke="#fff1d0" strokeWidth="2" />
    <path d="M7-10v20" stroke="#fbe3a4" strokeWidth="3" />
    <path d="M21-7v3m0 8v3" stroke="#fff5bc" strokeWidth="2" strokeLinecap="round" />
    <path d="M-16-12h7m-7 24h7m22-24h5m-5 24h5" stroke="#25314c" strokeWidth="3.2" strokeLinecap="round" />
    <rect x="3" y="-5" width="6" height="10" rx="2" fill="#6dcaf6" />
  </g>
}

function Plant({ x, y, large = false }: Point & { large?: boolean }) {
  return <g transform={`translate(${x} ${y})`}>
    <circle cy="3" r={large ? 12 : 7} fill="#79ae58" opacity=".6" />
    <circle r={large ? 11 : 6} fill={large ? '#399557' : '#55a779'} />
    <circle cx="-2" cy="-2" r={large ? 7 : 4} fill="#72c471" />
  </g>
}

const palettes = [
  ['#f8bfaa', '#d98979', '#ffe5c7'], ['#b7beef', '#838bc8', '#e4e8ff'],
  ['#f6d17f', '#bf954e', '#fff0bf'], ['#9bdacb', '#60a8a2', '#d8f5ec'],
]
type Lot = Maze['buildings'][number]

export function Building({ lot, station = false }: { lot: Lot; station?: boolean }) {
  const { x, y, width: w, height: h, style, kind } = lot
  const [wall, edge, roof] = station ? ['#f56e72', '#ab3f5b', '#fff4db'] : palettes[style % palettes.length]
  const columns = w >= 65 ? 3 : 2
  return <g transform={`translate(${x - w / 2} ${y - h / 2})`}>
    <rect x="2" y="4" width={w} height={h} rx="8" fill="#46664c" opacity=".18" />
    <rect width={w} height={h} rx="7" fill={wall} stroke={edge} strokeWidth="2" />
    <path d={`M3 17 V8 Q3 3 8 3 H${w-8} Q${w-3} 3 ${w-3} 8 V17Z`} fill={roof} />
    {station
      ? <><rect x={w / 2 - 19} y="23" width="38" height={h - 23} rx="3" fill="#733d54" />
        <path d={`M${w/2-12} 31h24m-24 6h24`} stroke="#f4a6a4" strokeWidth="2" />
        <text x={w / 2} y="14" textAnchor="middle" fill="#75374a" fontSize="13" fontWeight="800">소방서</text></>
      : kind === 'house' ? <>
        <path d={`M1 22 ${w / 2} 4 ${w - 1} 22Z`} fill={edge} stroke={edge} strokeWidth="2" />
        <rect x={w * .11} y={h * .55} width={w * .22} height={h * .23} rx="2" fill="#e6f6ff" />
        <rect x={w * .66} y={h * .59} width={w * .19} height={h * .41} rx="2" fill={edge} />
      </> : kind === 'shop' ? <>
        <rect x={w * .1} y={h * .48} width={w * .8} height={h * .45} rx="2" fill="#e6f6ff" stroke={edge} />
        <path d={`M4 ${h * .44}h${w-8}`} stroke={edge} strokeWidth="10" />
        <path d={`M4 ${h * .44}h${w-8}`} stroke="#fff8de" strokeWidth="10" strokeDasharray="7 7" />
      </> : kind === 'tower' ? <>
        <rect x={w * .16} y="5" width={w * .68} height={h - 11} rx="3" fill="#536c9a" />
        <path d={`M${w * .36} 8v${h-16}M${w * .63} 8v${h-16}`} stroke="#c1e6fa" strokeWidth="4" />
        <path d={`M7 ${h * .7}h${w - 14}`} stroke={roof} strokeWidth="4" />
      </> : kind === 'hospital' || kind === 'school' ? <>
        <rect x="5" y="7" width={w - 10} height={h * .39} rx="4" fill="#fff4e7" />
        {kind === 'hospital'
          ? <path d={`M${w / 2 - 8} 17h16m-8-8v16`} stroke="#d9546b" strokeWidth="5" />
          : <path d={`M${w / 2 - 9} 19h18l-9-9z`} fill="#9a77a1" />}
        <rect x={w * .36} y={h * .6} width={w * .28} height={h * .4} rx="2" fill={edge} />
      </> : <g fill="#e6f6ff" stroke={edge} strokeWidth="1.2">
        {Array.from({ length: columns }, (_, i) => <g key={i} transform={`translate(${9 + i * (w - 26) / (columns - 1)} 0)`}>
          <rect y="20" width="8" height="9" rx="2" /><rect y="32" width="8" height="8" rx="2" />
        </g>)}
        <path d={`M${w/2-5} ${h}v-7q5-6 10 0v7`} fill={edge} />
      </g>}
  </g>
}

function Landscaping({ lot }: { lot: Park }) {
  const { x, y, width, height, feature } = lot
  return <g transform={`translate(${x} ${y})`}>
    <rect x={-width / 2} y={-height / 2} width={width} height={height} rx="12"
      fill={feature === 'plaza' ? '#efdcb1' : '#a8d98a'} />
    {feature === 'field' ? <>
      <rect x={-width * .43} y={-height * .38} width={width * .86} height={height * .76}
        rx="3" fill="#7dc795" stroke="#f8f4c5" strokeWidth="2" />
      <path d={`M0 ${-height * .38}v${height * .76}`} stroke="#f8f4c5" />
      <circle r={Math.min(width, height) * .17} fill="none" stroke="#f8f4c5" />
    </> : feature === 'playground' ? <>
      <path d="M-20 13-11-13 0 13m-11-26H6L17 13M0 13h16" fill="none"
        stroke="#886baa" strokeWidth="4" strokeLinecap="round" />
      <circle cx="17" cy="-8" r="6" fill="#f7cf68" />
    </> : feature === 'plaza' ? <>
      <circle r={Math.min(width, height) * .3} fill="#82cde3" stroke="#f9f7e0" strokeWidth="3" />
      <circle r="4" fill="#e4f7fb" />
    </> : <>
      <path d="M-19 11Q0-16 19 6" stroke="#f4e8b1" strokeWidth="6" fill="none" />
      <Plant x={-15} y={-11} large /><Plant x={18} y={11} />
      <circle cx="12" cy="-13" r="3" fill="#ffda71" /><circle cx="19" cy="-14" r="2.6" fill="#fff1b6" />
    </>}
  </g>
}

function Waterfront({ water }: { water: Waterway }) {
  const { kind, x, y, width, height, bridges } = water
  return <>
    {kind === 'river' ? <rect x={x} y={y} width={width} height={height} fill="#85d4e9" /> :
      <rect x={x} y={y} width={width} height={height} rx={Math.min(width, height) * .37}
        fill="#85d4e9" stroke="#d8efb5" strokeWidth="9" />}
    {[.2, .42, .64, .8].map((fraction, i) => <path key={fraction}
      d={`M${x + width * (i % 2 ? .42 : .19)} ${y + height * fraction}q13-7 24 0t24 0`}
      fill="none" stroke="#d6f3fc" strokeLinecap="round" strokeWidth="3" />)}
    {bridges?.map(deck => <rect key={deck} x={x - 9} y={deck - 33} width={width + 18} height="66"
      rx="5" fill="#ffe5a5" stroke="#b49882" strokeWidth="4" />)}
  </>
}

export const City = memo(function City({ maze }: { maze: Maze }) {
  const road = maze.roads.map(([a, b]) => {
    const p = maze.nodes[a], q = maze.nodes[b]
    return `M${p.x} ${p.y}L${q.x} ${q.y}`
  }).join('')
  const start = maze.nodes[maze.start]
  return <>
    <rect width={maze.width} height={maze.height} fill={maze.ground ?? '#c9e9aa'} />
    {maze.ground ? <path d={`M0 24Q${maze.width / 2} 2 ${maze.width} 27M0 ${maze.height - 25}q${maze.width / 2} -22 ${maze.width} 0`}
      stroke="#ffffff42" strokeWidth="24" fill="none" /> :
      <path d="M-10 39Q190-15 372 48T750 22T1080 41M-10 669Q160 609 325 667T698 661T1080 666" stroke="#dff2bd" strokeWidth="39" fill="none" />}
    {maze.water && <Waterfront water={maze.water} />}
    {maze.parks.map((lot, i) => <Landscaping key={i} lot={lot} />)}
    {maze.buildings.map((lot, i) => <Building key={i} lot={lot} />)}
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={road} stroke="#f6edcb" strokeWidth={maze.roadWidth + 12} />
      <path d={road} stroke="#667583" strokeWidth={maze.roadWidth} />
      <path d={road} stroke="#e9e1b4" strokeWidth="2" strokeDasharray="10 12" strokeDashoffset="-7" opacity=".85" />
    </g>
    <circle cx={start.x} cy={start.y} r="18" fill="#85af91" stroke="#dff6b9" strokeWidth="2" />
    <path d={`M${start.x-9} ${start.y}h18m-7-7 7 7-7 7`} fill="none" stroke="#fffbd4" strokeWidth="2.5" strokeLinecap="round" />
    <Building lot={maze.station} station />
  </>
})

export const flamePoint = (lot: Lot) => ({ x: lot.x, y: lot.y - 8 })

export function Flame({ at, active }: { at: Point; active: boolean }) {
  return <g transform={`translate(${at.x} ${at.y})`}>
    <g className={`maze-flame${active ? ' maze-flame-fade' : ''}`}>
      <g className="maze-smoke" fill="#f4e1d2" opacity=".9">
        <circle cx="1" cy="-25" r="8" /><circle cx="-4" cy="-32" r="6" /><circle cx="6" cy="-38" r="5" />
      </g>
      <path d="M-16 7C-18-4-8-9-8-17c5 1 6 6 7 9C2-15 5-18 4-25 15-18 20-3 14 7c-5 9-21 11-30 0z" fill="#f77542" />
      <path d="M-7 8c-4-8 6-10 7-17 6 5 10 13 5 17-4 3-9 3-12 0z" fill="#ffe479" />
    </g>
  </g>
}

export function Water({ nozzle, fire }: { nozzle: Point; fire: Point }) {
  const control = { x: (nozzle.x + fire.x) / 2, y: (nozzle.y + fire.y) / 2 - 31 }
  const path = `M${nozzle.x} ${nozzle.y}Q${control.x} ${control.y} ${fire.x} ${fire.y}`
  return <g className="maze-water" pointerEvents="none">
    <path d={path} stroke="#93eaff" strokeWidth="11" strokeLinecap="round" fill="none" opacity=".88" />
    <path d={path} stroke="#368ee5" strokeWidth="5" strokeLinecap="round" strokeDasharray="10 6" fill="none" />
    <circle cx={fire.x - 9} cy={fire.y + 5} r="5" fill="#b2f2ff" /><circle cx={fire.x + 8} cy={fire.y - 2} r="4" fill="#89ddfd" />
  </g>
}
