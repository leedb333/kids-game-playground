import {useId} from 'react'
import type {CharacterId,Outfit,SeasonId} from './data'
import {CharacterArt,Flower} from './FittedArtwork'
import {equip} from './model'
export {CharacterArt,ItemLayer,ItemPicture} from './FittedArtwork'

export function SpringPark(){const id=useId().replace(/:/g,'');return <g aria-hidden="true"><defs><linearGradient id={id+'sky'} x2="0" y2="1"><stop stopColor="#e9f2e7"/><stop offset="1" stopColor="#fbf1dc"/></linearGradient><linearGradient id={id+'lawn'} x2="0" y2="1"><stop stopColor="#c3d7a8"/><stop offset="1" stopColor="#e2dfb7"/></linearGradient></defs><path d="M0 0H1080V670H0Z" fill={`url(#${id}sky)`}/><circle cx="902" cy="90" r="36" fill="#f7dfac" stroke="#faebc9" strokeWidth="12"/><g fill="#fffaf0" opacity=".8"><path d="M270 80Q250 52 223 70Q200 44 175 75Q145 63 135 90H290Q290 80 270 80M800 130Q783 105 760 122Q735 100 719 128Q688 119 684 145H825Q824 129 800 130"/></g><path d="M0 380Q206 290 439 363Q729 295 1080 365V670H0Z" fill={`url(#${id}lawn)`}/><path d="M0 600Q310 493 565 516Q810 520 1080 595V670H0Z" fill="#eadcc1"/><path d="M0 620Q353 531 657 552Q888 562 1080 615" fill="none" stroke="#f7ecd7" strokeWidth="12" opacity=".7"/>
 <g stroke="#a28c70" fill="none" strokeLinecap="round"><path d="M62 412 79 146M75 217 17 154M77 182 136 111M1026 407 1008 183M1013 231 1065 166" strokeWidth="14"/><path d="M75 217 17 154M77 182 136 111M1013 231 1065 166" strokeWidth="7"/></g>
 {[[-5,94,67],[62,76,72],[129,82,66],[15,158,58],[114,141,62],[1017,108,80],[1084,125,71],[968,153,50]].map(([x,y,r],i)=><g key={i}><circle cx={x} cy={y} r={r} fill={i%2?'#e9c8ca':'#f1d3cf'}/><circle cx={x-14} cy={y-15} r={r*.7} fill="#f7e0d6" opacity=".6"/>{[0,1,2].map(j=><Flower key={j} x={x-25+j*25} y={y+j%2*17} size={.9} color="#fff0e4"/>)}</g>)}
 <g stroke="#a2b086" strokeWidth="2">{[[22,473],[1049,500],[59,537],[984,570],[1005,455],[17,590]].map(([x,y],i)=><g key={x}><path d={`M${x} ${y+22}v-23m0 15-9-5`} fill="none"/><Flower x={x} y={y} size={.8} color={i%2?'#d8aab4':'#fff0d0'}/></g>)}</g>
 <g fill="#e1b4ba" opacity=".65">{[[194,221],[902,278],[42,328],[1004,78],[325,88],[1033,330]].map(([x,y],i)=><ellipse key={x} cx={x} cy={y} rx="5" ry="9" transform={`rotate(${i*37} ${x} ${y})`}/>)}</g></g>}


