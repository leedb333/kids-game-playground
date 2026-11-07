import {useId} from 'react'
import {itemById,type Item,type CharacterId,type Outfit,type Slot} from './data'
import {fittingRigs,layerPlan,type Foot} from './rig'

export function Flower({x=0,y=0,size=1,color='#f5cbd1'}:{x?:number;y?:number;size?:number;color?:string}){return <g transform={`translate(${x} ${y}) scale(${size})`} stroke="none">{[0,72,144,216,288].map(a=><ellipse key={a} cy="-6" rx="4" ry="6" fill={color} transform={`rotate(${a})`}/>)}<circle r="3.4" fill="#d6ad64"/></g>}
function Bow({c,a}:{c:string;a:string}){return <g><path d="M-5-3Q-35-28-39-8Q-44 14-7 7M5-3Q35-28 39-8Q44 14 7 7" fill={c}/><path d="m-5 5-16 27 15-5 10-19 16 24 10-12-20-17" fill={a}/><path d="M-29-8-9 1M29-8 9 1" fill="none" opacity=".4"/><ellipse rx="8" ry="10" fill={c}/></g>}
function FabricDefs({id,c,a}:{id:string;c:string;a:string}){return <defs><linearGradient id={id+'fabric'} x1="0" y1="0" x2=".8" y2="1"><stop stopColor={a}/><stop offset=".2" stopColor={c}/><stop offset=".78" stopColor={c}/><stop offset="1" stopColor={a}/></linearGradient></defs>}

