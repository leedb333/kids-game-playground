import {urls} from './assets'
import bun from './burger/assets/bun-top.png'
import patty from './burger/assets/patty-cooked.png'
import bottom from './burger/assets/bun-bottom.png'
import cupcake from './cupcake/assets/cupcake-baked-base.png'
import cream from './cupcake/assets/frosting-strawberry.png'
import cup from '../../../public/assets/cooking-v2/icecream/containers/container-cup.png'
import scoop from '../../../public/assets/cooking-v2/icecream/scoops/scoop-rainbow-sherbet.png'
import './recipe-links.css'

export function RecipeLinks({start,ready,resume}:{start:()=>void;ready:boolean;resume:boolean}){
 const pictures=[<><img src={urls.dough} alt=""/><img src={urls.sauce} alt=""/></>,<><img src={bottom} alt=""/><img src={patty} alt=""/><img src={bun} alt=""/></>,<><img src={cupcake} alt=""/><img src={cream} alt=""/></>,<><img src={cup} alt=""/><img src={scoop} alt=""/></>]
 return <nav className="cv2-menu-cards" aria-label="요리 선택">{['피자','햄버거','컵케이크','아이스크림'].map((name,i)=>{
  const content=<><div className={`cv2-menu-food food-${i}`} aria-hidden="true">{pictures[i]}</div><strong>{name} 만들기</strong><span>{i===0?(resume?'이어서 만들기':'만들기 시작'):i===2?'세 컵을 함께 꾸며요':i===3?'1~3스쿱을 담아요':'자유롭게 쌓아요'}</span></>
  return i===0?<button key={name} disabled={!ready} onClick={start}>{content}</button>:<a key={name} aria-label={`${name} 만들기`} href={`${import.meta.env.BASE_URL}prototypes/cooking-v2/${['','burger','cupcake','icecream'][i]}/${i===3?'':'#play'}`}>{content}</a>
 })}</nav>
}
