import {useId} from 'react'
export function Star({x=0,y=0,r=10,fill='#ffe56a'}:{x?:number;y?:number;r?:number;fill?:string}){return <path d={Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.48:r;return `${i?'L':'M'}${x+Math.cos(a)*rr} ${y+Math.sin(a)*rr}`}).join('')+'Z'} fill={fill}/>}
export function NightSky({height=620}:{height?:number}){
 const id=useId().replace(/:/g,''),h=height
 return <svg className="brick-night" viewBox={`0 0 1000 ${h}`} aria-hidden="true"><defs>
 <linearGradient id={id+'sky'} x2=".2" y2="1"><stop stopColor="#0b144e"/><stop offset=".55" stopColor="#123686"/><stop offset="1" stopColor="#3362be"/></linearGradient>
 <radialGradient id={id+'haze'}><stop stopColor="#496fec" stopOpacity=".4"/><stop offset="1" stopColor="#123686" stopOpacity="0"/></radialGradient>
 <radialGradient id={id+'cloud'} cx=".3" cy=".1" r=".95"><stop stopColor="#cad7ff"/><stop offset=".6" stopColor="#9cacfa"/><stop offset="1" stopColor="#8584d4"/></radialGradient>
 <linearGradient id={id+'hill'} x2="0" y2="1"><stop stopColor="#44a7c2"/><stop offset="1" stopColor="#154f9c"/></linearGradient>
 <linearGradient id={id+'castle'} x2=".7" y2="1"><stop stopColor="#a6a5f5"/><stop offset="1" stopColor="#6866bc"/></linearGradient>
 </defs><path d={`M0 0H1000V${h}H0Z`} fill={`url(#${id}sky)`}/><ellipse cx="490" cy={h*.53} rx="540" ry={h*.56} fill={`url(#${id}haze)`}/>
 {Array.from({length:84},(_,i)=>{const x=(i*137.73+29)%1000,y=((i*97.41+41)%997)/997*(h-95);return <g key={i} opacity={.2+(i%4)*.12} fill="#e6efff">{i%9===0?<path d={`M${x-3} ${y}q3-1 3-5q0 4 3 5q-3 1-3 5q0-4-3-5Z`}/>:<circle cx={x} cy={y} r={i%5===0?1.8:1}/>}</g>})}
 <g opacity=".7"><Star x={147} y={69} r={12}/><Star x={906} y={107} r={10}/><Star x={60} y={h*.58} r={9}/><Star x={950} y={h*.56} r={8}/></g>
 <g fill={`url(#${id}cloud)`} opacity=".69"><path d="M-45 165Q-44 124-8 130Q8 90 45 116Q82 101 92 137Q122 127 132 157Q151 162 136 175Q85 194 39 180Q-8 194-45 165Z"/><path d="M905 147Q911 115 939 124Q956 83 988 104Q1020 88 1040 123Q1070 116 1078 159Q1038 185 1005 170Q949 188 905 147Z"/>
 <path d={`M-45 ${h-103}Q-44 ${h-175} 6 ${h-171}Q36 ${h-229} 83 ${h-196}Q122 ${h-202} 127 ${h-159}Q167 ${h-181} 190 ${h-144}Q224 ${h-153} 239 ${h-121}Q252 ${h-120} 270 ${h-60}V${h}H-45Z`}/>
 <path d={`M713 ${h-97}Q710 ${h-149} 751 ${h-151}Q764 ${h-190} 802 ${h-175}Q844 ${h-211} 865 ${h-173}Q908 ${h-178} 920 ${h-141}Q951 ${h-160} 986 ${h-140}Q1030 ${h-155} 1043 ${h-105}V${h}H690Z`}/></g>
 <path d={`M0 ${h-88}Q118 ${h-148} 281 ${h-71}Q410 ${h-116} 550 ${h-44}L1000 ${h-30}V${h}H0Z`} fill="#2354a8"/>
 <g transform={`translate(829 ${h-212})`} opacity=".85"><path d="M21 68H94V153H21Z" fill={`url(#${id}castle)`}/><path d="M10 57H34V149H10ZM80 47H105V149H80Z" fill="#8985d5"/><path d="M3 59 22 21 41 59ZM72 49 92 6 113 49ZM36 63 58 18 80 63Z" fill="#7771ce" stroke="#aaa5ec" strokeWidth="2"/><path d="M48 75h20v65H48Z" fill="#9d9be7"/><path d="M53 139v-20q7-13 14 0v20ZM15 83q8-12 14 0v19H15ZM85 72q8-12 14 0v20H85ZM52 80q7-10 13 0v18H52Z" fill="#ffeac0"/><path d="M58 18V1M92 7V-12M22 22V8" stroke="#b8b0ef" strokeWidth="2"/><path d="M59 1 74 5 59 10ZM93-12 108-8 93-3ZM23 8 36 12 23 17Z" fill="#e6a0ca"/></g>
 <path d={`M0 ${h-49}Q94 ${h-125} 220 ${h-45}Q695 ${h+3} 825 ${h-85}Q918 ${h-136} 1000 ${h-110}V${h}H0Z`} fill={`url(#${id}hill)`}/>
 <path d={`M916 ${h-115}Q869 ${h-86} 895 ${h-69}Q958 ${h-45} 854 ${h-1}`} fill="none" stroke="#83a6d7" strokeWidth="18" opacity=".75"/>
 <g fill="#145b87" opacity=".9"><path d={`M0 ${h}v-48q15-40 34-8q18-53 39-20q32-9 27 27q25-19 35 7L168 ${h}Z`}/><path d={`M1000 ${h}v-62q-22-28-32 2q-28-35-42 4q-26-15-34 20q-30-13-38 36Z`}/></g>
 </svg>
}
