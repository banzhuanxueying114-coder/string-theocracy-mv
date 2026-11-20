from PIL import Image, ImageDraw, ImageFont, ImageFilter
import sys
Wd,Ht=3840,2160
src=Image.open('art/full/I/I09_raise_shears.png').convert('RGB')
y0=60
im=src.crop((0,y0,3840,y0+Ht))
INK=(34,22,18); ORANGE=(232,106,32); PAPER=(250,238,214)
d=ImageDraw.Draw(im,'RGBA')
# dark gradient from bottom
g=Image.new('L',(1,Ht))
for y in range(Ht):
    t=max(0,(y-Ht*0.50)/(Ht*0.50)); g.putpixel((0,y),int(235*min(1,t**1.15)))
g=g.resize((Wd,Ht))
dark=Image.new('RGB',(Wd,Ht),INK)
im=Image.composite(dark,im,g)
d=ImageDraw.Draw(im)
fT=ImageFont.truetype('C:/Windows/Fonts/OLDENGL.TTF',470)
fS=ImageFont.truetype('C:/Windows/Fonts/OLDENGL.TTF',110)
fM=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',84)
def center(txt,font,y,fill,sh=None):
    w=d.textlength(txt,font=font); x=(Wd-w)/2
    if sh: d.text((x+10,y+10),txt,font=font,fill=sh)
    d.text((x,y),txt,font=font,fill=fill)
center('String Theocracy',fT,1330,PAPER,INK)
center('Mili',fS,1880,ORANGE)
# mono line
tag='> cut_the_strings --self'
w=d.textlength(tag,font=fM)
d.rectangle((150,150,150+w+80,150+130),fill=INK)
d.rectangle((150,150,162,280),fill=ORANGE)
d.text((200,170),tag,font=fM,fill=ORANGE)
im.save('out/cover/cover_4k.png')
im.resize((1920,1080),Image.LANCZOS).save('out/cover/cover_1080.jpg',quality=93)
