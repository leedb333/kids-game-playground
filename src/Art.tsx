import type { GameId } from './games/registry'
export function Child({girl=false}:{girl?:boolean}) {return <svg viewBox="0 0 160 160" aria-hidden="true"><path d="M35 152q0-62 45-62t46 62" fill={girl?'#ff79b4':'#3faef4'} stroke="#533947" strokeWidth="4"/><path d="M38 117 15 95M121 117l25-26" stroke="#533947" strokeWidth="19" strokeLinecap="round"/><path d="M38 117 15 95M121 117l25-26" stroke="#ffd3ae" strokeWidth="12" strokeLinecap="round"/>{girl&&<path d="M30 51q-29 32-9 61M129 51q30 32 10 61" fill="none" stroke="#75422f" strokeWidth="25"/>}<ellipse cx="80" cy="65" rx="51" ry="48" fill="#ffd8b7" stroke="#533947" strokeWidth="4"/><path d="M29 59Q23 5 79 10q58 0 53 51l-25-28-8 17-21-23-19 25-4-18Z" fill={girl?'#784833':'#65402d'} stroke="#533947" strokeWidth="4"/>{!girl&&<path d="M24 43Q37-5 88 5q31 1 43 28L68 28 34 52Z" fill="#ffd44e" stroke="#234b71" strokeWidth="4"/>}<path d="M49 67q7-12 15 0m33 0q7-12 15 0" fill="none" stroke="#533947" strokeWidth="4" strokeLinecap="round"/><ellipse cx="44" cy="80" rx="10" ry="6" fill="#ff9b99"/><ellipse cx="116" cy="80" rx="10" ry="6" fill="#ff9b99"/><path d="M64 81q16 7 32 0-3 24-16 24T64 81" fill="#f87482" stroke="#533947" strokeWidth="3"/>{girl&&<path d="m125 26-13-12-6 23 22 5 7-22Z" fill="#ff6aaa" stroke="#9b355d" strokeWidth="3"/>}</svg>}
export function GameArt({id}:{id:GameId}) {return <svg viewBox="0 0 240 230" aria-hidden="true" className="game-art"><g stroke="#343951" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
{id==='bricks'&&<>{[0,1,2,3].map(row=>[0,1,2].map(col=><rect key={row+'-'+col} x={22+col*66} y={27+row*29} width="63" height="26" rx="6" fill={['#ff7d7c','#ffdc48','#a4e452','#63d5f5'][row]}/>))}<path d="m86 186 61-49m-42 50 57-51" stroke="#fff" strokeWidth="10"/><circle cx="165" cy="133" r="21" fill="#fff"/><rect x="51" y="193" width="138" height="24" rx="12" fill="#38b5ed"/><path d="M69 200h69" stroke="#c6f5ff" strokeWidth="5"/></>}
{id==='memory'&&<><g transform="rotate(-12 87 116)"><rect x="27" y="30" width="115" height="161" rx="23" fill="#f4bdde" stroke="#bf76ac"/><rect x="36" y="39" width="97" height="142" rx="17" fill="#fbd9ec" stroke="#fff3fa" strokeWidth="3"/><path d="m84 77 12 25 28 4-20 20 4 28-24-13-25 13 5-28-20-20 28-4Z" fill="#ffe47e" stroke="#d5aa52"/></g><g transform="rotate(12 159 129)"><rect x="104" y="56" width="112" height="151" rx="23" fill="#fff9ef" stroke="#8fcaf0"/><circle cx="133" cy="103" r="14" fill="#e8b389"/><circle cx="185" cy="103" r="14" fill="#e8b389"/><ellipse cx="159" cy="132" rx="39" ry="35" fill="#f2c399"/><path d="M139 130q5-7 10 0m21 0q5-7 10 0m-31 15q10 13 20 0" fill="none" stroke="#996647" strokeWidth="4"/><ellipse cx="159" cy="141" rx="5" ry="3" fill="#996647" stroke="none"/></g></>}
{id==='jigsaw-puzzle'&&<>
  <rect x="25" y="28" width="190" height="172" rx="24" fill="#fff4d9"/>
  <path d="M46 55h65v22c-25-9-25 29 0 20v25H88c10 25-28 25-19 0H46z" fill="#f2a2c9"/>
  <path d="M111 55h68v67h-25c9-25-30-25-21 0h-22V97c-25 9-25-29 0-20z" fill="#97d8fb"/>
  <path d="M46 122h23c-9 25 29 25 19 0h23v68H46z" fill="#b5e78f"/>
  <path d="M132 134h22c-9-25 30-25 21 0h25v66h-68z" fill="#ffc575" transform="rotate(-10 165 167)"/>
</>}
{id==='firetruck-maze'&&<>
  <path d="M25 181h188" stroke="#8bc783" strokeWidth="14" strokeLinecap="round"/>
  <rect x="30" y="63" width="43" height="73" rx="7" fill="#b9d8f5"/>
  <rect x="169" y="56" width="39" height="81" rx="6" fill="#ddc5ee"/>
  <path d="M44 79h15m-15 15h15m125-22h10m-10 15h10" stroke="#fff5d8" strokeWidth="7"/>
  <rect x="34" y="108" width="126" height="60" rx="12" fill="#ed565f"/>
  <path d="M142 118h35l23 22v28h-58z" fill="#ff7477"/>
  <path d="M156 124h19l13 15h-32z" fill="#b7ecff"/>
  <path d="M47 124h76m-76 20h76m-70-20v20m21-20v20m21-20v20m21-20v20" stroke="#fff0c1" strokeWidth="5"/>
  <circle cx="61" cy="168" r="14" fill="#526276"/><circle cx="173" cy="168" r="14" fill="#526276"/>
  <path d="M152 106h15" stroke="#5cbbeb" strokeWidth="7" strokeLinecap="round"/>
</>}
{id==='spot-the-difference'&&<>
  <g stroke="#946b9c" strokeWidth="5">
    <rect x="20" y="62" width="99" height="107" rx="12" fill="#fdf4d9" transform="rotate(-9 70 114)"/>
    <rect x="107" y="58" width="99" height="107" rx="12" fill="#fff6d9" transform="rotate(8 155 112)"/>
  </g>
  <path d="M35 139l29-43 27 33 14-12 7 21zM119 140l25-41 27 33 17-14 12 27z" fill="#77c5a3"/>
  <circle cx="88" cy="91" r="10" fill="#ffbd64"/><path d="M167 83l4 8 10 1-7 7 1 10-9-5-9 5 2-10-7-7 10-1z" fill="#e6a357"/>
  <path d="m161 155 32 29" stroke="#6974a1" strokeWidth="13" strokeLinecap="round"/>
  <circle cx="142" cy="138" r="26" fill="#a7e4f4" fillOpacity=".57" stroke="#6974a1" strokeWidth="8"/>
</>}
</g></svg>}
