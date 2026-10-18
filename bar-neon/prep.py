# Prepara capas a partir del dibujo fijo: base sin brazo/humo, capa del brazo, capa del neón.
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
A=np.array(Image.open('src/still.png').convert('RGB')).astype(np.float32);H,W=A.shape[:2]
P=[(105,62),(130,58),(200,86),(300,122),(385,148),(430,155),(520,146),(585,158),(612,185),(606,212),(560,218),(520,230),(440,236),(405,236),(420,282),(480,280),(540,290),(600,338),(652,380),(646,402),(600,408),(552,388),(560,425),(582,472),(588,540),(560,554),(520,522),(498,492),(470,480),(425,500),(405,522),(412,562),(440,622),(456,702),(452,762),(432,812),(402,842),(382,882),(372,942),(342,1000),(382,1040),(420,1082),(412,1122),(382,1162),(330,1176),(262,1124),(232,1094),(212,1050),(188,1000),(182,900),(200,800),(226,750),(238,720),(248,640),(240,560),(228,470),(228,380),(240,330),(280,272),(310,205),(338,160),(300,128),(250,100),(190,84),(140,80)]
P=[(130+x/3,640+y/3) for x,y in P]
m=Image.new('L',(W,H),0);ImageDraw.Draw(m).polygon(P,fill=255);arm=np.array(m)>0
R,G,B=A[...,0],A[...,1],A[...,2];yy,xx=np.mgrid[:H,:W]
smoke=(R>45)&(R>B+14)&(G>0.55*R)&(G>B)&(R<225)&(xx<238)&(yy>230)&(yy<720)
print('humo px',smoke.sum(),'color medio',A[smoke].mean(0))
hm=Image.fromarray(((smoke|arm)*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9));hole=np.array(hm)>0
def diffuse(img,known,k=4,it=700):
    h,w=known.shape;sm=Image.fromarray(np.clip(img,0,255).astype(np.uint8)).resize((w//k,h//k),Image.BILINEAR)
    c=np.array(sm).astype(np.float32);kn=np.array(Image.fromarray((known*255).astype(np.uint8)).resize((w//k,h//k),Image.NEAREST))>250
    c[~kn]=c[kn].mean(0)
    for _ in range(it):
        p=np.pad(c,((1,1),(1,1),(0,0)),mode='edge');n=(p[:-2,1:-1]+p[2:,1:-1]+p[1:-1,:-2]+p[1:-1,2:])/4
        c=np.where(kn[...,None],c,n)
    return np.array(Image.fromarray(np.clip(c,0,255).astype(np.uint8)).resize((w,h),Image.BICUBIC)).astype(np.float32)
fill=np.array(Image.fromarray(np.clip(diffuse(A,~hole),0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32)
soft=np.array(hm.filter(ImageFilter.GaussianBlur(2))).astype(np.float32)[...,None]/255
base=A*(1-soft)+fill*soft
Image.fromarray(np.clip(base,0,255).astype(np.uint8)).save('src/base.png')
Image.fromarray(np.dstack([A,np.array(m.filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)]).astype(np.uint8),'RGBA').save('src/arm.png')
neon=(R>190)&(G>55)&(G<170)&(B<70)&(yy<300)
nm=np.array(Image.fromarray((neon*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)))
Image.fromarray(np.dstack([A.astype(np.uint8),nm]),'RGBA').save('src/neon.png')
Image.fromarray(np.clip(base,0,255).astype(np.uint8)).crop((0,240,620,1100)).save('build/base_crop.png')