function Headwear({kind,c,a,id}:{kind:string;c:string;a:string;id:string}){
 const fabric=`url(#${id}fabric)`
 return kind==='cap'?<>
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

/** Neckline, shoulder, sleeve and hem share the doll's shoulder/waist landmarks. */
function HumanTop({kind,c,a,id,tucked=false}:{kind:string;c:string;a:string;id:string;tucked?:boolean}){
 const hoodie=kind==='hoodie',jacket=kind==='jacket',long=['shirt','cardigan','hoodie','jacket'].includes(kind),hem=tucked?109:jacket?120:114
 const path=long?`M-22 0Q0 16 22 0L43 10Q55 17 ${hoodie?62:58} 38L${hoodie?70:65} 121Q58 130 47 122L38 63 43 ${hem}Q0 ${hem+7}-43 ${hem}L-38 63-47 122Q-58 130-${hoodie?70:65} 121L-${hoodie?62:58} 38Q-55 17-43 10Z`:`M-22 0Q0 16 22 0L43 10Q56 15 62 32L72 55 52 67 40 47 42 ${hem}Q0 ${hem+6}-42 ${hem}L-40 47-52 67-72 55-62 32Q-56 15-43 10Z`
 return <g data-tailored-top={kind}>
  <defs><clipPath id={id+'shirt'}><path d={path}/></clipPath></defs>
  {hoodie&&<path d="M-34 12Q-60-29-26-39Q0-19 26-39Q60-29 34 12" fill={a}/>}
  <path d={path} fill={`url(#${id}fabric)`}/>
  <g clipPath={`url(#${id}shirt)`}>
   {kind==='tee'&&[33,53,73,93].map(y=><path key={y} d={`M-78 ${y}Q0 ${y+5} 78 ${y}`} fill="none" stroke={a} strokeWidth="7"/>)}
   {kind==='cardigan'&&<path d="M-22-3H22L18 108H-18Z" fill={a} stroke="none"/>}
   <path d={`M-35 45Q-32 80-35 ${hem-6}M35 45Q32 80 35 ${hem-6}`} fill="none" stroke="#68584c" strokeWidth="1.2" opacity=".16"/>
   <path d={`M-37 ${hem-6}Q0 ${hem+1} 37 ${hem-6}`} fill="none" stroke={a} strokeWidth="3"/>
  </g>
  {kind==='shirt'||jacket?<>
   <path d="M-22 0-2 19-16 31-29 7M22 0 2 19 16 31 29 7" fill={a}/><path d={`M0 20V${hem}`} stroke={a} strokeWidth="2" fill="none"/>
   {[38,59,80,101].map(y=><circle key={y} cy={y} r="2.2" fill={a} stroke="none"/>)}
   {[-24,24].map(x=><g key={x}><path d={`M${x-10} 42h20v21q-10 8-20 0Z`} fill="none" stroke={a} strokeWidth="1.6"/>{jacket&&<path d={`M${x-10} 42h20l-10 9Z`} fill={a}/>}</g>)}
  </>:kind==='cardigan'?<>
   <path d="M-22 0 0 43 22 0M0 43V114" fill="none" stroke="#b78289" strokeWidth="3"/>{[59,81,103].map(y=><circle key={y} cy={y} r="2.8" fill={a} stroke="none"/>)}
   <path d="M-33 74h19v22q-10 7-19 0ZM14 74h19v22q-10 7-19 0Z" fill="none" stroke={a} strokeWidth="1.8"/>
  </>:hoodie?<>
   <path d="M-23 0Q0 27 23 0M-13 18-15 47M13 18 15 47" fill="none" stroke={a} strokeWidth="3"/>
   <path d="M-22 72H22L28 100Q0 109-28 100Z" fill={a}/><path d="M-14 78-23 96M14 78 23 96" fill="none" opacity=".3"/>
  </>:<path d="M-23 1Q0 22 23 1" fill="none" stroke={a} strokeWidth="5"/>}
  {long?<path d={`M-63 118-49 120M49 120 63 118M-39 ${hem-3}Q0 ${hem+4} 39 ${hem-3}`} fill="none" stroke={a} strokeWidth={hoodie?7:4}/>:<path d="M-67 53-53 62M53 62 67 53" stroke={a} strokeWidth="3"/>}
 </g>
}
function HumanBottom({kind,c,a,id}:{kind:string;c:string;a:string;id:string}){
 const skirt=kind==='skirt'||kind==='pleats',short=kind==='shorts',end=short?66:126
 return <g data-tailored-bottom={kind}>
 {skirt?<>
  <path d="M-40 0H40L60 83Q0 102-60 83Z" fill={`url(#${id}fabric)`}/><path d="M-40 0H40V11H-40Z" fill={a}/>
  {kind==='pleats'?[-30,-15,0,15,30].map(x=><path key={x} d={`M${x} 12 ${x*1.62} 88`} stroke={a} strokeWidth="2.5" fill="none"/>):<><path d="M-34 20Q0 13 34 20M-51 78Q0 93 51 78" fill="none" stroke={a} strokeWidth="2"/><Flower x={29} y={47} color={a} size={.8}/></>}
 </>:<>
  <path d={`M-40 0Q0 7 40 0L38 ${end}Q23 ${end+5} 9 ${end}L3 37Q0 31-3 37L-9 ${end}Q-23 ${end+5}-38 ${end}Z`} fill={`url(#${id}fabric)`}/>
  <path d="M-37 7Q0 15 37 7M0 8V33M-31 16Q-30 32-15 31M31 16Q30 32 15 31" stroke={a} strokeWidth="1.8" fill="none"/>
  <path d={`M-35 ${end-6}-12 ${end-5}M12 ${end-5} 35 ${end-6}`} fill="none" stroke={a} strokeWidth="5"/>
  {!short&&<path d={`M-25 40-25 ${end-11}M25 40 25 ${end-11}`} stroke={a} strokeWidth="1" opacity=".4" fill="none"/>}<circle cy="20" r="2.6" fill={a} stroke="none"/>
 </>}
 </g>
}
function HumanOnepiece({kind,c,a,id}:{kind:string;c:string;a:string;id:string}){const set=kind==='set';return <g data-tailored-onepiece={kind}>
 <path d="M-22 0Q0 16 22 0L43 10Q51 15 55 33L63 54 45 65 38 47 37 105 71 207Q0 232-71 207L-37 105-38 47-45 65-63 54-55 33Q-51 15-43 10Z" fill={`url(#${id}fabric)`}/>
 <path d="M-23 1Q0 23 23 1" stroke={a} strokeWidth="5" fill="none"/>
 <path d="M-37 103Q0 111 37 103L39 113Q0 122-39 113Z" fill={a}/>
 {set?<>
  <path d="M-20 1 0 25 20 1M0 25V102" fill="none" stroke={a} strokeWidth="3"/>
  {[-29,-14,0,14,29].map(x=><path key={x} d={`M${x} 118 ${x*1.9} 211`} fill="none" stroke={a} strokeWidth="2.5"/>)}<Flower x={-22} y={47} color={a} size={.65}/>
 </>:<>
  {[[-34,147],[11,132],[37,183],[-9,202]].map(([x,y])=><Flower key={x} x={x} y={y} color={a} size={.8}/>)}
  <path d="M-56 201Q0 219 56 201" stroke={a} strokeWidth="3" fill="none"/><g transform="translate(24 107) scale(.31)"><Bow c={a} a="#f2d4bd"/></g>
 </>}
 </g>}

const dogCoat='M-63-15Q-41-25-19-12Q31-17 69 1Q91 16 82 49L76 60Q14 75-48 48L-57 69-81 61-85 30Q-83 3-63-15Z'
function DogGarment({item,id}:{item:Item;id:string}){
 const {image:kind,color:c,accent:a,equipSlot:slot}=item,full=slot==='dogOutfit'
 const silhouette=kind==='vest'?'M-63-15Q-41-25-19-12Q31-17 69 1Q91 16 82 49L76 60Q14 75-48 48L-48 37Q-27 31-40 11L-61 4Z':dogCoat
 if(slot==='bottom')return kind==='waist'?<>
  <path d="M-32-20Q-6-30 23-16L29-6Q0 2-29-7Z" fill={c}/><g transform="translate(4 -10) rotate(-10) scale(.46)"><Bow c={c} a={a}/></g>
 </>:<>
  <path d="M-32-22Q1-32 28-13L29 19 14 32-3 29-12 10-23 25-39 19Z" fill={`url(#${id}fabric)`}/>
  <path d="M-30-17Q0-25 24-10M-35 14-24 19M-1 23 12 27" fill="none" stroke={a} strokeWidth="4"/>
  <path d="M5-10 5 9Q14 15 21 6V-8" fill="none" stroke={a} strokeWidth="1.5"/>
 </>
 if(kind==='harness')return <g data-dog-tailoring="harness">
  <path d="M-67-12-56-17-29 51-42 55ZM31-13 45-8 44 60 29 64Z" fill={c}/>
  <path d="M-58 8Q-10 37 40 25L40 40Q-11 49-53 25Z" fill={a}/>
  <path d="M-57-5Q-14 18 39 5" fill="none" stroke={c} strokeWidth="11"/>
  <rect x="-21" y="13" width="22" height="17" rx="4" fill={c}/><circle cx="-10" cy="21" r="5" fill={a}/><path d="M-8-9v-6" stroke="#9d9e90" strokeWidth="5"/>
 </g>
 return <g data-dog-tailoring={full?'all-in-one':kind}>
  {full&&fittingRigs.dog.feet.map((foot,i)=>{const x=foot.x-190,y=foot.y-350,far=foot.depth==='far';return <path key={i} d={`M${x-10} ${far?45:46}Q${x-13} ${y-35} ${x-10} ${y-19}Q${x} ${y-12} ${x+11} ${y-19}L${x+12} ${far?47:43}Z`} fill={c}/>})}
  <path d={silhouette} fill={`url(#${id}fabric)`}/><defs><clipPath id={id+'dogcoat'}><path d={silhouette}/></clipPath></defs>
  <g clipPath={`url(#${id}dogcoat)`}>
   <path d="M-69-5Q-21-3 23-3Q51-2 71 13" stroke="#fff6dd" strokeWidth="3" opacity=".45" fill="none"/>
   {kind==='tee'&&[16,35,54].map(y=><path key={y} d={`M-91 ${y}Q-14 ${y+17} 89 ${y+4}`} fill="none" stroke={a} strokeWidth="7"/>)}
   {kind==='knit'&&[-34,-18,-2,14,30,46,62].map(x=><path key={x} d={`M${x} 4q-6 24 1 52`} fill="none" stroke={a} strokeWidth="1.3" opacity=".7"/>)}
   {(kind==='knit'||full)&&[[-27,17],[22,37],[53,13]].map(([x,y])=><Flower key={x} x={x} y={y} size={full?.65:.75} color={a}/>)}
   {kind==='vest'&&<><path d="M-43-13Q-21 12-40 52" fill="none" stroke={a} strokeWidth="4"/><path d="M21 16h26v21q-13 9-26 0Z" fill={a}/><path d="M24 20h20" stroke={c}/>{[10,26,42].map(y=><circle key={y} cx="-35" cy={y} r="2.5" fill={a} stroke="none"/>)}</>}
  </g>
  <path d="M-63-13Q-54-1-45 4M-43 48Q17 69 77 56" fill="none" stroke={a} strokeWidth={kind==='knit'?7:4}/>
  {kind==='vest'?<path d="M-58 6Q-33 22-46 36" fill="none" stroke={a} strokeWidth="4"/>:<><path d="M-77 56-59 63" stroke={a} strokeWidth={kind==='knit'?7:4}/><path d="M-60 17Q-69 35-66 50" fill="none" stroke="#80675d" strokeWidth="1.5" opacity=".5"/></>}
 </g>
}
function Shoe({foot,kind,c,a,id}:{foot:Foot;kind:string;c:string;a:string;id:string}){return <g transform={`translate(${foot.x} ${foot.y}) scale(${foot.facing*foot.width} ${foot.width})`}>
 {kind==='boots'||kind==='socks'?<>
  <path d="M-12-38Q0-34 12-38L13-8Q28-5 28 7Q26 18-17 14L-17-6Z" fill={`url(#${id}fabric)`}/><path d="M-13-37Q0-32 13-37V-29Q0-24-14-29Z" fill={a}/>
  <path d="M-16 8Q6 14 27 6V14Q7 22-17 15Z" fill={a}/>{kind==='socks'?<path d="M-13-19H13M-14-8H13" stroke={a} strokeWidth="5"/>:<path d="M7-23V-11" stroke={a} strokeWidth="3"/>}
 </>:kind==='sandals'?<>
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
 if(!anchor)return null
 const headFit=dog&&item.equipSlot==='headwear'?(item.image==='bow'?'scale(.84)':'scale(.86 .56)'):dog&&item.equipSlot==='eyewear'?'scale(.82)':undefined
 return <g data-equipped-item={item.itemId} data-slot={item.equipSlot} data-fit-rig={dog?'dog-side':'doll'} className={preview?undefined:'dress-fitted-item'} transform={`translate(${anchor.x} ${anchor.y}) scale(${item.scale})`} stroke="#806658" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
  <FabricDefs id={id} c={c} a={a}/>
  {item.equipSlot==='headwear'?<g transform={headFit}><Headwear kind={item.image} c={c} a={a} id={id}/></g>:item.equipSlot==='eyewear'?<g transform={headFit}><Eyewear c={c} a={a}/></g>:item.equipSlot==='footwear'?<g>{fittingRigs[character].feet.map((foot,i)=><g key={i} data-shoe={i} data-foot-depth={foot.depth}><Shoe foot={{...foot,x:foot.x-anchor.x,y:foot.y-anchor.y}} kind={item.image} c={c} a={a} id={id}/></g>)}</g>:dog?<DogGarment item={item} id={id}/>:item.equipSlot==='onepiece'?<HumanOnepiece kind={item.image} c={c} a={a} id={id}/>:item.equipSlot==='bottom'?<HumanBottom kind={item.image} c={c} a={a} id={id}/>:<HumanTop kind={item.image} c={c} a={a} id={id}/>}
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
function DogHead({id}:{id:string}){const fur=`url(#${id}fur)`;return <g data-body-part="head">
 <path d="M70 247Q45 239 48 278Q42 310 64 329Q80 330 85 308M149 245Q177 239 176 279Q184 310 162 330Q144 327 139 309" fill="#bc9369"/>
 <path d="M59 266Q50 303 66 315M164 264Q176 299 160 315" stroke="#d5ad7e" strokeWidth="6" fill="none"/>
 <path d="M57 285Q55 244 89 236Q107 224 124 235Q160 238 164 276Q170 311 149 331Q127 351 103 342Q68 343 60 316Q52 304 57 285Z" fill={fur}/>
 <path d="M99 237Q89 254 95 269Q107 278 116 257Q119 243 115 235" fill="#e5c396" stroke="none"/>
 <path d="M81 277q9-5 17-2M121 275q9-4 18 1" fill="none" stroke="#9e7d5c" strokeWidth="1.7"/>
 <g stroke="none"><ellipse data-eye="left" cx="91" cy="291" rx="6" ry="8" fill="#5c4a3e"/><ellipse data-eye="right" cx="129" cy="291" rx="6" ry="8" fill="#5c4a3e"/><circle cx="93" cy="288" r="2.2" fill="#fffaf0"/><circle cx="131" cy="288" r="2.2" fill="#fffaf0"/><ellipse cx="77" cy="310" rx="10" ry="6" fill="#e5ac96"/><ellipse cx="145" cy="309" rx="10" ry="6" fill="#e5ac96"/><ellipse cx="110" cy="320" rx="26" ry="19" fill="#fff1d7"/></g>
 <path d="M100 307Q110 302 120 307Q122 315 110 319Q99 315 100 307Z" fill="#77594a"/>
 <path d="M110 319v7M98 324Q103 333 110 326Q117 333 124 323" fill="none" strokeWidth="1.8"/><path d="M106 331Q111 342 116 330" fill="#d48f8f" strokeWidth="1.3"/>
 </g>}

export function CharacterArt({character,outfit={}}:{character:CharacterId;outfit?:Outfit}){
 const id=useId().replace(/:/g,''),rig=fittingRigs[character],plan=layerPlan(character,outfit),girl=character==='girl',dog=character==='dog'
 const skin=`url(#${id}skin)`,hair=`url(#${id}hair)`,fur=`url(#${id}fur)`
 const worn=(slots:Slot[])=>Object.values(outfit).map(key=>itemById[key!]).filter((item):item is Item=>!!item&&slots.includes(item.equipSlot)).sort((a,b)=>a.layerOrder-b.layerOrder).map(item=><ItemLayer key={item.itemId} item={item} character={character}/>)
 const covered=!!outfit.headwear&&['cap','bucket','straw','beret'].includes(itemById[outfit.headwear]?.image)
 return <g className="dress-character-art" data-body-rig={dog?'dog-side':'doll'} stroke="#795f50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
 <defs><radialGradient id={id+'skin'} cx=".4" cy=".3"><stop stopColor="#ffdfbf"/><stop offset="1" stopColor="#edbc9b"/></radialGradient><linearGradient id={id+'hair'} x2=".8" y2="1"><stop stopColor={girl?'#a47558':'#96724f'}/><stop offset="1" stopColor="#654b3c"/></linearGradient><radialGradient id={id+'fur'} cx=".3" cy=".3"><stop stopColor="#fff4d7"/><stop offset="1" stopColor="#e0c08f"/></radialGradient></defs>
 {dog?<>
  <g data-body-part="paw-shadows" stroke="none" fill="#909473" opacity=".16">{rig.feet.map((foot,i)=><ellipse key={i} cx={foot.x+3} cy={foot.y+13} rx={foot.width*21} ry={foot.width*4}/>)}</g>
  <path data-body-part="tail" d="M267 361Q295 351 291 332Q286 317 280 328Q288 342 266 344" fill={fur}/>
  {rig.feet.filter(f=>f.depth==='far').map((foot,i)=><g key={i} data-body-part="far-leg"><path d={`M${foot.x-9} 386Q${foot.x-11} 414 ${foot.x-9} ${foot.y-5}Q${foot.x} ${foot.y+3} ${foot.x+9} ${foot.y-5}L${foot.x+10} 385Z`} fill="#dcc094"/>{plan.baseFootwear&&<ellipse cx={foot.x} cy={foot.y} rx="12" ry="7" fill="#e4cda5"/>}</g>)}
  <path data-body-part="torso" d="M108 362Q129 338 177 344Q230 333 268 355Q289 371 279 399Q273 420 237 422L150 418Q115 419 101 392Q92 373 108 362Z" fill={fur}/>
  <path data-body-part="neck" d="M99 366Q91 338 103 318L139 316Q160 343 147 377" fill={fur}/>
  {rig.feet.filter(f=>f.depth==='near').map((foot,i)=><g key={i} data-body-part="near-leg"><path d={`M${foot.x-10} ${i?400:376}Q${foot.x-17} 428 ${foot.x-12} ${foot.y-6}Q${foot.x} ${foot.y+3} ${foot.x+12} ${foot.y-6}L${foot.x+12} ${i?397:374}Z`} fill={fur}/>{plan.baseFootwear&&<path d={`M${foot.x-13} ${foot.y-8}Q${foot.x+7} ${foot.y-14} ${foot.x+15} ${foot.y-2}Q${foot.x+19} ${foot.y+12} ${foot.x-12} ${foot.y+10}Q${foot.x-19} ${foot.y+4} ${foot.x-13} ${foot.y-8}Z`} fill={fur}/>}</g>)}
  <path d="M163 354Q211 347 249 362M149 409Q182 419 213 414" fill="none" stroke="#fff7e0" strokeWidth="3" opacity=".55"/>
  {worn(['bottom','top','dogOutfit'])}<DogHead id={id}/>{worn(['footwear','eyewear','headwear'])}
 </>:<>
  {girl&&<g data-body-part="back-hair"><path d="M105 108Q85 164 93 229Q104 247 119 226L201 226Q219 247 230 225Q240 170 215 108Z" fill={hair}/><path d="M102 158Q93 194 103 226M220 159Q231 194 221 225" fill="none" stroke="#b58b68" strokeWidth="4" opacity=".65"/></g>}
  <path data-body-part="neck" d="M140 193V223Q160 236 180 223V193" fill={skin}/>
  <path data-body-part="torso" d="M123 230Q160 212 197 230L198 326Q160 343 122 326Z" fill={skin}/>
  <path data-body-part="arms" d="M120 231Q109 232 105 251L95 332Q94 345 103 349Q115 351 116 337L129 265M200 231Q211 232 215 251L225 332Q226 345 217 349Q205 351 204 337L191 265" fill={skin}/>
  <path data-body-part="hips" d="M124 322Q160 313 196 322L194 363H126Z" fill={skin}/>
  <path data-body-part="legs" d="M126 344H153L150 458Q139 467 128 458ZM167 344H194L192 458Q181 467 170 458Z" fill={skin}/>
  {plan.baseBottom&&<g data-base-bottom="street-shorts" transform="translate(160 330)"><FabricDefs id={id+'basebottom'} c="#a0b5ad" a="#d4ded0"/><HumanBottom kind="shorts" c="#a0b5ad" a="#d4ded0" id={id+'basebottom'}/></g>}
  {worn(['bottom'])}
  {plan.baseTop&&<g data-base-top={plan.tuckBaseTop?'tucked-street-tee':'street-tee'}>
   <defs><clipPath id={id+'basetuck'}><rect data-base-hem-mask="true" x="70" y="175" width="180" height={plan.tuckBaseTop?rig.waist-175:180}/></clipPath></defs>
   <g clipPath={`url(#${id}basetuck)`}><g transform="translate(160 220)"><FabricDefs id={id+'basetop'} c={girl?'#cfaaa0':'#b8c9b9'} a={girl?'#ead1bf':'#e0e5d2'}/><HumanTop kind="tee" c={girl?'#cfaaa0':'#b8c9b9'} a={girl?'#ead1bf':'#e0e5d2'} id={id+'basetop'} tucked={plan.tuckBaseTop}/></g></g>
  </g>}
  {worn(['top','onepiece'])}
  <g data-body-part="hands"><path d="M97 339Q88 346 96 358Q103 365 113 358L117 343M223 339Q232 346 224 358Q217 365 207 358L203 343" fill={skin}/><path d="m100 350 0 5M220 350v5" stroke="#d7a88c" strokeWidth="1.3"/></g>
  {plan.baseFootwear&&<g data-base-footwear="street-shoes"><FabricDefs id={id+'baseshoes'} c="#e7d5b9" a="#f2e5cc"/>{rig.feet.map((foot,i)=><Shoe key={i} foot={foot} kind="sneakers" c="#e7d5b9" a="#f2e5cc" id={id+'baseshoes'}/>)}</g>}
  {worn(['footwear'])}<HumanHead girl={girl} id={id} covered={covered}/>{worn(['eyewear','headwear'])}
 </>}
 </g>
}