export function SeasonPark({season}:{season:SeasonId}){
 const id=useId().replace(/:/g,'')
 if(season==='spring')return <g data-season-background="spring"><SpringPark/></g>
 const summer=season==='summer',winter=season==='winter',sky=summer?['#bfe2ea','#eff2d8']:winter?['#bbcbdc','#e5e8ed']:['#e8d3b4','#f7ead2'],grass=summer?['#a3c79d','#d9dea7']:winter?['#d1dbe4','#eef0ed']:['#d2b98c','#e4d0a8']
 return <g data-season-background={season} aria-hidden="true">
 <defs><linearGradient id={id+'sky'} x2="0" y2="1"><stop stopColor={sky[0]}/><stop offset="1" stopColor={sky[1]}/></linearGradient><linearGradient id={id+'land'} x2="0" y2="1"><stop stopColor={grass[0]}/><stop offset="1" stopColor={grass[1]}/></linearGradient></defs>
 <path d="M0 0H1080V670H0Z" fill={`url(#${id}sky)`}/><circle cx="901" cy="89" r={summer?43:34} fill={winter?'#f4eee1':'#f4d49a'} stroke={winter?'#e5e6e6':'#fae5b9'} strokeWidth="12"/>
 <g fill="#fffaf1" opacity=".65"><path d="M154 90q15-35 43-20q27-31 53 0q28-5 35 20ZM670 130q18-30 40-18q25-30 46-4q29-7 42 22Z"/></g>
 <path d="M0 375Q250 289 470 358Q790 283 1080 360V670H0Z" fill={`url(#${id}land)`}/><path d="M0 605Q350 490 600 520Q880 535 1080 596V670H0Z" fill={winter?'#bbc8d2':summer?'#e9dabb':'#dfc39c'}/><path d="M0 626Q380 527 654 552Q900 567 1080 619" stroke={winter?'#e6ebee':'#f6e5c9'} strokeWidth="12" opacity=".7" fill="none"/>
 {winter?<>
 <g stroke="#8798a6" strokeWidth="8" fill="none" strokeLinecap="round"><path d="M71 410 82 145M79 214 25 158M81 185 139 112M1014 410 1007 190M1010 251 1062 195"/><path d="M25 158 4 159M139 112l13-19" strokeWidth="4"/></g>
 <g stroke="#f3f3ee" strokeWidth="8" fill="none" strokeLinecap="round"><path d="M25 152 77 205M86 174 134 112M1014 243 1060 190"/></g>
 <g fill="#8ca6a1" stroke="#78958f" strokeWidth="2"><path d="M3 338 47 216 88 338 77 331 99 372H-8L13 330Z"/><path d="M1000 326 1040 206 1085 326 1072 320 1091 361H989L1009 319Z"/></g>
 <g fill="#f3f4ef"><path d="m16 305 31-89 29 88-29-13ZM1007 302l33-96 34 96-34-12Z"/></g>
 <g transform="translate(970 305)"><ellipse cy="29" rx="34" ry="38" fill="#f8f7f0" stroke="#c3ced6" strokeWidth="2"/><circle cy="-16" r="25" fill="#f8f7f0" stroke="#c3ced6" strokeWidth="2"/><path d="M-24-28H25V-36H15V-57H-13V-36H-24Z" fill="#899ca8"/><path d="M-22 5Q0 14 22 5V15Q0 24-22 15Z" fill="#c09296"/><path d="M12 16 25 18 21 43 8 40Z" fill="#c09296"/><g fill="#667786"><circle cx="-8" cy="-19" r="2"/><circle cx="8" cy="-19" r="2"/><circle cy="29" r="3"/><circle cy="43" r="3"/></g><path d="m0-12 17 4-17 4Z" fill="#d3a37e"/></g>
 {[[45,56],[164,115],[330,57],[590,158],[777,70],[1014,78],[28,460],[1047,521]].map(([x,y])=><g key={x} stroke="#f7f6ef" strokeWidth="2"><path d={`M${x-6} ${y}h12m-6-6v12m-4-10 8 8m0-8-8 8`}/></g>)}
 </>:<>
 <g stroke="#a18a6c" fill="none" strokeLinecap="round"><path d="M61 414 79 146M75 217 17 154M77 182 136 111M1026 407 1008 183M1013 231 1065 166" strokeWidth="13"/></g>
 {[[-5,94,67],[62,76,72],[129,82,66],[15,158,58],[114,141,62],[1017,108,80],[1084,125,71],[968,153,50]].map(([x,y,r],i)=><g key={i}><circle cx={x} cy={y} r={r} fill={summer?(i%2?'#8bb795':'#a9c7a0'):(i%2?'#cf9b73':'#e2b37e')}/><circle cx={x-14} cy={y-15} r={r*.65} fill={summer?'#c4d9b0':'#efcca0'} opacity=".6"/>{!summer&&<path d={`M${x-8} ${y-8}q-10 11 2 17q16-6 11-19q-6 6-13 2Z`} fill="#b8815f" opacity=".6"/>}</g>)}
 {summer?<><path d="M0 389Q100 354 176 378L172 394Q90 373 0 410Z" fill="#93c2c2" opacity=".65"/>{[[29,477],[1024,490],[62,550],[997,567]].map(([x,y])=><g key={x}><path d={`M${x} ${y+22}v-25`} stroke="#809b6c" strokeWidth="2"/><Flower x={x} y={y} color="#f8e7b6" size={1}/></g>)}</>:<g fill="#b8805d" stroke="#a97453" strokeWidth="1.3">{[[23,478],[57,543],[1041,473],[993,557],[40,609],[1025,618]].map(([x,y],i)=><g key={x} transform={`translate(${x} ${y}) rotate(${i*31})`}><path d="M0-12 6-5 12-7 8 1 12 7 3 8 0 14-3 8-12 7-8 1-12-7-6-5Z"/><path d="M0-9V18" fill="none"/></g>)}</g>}
 </>}
 </g>
}

export function FashionScene({looks,selected,hover,previewItem,photo=false,season='spring'}:{looks:Record<CharacterId,Outfit>;selected?:CharacterId;hover?:CharacterId|null;previewItem?:string;photo?:boolean;season?:SeasonId}){return <svg className="dress-scene-svg" data-scene-season={season} viewBox="0 0 1080 670" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><SeasonPark season={season}/>{(['boy','girl','dog'] as const).map((character,i)=><g key={character} className={!photo&&hover===character&&previewItem?'dress-live-fitting':undefined} data-character-art={character} transform={`translate(${i*330+50} 75) scale(.98)`}><ellipse cx="160" cy="488" rx="112" ry="18" fill="#a5aa85" opacity=".2"/>{!photo&&(selected===character||hover===character)&&<><ellipse className={hover===character?'dress-hover-ring':''} cx="160" cy="489" rx="123" ry="27" fill={hover===character?'#f9ecc0':'#fcf3df'} stroke={hover===character?'#b19b59':'#c5999e'} strokeWidth="3" strokeDasharray={hover===character?undefined:'6 7'}/><path d="m150 530 10 8 10-8" stroke="#b2818d" strokeWidth="4" fill="none"/></>}<CharacterArt character={character} season={season} outfit={!photo&&hover===character&&previewItem?equip(looks[character],previewItem,character):looks[character]}/></g>)}</svg>}
