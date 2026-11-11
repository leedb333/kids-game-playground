import {createRoot} from 'react-dom/client'
import {PizzaWorkbench} from './Workbench'
createRoot(document.getElementById('root')!).render(<PizzaWorkbench/>)
if(import.meta.env.PROD&&'serviceWorker' in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(()=>{})})
