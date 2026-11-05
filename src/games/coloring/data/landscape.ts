import type { Drawing, Region, Decoration, PaintColor } from './types'

// Native landscape puzzles. Original portrait files remain as reference material.
const swatches = [
 ['맑은 하늘','#8edcf7'],['구름 흰색','#ffffff'],['햇살 크림','#fff2b4'],['햇님 노랑','#ffda4f'],
 ['살구색','#ffca8a'],['귤 주황','#ff9d43'],['소방 빨강','#f35361'],['진한 빨강','#d73753'],
 ['꽃잎 분홍','#fa88bd'],['연한 분홍','#ffd0e3'],['연보라','#cfaff4'],['보라','#9b70d6'],
 ['경찰 파랑','#3d7edc'],['짙은 파랑','#2458a7'],['창문 하늘색','#9ee8ff'],['청록색','#49bdc9'],
 ['연두색','#b9e878'],['풀 초록','#75c76d'],['잎 초록','#3caa77'],['짙은 초록','#247d68'],
 ['나무 갈색','#b18060'],['모래 베이지','#edd2a5'],['은회색','#d6dfeb'],['관절 회색','#9aafc7'],
 ['도로 회색','#7b91ad'],['바퀴 남색','#394c70'],['연한 크림','#fff8e8'],['짙은 남색','#263956'],
] as const
const palette:PaintColor[]=swatches.map(([name,hex],i)=>({id:i+1,name,hex}))

class Scene {
 regions:Region[]=[]
 decorations:Decoration[]=[]
 add(id:string,colorId:number,d:string,x:number,y:number,r=30){this.regions.push({id:`wide-${id}`,colorId,d,label:[x,y],labelSize:r<12?12:r<20?18:24,touchRadius:r});return this}
 rect(id:string,c:number,x:number,y:number,w:number,h:number){return this.add(id,c,`M${x} ${y}h${w}v${h}h-${w}Z`,x+w/2,y+h/2,Math.min(w,h)/2-3)}
 ellipse(id:string,c:number,x:number,y:number,rx:number,ry:number){return this.add(id,c,`M${x-rx} ${y}a${rx} ${ry} 0 1 0 ${rx*2} 0a${rx} ${ry} 0 1 0 -${rx*2} 0Z`,x,y,Math.min(rx,ry)-3)}
 line(d:string,width=5,stroke='#263956'){this.decorations.push({d,stroke,strokeWidth:width});return this}
 star(id:string,c:number,x:number,y:number,r=35){const pts=Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.48:r;return `${x+Math.cos(a)*q} ${y+Math.sin(a)*q}`});return this.add(id,c,`M${pts.join('L')}Z`,x,y,r*.35)}
 leaf(id:string,c:number,x:number,y:number,w:number,h:number,flip=false){const sign=flip?-1:1;this.add(id,c,`M${x} ${y}Q${x+sign*w} ${y-h*1.3} ${x+sign*w} ${y-h*.7}Q${x+sign*w*.7} ${y+h*.25} ${x} ${y}Z`,x+sign*w*.58,y-h*.38,Math.min(w,h)*.2);return this}
 cloud(id:string,x:number,y:number){return this.add(id,2,`M${x-95} ${y+30}Q${x-140} ${y-12} ${x-80} ${y-22}Q${x-70} ${y-92} ${x-5} ${y-48}Q${x+58} ${y-100} ${x+85} ${y-25}Q${x+145} ${y-5} ${x+95} ${y+30}Z`,x,y,25)}
 flower(id:string,x:number,y:number,r:number,colors:number[]){
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5-Math.PI/2;this.ellipse(`${id}-petal-${i}`,colors[i%colors.length],x+Math.cos(a)*r*.72,y+Math.sin(a)*r*.72,r*.48,r*.48)}
  this.ellipse(`${id}-heart`,4,x,y,r*.42,r*.42);return this
 }
 background(garden=false){
  this.rect('sky',1,0,0,1200,700);this.regions[0].label=[575,45]
  this.add('far-hills',17,'M0 445Q170 320 380 430Q600 325 825 420Q1050 325 1200 415V700H0Z',70,460,28)
  this.add('lawn',garden?18:22,'M0 560Q300 500 600 555Q900 510 1200 555V700H0Z',50,620,35)
  this.regions[2].label=[580,555]
  this.cloud('cloud-left',155,116);this.cloud('cloud-right',855,98)
  this.ellipse('sun',4,1092,106,52,52)
  for(let i=0;i<8;i++){const a=i*Math.PI/4;this.line(`M${1092+Math.cos(a)*67} ${106+Math.sin(a)*67}l${Math.cos(a)*15} ${Math.sin(a)*15}`,5,'#e3a847')}
  this.line('M1077 103q5-10 10 0m17 0q5-10 10 0M1082 120q10 12 20 0',4)
 }
 finish(id:string,title:string):Drawing {
  const label=(key:string,x:number,y:number,size=24,r=20)=>{const region=this.regions.find(region=>region.id===`wide-${key}`);if(region){region.label=[x,y];region.labelSize=size;region.touchRadius=r}}
  if(id==='police-car-robot'||id==='fire-robot'){
   label('far-hills',580,490);label('lawn',1160,565,18,10);label('road',580,620)
   label('car-body',233,480);label('door',310,463,18,12);label('robot-body',814,419,20)
   label('truck-back',325,365,20);label('truck-cab',537,450,16,10);label('hose-coil',128,344,12,6)
   for(const [i,x] of [150,450].entries()){label(`tire-${i}`,x-46,548,14,10);label(`wheel-${i}`,x,525,12,6)}
  }
  if(id==='baby-dinosaur'){label('lawn',50,640);label('eye-white',714,225,12,6)}
  if(id==='garden-butterfly'){
   label('upper-left-wing',275,228,22);label('upper-right-wing',925,228,22)
   label('lower-left-wing',329,501,22);label('lower-right-wing',871,501,22)
  }
  if(id==='rose')for(const [name,x,y,r] of [['left',286,287,110],['center',616,245,147],['right',953,311,108]] as const)label(`${name}-inner-petal`,x-r*.4,y-r*.04,18,12)
  // Empty palette entries are omitted, then numbered in the same fixed sequence.
  const used=palette.filter(c=>this.regions.some(r=>r.colorId===c.id))
  const colors=used.map((c,i)=>({...c,id:i+1}))
  const regions=this.regions.map(r=>({...r,colorId:used.findIndex(c=>c.id===r.colorId)+1}))
  return {id,title,revision:2,kind:'official',viewBox:[0,0,1200,700],colors,regions,decorations:this.decorations,strokeWidth:5,strokeColor:'#34445f',paperColor:'#ffffff',maxZoom:16,labelSize:24}
 }
}

