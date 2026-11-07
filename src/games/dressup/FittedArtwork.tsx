import {useId} from 'react'
import {DogCharacter,DogItemLayer} from './DogArtwork'
import {itemById,type Item,type CharacterId,type Outfit,type Slot,type SeasonId} from './data'
import {fittingRigs,layerPlan,type Foot} from './rig'

export function Flower({x=0,y=0,size=1,color='#f5cbd1'}:{x?:number;y?:number;size?:number;color?:string}){return <g transform={`translate(${x} ${y}) scale(${size})`} stroke="none">{[0,72,144,216,288].map(a=><ellipse key={a} cy="-6" rx="4" ry="6" fill={color} transform={`rotate(${a})`}/>)}<circle r="3.4" fill="#d6ad64"/></g>}
function Bow({c,a}:{c:string;a:string}){return <g><path d="M-5-3Q-35-28-39-8Q-44 14-7 7M5-3Q35-28 39-8Q44 14 7 7" fill={c}/><path d="m-5 5-16 27 15-5 10-19 16 24 10-12-20-17" fill={a}/><path d="M-29-8-9 1M29-8 9 1" fill="none" opacity=".4"/><ellipse rx="8" ry="10" fill={c}/></g>}
function FabricDefs({id,c,a}:{id:string;c:string;a:string}){return <defs><linearGradient id={id+'fabric'} x1="0" y1="0" x2=".8" y2="1"><stop stopColor={a}/><stop offset=".2" stopColor={c}/><stop offset=".78" stopColor={c}/><stop offset="1" stopColor={a}/></linearGradient></defs>}

function Headwear({kind,c,a,id}:{kind:string;c:string;a:string;id:string}){
 const fabric=`url(#${id}fabric)`
 return kind==='beanie'?<><path d="M-61 9Q-65-43-25-52Q15-65 47-40Q65-20 61 9Z" fill={fabric}/><path d="M-62 4Q0 18 62 4V27Q0 39-62 27Z" fill={a}/>{[-49,-35,-21,-7,7,21,35,49].map(x=><path key={x} d={`M${x} 12v16`} fill="none" stroke={c} strokeWidth="2"/>)}<circle cx="0" cy="-56" r="13" fill={a}/><path d="M-39-18Q-27-40-9-41" stroke={a} strokeWidth="3" fill="none"/></>:kind==='cap'?<>
  <path d="M-65 11Q-67-19-48-40Q-15-65 23-50Q59-40 64 9Q0 29-65 11Z" fill={fabric}/>
  <path d="M-10-54Q7-34 9 8M-49-37Q-35-17-38 10M39-38Q27-15 34 11" fill="none" stroke={a} strokeWidth="1.6" opacity=".8"/>
  <path d="M-64 8Q-10 0 49 10Q83 15 70 25Q38 36-6 23Q-33 18-63 22Z" fill={a}/>
  <path d="M-53 14Q-12 7 45 16" fill="none" stroke={c} strokeWidth="1.6"/>
  <circle cx="-9" cy="-54" r="3" fill={c}/><path d="m-8-29 5-5 6 6-6 6Z" fill={a} stroke="none"/>
 </>:kind==='bucket'?<>
  <path d="M-53-37Q0-56 53-37L61 10Q0 28-61 10Z" fill={fabric}/><path d="M-60 7Q0 19 60 7L79 22Q0 39-79 22Z" fill={c}/>
  <path d="M-47-26Q0-38 47-26M-66 20Q0 34 66 20" stroke={a} strokeWidth="2" fill="none"/><Flower x={26} y={-6} size={.85} color={a}/>
 </>:kind==='straw'?<>
  <ellipse cy="16" rx="86" ry="14" fill={c}/><path d="M-60 7-51-38Q0-57 51-38L60 7Q0 30-60 7Z" fill={fabric}/>
  {[-32,-23,-14,-5].map(y=><path key={y} d={`M-53 ${y}Q0 ${y+11} 53 ${y}`} fill="none" stroke="#b89866" strokeWidth="1" opacity=".6"/>)}
  <path d="M-59 1Q0 18 59 1L60 12Q0 34-60 12Z" fill={a}/><path d="M-76 18Q0 39 76 18" fill="none" stroke="#f4dfb3" strokeWidth="3"/>
  <g transform="translate(43 12) rotate(9) scale(.36)"><Bow c={a} a="#efc9bf"/></g>
 </>:kind==='beret'?<>
  <path d="M-65 9Q-77-11-52-33Q-18-63 28-49Q77-39 66-13Q63 7 40 13Z" fill={fabric}/><path d="M-60 8Q0 23 55 8L51 22Q0 36-58 22Z" fill={a}/>
  <path d="M4-52 10-62" stroke={c} strokeWidth="6"/><path d="M-46-12Q-30-33-8-35" fill="none" stroke={a} strokeWidth="4" opacity=".65"/>
 </>:kind==='band'?<>
  <path d="M-61 32Q-67-31-13-43Q51-54 62 28" fill="none" stroke={c} strokeWidth="10"/><path d="M-55 6Q-37-31-12-35" fill="none" stroke={a} strokeWidth="2"/>
  <Flower x={-43} y={-22} size={1.25} color={a}/><Flower x={-20} y={-37} size={.95} color="#fff0d5"/><Flower x={4} y={-40} size={.65} color={a}/>
 </>:<g transform="translate(42 -24) rotate(18) scale(.73)"><Bow c={c} a={a}/></g>
}
function Eyewear({c,a}:{c:string;a:string}){return <g>
 <path d="M-60-8-44-2M44-2 60-8M-4-4Q0-8 4-4" fill="none" stroke={c} strokeWidth="4"/>
 {[-24,24].map(x=><g key={x} transform={`translate(${x} 0)`}><rect data-eyewear-lens="true" x="-21" y="-16" width="42" height="31" rx="13" fill={c} stroke={c} strokeWidth="3.5"/><rect x="-17" y="-12" width="34" height="23" rx="10" fill={a} stroke="none"/><path d="m-10-7 14 0-18 14" fill="none" stroke="#fffaf0" strokeWidth="3" opacity=".65"/></g>)}
 </g>}

