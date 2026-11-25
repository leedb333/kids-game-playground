import {createContext} from 'react'
export const SoundContext=createContext(false)

export const GameHomeContext=createContext<()=>void>(()=>{})
