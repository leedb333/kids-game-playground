import {mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {readPng,writePng,crop,alphaBounds} from './lib/png-rgba.mjs'
const source='public/assets/cooking-v2/pizza/',output='src/games/cooking-v2/assets/'
mkdirSync(output,{recursive:true});mkdirSync('docs/cooking-v2-prototype',{recursive:true})
const originals={},images={}
for(const name of readdirSync(source).filter(f=>f.endsWith('.png'))){const im=readPng(source+name);images[name]=im;originals[name]={width:im.width,height:im.height,channels:im.channels,sha256:createHash('sha256').update(readFileSync(source+name)).digest('hex'),...alphaBounds(im)}}
// Remove low-alpha colour speckles, keep the largest object plus its antialias edge.
function clean(im){const {width:w,height:h}=im,n=w*h,labels=new Int32Array(n),queue=new Int32Array(n);let id=0,biggest=0,biggestSize=0
 for(let p=0;p<n;p++){if(labels[p]||im.data[p*4+3]<32)continue;id++;let head=0,tail=1;queue[0]=p;labels[p]=id;while(head<tail){const q=queue[head++],x=q%w,y=Math.floor(q/w);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,j=ny*w+nx;if(nx<0||nx>=w||ny<0||ny>=h||labels[j]||im.data[j*4+3]<32)continue;labels[j]=id;queue[tail++]=j}}if(tail>biggestSize){biggestSize=tail;biggest=id}}
 const data=Buffer.from(im.data);for(let p=0;p<n;p++){const a=data[p*4+3],x=p%w,y=Math.floor(p/w);let keep=labels[p]===biggest;if(!keep&&a>12)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<w&&ny>=0&&ny<h&&labels[ny*w+nx]===biggest)keep=true}data[p*4+3]=!keep||a<=12?0:a>=245?255:a}
 return {...im,data}
}
const cooked={};for(const [name,im] of Object.entries(images))cooked[name]=im.channels===4?clean(im):im
const manifest=[]
function insidePolygon(x,y,points){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [xi,yi]=points[i],[xj,yj]=points[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)yes=!yes}return yes}
function segmentDistance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)}
function make(name,from,box,shape){const im=crop(cooked[from],...box);if(shape)for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){const px=x+box[0]+.5,py=y+box[1]+.5;let m=1;if(shape.ellipse){const [cx,cy,rx,ry]=shape.ellipse,d=Math.sqrt(((px-cx)/rx)**2+((py-cy)/ry)**2);m=Math.max(0,Math.min(1,(1-d)*Math.min(rx,ry)))}else{const points=shape.polygon,inside=insidePolygon(px,py,points);m=inside?Math.min(1,...points.map((p,i)=>segmentDistance(px,py,p,points[(i+1)%points.length]))):0}im.data[(y*im.width+x)*4+3]=Math.round(im.data[(y*im.width+x)*4+3]*m)}for(let i=0;i<im.data.length;i+=4)if(im.data[i+3]===0){im.data[i]=0;im.data[i+1]=0;im.data[i+2]=0}writePng(output+name+'.png',im);manifest.push({name,from,box,shape:shape??null,width:im.width,height:im.height,...alphaBounds(im)})}
make('room','pizza-prep-bg.png',[0,0,1672,395]);make('counter','pizza-prep-bg.png',[0,395,1672,546])
make('dough','pizza-dough-flat.png',[40,60,1156,1116],{ellipse:[618,618,574,553]})
make('sauce','pizza-sauce-tomato.png',[200,200,840,840])
make('board','pizza-cutting-board.png',[72,240,1110,810]);make('spoon','tool-spoon.png',[110,310,1045,660])
make('cheese-pile','pizza-cheese-raw.png',[100,85,1050,1040])
make('pepperoni','topping-pepperoni.png',[398,342,450,395],{ellipse:[623,539,223,195]})
make('mushroom','topping-mushroom.png',[300,570,530,375],{polygon:[[551,578],[610,581],[670,598],[724,623],[765,654],[793,691],[806,729],[803,762],[786,796],[759,817],[714,826],[694,866],[673,906],[648,928],[598,929],[545,922],[496,911],[465,893],[453,878],[459,853],[478,819],[434,830],[393,825],[359,809],[338,785],[328,755],[333,724],[350,691],[378,660],[413,633],[455,610],[502,591]]})
// Source-colour cutouts of actual visible cheese strands, not procedurally drawn food.
make('cheese-a','pizza-cheese-raw.png',[397,90,245,140],{polygon:[[405,175],[417,161],[431,161],[446,173],[464,177],[488,169],[520,150],[555,126],[591,104],[617,93],[630,94],[639,104],[636,118],[620,133],[597,150],[565,171],[532,191],[499,210],[471,224],[446,227],[423,218],[406,203],[399,190]]})
make('cheese-b','pizza-cheese-raw.png',[581,189,200,215],{polygon:[[596,192],[609,190],[626,203],[650,229],[675,254],[704,281],[731,309],[753,340],[773,374],[778,390],[773,400],[763,400],[751,390],[732,371],[713,351],[691,331],[668,312],[645,292],[625,268],[609,246],[597,222],[584,205]]})
make('cheese-c','pizza-cheese-raw.png',[333,305,245,160],{polygon:[[341,307],[355,307],[373,317],[397,337],[423,360],[451,380],[478,398],[506,414],[535,432],[565,445],[576,454],[573,463],[562,463],[542,454],[517,445],[490,434],[459,421],[427,403],[398,385],[374,365],[352,344],[338,324]]})
writeFileSync('docs/cooking-v2-prototype/asset-audit.json',JSON.stringify({originals,processing:'Originals unchanged. Alpha speckles removed, near-opaque pixels normalized, conservative masks/crops; food RGB preserved.',processed:manifest},null,2)+'\n')
console.log(`Prepared ${manifest.length} derivatives from ${Object.keys(originals).length} original assets.`)