/** Sleeves and bare arms share shoulder pivots; the wrists open away from the waist. */
function Sleeves({long,c,a,id}:{long:boolean;c:string;a:string;id:string}){return <g data-sleeve-pose="open-arms">{[-1,1].map(side=><g key={side} transform={side===1?'scale(-1 1)':undefined}><path d="M-42 10-30 19-37 67-55 55-46 25Z" fill={`url(#${id}fabric)`} stroke="none"/><g transform="rotate(14 -40 12)"><path d={long?'M-42 10Q-55 15-58 38L-65 121Q-57 130-47 122L-38 58Z':'M-42 10Q-56 14-62 32L-72 55-52 67-38 44Z'} fill={`url(#${id}fabric)`}/><path d={long?'M-63 118-49 120':'M-67 53-53 62'} fill="none" stroke={a} strokeWidth={long?6:3}/><path d="M-48 23-45 44" stroke={c} opacity=".5" fill="none"/></g></g>)}</g>}
function HumanTop({kind,c,a,id,tucked=false}:{kind:string;c:string;a:string;id:string;tucked?:boolean}){
 const hoodie=kind==='hoodie',jacket=['jacket','suit','coat'].includes(kind),long=!['tee','polo','sailor'].includes(kind),hem=tucked?109:kind==='coat'?153:jacket?120:114
 const body=`M-22 0Q0 16 22 0L43 10 38 55 43 ${hem}Q0 ${hem+7}-43 ${hem}L-38 55-43 10Z`
 return <g data-tailored-top={kind} data-neckline="open">
 <Sleeves long={long} c={c} a={a} id={id}/>
 {hoodie&&<path d="M-36 12Q-44 2-35-2Q-28-6-22 3Q0 19 22 3Q28-6 35-2Q44 2 36 12L28 24H-28Z" fill={a}/>}
 <defs><clipPath id={id+'shirt'}><path d={body}/></clipPath></defs><path d={body} fill={kind==='suit'?c:`url(#${id}fabric)`}/>
 <g clipPath={`url(#${id}shirt)`}>
 {kind==='tee'&&[33,53,73,93].map(y=><path key={y} d={`M-45 ${y}Q0 ${y+5} 45 ${y}`} stroke={a} strokeWidth="7" fill="none"/>)}
 {kind==='cardigan'&&<path d="M-22-3H22L18 108H-18Z" fill={a} stroke="none"/>}
 {['knit','sweatshirt'].includes(kind)&&[-25,-8,8,25].map(x=><path key={x} d={`M${x} 30q-10 12 0 24t0 24t0 24`} stroke={a} strokeWidth="2.2" fill="none" opacity=".8"/>)}
 {kind==='puffer'&&[34,59,84,108].map(y=><path key={y} d={`M-50 ${y}Q0 ${y+13} 50 ${y}`} fill="none" stroke={a} strokeWidth="3"/>)}
 <path d={`M-35 45Q-32 80-35 ${hem-6}M35 45Q32 80 35 ${hem-6}`} fill="none" stroke="#68584c" strokeWidth="1.2" opacity=".16"/>
 <path d={`M-37 ${hem-6}Q0 ${hem+1} 37 ${hem-6}`} fill="none" stroke={a} strokeWidth="3"/>
 </g>
 {kind==='suit'?<><path d="M-22 0H22L17 51 0 73-17 51Z" fill="#fff5e2"/><path d="m0 11-7 9 5 8-5 32 7 10 7-10-5-32 5-8Z" fill="#bc7f87" strokeWidth="1.3"/><path d="M-22 0-33 17-19 27-29 37 0 74M22 0 33 17 19 27 29 37 0 74" fill={a}/><path d="M0 74V119M-32 81h19M13 81h19" fill="none" stroke={a}/><circle cx="4" cy="88" r="2.5" fill={a} stroke="none"/></>:
 kind==='shirt'||jacket?<><path d="M-22 0-2 19-16 31-29 7M22 0 2 19 16 31 29 7" fill={a}/><path d={`M0 20V${hem}`} stroke={a} strokeWidth="2" fill="none"/>{[38,59,80,101].map(y=><circle key={y} cy={y} r="2.2" fill={a} stroke="none"/>)}{[-24,24].map(x=><path key={x} d={`M${x-10} 50h20v21q-10 8-20 0Z`} fill="none" stroke={a} strokeWidth="1.6"/>)}</>:
 kind==='cardigan'?<><path d="M-22 0 0 43 22 0M0 43V114" fill="none" stroke="#b78289" strokeWidth="3"/>{[59,81,103].map(y=><circle key={y} cy={y} r="2.8" fill={a} stroke="none"/>)}</>:
 hoodie?<><path d="M-23 1Q0 22 23 1M-13 18-15 47M13 18 15 47" fill="none" stroke={a} strokeWidth="3"/><path d="M-22 72H22L28 100Q0 109-28 100Z" fill={a}/><path d="M-14 78-23 96M14 78 23 96" fill="none" opacity=".3"/></>:
 kind==='sailor'?<><path d="M-23 1-36 22 0 47 36 22 23 1 0 28Z" fill={a}/><path d="m0 38-7 24 9-3 5 12 2-29" fill={a}/></>:kind==='polo'?<><path d="M-23 0-2 19-16 27-28 8M23 0 2 19 16 27 28 8" fill={a}/><path d="M0 19v29" stroke={a}/><circle cy="35" r="2" fill={a}/></>:<path d="M-23 1Q0 22 23 1" fill="none" stroke={a} strokeWidth="5"/>}
 {kind==='coat'&&<g data-scarf="true"><path d="M-25 2Q0 17 25 2L28 16Q0 34-28 16Z" fill="#cb8c82"/><path d="M10 20 29 16 35 76 13 82Z" fill="#cb8c82"/><path d="m17 76 1 10M25 74l1 10M32 72l1 10" stroke="#e9b9a3" strokeWidth="2"/></g>}
 </g>
}
function HumanBottom({kind,c,a,id}:{kind:string;c:string;a:string;id:string}){
 const formal=kind==='formal',skirt=kind==='skirt'||kind==='pleats',short=kind==='shorts',end=short?66:126
 return <g data-tailored-bottom={kind}>
 {skirt?<>
  <path d="M-40 0H40L60 83Q0 102-60 83Z" fill={`url(#${id}fabric)`}/><path d="M-40 0H40V11H-40Z" fill={a}/>
  {kind==='pleats'?[-30,-15,0,15,30].map(x=><path key={x} d={`M${x} 12 ${x*1.62} 88`} stroke={a} strokeWidth="2.5" fill="none"/>):<><path d="M-34 20Q0 13 34 20M-51 78Q0 93 51 78" fill="none" stroke={a} strokeWidth="2"/><Flower x={29} y={47} color={a} size={.8}/></>}
 </>:<>
  <path d={`M-40 0Q0 7 40 0L38 ${end}Q23 ${end+5} 9 ${end}L3 37Q0 31-3 37L-9 ${end}Q-23 ${end+5}-38 ${end}Z`} fill={formal?c:`url(#${id}fabric)`}/>
  <path d={formal?"M-37 7Q0 15 37 7M0 8V33M-31 16-25 33M31 16 25 33":"M-37 7Q0 15 37 7M0 8V33M-31 16Q-30 32-15 31M31 16Q30 32 15 31"} stroke={a} strokeWidth="1.8" fill="none"/>
  <path d={`M-35 ${end-6}-12 ${end-5}M12 ${end-5} 35 ${end-6}`} fill="none" stroke={a} strokeWidth="5"/>
  {kind==='corduroy'&&[-30,-22,-14,14,22,30].map(x=><path key={x} d={`M${x} 37V${end-10}`} stroke={a} strokeWidth="1.2" fill="none" opacity=".7"/>)}{!short&&<path d={`M-25 40-25 ${end-11}M25 40 25 ${end-11}`} stroke={a} strokeWidth="1" opacity=".4" fill="none"/>}<circle cy="20" r="2.6" fill={a} stroke="none"/>
 </>}
 </g>
}
function HumanOnepiece({kind,c,a,id}:{kind:string;c:string;a:string;id:string}){
 const set=kind==='set',gown=kind==='gown',winter=kind==='winterdress',end=gown?219:207,width=gown?78:71
 const dress=`M-22 0Q0 16 22 0L43 10 38 47 37 105 ${width} ${end}Q0 ${end+25}-${width} ${end}L-37 105-38 47-43 10Z`
 return <g data-tailored-onepiece={kind}>
 <Sleeves long={winter} c={c} a={a} id={id}/><defs><clipPath id={id+'dress'}><path d={dress}/></clipPath></defs><path d={dress} fill={`url(#${id}fabric)`}/>
 <g clipPath={`url(#${id}dress)`}>
 {kind==='pinafore'&&<>{[-58,-29,0,29,58].map(x=><path key={x} d={`M${x} 0v240`} stroke={a} strokeWidth="2" opacity=".7"/>)}{[25,55,85,135,165,195].map(y=><path key={y} d={`M-80 ${y}H80`} stroke={a} strokeWidth="2" opacity=".7"/>)}</>}
 {gown?<><path d="M-38 114Q-61 170-70 218M-20 116-31 229M20 116 31 229M38 114Q61 170 70 218" fill="none" stroke={a} strokeWidth="3" opacity=".8"/><path d="M-81 194Q0 224 81 194L80 215Q0 246-80 215Z" fill={a}/></>:set?[-29,-14,0,14,29].map(x=><path key={x} d={`M${x} 118 ${x*1.9} 211`} fill="none" stroke={a} strokeWidth="2.5"/>):[[-34,147],[11,132],[37,183],[-9,202]].map(([x,y])=><Flower key={x} x={x} y={y} color={a} size={.8}/>)}
 <path d={`M-65 ${end-8}Q0 ${end+12} 65 ${end-8}`} stroke={a} strokeWidth={winter?8:3} fill="none"/>
 </g>
 <path d="M-23 1Q0 23 23 1" stroke={a} strokeWidth={winter?7:4} fill="none"/>
 <path d="M-37 103Q0 111 37 103L39 113Q0 122-39 113Z" fill={a}/><g transform="translate(24 107) scale(.36)"><Bow c={a} a="#f2d4bd"/></g>
 </g>
}
function Handbag({kind,c,a,id}:{kind:string;c:string;a:string;id:string}){return <g data-handbag="hand-held"><path d="M-12 23V7Q-12-16 5-16Q22-16 22 7V23" fill="none" stroke={c} strokeWidth="5"/><path d="M-22 20Q5 14 33 20L37 66Q5 78-25 66Z" fill={`url(#${id}fabric)`}/><path d="M-21 23Q5 40 33 23V40Q5 52-22 40Z" fill={a}/><rect x="0" y="35" width="10" height="9" rx="2" fill="#cfb477"/>{kind==='basket'&&[29,38,47,56,65].map(y=><path key={y} d={`M-22 ${y}Q5 ${y+10} 35 ${y}`} stroke="#ba986b" fill="none" strokeWidth="1" opacity=".7"/>)}<path d="M-17 51v10M29 51v10" stroke={a} fill="none" strokeWidth="2"/></g>}

