"""Hand-authored silhouettes for v4. Never infer an object from RGB differences.
Every moving image has one source drawing; no mid-motion pose substitution.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'art/sample'
OUT = SRC / 'clean'
OUT.mkdir(exist_ok=True)

def mask(points, size):
    m = Image.new('L', size)
    ImageDraw.Draw(m).polygon([(round(x*size[0]), round(y*size[1])) for x,y in points], fill=255)
    return m.filter(ImageFilter.GaussianBlur(0.55))

def cut(name, source, points):
    im = Image.open(SRC / (source+'.png')).convert('RGBA')
    m = mask(points, im.size)
    im.putalpha(m)
    im.save(OUT / (name+'.png'))
    return m

def light_cut(name, source, points, threshold=65, floor=10):
    im=Image.open(SRC/(source+'.png')).convert('RGBA')
    region=mask(points,im.size)
    arr=np.array(im)
    # This color selection is restricted to a manually defined object envelope.
    lum=arr[:,:,:3].max(2)
    alpha=(np.clip((lum.astype(float)-threshold)/12,0,1)*np.array(region)).astype('uint8')
    alpha[:round(floor*im.height),:]=0
    im.putalpha(Image.fromarray(alpha))
    im.save(OUT/(name+'.png'))
    return region

def plate(name, source, replacement, m):
    a = Image.open(SRC / (source+'.png')).convert('RGBA')
    b = Image.open(SRC / (replacement+'.png')).convert('RGBA')
    Image.composite(b, a, m.filter(ImageFilter.MaxFilter(9))).save(OUT / (name+'.png'))

# I8: only the far sleeve, forearm and fingers. The near arm and hair stay still.
arm = [(0.327,.548),(.366,.552),(.390,.574),(.430,.586),(.456,.573),(.471,.550),(.494,.541),(.518,.512),(.545,.493),(.561,.479),(.577,.458),(.598,.434),(.616,.416),(.640,.387),(.664,.363),(.667,.370),(.649,.398),(.628,.421),(.650,.408),(.666,.406),(.668,.413),(.649,.421),(.632,.437),(.649,.435),(.667,.441),(.666,.449),(.643,.450),(.625,.478),(.607,.491),(.586,.503),(.565,.523),(.552,.554),(.547,.590),(.527,.622),(.505,.649),(.488,.681),(.466,.705),(.441,.726),(.414,.737),(.390,.727),(.367,.711),(.348,.692),(.333,.652)]
m = light_cut('i8_arm', 'i8_reach', arm, 90)
# A single arm contour is cut away from its same-scene plate.
plate('i8_plate','i8_reach','i8_faceoff',m)

# G4: actual wrist is at .764,.674; include the whole palm, not a crop through fingers.
hand = [(.773,.708),(.741,.682),(.718,.665),(.694,.638),(.676,.612),(.659,.600),(.645,.581),(.635,.556),(.621,.543),(.608,.550),(.600,.546),(.598,.536),(.614,.521),(.626,.518),(.627,.506),(.615,.503),(.609,.515),(.601,.523),(.596,.520),(.598,.507),(.611,.483),(.622,.471),(.637,.469),(.651,.480),(.658,.479),(.645,.463),(.634,.459),(.622,.466),(.610,.468),(.605,.462),(.602,.456),(.609,.450),(.630,.443),(.649,.444),(.672,.461),(.689,.477),(.703,.487),(.714,.515),(.724,.553),(.737,.588),(.763,.620),(.780,.646),(.786,.680)]
m = light_cut('g4_hand','g4_hand_seam',[(.58,.43),(.66,.42),(.72,.47),(.78,.60),(.79,.68),(.77,.71),(.72,.68),(.65,.62),(.59,.57)],65)
# Fill only the removed hand with sampled dark background, preserving the cuff.
a = Image.open(SRC/'g4_hand_seam.png').convert('RGBA')
arr = np.array(a)
y,x = np.indices(arr.shape[:2]); shade = np.clip(21 + 8*x/arr.shape[1] + 5*y/arr.shape[0],0,255)
bg = np.stack([shade*1.05,shade*.89,shade*.74,np.full_like(shade,255)],axis=-1).astype('uint8')
Image.composite(Image.fromarray(bg),a,m.filter(ImageFilter.MaxFilter(7))).save(OUT/'g4_plate.png')

# I5: keep one palm drawing throughout; finger motion is a mesh deformation.
hand5 = [(.441,.405),(.464,.362),(.480,.335),(.484,.302),(.492,.269),(.495,.244),(.495,.218),(.500,.190),(.509,.174),(.515,.150),(.523,.126),(.532,.098),(.542,.072),(.553,.047),(.568,.033),(.577,.029),(.582,.035),(.576,.048),(.564,.068),(.553,.094),(.543,.124),(.539,.148),(.549,.141),(.564,.125),(.582,.109),(.601,.096),(.617,.092),(.628,.101),(.627,.111),(.614,.110),(.598,.122),(.582,.143),(.568,.165),(.559,.190),(.554,.211),(.572,.201),(.590,.185),(.607,.165),(.623,.153),(.638,.149),(.648,.154),(.649,.164),(.642,.170),(.632,.168),(.616,.190),(.600,.216),(.579,.247),(.603,.237),(.625,.224),(.644,.207),(.660,.197),(.674,.196),(.677,.203),(.666,.215),(.652,.232),(.639,.254),(.623,.276),(.605,.291),(.580,.307),(.559,.319),(.543,.336),(.523,.355),(.508,.371),(.496,.386),(.484,.413),(.474,.435)]
m = light_cut('i5_hand','i5_turn',[(.45,.14),(.49,.12),(.51,.10),(.52,.05),(.55,.015),(.575,.005),(.595,.02),(.59,.045),(.575,.075),(.56,.11),(.59,.09),(.615,.075),(.635,.075),(.655,.095),(.655,.115),(.64,.12),(.62,.11),(.595,.145),(.58,.18),(.57,.215),(.59,.195),(.615,.165),(.64,.145),(.665,.14),(.68,.155),(.675,.175),(.655,.18),(.635,.205),(.615,.235),(.595,.265),(.625,.245),(.65,.22),(.68,.205),(.70,.21),(.705,.23),(.69,.25),(.665,.275),(.64,.31),(.61,.34),(.575,.36),(.55,.385),(.52,.42),(.49,.45),(.455,.42)],90,floor=12)
a = Image.open(SRC/'i5_turn.png').convert('RGBA')
# Extend the existing sleeve texture beneath the hand; sample its adjacent forearm strip.
arr=np.array(a); bg=arr.copy()
for yy in range(a.height):
    sample=arr[yy,int(a.width*.455)]
    bg[yy,int(a.width*.44):int(a.width*.50)]=sample
Image.composite(Image.fromarray(bg),a,m.filter(ImageFilter.MaxFilter(7))).save(OUT/'i5_plate.png')

# I7: move the doll, with the architecture and stage locked off.
doll = [(.442,.133),(.470,.111),(.498,.115),(.520,.145),(.537,.179),(.543,.215),(.554,.268),(.562,.312),(.580,.354),(.602,.397),(.615,.435),(.622,.479),(.614,.505),(.620,.544),(.628,.594),(.632,.625),(.622,.653),(.625,.692),(.604,.723),(.574,.750),(.539,.774),(.532,.807),(.528,.836),(.516,.859),(.501,.903),(.487,.916),(.480,.903),(.480,.870),(.475,.839),(.475,.808),(.466,.786),(.433,.778),(.404,.758),(.383,.733),(.384,.703),(.392,.662),(.383,.626),(.383,.587),(.386,.552),(.386,.518),(.386,.487),(.395,.454),(.402,.415),(.413,.376),(.419,.334),(.425,.293),(.430,.251),(.433,.207)]
m = cut('i7_doll','i7_newdoll',doll)
a = Image.open(SRC/'i7_newdoll.png').convert('RGBA'); arr=np.array(a)
# Symmetric dark curtain sample; floor stays untouched.
bg=arr.copy()
for yy in range(a.height):
    bg[yy,:, :] = arr[yy,int(a.width*.66),:]
erase=mask([(.36,.09),(.56,.09),(.64,.35),(.66,.68),(.62,.80),(.55,.94),(.45,.94),(.35,.79),(.36,.40)],a.size)
Image.composite(Image.fromarray(bg),a,erase.filter(ImageFilter.GaussianBlur(3))).save(OUT/'i7_plate.png')

# Loose cloth edge only. Preserve the source hand and glove overlap; do not cut across fingers.
flap=[(.46,.47),(.51,.43),(.57,.45),(.61,.50),(.64,.58),(.65,.67),(.62,.76),(.58,.85),(.53,.91),(.51,.89),(.53,.82),(.55,.73),(.56,.64),(.54,.56),(.50,.52)]
m=cut('g5_flap','g5_hand_half',flap)
a=Image.open(SRC/'g5_hand_half.png').convert('RGBA')
Image.composite(Image.new('RGBA',a.size,(12,10,9,255)),a,m.filter(ImageFilter.MaxFilter(9))).save(OUT/'g5_plate.png')
print('wrote clean single-drawing silhouettes:',len(list(OUT.glob('*.png'))))
