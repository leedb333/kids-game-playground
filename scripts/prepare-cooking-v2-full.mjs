import {readPng,writePng,crop,alphaBounds} from './lib/png-rgba.mjs'
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const names=['onion','paprika','olive','dough-ball','dough-mid','dough-baked','cheese-melt'],audit=[]
// Alpha-only cleanup removes the generated low-opacity glow; visible food colours remain intact.
for(const name of names){const source=`public/assets/cooking-v2/pizza/full/${name}.png`,im=readPng(source);for(let i=3;i<im.data.length;i+=4)im.data[i]=Math.round(Math.max(0,Math.min(1,(im.data[i]-210)/35))*255)
 const b=alphaBounds(im,64),cut=crop(im,b.left,b.top,b.right-b.left+1,b.bottom-b.top+1),width=name.startsWith('dough')?1024:name==='cheese-melt'?384:512,height=Math.round(width*cut.height/cut.width),data=Buffer.alloc(width*height*4)
 // Bilinear sampling in premultiplied alpha avoids dark fringes on transparent edges.
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const u=Math.max(0,Math.min(cut.width-1,(x+.5)*cut.width/width-.5)),v=Math.max(0,Math.min(cut.height-1,(y+.5)*cut.height/height-.5)),a=Math.floor(u),b=Math.floor(v),dx=u-a,dy=v-b,samples=[[a,b,(1-dx)*(1-dy)],[Math.min(a+1,cut.width-1),b,dx*(1-dy)],[a,Math.min(b+1,cut.height-1),(1-dx)*dy],[Math.min(a+1,cut.width-1),Math.min(b+1,cut.height-1),dx*dy]];let alpha=0;const rgb=[0,0,0];for(const [px,py,w] of samples){const j=(py*cut.width+px)*4,weight=w*cut.data[j+3]/255;alpha+=weight;for(let c=0;c<3;c++)rgb[c]+=cut.data[j+c]*weight}const j=(y*width+x)*4;for(let c=0;c<3;c++)data[j+c]=alpha?Math.round(rgb[c]/alpha):0;data[j+3]=Math.round(alpha*255)}
 writePng(`src/games/cooking-v2/assets/${name}.png`,{width,height,data});audit.push({name,original:{width:im.width,height:im.height,sha256:createHash('sha256').update(readFileSync(source)).digest('hex')},crop:b,processed:{width,height,...alphaBounds({width,height,data})}})
}
mkdirSync('docs/cooking-v2-full',{recursive:true});writeFileSync('docs/cooking-v2-full/asset-audit.json',JSON.stringify(audit,null,2)+'\n');console.log('Prepared 7 generated food sprites; originals preserved.')