function Shoe({foot,kind,c,a,id}:{foot:Foot;kind:string;c:string;a:string;id:string}){return <g transform={`translate(${foot.x} ${foot.y}) scale(${foot.facing*foot.width} ${foot.width})`}>
 {kind==='boots'||kind==='furboots'||kind==='socks'?<>
  <path d="M-12-38Q0-34 12-38L13-8Q28-5 28 7Q26 18-17 14L-17-6Z" fill={`url(#${id}fabric)`}/><path d="M-13-37Q0-32 13-37V-29Q0-24-14-29Z" fill={a}/>
  <path d="M-16 8Q6 14 27 6V14Q7 22-17 15Z" fill={a}/>{kind==='furboots'&&<path d="M-13-36q3-6 6-1q3-6 6-1q3-6 6-1q3-6 6-1" stroke={a} strokeWidth="7" fill="none"/>}{kind==='socks'?<path d="M-13-19H13M-14-8H13" stroke={a} strokeWidth="5"/>:<path d="M7-23V-11" stroke={a} strokeWidth="3"/>}
 </>:kind==='loafers'?<><path d="M-14-10Q-5-20 10-9L12-3Q29-1 27 9Q25 20-16 14L-17 0Z" fill={`url(#${id}fabric)`}/><path d="M-16 8Q5 16 27 7V14Q5 23-17 15Z" fill={a}/><path d="M-10-7Q0-1 11-5L13 2Q0 7-11 0Z" fill={a}/><rect x="-2" y="-4" width="8" height="4" rx="1" fill="#c0a06c"/></>:kind==='sandals'?<>
  <path d="M-13-8Q-7-15 9-8Q26-5 26 7Q23 19-15 14Z" fill="#efc4a0"/><path d="M-16 10Q5 16 26 7L26 15Q5 23-17 16Z" fill={a}/>
  <path d="M-10-8 10 10M9-8-11 9M-12-10V-20H10V-9" stroke={c} strokeWidth="6" fill="none"/><rect x="6" y="-21" width="9" height="7" rx="2" fill={a}/>
 </>:<>
  <path d="M-13-21Q-2-25 10-17L12-5Q29-3 28 8Q25 20-16 14L-16-8Z" fill={`url(#${id}fabric)`}/>
  <path d="M-16 7Q6 15 28 6V14Q7 23-17 15Z" fill={a}/><path d="M-7-15 6-13M-6-9 9-7M-5-3 12-1" fill="none" stroke="#fffaeb" strokeWidth="2.6"/><path d="M17-2Q26-2 26 6" stroke={a} fill="none"/>
 </>}
 </g>}

