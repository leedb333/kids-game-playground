import {useId} from 'react'
import {urls} from './assets'
import type {Work} from './model'
export function Mixing({work,tip}:{work:Work;tip?:{x:number;y:number}}){const id=useId().replace(/:/g,'');return <svg viewBox="0 0 1000 900" role="img" aria-label="반죽이 담긴 분홍 볼" className="cc-food">
 <image href={urls.bowl} x="90" y="150" width="820" height="672"/>
 <defs><clipPath id={id}><ellipse cx="500" cy="363" rx="308" ry="87"/></clipPath></defs><g clipPath={`url(#${id})`}><image href={urls.surface} x="166" y="261" width="668" height="204" preserveAspectRatio="none" transform={`rotate(${Math.sin(work.mix*Math.PI*8)*5} 500 363)`}/></g>
 {tip&&<image href={urls.whisk} x={tip.x-42} y={tip.y-58} width="84" height="225" transform={`rotate(150 ${tip.x} ${tip.y})`}/>}</svg>}
export function Baking({work:w}:{work:Work}){const open=w.oven==='open'||w.oven==='inside',inside=['inside','baking','done'].includes(w.oven),baking=w.oven==='baking',growth=.7+.3*w.elapsed/3000
 const tray=<g><image href={urls.tray} x="30" y="280" width="920" height="530"/>{w.filled&&<image href={urls.surface} x="155" y="388" width="175" height="54" preserveAspectRatio="none"/>}{(baking||w.oven==='done')&&<image href={urls.base} x={243-125*growth} y={430-235*growth} width={250*growth} height={235*growth}/>}</g>
 return <svg viewBox="0 0 1400 900" className="cc-food" role="img" aria-label="컵케이크 트레이와 오븐">
 <defs><linearGradient id="cc-body" x2="0" y2="1"><stop stopColor="#ffe9e8"/><stop offset="1" stopColor="#da9f9e"/></linearGradient><radialGradient id="cc-heat"><stop stopColor="#ffcf75"/><stop offset="1" stopColor="#6b403e"/></radialGradient></defs>
 <g transform="translate(760 110)"><rect x="0" y="0" width="575" height="680" rx="55" fill="url(#cc-body)" stroke="#b6797e" strokeWidth="9"/><rect x="30" y="30" width="515" height="100" rx="28" fill="#fff7eb"/><circle cx="93" cy="79" r="25" fill="#e5b485" stroke="#b68164" strokeWidth="4"/><circle cx="161" cy="79" r="25" fill="#e5b485" stroke="#b68164" strokeWidth="4"/><rect x="350" y="50" width="150" height="55" rx="13" fill="#697c70"/><text x="425" y="86" textAnchor="middle" fill="#fffad4" fontSize="25" fontFamily="sans-serif">{baking?'굽는 중':w.oven==='done'?'다 됐어요':'작은 오븐'}</text><rect x="36" y="155" width="503" height="435" rx="35" fill={baking?'url(#cc-heat)':'#514443'}/>{inside&&<g transform="translate(66 160) scale(.43)">{tray}</g>}
 {!open&&<g><rect x="25" y="144" width="525" height="458" rx="40" fill="#dd999633" stroke="#ba7f7c" strokeWidth="13"/><path d="M65 195 H510" stroke="#fff5e7" strokeWidth="24" strokeLinecap="round"/><path d="M85 235 L215 212" stroke="#fff" strokeWidth="13" opacity=".3" strokeLinecap="round"/></g>}
 {open&&<path d="M34 600 H540 L580 752 Q290 810 -10 752 Z" fill="#ecc3b7" stroke="#b87b77" strokeWidth="9"/>}<circle cx="490" cy="644" r="9" fill={baking?'#ffd678':'#8d9b83'}/></g>
 {!inside&&<g transform="translate(-20 135) scale(.76)">{tray}</g>}
 {baking&&<g className="cc-steam" fill="none" stroke="#fff4d0" strokeWidth="8" opacity=".6"><path d="M970 460 q-22 -25 0 -50 t0 -50"/><path d="M1050 460 q-22 -25 0 -50 t0 -50"/></g>}</svg>}