function robotScene(fire=false){
 const s=new Scene();s.background()
 s.add('road',25,'M0 590Q600 555 1200 590V700H0Z',580,660,25)
 for(const x of [70,300,530,760,990])s.rect(`road-stripe-${x}`,27,x,643,115,15)
 // Vehicle and robot stand side-by-side, rather than stacked vertically.
 if(fire){
  s.rect('truck-back',7,45,335,330,198)
  s.add('truck-cab',8,'M375 355H481L555 435V533H375Z',437,486,32)
  s.add('front-window',15,'M391 373H472L517 435H391Z',447,407,25)
  s.rect('cab-door',7,391,449,102,68)
  s.rect('side-compartment',23,70,401,278,108)
  s.line('M85 426H333M85 451H333M85 477H333',5,'#9aafc7')
  s.rect('ladder',27,75,292,350,35)
  for(let x=95;x<415;x+=40)s.line(`M${x} 297v25`,5)
  s.rect('ladder-base',24,153,328,143,30)
  s.ellipse('hose-coil',6,128,366,37,28)
  s.ellipse('hose-hole',22,128,366,17,12)
  s.rect('truck-stripe',4,45,387,330,17)
 }else{
  s.add('car-roof',13,'M145 389L224 293Q240 274 279 274H375Q400 275 422 302L486 390Z',286,292,20)
  s.add('car-body',2,'M70 390Q74 365 143 365H469L535 403V527H63V422Z',316,433,35)
  s.add('windshield',15,'M227 309H300V365H184Z',254,339,22)
  s.add('side-window',16,'M319 308H375Q390 309 405 332L427 365H319Z',367,341,22)
  s.rect('door',13,289,390,125,121)
  s.star('door-badge',4,350,448,35)
  s.add('hood',14,'M81 392H263V445H63V422Z',164,418,22)
  s.rect('rear-panel',13,433,419,102,93)
  s.rect('door-handle',24,377,397,25,13)
 }
 s.rect('lightbar-base',28,235,251,139,20)
 s.rect('red-light',7,242,225,57,27)
 s.rect('blue-light',13,308,225,57,27)
 if(fire)s.line('M270 270v22M339 270v22',8)
 s.rect('front-bumper',23,50,516,515,27)
 s.rect('headlamp',3,65,456,66,38)
 s.rect('rear-lamp',6,505,470,30,35)
 for(const [i,x] of [150,450].entries()){
  s.ellipse(`tire-${i}`,26,x,548,61,61)
  s.ellipse(`wheel-${i}`,23,x,548,33,33)
  s.ellipse(`hub-${i}`,24,x,548,13,13)
 }
 s.add('transform-arrow',4,'M582 372H647V346L700 397L647 448V421H582Z',632,398,25)
 // Friendly robot, broad limbs and large independent colorable pieces.
 s.add('left-arm',fire?6:13,'M760 314L704 329L685 419L733 437L773 367Z',727,371,23)
 s.ellipse('left-elbow',24,706,430,31,31)
 s.add('left-hand',fire?7:14,'M686 450L725 450L745 509L696 527L672 486Z',707,484,24)
 s.add('right-arm',fire?6:13,'M1010 316L1062 334L1095 407L1052 432L1005 373Z',1054,373,25)
 s.ellipse('right-elbow',24,1084,422,30,30)
 s.add('right-hand',fire?7:14,'M1064 449L1105 441L1134 483L1117 520L1065 501Z',1096,481,25)
 s.rect('left-leg',23,796,477,70,99)
 s.rect('right-leg',24,922,477,70,99)
 s.add('left-boot',fire?8:14,'M783 551H867L881 609H755V583Z',820,585,23)
 s.add('right-boot',fire?8:14,'M918 551H1000L1036 584V609H906Z',963,585,23)
 s.rect('waist',28,818,457,143,37)
 s.add('robot-body',fire?7:13,'M769 308H1019L993 465H793Z',893,423,28)
 s.add('chest-panel',fire?4:2,'M805 321H983L971 387H817Z',855,351,23)
 s.star('chest-star',fire?6:4,926,350,29)
 s.rect('belly-panel',fire?8:14,847,404,91,42)
 s.ellipse('left-ear',fire?6:13,788,245,24,36)
 s.ellipse('right-ear',fire?6:13,998,245,24,36)
 s.add('helmet',fire?7:14,'M795 277V209Q797 156 850 149H934Q986 158 993 209V277Z',826,209,18)
 s.add('face',3,'M823 216H965V268Q950 303 895 303Q839 301 823 268Z',893,272,19)
 s.rect('left-eye',28,843,232,28,16)
 s.rect('right-eye',28,918,232,28,16)
 s.line('M872 273q22 17 44 0',5)
 s.star('forehead-badge',4,893,186,24)
 s.star('sparkle-one',11,619,226,34);s.star('sparkle-two',3,1145,302,28)
 return s.finish(fire?'fire-robot':'police-car-robot',fire?'소방차 로봇 변신':'경찰차 로봇 변신')
}

