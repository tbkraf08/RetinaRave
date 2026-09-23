#!/usr/bin/env python3
# usage: montage.py out.jpg cols img1 img2 ...   (tiles screenshots at 640 px wide with a filename caption)
import sys;from PIL import Image,ImageDraw
out,cols,files=sys.argv[1],int(sys.argv[2]),sys.argv[3:];W=640;ims=[Image.open(f) for f in files];H=int(ims[0].height*W/ims[0].width)+14
rows=(len(ims)+cols-1)//cols;M=Image.new('RGB',(cols*(W+4),rows*(H+4)),(34,34,34));d=ImageDraw.Draw(M)
for i,(im,f) in enumerate(zip(ims,files)):
    x,y=(i%cols)*(W+4),(i//cols)*(H+4);M.paste(im.resize((W,H-14)),(x,y+14));d.text((x+4,y+1),f.split('/')[-1].replace('.jpg',''),fill=(200,230,200))
M.save(out,quality=80)
