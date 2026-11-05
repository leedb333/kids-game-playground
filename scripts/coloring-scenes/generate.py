"""Approved scene -> fixed image background plus independent foreground SVG cells.
The original reference bytes stay unchanged, and backgrounds have no paint IDs.
"""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
bundle=ROOT.parent/'app/.art-tools'
if bundle.exists():sys.path.insert(0,str(bundle))
import json,hashlib,shutil
import cv2,numpy as np,potrace
from PIL import Image
from scipy import ndimage
from scipy.cluster.vq import kmeans2
from scipy.optimize import linear_sum_assignment

CONFIG=[
 ('police','police-car-robot','멋진 경찰차','docs/coloring-v4-preview/police-city.png',25),
 ('fire','fire-robot','멋진 소방차','docs/coloring-v4-final/fire-city-larger.png',25),
 ('dinosaur','baby-dinosaur','숲속 공룡','docs/coloring-v4-preview/dinosaur-trees.png',28),
 ('butterfly','garden-butterfly','꽃에 앉은 나비','docs/coloring-v4-preview/butterfly-meadow.png',28),
]
def trace(mask):
 ys,xs=np.where(mask)
 if not len(xs):return ''
 left,top,right,bottom=int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())
 curves=potrace.Bitmap(~mask[top:bottom+1,left:right+1].astype(bool)).trace(turdsize=1,alphamax=.9,opttolerance=.12)
 out=[]
 def pt(p):return f'{p.x+left:.2f},{p.y+top:.2f}'
 for curve in curves:
  out.append('M'+pt(curve.start_point))
  for s in curve:
   out.append('L'+pt(s.c)+' '+pt(s.end_point) if s.is_corner else 'C'+pt(s.c1)+' '+pt(s.c2)+' '+pt(s.end_point))
  out.append('Z')
 return ' '.join(out)
def hexcolor(rgb):return '#'+''.join(f'{int(c):02X}' for c in rgb)
def namecolor(rgb):
 h,s,v=map(int,cv2.cvtColor(np.array(rgb,dtype='uint8').reshape(1,1,3),cv2.COLOR_RGB2HSV)[0,0])
 if s<25:return '하양' if v>230 else '밝은 회색' if v>175 else '회색' if v>110 else '진한 회색'
 h*=2
 name='빨강' if h<15 or h>=345 else '주황' if h<42 else '노랑' if h<70 else '연두' if h<95 else '초록' if h<160 else '청록' if h<190 else '하늘' if h<210 else '파랑' if h<255 else '보라' if h<290 else '분홍' if h<330 else '자주'
 return ('밝은 ' if v>210 and s<130 else '진한 ' if v<145 else '')+name