function dinosaurScene(){
 const s=new Scene();s.background(true)
 s.add('trail',22,'M530 548Q650 555 681 700H1060Q924 562 762 538Z',847,663,40)
 // Trees frame the scene without covering the animal or egg.
 s.rect('left-trunk',21,105,290,55,260)
 s.add('left-tree',19,'M30 318Q14 257 72 246Q34 163 115 149Q160 104 198 164Q269 166 239 246Q277 308 211 336Z',133,247,45)
 s.rect('right-trunk',21,1086,305,48,252)
 s.add('right-tree',20,'M1012 332Q968 268 1034 239Q1006 172 1071 170Q1115 128 1155 177Q1215 176 1190 250Q1235 316 1169 348Z',1110,264,45)
 // Tail, plates, legs and head form a wide, walking dinosaur.
 s.add('tail',18,'M430 414Q265 464 217 350Q215 492 407 527Z',319,472,32)
 for(const [i,x,y] of [[0,410,361],[1,460,327],[2,510,315],[3,556,332]] as const)s.add(`back-plate-${i}`,i%2?6:4,`M${x-29} ${y+44}L${x-7} ${y-33}Q${x+23} ${y-29} ${x+35} ${y+42}Z`,x,y+12,18)
 s.add('back-leg',19,'M544 472H608L620 580H527Z',575,543,26)
 s.add('body',18,'M374 424Q404 352 497 357Q584 348 630 416L652 502Q515 566 386 511Z',478,443,43)
 s.add('belly',17,'M509 459Q569 419 625 426L651 503Q595 540 514 534Z',577,488,33)
 s.add('neck',18,'M587 440L612 299L727 313L689 502Q651 536 615 507Z',660,404,35)
 s.add('front-leg',18,'M410 485Q449 478 474 508L465 585H389Z',431,548,29)
 s.add('front-foot',17,'M397 564H466L493 600Q446 616 376 600Z',434,590,17)
 s.add('back-foot',16,'M537 567H612L638 599H519Z',576,589,17)
 s.add('head',18,'M593 268Q585 188 659 172Q746 145 774 215Q838 222 837 274Q835 331 748 338L629 330Z',686,244,40)
 s.add('muzzle',17,'M693 287Q748 267 836 269Q847 328 748 338L691 327Z',756,310,20)
 s.ellipse('cheek',9,662,294,20,15)
 s.ellipse('eye-white',2,734,223,28,34)
 s.ellipse('eye',28,741,225,12,19)
 s.line('M778 298q25 12 43-8M798 251h2',5)
 for(const [i,x,y] of [[0,412,432],[1,475,386],[2,530,418]] as const)s.ellipse(`spot-${i}`,20,x,y,18,13)
 // A large patterned egg balances the dinosaur on the right.
 s.add('egg',3,'M850 600Q789 575 799 484Q812 375 885 348Q959 368 990 478Q1025 596 938 613Z',897,408,26)
 for(const [i,c,x,y,rx,ry] of [[0,9,851,461,24,19],[1,11,931,459,25,24],[2,6,889,521,24,20],[3,15,841,557,22,19],[4,12,953,565,21,22]] as const)s.ellipse(`egg-dot-${i}`,c,x,y,rx,ry)
 s.flower('left-flower',115,602,36,[9,10,11,12,5])
 s.flower('right-flower',1100,613,34,[7,8,13,14,16])
 s.ellipse('pebble',23,701,603,28,16);s.ellipse('pebble-two',24,741,622,22,15)
 s.leaf('fern',19,225,606,60,65);s.leaf('fern-two',20,251,613,50,55,true)
 s.star('little-sparkle',27,945,248,26)
 return s.finish('baby-dinosaur','공룡과 알')
}

