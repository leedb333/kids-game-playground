import {useEffect,useRef,useState,type PointerEvent} from 'react'
import {urls,type Images} from '../assets'
import {inside,type Point} from '../model'
import {ROLL_DISTANCE} from './session'
import roller from './roller.svg'
export function Dough({images,value,onChange}:{images:Images;value:number;onChange:(n:number)=>void}){
 const ref=useRef<HTMLCanvasElement>(null),gesture=useRef<{id:number;value:number;last?:Point}|null>(null),[draft,setDraft]=useState<number|null>(null),[pin,setPin]=useState<Point|null>(null),progress=draft??value
 useEffect(()=>{const c=ref.current!,ctx=c.getContext('2d')!;ctx.clearRect(0,0,1200,1200);const p=progress,blend=p<.5?p*2:(p-.5)*2,first=p<.5?images.doughBall:images.doughMid,last=p<.5?images.doughMid:images.dough,w=1200*(.45+p*.55),h=w*.96,x=600-w/2,y=600-h/2;ctx.globalAlpha=1-blend;ctx.drawImage(first,x,y,w,h);ctx.globalAlpha=blend;ctx.drawImage(last,x,y,w,h);ctx.globalAlpha=1},[images,progress])
 function point(e:PointerEvent){const r=ref.current!.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*1024,y:(e.clientY-r.top)/r.height*1024}}
 function down(e:PointerEvent){if(e.button!==0||gesture.current)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);gesture.current={id:e.pointerId,value,last:inside(point(e))?point(e):undefined};setDraft(value);setPin(point(e))}
 function move(e:PointerEvent){const g=gesture.current;if(!g||g.id!==e.pointerId)return;const p=point(e);setPin(p);if(inside(p)){if(g.last){const d=Math.hypot(p.x-g.last.x,p.y-g.last.y);if(d>6){g.value=Math.min(1,g.value+Math.min(80,d)/ROLL_DISTANCE);setDraft(g.value);g.last=p}}else g.last=p}else g.last=undefined}
 function end(e:PointerEvent,cancel=false){const g=gesture.current;if(!g||g.id!==e.pointerId)return;gesture.current=null;setDraft(null);setPin(null);if(!cancel&&g.value>value)onChange(g.value)}
 return <div className="cv2-dough-tools" onPointerMove={move} onPointerUp={e=>end(e)} onPointerCancel={e=>end(e,true)}><div className="cv2-workspace"><img className="cv2-board" src={urls.board} alt="나무 도마"/><canvas ref={ref} className="cv2-food" width={1200} height={1200} tabIndex={0} aria-label="밀대로 반죽 펴기" data-rolling={progress.toFixed(3)} onPointerDown={down} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onChange(Math.min(1,value+.1))}}}/>{pin&&<img className="cv2-active-pin" src={roller} alt="" style={{left:pin.x/1024*100+'%',top:pin.y/1024*100+'%'}}/>}</div><button className="cv2-pin-pick" aria-label="밀대를 반죽으로 끌어오기" onPointerDown={down} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();ref.current?.focus()}}}><img src={roller} alt=""/>밀대</button></div>
}