/** A single fitted asset is shared by thumbnails, previews, the doll and PNG export. */
export function ItemLayer({item,character,preview=false}:{item:Item;character:CharacterId;preview?:boolean}){
 const id=useId().replace(/:/g,''),anchor=item.anchorPosition[character],dog=character==='dog',c=item.color,a=item.accent
 if(dog)return <DogItemLayer item={item} preview={preview}/>
 if(!anchor)return null
 return <g data-equipped-item={item.itemId} data-slot={item.equipSlot} data-fit-rig="doll" className={preview?undefined:'dress-fitted-item'} transform={`translate(${anchor.x} ${anchor.y}) scale(${item.scale})`} stroke="#806658" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
  <FabricDefs id={id} c={c} a={a}/>
  {item.equipSlot==='headwear'?<g ><Headwear kind={item.image} c={c} a={a} id={id}/></g>:item.equipSlot==='eyewear'?<g ><Eyewear c={c} a={a}/></g>:item.equipSlot==='footwear'?<g>{fittingRigs[character].feet.map((foot,i)=><g key={i} data-shoe={i} data-foot-depth={foot.depth}><Shoe foot={{...foot,x:foot.x-anchor.x,y:foot.y-anchor.y}} kind={item.image} c={c} a={a} id={id}/></g>)}</g>:item.equipSlot==='handbag'?<Handbag kind={item.image} c={c} a={a} id={id}/>:item.equipSlot==='onepiece'?<HumanOnepiece kind={item.image} c={c} a={a} id={id}/>:item.equipSlot==='bottom'?<HumanBottom kind={item.image} c={c} a={a} id={id}/>:<HumanTop kind={item.image} c={c} a={a} id={id}/>}
 </g>
}
export function ItemPicture({item,character}:{item:Item;character:CharacterId}){return <svg viewBox={fittingRigs[character].preview[item.equipSlot]} className="dress-item-picture" aria-hidden="true"><ItemLayer item={item} character={character} preview/></svg>}

