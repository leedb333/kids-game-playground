import {useContext,useEffect,useRef} from 'react'
import {SoundContext} from '../../GameSettings'
export function useOvenChime(baking:boolean,baked:boolean){
 const sound=useContext(SoundContext),audio=useRef<AudioContext|null>(null),wasBaking=useRef(baking)
 function unlock(){try{audio.current??=new AudioContext();void audio.current.resume().catch(()=>{})}catch{/* Continue silently when audio is unavailable. */}}
 useEffect(()=>{if(wasBaking.current&&!baking&&baked&&sound&&audio.current){const ctx=audio.current,t=ctx.currentTime;for(const frequency of [1046.5,1568]){const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.frequency.value=frequency;gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.09,t+.015);gain.gain.exponentialRampToValueAtTime(.0001,t+.9);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start(t);oscillator.stop(t+1)}}wasBaking.current=baking},[baking,baked,sound])
 useEffect(()=>()=>{void audio.current?.close().catch(()=>{})},[])
 return unlock
}
