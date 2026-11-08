import {useEffect,useRef,useState,type ReactNode} from 'react'

/** Visible touch controls do not depend on the device showing a scrollbar.
 * Keep item artwork free for the existing drag-to-dress gesture. */
export function WardrobeBrowser({category,children}:{category:string;children:ReactNode}){
 const list=useRef<HTMLDivElement>(null)
 const [edges,setEdges]=useState({top:true,bottom:true})
 useEffect(()=>{
  const el=list.current;if(!el)return
  const update=()=>setEdges({top:el.scrollTop<=1,bottom:el.scrollTop+el.clientHeight>=el.scrollHeight-1})
  el.addEventListener('scroll',update,{passive:true})
  const observer=new ResizeObserver(update);observer.observe(el);if(el.firstElementChild)observer.observe(el.firstElementChild)
  update();return()=>{el.removeEventListener('scroll',update);observer.disconnect()}
 },[])
 function scroll(direction:number){const el=list.current;if(el)el.scrollBy({top:direction*Math.max(48,el.clientHeight*.8),behavior:'instant'})}
 return <div className="dress-item-browser">
  <div className="dress-list-controls" role="group" aria-label="옷장 목록 이동">
   <button type="button" aria-label="옷장 위로 보기" aria-controls="dress-items" disabled={edges.top} onClick={()=>scroll(-1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 15 7-7 7 7"/></svg>위로</button>
   <span aria-hidden="true">더 많은 옷 보기</span>
   <button type="button" aria-label="옷장 아래로 보기" aria-controls="dress-items" disabled={edges.bottom} onClick={()=>scroll(1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 9 7 7 7-7"/></svg>아래로</button>
  </div>
  <div className="dress-items" id="dress-items" ref={list} role="tabpanel" aria-labelledby={`dress-tab-${category}`} tabIndex={0}>{children}</div>
 </div>
}
