import './recipe-links.css'
export function RecipeLinks(){return <nav className="cv2-other-recipes" aria-label="다른 요리 선택">{[['burger','햄버거 만들기'],['cupcake','컵케이크 만들기'],['icecream','아이스크림 만들기']].map(([path,label])=><a key={path} href={`${import.meta.env.BASE_URL}prototypes/cooking-v2/${path}/`}>{label}</a>)}</nav>}
