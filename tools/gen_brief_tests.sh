#!/usr/bin/env bash
# Same six shots, but as short intent briefs with one shared style line; the image model decides the details.
NODE="${NODE:-node}"
PY="${PY:-python3}"
GEN="D:/dpskhns/tools/gpt-image/generate.mjs"
OUT="D:/gemini work/art/brief"
mkdir -p "$OUT"

HEAD="你是一支动画 MV 的美术指导。请根据下面的画面意图自己决定构图、光线和细节，画出这支 MV 里的一个镜头。"
WHO="主角：一个少女模样的提线人偶，橙色长直发垂到膝下，琥珀色眼睛，头右侧戴一朵橙白相间的大菊花发饰配黑丝带，穿黑白两色的长款女仆裙。"
STYLE="画风：所有镜头出自同一部手绘二维动画电影，线条干净，平涂上色加两层简单明暗，暗部压得很深，光只有一个来源。色彩克制，只用黑、象牙白、橙、金。16:9 宽银幕。不要出现任何文字。"

S1="画面意图：远景。一座大教堂里，祭坛的位置是一个木偶戏台，幕布刚拉开。一束顶光里，她被许多金线吊在台上，在画面里很小。台下坐满背对我们的白袍人。"
S2="画面意图：近景。金线吊着她的手腕，其中一根线把她的嘴角拉成微笑，但她的眼睛直直看着观众。能看出她的手和脖子是人偶的球形关节。"
S3="画面意图：仰拍教堂墙上的一扇彩绘玻璃花窗，窗上的圣像就是她，整个人完全由一片片玻璃和黑色铅条拼成，没有手绘的五官。她双手抬起，头后有光环，光从窗外透进来。"
S4="画面意图：戏台后面昏暗的工坊。架子上摆满和她一模一样、闭着眼睛的人偶头，一盏吊灯照着。其中只有一个睁着眼睛，看着我们。"
S5="画面意图：动作镜头。她握着一把黑色大剪刀，撞碎一扇画着她自己的彩绘玻璃花窗冲出来，碎玻璃和被剪断的金线在她身后飞散。表情平静而坚决。"
S6="画面意图：从戏台地面向上仰拍。一只巨大的、戴白手套的手握着木偶操纵架悬在上方，占了画面上半部分。她在画面底部，很小，背对我们仰头看着那只手，脚边是剪断的线。"

run() { "$NODE" "$GEN" --api images "$HEAD $2 $WHO $STYLE" --out "$OUT/$1.png" 2>&1 | grep -v -i "key" | tail -1; echo "$1 exit: ${PIPESTATUS[0]}"; }
run s1_cathedral "$S1" &
run s2_doll "$S2" &
run s3_glass "$S3" &
run s4_workshop "$S4" &
run s5_shatter "$S5" &
run s6_hand "$S6" &
wait
"$PY" - <<'EOF'
from PIL import Image
import os
d = r"D:/gemini work/art/brief"
names = ["s1_cathedral","s2_doll","s3_glass","s4_workshop","s5_shatter","s6_hand"]
W, H, G = 1000, 563, 12
sheet = Image.new("RGB", (W*2+G*3, H*3+G*4), (20,20,20))
for i, n in enumerate(names):
    p = os.path.join(d, n + ".png")
    if not os.path.exists(p):
        print("missing", n); continue
    im = Image.open(p).convert("RGB")
    print(n, im.size)
    im = im.resize((W, H), Image.LANCZOS)
    sheet.paste(im, (G + (i % 2)*(W+G), G + (i//2)*(H+G)))
sheet.save(os.path.join(d, "sheet.jpg"), quality=90)
print("sheet", sheet.size)
EOF
