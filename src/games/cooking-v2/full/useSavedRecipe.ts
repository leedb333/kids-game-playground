import {useEffect,useState} from 'react'
/** Each recipe owns its parser, state and key; shared saving never reads another game's data. */
export function useSavedRecipe<T>(key:string,read:()=>T){const [value,setValue]=useState(read),[saved,setSaved]=useState(true);useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(value));setSaved(true)}catch{setSaved(false)}},[key,value]);return {value,setValue,saved}}