function butterflyScene(){
 const s=new Scene();s.background(true)
 // Wings extend to both sides of the landscape sheet.
 s.add('upper-left-wing',9,'M590 337Q421 100 273 152Q198 220 291 381Q442 424 590 337Z',375,231,45)
 s.add('lower-left-wing',11,'M585 351Q381 335 284 419Q269 544 395 559Q501 539 595 397Z',392,466,42)
 s.add('upper-right-wing',9,'M610 337Q779 100 927 152Q1002 220 909 381Q758 424 610 337Z',825,231,45)
 s.add('lower-right-wing',11,'M615 351Q819 335 916 419Q931 544 805 559Q699 539 605 397Z',808,466,42)
 for(const side of [-1,1]){
  const at=(x:number)=>600+side*x
  s.add(`upper-panel-${side}`,4,`M${at(44)} 317Q${at(142)} 181 ${at(250)} 198Q${at(300)} 223 ${at(247)} 320Q${at(136)} 359 ${at(44)} 317Z`,at(161),270,32)
  s.add(`lower-panel-${side}`,15,`M${at(39)} 383Q${at(141)} 370 ${at(247)} 439Q${at(222)} 518 ${at(152)} 504Z`,at(154),444,30)
  s.ellipse(`wing-spot-one-${side}`,12,at(294),269,24,31)
  s.ellipse(`wing-spot-two-${side}`,6,at(215),342,30,20)
  s.ellipse(`wing-spot-three-${side}`,7,at(277),461,20,25)
  s.ellipse(`wing-spot-four-${side}`,16,at(174),200,20,15)
 }
 s.add('body',6,'M573 289Q600 263 627 289L619 455Q600 505 581 455Z',600,399,23)
 s.ellipse('body-stripe',5,600,343,24,18)
 s.ellipse('head',4,600,257,45,42)
 s.line('M578 220Q538 170 554 156M621 220Q657 171 645 154',6)
 s.ellipse('antenna-left',8,553,151,12,12);s.ellipse('antenna-right',8,646,151,12,12)
 s.ellipse('eye-left',28,584,253,7,10);s.ellipse('eye-right',28,616,253,7,10)
 s.line('M586 275q14 14 28 0',4)
 for(const [name,x,y,cols] of [['left',134,410,[9,10,7,8,5]],['right',1070,428,[11,12,13,14,16]],['low-left',360,626,[3,27,22,23,24]],['low-right',845,625,[4,6,15,25,26]]] as const){
  if(y<500)s.rect(`${name}-stem`,20,x-7,y+25,14,145)
  s.flower(`${name}-flower`,x,y,y<500?54:35,[...cols])
 }
 s.leaf('left-leaf',19,132,534,60,65);s.leaf('right-leaf',17,1070,551,65,65,true)
 s.ellipse('garden-stone',21,600,614,55,21)
 return s.finish('garden-butterfly','알록달록 나비')
}

