import {useId} from 'react'
import {itemById,type Item,type Outfit,type SeasonId} from './data'
import {fittingRigs} from './rig'

// All dog assets share a 320 × 520 canvas. Humans use their own renderer.
const coat='M130 340Q143 337 160 347Q209 336 253 347Q276 350 280 374Q283 397 263 410Q220 428 160 415L133 405Q114 394 114 375Q114 354 130 340Z'
function Blossom({x,y,c}:{x:number;y:number;c:string}){return <g transform={`translate(${x} ${y})`} stroke="none">{[0,72,144,216,288].map(a=><ellipse key={a} cy="-4" rx="3" ry="5" transform={`rotate(${a})`} fill={c}/>)}<circle r="2.5" fill="#ceaa69"/></g>}
export function DogItemLayer({item,preview=false}:{item:Item;preview?:boolean}){
 const id=useId().replace(/:/g,''),{color:c,accent:a,image:kind,equipSlot:slot}=item,anchor=item.anchorPosition.dog
 if(!anchor||!item.compatibleCharacters.includes('dog'))return null
 const fabric=`url(#${id}cloth)`
 return <g data-equipped-item={item.itemId} data-slot={slot} data-fit-rig="dog-natural" className={preview?undefined:'dress-fitted-item'} transform={`translate(${anchor.x} ${anchor.y}) scale(${item.scale})`} stroke="#806658" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <defs><linearGradient id={id+'cloth'} x1="0" y1="0" x2=".2" y2="1"><stop stopColor={a}/><stop offset=".28" stopColor={c}/><stop offset=".72" stopColor={c}/><stop offset="1" stopColor={a}/></linearGradient></defs>
 {slot==='dogHeadwear'?kind==='beanie'?<><path d="M-46 8Q-49-25-24-31Q14-44 40-19L47 9Z" fill={fabric}/><path d="M-47 4Q0 17 47 4V22Q0 32-47 22Z" fill={a}/>{[-36,-24,-12,0,12,24,36].map(x=><path key={x} d={`M${x} 12v12`} stroke={c} fill="none"/>)}<circle cy="-36" r="10" fill={a}/></>:kind==='straw'?<><ellipse cy="16" rx="57" ry="10" fill={a}/><path d="M-40 9-34-24Q0-36 34-24L40 9Q0 24-40 9Z" fill={fabric}/><path d="M-39 3Q0 17 39 3" stroke={a} strokeWidth="6" fill="none"/>{[-17,-10].map(y=><path key={y} d={`M-34 ${y}Q0 ${y+9} 34 ${y}`} fill="none" stroke={a} strokeWidth="1"/>)}</>:kind==='bow'?<g transform="translate(40 0) rotate(22)"><path d="M-3 0Q-24-20-24-3Q-25 11-4 6M3 0Q23-20 24-3Q25 11 4 6" fill={fabric}/><path d="m-3 5-9 16 9-3 4-11 10 14 5-7-12-11" fill={a}/><ellipse rx="5" ry="6" fill={c}/></g>:kind==='beret'?<><path d="M-48 7Q-59-8-36-24Q-3-43 30-28Q59-18 47 4L32 14Z" fill={fabric}/><path d="M-46 7Q0 19 44 7L40 18Q0 29-43 18Z" fill={a}/><path d="m6-32 4-8M-34-8Q-18-25-3-25" fill="none" stroke={a} strokeWidth="3"/></>:<><path d="M-48 10Q-50-23-22-28Q19-41 43-14L49 9Z" fill={fabric}/><path d="M-21-28Q-7-12-8 9M19-29Q30-12 30 10" stroke={a} fill="none" strokeWidth="1.5"/><path d="M-49 9Q-5 1 41 10Q64 15 52 22Q27 31-6 21L-47 22Z" fill={a}/><path d="M-40 15Q-4 8 35 16" stroke={c} fill="none"/><path d="m-8-12 5-5 5 5-5 5Z" fill={a} stroke="none"/></>:
 slot==='dogEyewear'?<><path d="m-51-7 18 5M33-2 51-7M-4-3Q0-7 4-3" fill="none" stroke={c} strokeWidth="3"/>{[-18,18].map(x=><g key={x} transform={`translate(${x} 0)`}><rect data-eyewear-lens="true" x="-15" y="-12" width="30" height="24" rx="10" fill={c} stroke={c}/><rect x="-12" y="-9" width="24" height="18" rx="8" fill={a} stroke="none"/><path d="m-8-5 10 0-14 10" stroke="#fff8e9" strokeWidth="2" opacity=".7"/></g>)}</>:
 slot==='dogFootwear'?fittingRigs.dog.feet.map((foot,i)=><g key={i} data-shoe={i} data-foot-depth={foot.depth}><g transform={`translate(${foot.x-anchor.x} ${foot.y-anchor.y}) scale(${foot.width})`}>
 <path d={kind==='sneakers'?'M-10-16Q0-20 9-14L10-3Q16 1 14 7Q10 13-13 9Q-19 5-15-2Z':'M-10-27Q0-23 10-27L10-3Q16 1 14 7Q10 13-13 9Q-19 5-15-2Z'} fill={fabric}/><path d={kind==='sneakers'?'M-10-15Q0-10 9-14':'M-10-26Q0-20 10-26V-20Q0-15-10-20Z'} fill={a}/><path d="M-15 5Q-1 10 14 5L13 9Q-1 15-15 9Z" fill={a}/>{kind==='sneakers'?<path d="M-6-8H6M-7-3H6" stroke="#fffefd" strokeWidth="2"/>:kind==='socks'?<path d="M-10-11H9M-11-4H10" stroke={a} strokeWidth="3"/>:<path d="M6-15v8" stroke={a} fill="none"/>}</g></g>):
 slot==='dogOutfit'?<g data-dog-tailoring={kind==='allinone'?'all-in-one':kind} transform="translate(-190 -355)">
 {kind==='harness'?<><path d="M136 341Q123 360 124 380Q124 395 142 404L152 394Q135 380 138 368L149 347Z" fill={fabric}/><path d="M226 342Q240 375 230 420L245 418Q255 380 240 343Z" fill={fabric}/><path d="M135 369Q182 381 239 369L240 382Q180 395 135 382Z" fill={a}/><path d="M146 347Q185 350 233 347" stroke={c} strokeWidth="9" fill="none"/><rect x="175" y="371" width="20" height="16" rx="4" fill={c}/><circle cx="185" cy="379" r="4" fill={a}/><path d="M184 347q-7-12 6-10q10 1 3 11" fill="none" stroke="#aca78f" strokeWidth="3"/></>:<>
 {kind==='allinone'&&<g fill={c}><path d="M127 402H148L146 432Q137 438 129 431ZM249 399 269 401 266 434Q258 440 249 433ZM101 394Q111 389 126 400L123 443Q110 450 100 442ZM226 401 251 407 245 449Q232 453 223 445Z"/><path d="m101 439 22 1M224 443l21 1" stroke={a} strokeWidth="5"/></g>}
 <defs><clipPath id={id+'wrap'}><path d={coat}/></clipPath></defs><path d={coat} fill={fabric}/>
 <g clipPath={`url(#${id}wrap)`}>
 <path d="M146 349Q200 341 253 355" stroke="#fff8e5" strokeWidth="3" opacity=".5" fill="none"/>
 {kind==='tee'&&[368,388,408].map(y=><path key={y} d={`M105 ${y}Q190 ${y+18} 291 ${y-6}`} fill="none" stroke={a} strokeWidth="8"/>)}
 {kind==='puffer'&&[365,383,401,416].map(y=><path key={y} d={`M105 ${y}Q190 ${y+16} 291 ${y-6}`} fill="none" stroke={a} strokeWidth="3"/>)}
 {kind==='knit'&&[151,167,183,199,215,231,247,263].map(x=><path key={x} d={`M${x} 348q-8 29 2 68`} fill="none" stroke={a} opacity=".7" strokeWidth="1.5"/>)}
 {(kind==='knit'||kind==='allinone')&&[[162,371],[207,393],[247,369]].map(([x,y])=><Blossom key={x} x={x} y={y} c={a}/>)}
 <path d="M151 408Q207 426 267 403" stroke={a} strokeWidth={kind==='knit'?6:4} fill="none"/>
 {kind==='vest'&&<><path d="M145 346Q169 368 151 410" stroke={a} strokeWidth="4" fill="none"/><path d="M214 370h26v20q-13 10-26 0Z" fill={a}/><path d="M217 375h20" stroke={c}/>{[365,380,395].map(y=><circle key={y} cx="157" cy={y} r="2.5" fill={a} stroke="none"/>)}</>}
 </g>
 <path d="M130 341Q119 354 120 371" stroke={a} strokeWidth="6" fill="none"/>
 {kind==='coat'&&<g data-dog-scarf="true"><path d="M126 343Q118 360 124 374L143 379Q135 359 145 347Z" fill={a}/><path d="m131 373 20 7-9 37-16-6Z" fill={a}/><path d="m129 408 12 4" stroke={c} strokeWidth="2"/></g>}
 {kind==='vest'?<path d="M133 369Q150 376 136 397" stroke={a} strokeWidth="4" fill="none"/>:<><path d="M119 372Q100 377 101 404L121 410Q130 387 140 382" fill={fabric}/><path d="m102 401 19 6M132 369Q144 375 140 382" fill="none" stroke={a} strokeWidth="4"/></>}
 </>}
 </g>:null}
 </g>
}
export function DogCharacter({outfit={},season='spring'}:{outfit?:Outfit;season?:SeasonId}){
 const id=useId().replace(/:/g,''),fur=`url(#${id}fur)`,feet=fittingRigs.dog.feet
 const wear=(slot:keyof Outfit)=>{const item=itemById[outfit[slot]??''];return item?.compatibleCharacters.includes('dog')?<DogItemLayer item={item}/>:null}
 return <g className="dress-character-art" data-body-rig="dog-natural" data-breed="maltese" data-fur-tone={season==='winter'?'silver':'white'} stroke="#92909b" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
 <defs><radialGradient id={id+'fur'} cx=".35" cy=".2" r=".9"><stop stopColor={season==='winter'?'#e7eaf0':'#fffefd'}/><stop offset=".65" stopColor={season==='winter'?'#cdd2df':'#f5f4f1'}/><stop offset="1" stopColor={season==='winter'?'#a9b2c4':'#dcdce0'}/></radialGradient></defs>
 <g data-body-part="paw-shadows" fill="#89916d" stroke="none" opacity=".16">{feet.map((f,i)=><ellipse key={i} cx={f.x} cy={f.y+10} rx={f.width*18} ry="3"/>)}</g>
 <path data-body-part="tail" d="M268 351Q291 361 303 337L307 328 302 330Q304 313 294 318L289 315 291 325Q278 324 279 336L267 337Z" fill={fur}/>
 {feet.filter(f=>f.depth==='far').map((f,i)=><g key={i} data-body-part="far-leg"><path d={i?'M246 393Q269 395 266 418L264 452Q257 461 249 451L248 427 238 411Z':'M128 384Q144 380 150 398L146 452Q138 461 130 452L129 421 122 404Z'} fill={season==='winter'?'#b7c0cf':'#dedfe5'}/>{!outfit.dogFootwear&&<ellipse cx={f.x} cy={f.y} rx="10" ry="6" fill={fur}/>}</g>)}
 <g data-body-part="near-leg"><path d="M102 380Q120 377 129 398L123 428 121 469Q113 479 103 469L101 432Q95 403 102 380Z" fill={fur}/>{!outfit.dogFootwear&&<path d="M102 466Q92 469 96 479Q109 487 124 479L124 472Q119 464 102 466Z" fill={fur}/>}</g>
 <g data-body-part="near-leg"><path d="M244 387Q268 392 264 409Q260 422 244 428L241 446 240 470Q230 479 222 469L220 447 225 421 232 407Z" fill={fur}/>{!outfit.dogFootwear&&<path d="M221 467Q211 471 215 479Q229 487 243 479L243 472Q238 464 221 467Z" fill={fur}/>}</g>
 <path data-body-part="torso" d="M118 333Q139 332 160 347Q207 335 253 347Q278 349 285 370L290 380 285 383Q292 397 278 409L280 414 268 416Q251 432 226 424L202 427 192 424 174 427 164 421Q138 426 117 413L108 414 108 408Q94 405 96 381Q97 351 118 333Z" fill={fur}/>
 <path d="M158 353Q209 342 250 356M169 414Q193 420 217 417" stroke="#fffefd" strokeWidth="3" opacity=".6" fill="none"/>
 {wear('dogOutfit')}
 <g data-body-part="head">
 <path d="M69 273Q46 259 48 298Q43 330 62 351Q80 353 84 331M147 272Q173 257 178 299Q185 329 165 351Q146 350 140 330" fill={fur}/><path d="M59 288Q51 324 65 339M166 289Q176 321 164 339" stroke="#e4e4e8" strokeWidth="6" fill="none"/>
 <path d="M61 299Q58 278 71 269L69 263 80 263Q90 250 102 255L108 250 114 255Q135 251 148 265L155 265 153 273Q165 282 161 299L166 308 162 315Q171 335 155 349L156 356 147 356Q132 372 112 367L103 372 98 367Q79 369 68 350L62 350 64 343Q53 328 60 315L55 309Z" fill={fur}/>
 <path d="M89 273q4-10 11-12M103 273q7-10 17-10M71 328l-3 9M152 326l3 9" fill="none" stroke="#dedde3" strokeWidth="2"/>
 <path d="M81 296q9-5 17-2M120 295q9-4 17 1" stroke="#aaa5ac" strokeWidth="1.7" fill="none"/>
 <g stroke="none"><ellipse data-eye="left" cx="91" cy="310" rx="5.5" ry="8" fill="#3f3a42"/><ellipse data-eye="right" cx="127" cy="310" rx="5.5" ry="8" fill="#3f3a42"/><circle cx="93" cy="307" r="2" fill="#fffaf0"/><circle cx="129" cy="307" r="2" fill="#fffaf0"/><ellipse cx="77" cy="332" rx="9" ry="5" fill="#e3b49e"/><ellipse cx="145" cy="332" rx="9" ry="5" fill="#e3b49e"/><ellipse cx="108" cy="343" rx="27" ry="19" fill="#faf9f7"/></g>
 <path d="M98 330Q108 325 118 330Q121 338 108 342Q97 339 98 330Z" fill="#49444c"/><path d="M108 342v6M95 347Q100 356 108 349Q116 355 122 346" fill="none" strokeWidth="1.8"/><path d="M104 353Q109 363 114 352" fill="#d79695" strokeWidth="1.2"/>
 </g>
 {wear('dogFootwear')}{wear('dogEyewear')}{wear('dogHeadwear')}
 </g>
}