function HumanHead({girl,id,covered}:{girl:boolean;id:string;covered:boolean}){
 const skin=`url(#${id}skin)`,hair=`url(#${id}hair)`
 return <g data-body-part="head">
  <ellipse cx="102" cy="143" rx="11" ry="16" fill={skin}/><ellipse cx="218" cy="143" rx="11" ry="16" fill={skin}/><path d="M100 140q-6-5-5 4M220 140q6-5 5 4" stroke="#d6a185" fill="none" strokeWidth="1.6"/>
  <path d="M101 113Q98 81 130 66Q160 52 190 66Q222 81 219 113L214 162Q204 189 160 202Q116 189 106 162Z" fill={skin}/>
  <defs><clipPath id={id+'haircut'}><rect x="75" y={covered?111:20} width="170" height="240"/></clipPath></defs>
  <g clipPath={`url(#${id}haircut)`} data-hair-crown={covered?'masked':'visible'}>
   <path d="M100 131Q86 91 103 72Q120 48 148 52Q178 42 202 58Q234 72 222 128L212 108Q180 113 158 84Q141 113 109 115L106 132Z" fill={hair}/>
   <path d="M106 88Q125 62 147 65M163 62Q192 59 210 85" stroke="#b88d69" strokeWidth="4" opacity=".6" fill="none"/>
  </g>
  {girl&&<><path d="M109 115Q103 144 113 170M211 115Q218 146 208 170" stroke={hair} strokeWidth="9" fill="none"/><path d="m127 132-4-3M193 132l4-3" strokeWidth="1.8" fill="none"/></>}
  <path d="M127 123q10-5 19-1M176 122q10-4 19 1" stroke="#795844" strokeWidth="1.8" fill="none"/>
  <g stroke="none"><ellipse data-eye="left" cx="138" cy="139" rx="6.5" ry="9" fill="#57453a"/><ellipse data-eye="right" cx="182" cy="139" rx="6.5" ry="9" fill="#57453a"/><circle cx="140" cy="136" r="2.3" fill="#fffaf0"/><circle cx="184" cy="136" r="2.3" fill="#fffaf0"/><ellipse cx="122" cy="163" rx="12" ry="6" fill="#eaa997" opacity=".6"/><ellipse cx="198" cy="163" rx="12" ry="6" fill="#eaa997" opacity=".6"/></g>
  <path d="M160 149q-5 8 1 9" fill="none" stroke="#cd987e" strokeWidth="1.7"/><path d="M149 174Q160 183 172 174" fill="none" stroke="#a26b58" strokeWidth="2.2"/>
 </g>
}
export function CharacterArt({character,outfit={},season='spring'}:{character:CharacterId;outfit?:Outfit;season?:SeasonId}){
 const id=useId().replace(/:/g,''),rig=fittingRigs[character],plan=layerPlan(character,outfit),girl=character==='girl',dog=character==='dog'
 if(dog)return <DogCharacter outfit={outfit} season={season}/>
 const skin=`url(#${id}skin)`,hair=`url(#${id}hair)`
 const worn=(slots:Slot[])=>Object.values(outfit).map(key=>itemById[key!]).filter((item):item is Item=>!!item&&slots.includes(item.equipSlot)).sort((a,b)=>a.layerOrder-b.layerOrder).map(item=><ItemLayer key={item.itemId} item={item} character={character}/>)
 const covered=!!outfit.headwear&&['cap','bucket','straw','beret','beanie'].includes(itemById[outfit.headwear]?.image)
 return <g className="dress-character-art" data-body-rig="doll" stroke="#795f50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
 <defs><radialGradient id={id+'skin'} cx=".4" cy=".3"><stop stopColor="#ffdfbf"/><stop offset="1" stopColor="#edbc9b"/></radialGradient><linearGradient id={id+'hair'} x2=".8" y2="1"><stop stopColor={girl?'#a47558':'#96724f'}/><stop offset="1" stopColor="#654b3c"/></linearGradient><radialGradient id={id+'fur'} cx=".3" cy=".3"><stop stopColor="#fff4d7"/><stop offset="1" stopColor="#e0c08f"/></radialGradient></defs>
 <>
  {girl&&<g data-body-part="back-hair"><path d="M105 108Q85 164 93 229Q104 247 119 226L201 226Q219 247 230 225Q240 170 215 108Z" fill={hair}/><path d="M102 158Q93 194 103 226M220 159Q231 194 221 225" fill="none" stroke="#b58b68" strokeWidth="4" opacity=".65"/></g>}
  <path data-body-part="neck" d="M140 193V223Q160 236 180 223V193" fill={skin}/>
  <path data-body-part="torso" d="M123 230Q160 212 197 230L198 326Q160 343 122 326Z" fill={skin}/>
  <g data-body-part="arms" data-arm-pose="open"><path transform="rotate(14 120 232)" d="M120 231Q109 232 105 251L95 332Q94 345 103 349Q115 351 116 337L129 265" fill={skin}/><path transform="rotate(-14 200 232)" d="M200 231Q211 232 215 251L225 332Q226 345 217 349Q205 351 204 337L191 265" fill={skin}/></g>
  <path data-body-part="hips" d="M124 322Q160 313 196 322L194 363H126Z" fill={skin}/>
  <path data-body-part="legs" d="M126 344H153L150 458Q139 467 128 458ZM167 344H194L192 458Q181 467 170 458Z" fill={skin}/>
  {plan.baseBottom&&<g data-base-bottom="street-shorts" transform="translate(160 330)"><FabricDefs id={id+'basebottom'} c="#a0b5ad" a="#d4ded0"/><HumanBottom kind="shorts" c="#a0b5ad" a="#d4ded0" id={id+'basebottom'}/></g>}
  {worn(['bottom'])}
  {plan.baseTop&&<g data-base-top={plan.tuckBaseTop?'tucked-street-tee':'street-tee'}>
   <defs><clipPath id={id+'basetuck'}><rect data-base-hem-mask="true" x="70" y="175" width="180" height={plan.tuckBaseTop?rig.waist-175:180}/></clipPath></defs>
   <g clipPath={`url(#${id}basetuck)`}><g transform="translate(160 220)"><FabricDefs id={id+'basetop'} c={girl?'#cfaaa0':'#b8c9b9'} a={girl?'#ead1bf':'#e0e5d2'}/><HumanTop kind="tee" c={girl?'#cfaaa0':'#b8c9b9'} a={girl?'#ead1bf':'#e0e5d2'} id={id+'basetop'} tucked={plan.tuckBaseTop}/></g></g>
  </g>}
  {worn(['top','onepiece'])}
  {worn(['handbag'])}<g data-body-part="hands"><g transform="rotate(14 120 232)"><path d="M97 339Q88 346 96 358Q103 365 113 358L117 343" fill={skin}/><path d="m100 350 0 5" stroke="#d7a88c" strokeWidth="1.3"/></g><g transform="rotate(-14 200 232)"><path d="M223 339Q232 346 224 358Q217 365 207 358L203 343" fill={skin}/><path d="M220 350v5" stroke="#d7a88c" strokeWidth="1.3"/></g></g>
  {plan.baseFootwear&&<g data-base-footwear="street-shoes"><FabricDefs id={id+'baseshoes'} c="#e7d5b9" a="#f2e5cc"/>{rig.feet.map((foot,i)=><Shoe key={i} foot={foot} kind="sneakers" c="#e7d5b9" a="#f2e5cc" id={id+'baseshoes'}/>)}</g>}
  {worn(['footwear'])}<HumanHead girl={girl} id={id} covered={covered}/>{worn(['eyewear','headwear'])}
 </>
 </g>
}
