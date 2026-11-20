from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
r=Path(__file__).resolve().parents[1]
files=sorted((r/'out/v4finalcheck').glob('*.png'))
w,h,g=640,360,6; cols=3; rows=(len(files)+cols-1)//cols
im=Image.new('RGB',(cols*w+(cols+1)*g,rows*h+(rows+1)*g),(45,45,45)); d=ImageDraw.Draw(im); font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',18)
for i,p in enumerate(files):
 x=g+(i%cols)*(w+g);y=g+(i//cols)*(h+g);im.paste(Image.open(p).convert('RGB').resize((w,h)),(x,y));d.rectangle((x,y,x+120,y+23),fill='black');d.text((x+5,y+2),p.stem,fill='white',font=font)
out=r/'out/v4finalcheck.jpg';im.save(out,quality=88);print(out)