for key,id,title,path,total in CONFIG:
 if len(sys.argv)>1 and key not in sys.argv[1:]:continue
 src=ROOT/path;original=Image.open(src).convert('RGB');width=1200;height=round(width*original.height/original.width)
 rgb=np.array(original.resize((width,height),Image.Resampling.LANCZOS))
 ink=rgb.max(axis=2)<(65 if key=='dinosaur' else 30)
 ink=cv2.morphologyEx(ink.astype('uint8'),cv2.MORPH_CLOSE,np.ones((2,2),np.uint8)).astype(bool)
 if key=='dinosaur':
  # Tree roots intentionally merge into the soft grass in the approved art.
  # Close only those wood/ground transitions so trunks remain paintable too.
  yy,xx=np.indices((height,width));r,g,b=rgb.astype(float).transpose(2,0,1)
  wood=(r>175)&(r>g*1.4)&(g>65)&(g<170)&(b<100)&((xx<210)|(xx>990))
  edge=wood & ~cv2.erode(wood.astype('uint8'),np.ones((3,3),np.uint8)).astype(bool)
  ink|=edge
  # The approved cream muzzle has a deliberate open contour near the smile.
  # Preserve that cream panel as its own closed color cell instead of merging
  # it into the teal head when tracing ink alone.
  cream=(r>225)&(g>205)&(b>140)&(b<235)&(xx>700)&(yy<470)
  ink|=cream & ~cv2.erode(cream.astype('uint8'),np.ones((3,3),np.uint8)).astype(bool)
 cells,_=ndimage.label(~ink)
 # Exterior background and quiet scenery share these open connected spaces.
 seeds=[(0,0),(width-1,0),(0,height-1),(width-1,height-1),(width//2,5),(width//2,height-6)]
 if key=='dinosaur':seeds=[(width//2,5),(width//2,height-6),(width-5,height-5)]
 if key=='butterfly':seeds=[(5,5),(width-5,5)]
 bg=set(int(cells[y,x]) for x,y in seeds if not ink[y,x])
 stats=[]
 for i,box in enumerate(ndimage.find_objects(cells),1):
  if box is None:continue
  mask=cells[box]==i;dist=ndimage.distance_transform_edt(np.pad(mask,1))[1:-1,1:-1]
  y,x=np.unravel_index(dist.argmax(),dist.shape);r=float(dist[y,x]);median=np.median(rgb[box][mask & (dist>=min(3,r*.6))],axis=0)
  stats.append(dict(component=i,area=int(mask.sum()),radius=round(r,2),label=[int(x+box[1].start),int(y+box[0].start)],rgb=median.tolist()))
 targets=[]
 for s in stats:
  if s['component'] in bg or s['area']<90 or s['radius']<5 or max(s['rgb'])<35:continue
  r,g,b=map(float,s['rgb']);_,sat,val=map(int,cv2.cvtColor(np.array(s['rgb'],dtype='uint8').reshape(1,1,3),cv2.COLOR_RGB2HSV)[0,0])
  if key=='dinosaur' and ((b>g+8 and b>r+30) or not (sat>=75 or (r>235 and g>220 and b<225))):continue
  if key=='butterfly' and sat<70:continue
  # Scenery seen through roof rails and ladder openings stays fixed scenery.
  if key=='police' and s['label'][1]<290 and r>75 and b>r+18:continue
  if key=='fire' and s['label'][1]<365 and r>140 and g>100 and b>90 and r>g+15 and g>b+10:continue
  targets.append(s)
 samples=np.array([s['rgb'] for s in targets]);unique=np.unique(samples.round().astype('uint8'),axis=0).astype(float)
 assert len(unique)>=total,(key,len(unique))
 centers,_=kmeans2(unique,total,minit='++',seed=23,iter=100)
 assignment=np.argmin(((samples[:,None,:]-centers[None,:,:])**2).sum(axis=2),axis=1)
 rows,cols=linear_sum_assignment(((centers[:,None,:]-samples[None,:,:])**2).sum(axis=2))
 for row,col in zip(rows,cols):assignment[col]=row
 colors=np.clip(centers.round(),0,255).astype('uint8')
 order=sorted(range(total),key=lambda c:-float(colors[c].mean()));number={c:i+1 for i,c in enumerate(order)}
 palette=[dict(id=number[c],name=namecolor(colors[c]),hex=hexcolor(colors[c])) for c in order]
 regions=[]
 for s,c in zip(targets,assignment):
  regions.append(dict(id=f"v4-cell-{s['component']:03}",colorId=number[int(c)],d=trace(cv2.dilate((cells==s['component']).astype('uint8'),np.ones((3,3),np.uint8))),label=s['label'],labelSize=round(min(23,s['radius']*1.1),1),touchRadius=s['radius'],fillRule='evenodd'))
 assets=ROOT/'public/assets/coloring-v4';assets.mkdir(parents=True,exist_ok=True)
 shutil.copyfile(src,assets/f'{key}.png')
 drawing=dict(id=id,title=title,revision=4,kind='official',viewBox=[0,0,width,height],colors=palette,regions=regions,
  backgroundImage=f'assets/coloring-v4/{key}.png',
  outlinePath=trace(ink),outlineColor='#000000',strokeColor='none',strokeWidth=0,paperColor='#FFFFFF',maxZoom=20,labelSize=23)
 out=ROOT/'src/games/coloring/data/scenes';out.mkdir(parents=True,exist_ok=True)
 (out/f'{id}.json').write_text(json.dumps(drawing,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
 report=dict(id=id,title=title,revision=4,source=path,sourceSha256=hashlib.sha256(src.read_bytes()).hexdigest(),viewBox=drawing['viewBox'],colors=palette,backgroundComponents=sorted(bg),
  regions=[{k:v for k,v in r.items() if k!='d'} for r in regions],allComponents=stats,
  contract='Image is noninteractive fixed scenery; only foreground SVG paths have numbers, paint handlers and progress. Source image bytes unchanged.')
 (ROOT/f'docs/coloring-v4-final/{key}-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(key,len(regions),'foreground cells',total,'colors',width,height,flush=True)