function roseScene(){
 const s=new Scene();s.background(true)
 // Three roses and their leaves spread across the full sheet.
 for(const [name,x,y,r] of [['left',286,287,110],['center',616,245,147],['right',953,311,108]] as const){
  s.add(`${name}-stem`,20,`M${x-9} ${y+65}L${x+8} ${y+65}L${x+4} 601H${x-11}Z`,x-2,558,8)
  s.leaf(`${name}-leaf-right`,19,x,y+241,110,100)
  s.leaf(`${name}-leaf-left`,18,x,y+193,110,95,true)
  s.add(`${name}-outer`,name==='left'?9:name==='right'?7:8,`M${x-r} ${y}Q${x-r*1.2} ${y-r*.65} ${x-r*.55} ${y-r*.72}Q${x} ${y-r*1.35} ${x+r*.55} ${y-r*.7}Q${x+r*1.18} ${y-r*.3} ${x+r*.85} ${y+r*.5}Q${x+r*.6} ${y+r} ${x} ${y+r*.8}Q${x-r} ${y+r*.8} ${x-r} ${y}Z`,x-r*.72,y-r*.15,20)
  s.add(`${name}-top-petal`,10,`M${x-r*.55} ${y-r*.72}Q${x} ${y-r} ${x+r*.55} ${y-r*.7}L${x+r*.26} ${y-r*.05}Q${x} ${y-r*.5} ${x-r*.55} ${y-r*.72}Z`,x+r*.22,y-r*.6,16)
  s.add(`${name}-right-petal`,9,`M${x+r*.55} ${y-r*.7}Q${x+r*1.1} ${y-r*.22} ${x+r*.85} ${y+r*.5}L${x+r*.15} ${y+r*.36}L${x+r*.26} ${y-r*.05}Z`,x+r*.65,y,24)
  s.add(`${name}-lower-petal`,7,`M${x-r*.82} ${y+r*.25}Q${x-r*.45} ${y+r*.9} ${x} ${y+r*.8}Q${x+r*.6} ${y+r*.9} ${x+r*.85} ${y+r*.5}L${x+r*.15} ${y+r*.36}L${x-r*.2} ${y+r*.18}Z`,x,y+r*.58,23)
  s.add(`${name}-inner-petal`,5,`M${x-r*.55} ${y-r*.72}Q${x+r*.1} ${y-r*.67} ${x+r*.26} ${y-r*.05}L${x+r*.15} ${y+r*.36}L${x-r*.2} ${y+r*.18}Q${x-r*.65} ${y+r*.1} ${x-r*.55} ${y-r*.72}Z`,x-r*.23,y-r*.2,25)
  s.ellipse(`${name}-heart`,6,x-r*.07,y-r*.1,r*.19,r*.17)
 }
 s.add('flowerbed',22,'M69 617Q600 574 1129 617L1080 671H115Z',583,643,30)
 s.flower('small-left',115,546,39,[3,4,11,12,15])
 s.flower('small-right',1090,565,38,[13,14,16,23,24])
 s.ellipse('stone-left',25,219,648,32,17);s.ellipse('stone-right',26,981,645,35,17)
 s.star('garden-sparkle',27,446,113,28)
 s.ellipse('ladybug-body',7,790,550,29,21);s.ellipse('ladybug-head',28,815,537,13,13);s.line('M790 531v38',4)
 s.ellipse('ladybug-dot',28,779,548,5,5)
 s.rect('garden-tag',21,438,513,20,99)
 s.add('garden-sign',2,'M398 487H489V545H398Z',443,515,22)
 s.line('M420 523q20-30 44 0',4,'#f35361')
 return s.finish('rose','장미꽃')
}

export const landscapeDrawings:Drawing[]=[robotScene(),robotScene(true),dinosaurScene(),butterflyScene(),roseScene()]
