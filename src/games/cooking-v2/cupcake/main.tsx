import '../prototype.css'
import './style.css'
import {mountLegacy} from './legacy'
import {mountThree} from './three/App'
// Keep both views behind an explicit entry; register offline support before the load event.
if(new URLSearchParams(location.search).has('legacy')||location.hash.startsWith('#legacy'))mountLegacy()
else mountThree()
if(import.meta.env.PROD&&'serviceWorker' in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(()=>{})})
