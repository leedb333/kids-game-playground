import {chromium} from '@playwright/test'
import {readFileSync} from 'node:fs'
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)})
try{
 const page=await browser.newPage({viewport:{width:1440,height:1560}}),pairs=[['오븐과 트레이','tablet-oven.png'],['오븐 안 트레이','tablet-inside.png'],['완성 문구','tablet-complete.png']],src=p=>'data:image/png;base64,'+readFileSync(p).toString('base64')
 await page.setContent('<style>body{margin:0;background:#fff3ed;color:#795448;font:18px sans-serif}h1{font-size:24px;text-align:center}section{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:8px}figure{margin:0;background:white;border-radius:14px;padding:8px}img{width:100%;height:440px;object-fit:contain}figcaption{text-align:center;padding:5px}</style><h1>컵케이크 화면 보완 · 수정 전 / 수정 후</h1>'+pairs.map(([label,file])=>'<section>'+['before','after'].map((phase,i)=>'<figure><img src="'+src('docs/cupcake-polish/'+phase+'/'+file)+'"><figcaption>'+label+' · '+(i?'수정 후':'수정 전')+'</figcaption></figure>').join('')+'</section>').join(''))
 await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.screenshot({path:'docs/cupcake-polish/comparison.png',fullPage:true})
}finally{await browser.close()}
