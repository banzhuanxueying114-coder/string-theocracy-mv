#!/usr/bin/env bash
# Awakening: she stops being a doll. Same short-brief method and the same style line as gen_brief_tests.sh.
NODE="${NODE:-node}"
PY="${PY:-python3}"
GEN="D:/dpskhns/tools/gpt-image/generate.mjs"
OUT="D:/gemini work/art/brief"
mkdir -p "$OUT"

HEAD="你是一支动画 MV 的美术指导。请根据下面的画面意图自己决定构图、光线和细节，画出这支 MV 里的一个镜头。"
LOOK="橙色长直发垂到膝下，琥珀色眼睛，头右侧戴一朵橙白相间的大菊花发饰配黑丝带"
STYLE_BASE="画风：所有镜头出自同一部手绘二维动画电影，线条干净，平涂上色加两层简单明暗，暗部压得很深，光只有一个来源。"
DARK="色彩克制，只用黑、象牙白、橙、金。16:9 宽银幕。不要出现任何文字。"
DAWN="教堂里面只有黑、象牙白、橙、金；门外的清晨天空是这支 MV 里第一次出现的淡蓝色。16:9 宽银幕。不要出现任何文字。"
LIB="穿白色高领衬衫配短披肩、黑色领巾、黑色束腰和米白色长褶裙，裙上有橙色和黑色的拼片"

A1="画面意图：近景，觉醒的瞬间。她刚剪断最后一根金线，瓷质的人偶外壳正从她的脸和手上裂开、成片剥落。画面里她一半还是人偶（瓷面、球形关节），另一半已经是活人的皮肤和手。眼睛第一次有了神采。主角：一个少女，${LOOK}，穿黑白两色的长款女仆裙。"
A2="画面意图：近景。她现在是活生生的人，身上没有任何关节和接缝。手腕上还系着一小截断掉的金线，她低头看着自己能自由活动的手。主角：一个少女，${LOOK}，${LIB}。"
A3="画面意图：远景，结尾。她推开教堂的大门走向外面的晨光，背对我们，怀里抱着一本暗红色的书。她身后的地上留着一具空的瓷质人偶外壳、一条女仆裙和散落的金线。主角：一个少女，已经是活生生的人，${LOOK}，${LIB}。"

run() { "$NODE" "$GEN" --api images "$HEAD $2 $STYLE_BASE $3" --out "$OUT/$1.png" 2>&1 | grep -v -i "key" | tail -1; echo "$1 exit: ${PIPESTATUS[0]}"; }
run a1_shell "$A1" "$DARK" &
run a2_alive "$A2" "$DARK" &
run a3_leave "$A3" "$DAWN" &
wait
"$PY" - <<'EOF'
from PIL import Image
import os
d = r"D:/gemini work/art/brief"
names = ["a1_shell","a2_alive","a3_leave"]
W, H, G = 1000, 563, 12
sheet = Image.new("RGB", (W*3+G*4, H+G*2), (20,20,20))
for i, n in enumerate(names):
    p = os.path.join(d, n + ".png")
    if not os.path.exists(p):
        print("missing", n); continue
    im = Image.open(p).convert("RGB")
    print(n, im.size)
    sheet.paste(im.resize((W, H), Image.LANCZOS), (G + i*(W+G), G))
sheet.save(os.path.join(d, "sheet_awake.jpg"), quality=90)
print("sheet", sheet.size)
EOF
