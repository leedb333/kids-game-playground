import type {Brick,BrickColor,Stage} from './types'
const palette:BrickColor[]=['pink','yellow','mint','purple','blue']
type Piece=Omit<Brick,'id'>
const block=(x:number,y:number,color:BrickColor,w=62,h=29):Piece=>({x:x-w/2,y:y-h/2,w,h,color,gold:false})
function heart(cx:number,cy:number,scale=1,color:BrickColor='pink'):Piece[]{
 const rows=[[-2,-1,1,2],[-3,-2,-1,0,1,2,3],[-3,-2,-1,0,1,2,3],[-2.5,-1.5,-.5,.5,1.5,2.5],[-2,-1,0,1,2],[-1,0,1],[0]]
 return rows.flatMap((xs,row)=>xs.map(x=>block(cx+x*68*scale,cy+row*36*scale,row%3===1?'pink':color,60*scale,28*scale)))
}
/** Union of oriented elliptical leaves, sampled on a spaced brick grid. */
function clover(cx:number,cy:number,scale=1,four=false):Piece[]{
 const pieces:Piece[]=[],centers=four?[[-118,-60],[118,-60],[-118,60],[118,60]]:[[0,-55],[-76,35],[76,35]]
 const pitchX=four?50:45,pitchY=four?30:27,spanX=four?6:4,spanY=four?5:4
 for(let row=-spanY;row<=spanY;row++)for(let col=-spanX;col<=spanX;col++){
  const x=col*pitchX,y=row*pitchY,dx=four?x/1.2:x
  const inside=centers.some(([lx,ly])=>{const angle=Math.atan2(ly,lx),u=(dx-lx)*Math.cos(angle)+(y-ly)*Math.sin(angle),v=-(dx-lx)*Math.sin(angle)+(y-ly)*Math.cos(angle),long=four?148:lx===0?70:96,short=four?75:lx===0?60:58;return (u/long)**2+(v/short)**2<=1})
  if(inside)pieces.push(block(cx+x*scale,cy+y*scale,'mint',(four?44:39)*scale,(four?24:22)*scale))
 }
 for(let i=0;i<(four?3:4);i++)pieces.push(block(cx,cy+(four?90+i*30:54+i*27)*scale,'mint',(four?44:39)*scale,(four?24:22)*scale))
 return pieces
}
function doubleHeart():Piece[]{
 const rows=[[-4,-3,-2,2,3,4],[-5,-1,1,5],[-6,0,6],[-6,6],[-5,5],[-4,4],[-3,3],[-2,2],[-1,1],[0]]
 return [1,.6].flatMap((scale,ring)=>rows.flatMap((xs,row)=>xs.map(x=>block(500+x*58*scale,(ring?178:104)+row*30*(ring?.57:1),ring?'purple':'pink',49*scale,24*(ring?.57:1)))))
}
function tinyHeart(cx:number):Piece[]{return [[-.75,.75],[-1.5,0,1.5],[-.75,.75],[0]].flatMap((xs,row)=>xs.map(x=>block(cx+x*40,112+row*32,'pink',52,26)))}
const wave=(rows:number,n:number,fn:(t:number,row:number)=>number)=>Array.from({length:rows},(_,row)=>Array.from({length:n},(_,i)=>block(85+i*830/(n-1),fn(i/(n-1),row),palette[(row*2+i%2)%5],n>13?49:60,28))).flat()
function unique(pieces:Piece[]):Piece[]{const placed:Piece[]=[];for(const b of pieces)if(!placed.some(a=>Math.abs((a.x+a.w/2)-(b.x+b.w/2))<(a.w+b.w)/2+3&&Math.abs((a.y+a.h/2)-(b.y+b.h/2))<(a.h+b.h)/2+3))placed.push(b);return placed}
const configs:{name:string;theme:Stage['theme'];pieces:Piece[]}[]=[
 {name:'무지개 산책',theme:'curve',pieces:wave(3,11,(t,r)=>112+(t-.5)**2*240+r*43)},
 {name:'두근두근 하트',theme:'heart',pieces:heart(500,112)},
 {name:'행운의 새싹',theme:'clover',pieces:clover(500,220)},
 {name:'출렁이는 별바다',theme:'wave',pieces:wave(2,14,(t,r)=>177+Math.sin(t*Math.PI*2)*53+r*48)},
 {name:'나란히 두 하트',theme:'heart',pieces:[...heart(265,130,.72),...heart(735,130,.72,'yellow')]},
 {name:'쌍둥이 클로버',theme:'clover',pieces:[...clover(260,180,.72),...clover(740,180,.72)]},
 {name:'지그재그 별빛길',theme:'zigzag',pieces:wave(2,13,(t,r)=>125+r*112+(Math.round(t*12)%2?53:0))},
 {name:'마음을 감싼 하트',theme:'heart',pieces:doubleHeart()},
 {name:'커다란 네잎클로버',theme:'clover',pieces:clover(500,224,1,true)},
 {name:'별빛 왕국의 축제',theme:'final',pieces:[...tinyHeart(180),...tinyHeart(820),...wave(4,16,(t,r)=>174+Math.cos(t*Math.PI*2+r*.15)*68+r*37)]},
]
export const stages:Stage[]=configs.map((c,i)=>({id:i+1,name:c.name,theme:c.theme,difficulty:i<3?'쉬움':i<6?'보통':i<9?'조금 더 도전':'마지막 축제',speed:222+i*7,paddleWidth:278-i*5,bricks:[{id:`s${i+1}-gold`,x:452,y:43,w:96,h:40,color:'gold',gold:true},...unique(c.pieces).map((b,j)=>({...b,id:`s${i+1}-b${j}`}))]}))
export function stageBricks(stage:Stage,height:number):Brick[]{const scale=Math.min(1,Math.max(.38,(height-145)/350));return stage.bricks.map(b=>({...b,x:500+(b.x-500)*scale,y:18+(b.y-40)*scale,w:b.w*scale,h:b.h*scale}))}
