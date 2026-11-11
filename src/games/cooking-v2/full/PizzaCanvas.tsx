import {useEffect,useRef} from 'react'
import type {Images} from '../assets'
import type {State} from '../model'
import {renderPizza} from '../render'
export function PizzaCanvas({state,images,bake=0}:{state:State;images:Images;bake?:number}){const ref=useRef<HTMLCanvasElement>(null),layer=useRef<HTMLCanvasElement|null>(null);useEffect(()=>{const l=layer.current??=document.createElement('canvas');l.width=1024;l.height=1024;renderPizza(ref.current!.getContext('2d')!,state,images,l,[],undefined,undefined,bake)},[state,images,bake]);return <canvas ref={ref} className="cv2-result-food" width={1200} height={1200} aria-label="내가 꾸민 피자"/>}
