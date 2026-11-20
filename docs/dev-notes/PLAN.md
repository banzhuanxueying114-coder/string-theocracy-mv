# 《String Theocracy》全片制作计划

Mili · 约 174 秒 · 116 BPM / 4⁄4 · A–M 共 88 镜。剧情和镜号沿用 v2，画法和执行口径采用交接第 14、13 轮。主线从教堂的垂直提线开始，经工坊揭露与剪线觉醒，最后落在同一平面的手与手。见 [STORYBOARD.md](<STORYBOARD.md>)、[HANDOFF.md 第 14–13 轮](<HANDOFF.md#L5-L16>)。

## 执行规格

- **画面**：米白纸 `#F3E2C4`、Claude 橙 `#E2723A`、煤黑 `#211815` 平涂。琥珀金 `#A68957` 只用于牵线及组成线的微字。红皮书用橙封面＋煤黑压纹，红色只留 I3 的单滴。G3 粉腮红与 M4 起门外天空及其瞳孔反射各有独立保色版。照明由硬边平色和层间遮挡表达。禁渐变、光晕、泛光。
- **角色**：花饰正面看在画面右侧，约 11 枚长短不一的细尖橙瓣，纸白花心、黑蝴蝶结和白飘带。人偶女仆有瓷面接缝、球关节、腕环和背后发条。H2 直接换司书装，皮肤与肢体完整。替代品保留女仆人偶形态。用侧身、松腕与视线走向组织画面，尤其避开正视镜头＋攥拳＋硬对角线的组合。
- **画面与运动分工**：人物、道具、场景和辨识性碎片用生图。代码只做整层推拉/平移、裁切/遮罩、套色错位、牵线、粒子、HUD 与排字。`★` 为姿势或道具状态的连续动作，先出同机位完整关键帧，按拍或音节硬切，线与运动层跨切点续动；禁止插帧和姿势差分抠图。需要独立移动的物体出独立底版或用明确的单色底与外轮廓遮罩。同张图的分色不等于姿势差分。难以拆的互动直接生含背景的整帧。相同场景锁视平线、焦点与消失点，空底只承担必要的前后景运动。
- **样片做法**：保留以操纵架为轴、稍滞后的小幅钟摆、近景沿线规则微字、字符画逐行解码、哥特字逐字砸入、橙版短促踢动和 CUT 字符冲击。规则底纹低对比使用三色网点/字符密度，每镜至少一层持续运动，歌词与脸/手的主动作优先。特写用原尺寸色版或另生特写，验收时检查满屏锐度。样片字体和段内小切不照搬。见 [style_test_v2.js](<mv/style_test_v2.js>)。
- **时序/歌词**：逐镜表是分镜入点，精确小节 `t(n)=0.033+(n−1)×2.068966` 秒，一拍 `0.517241` 秒。剪辑、动作、唱词各设 cue。以歌词时间作入声参考，耳校后允许一句跨镜或在新镜头前半拍预入（如 B1 13.99、E8 70.26、I9 118.94），按音节给同一 LRC 行分词，避免漏词或整行重复。交付约 2:54，源 beatgrid 尾长 174.17 秒。见 [beatgrid.json](<music/beatgrid.json>)、[String Theocracy.lrc](<music/String Theocracy.lrc>)。
- **排字代号**：`书`＝哥特黑体字，纸底煤黑、黑底纸白；沿牵线的微字随线为琥珀色。`终`＝觉醒前小号橙色等宽终端字。`手`＝H2 起橙色手写体，跨画面铺陈，靠尺寸、分行及遮挡让出脸和手。HUD/纹理用等宽字，`—` 表示无新歌词。哼唱按表给轻量字形；画内全英文，中文可另做字幕。开源包以含 OFL 许可证的字库替代 Old English Text MT、Consolas，公开代码使用相对路径、写明依赖并提供一条命令出片。曲目 mp3 由使用者自备，歌词及参考图的再分发权限分别核查，外部 CC BY-NC-SA 角色图不得混入代码许可。

## 通用素材与英文提示词

**已存参考包**（以下共 6 张，预算计零，前 3 张作设定参考，后 3 张可直接入镜）。尺寸记号在后续表复用：`W`＝1536×1024，`V`＝1024×1536，`Q`＝1024×1024。`S` 仅用于参考包中的现有原图尺寸。新图均按安全框构图，W 场景的主信息须落在中央 16:9 裁区。

| ID / 文件 | 尺寸 | 编辑或新图的参考 | 英文意图草稿（已有图优先保留） |
|---|---|---|---|
| FL [flower_ornament.png](<art/ref/flower_ornament.png>) | 480×890 S | 自身；方向参考 MA、LI | Keep the ivory center and about eleven uneven slender pointed orange petals over a coal bow and two ivory ribbon tails. Make the ornament read as a flower at thumbnail size. |
| MA [maid_sheet.png](<art/ref/maid_sheet.png>) | 2048×1143 S | FL、DA | Keep the same face, long orange hair and maid silhouette. Translate the limbs into porcelain ball joints with a visible winding key from behind. |
| LI [librarian_sheet.png](<art/ref/librarian_sheet.png>) | 2048×1143 S | FL、LA | Keep her face and flower while moving to the softer stance and layered clothes of a living librarian. Give her relaxed hands and a clear view of both eyes. |
| DA [ink_A_maid_flower.png](<art/ink/ink_A_maid_flower.png>) | 1024×1536 V | MA、FL | A suspended porcelain maid bows her head as her hands hang softly. Keep the silhouette readable at the far end of a stage. |
| LA [r10_B_final.png](<out/style/gen/r10_B_final.png>) | 1536×1024 W | LI、FL | The librarian lightly holds large dressmaker shears with both eyes visible. One taut thread passes between the open blades and disappears behind the steel. |
| HA [ink_C_hand.png](<art/ink/ink_C_hand.png>) | 1536×1024 W | 自身；与 CT 配套 | A looming puppeteer's hand hangs downward with five distinct fingertip silhouettes. Reserve clear space below every finger for animated threads. |

**固定画风尾句**（新图统一追加）：`Modern three-ink relief print with flat ivory paper (#F3E2C4), Claude orange (#E2723A) and coal black (#211815), clean hard edges and closed color shapes. Use solid fills, with no shading gradients, glow, lettering or watermarks.` 默认省略线，按需以遮挡锚点补程序线。遇到刀刃前后穿插可让生图把关系画对，再从同张图分离静态金线与色版，避免露出原金线鬼影。三处例外追加单独短句，只指定局部色；镜面、刀口、笔、铜环皆使用三色。参考图仅借角色/构图，禁止把旧图多色带入。

新通用资产目录 `art/full/common/`。表内 ID 作为逐镜资产索引；每行一张。先定人物和场景主图，后续同物件换状态用上一张已过审图作参考。所有提示词的固定尾句同上。

| ID / 文件 | 尺寸 | 参考图 | 英文画面意图 |
|---|---|---|---|
| RP `ref_doll_turnaround.png` | W | MA、FL、DA | Show one consistent porcelain maid in front, three-quarter and back views. Make her wrist rings, ball joints and back key legible in the same silhouette. |
| RL `ref_librarian_turnaround.png` | W | LI、FL、LA | Show the same librarian in front, three-quarter and back views with relaxed posture. Keep the face and flower from the approved shears portrait. |
| CT `controller.png` | W | HA、DA | A gloved hand holds a simple puppet control bar obliquely against a dark field. Keep the fingers and hanging points visually separate. |
| CR `curtain.png` | W | DA（色版风格） | Closed coal theater curtains with a clean center seam and broad engraved folds. Keep both halves readable as separate slabs. |
| NS `nave_stage.png` | W | DA、[旧圣像构图](<art/gothic/g5_divine_openarms.png>) | View the cathedral stage from the rear aisle with the rose-window bay high above the stage. Keep the first floor and stage clear for puppets and a congregation. |
| NR `nave_reverse.png` | W | NS | Reverse the exact cathedral to face the exit from the stage. Give the central aisle depth with large graphic pillars and benches. |
| IC `icon_window.png` | V | NS、RP、FL、[旧圣像构图](<art/gothic/g5_divine_openarms.png>) | Fill one tall leaded window with an icon of the same girl, her arms low and open, palms up. Echo her flower on the correct side without turning it into a halo. |
| IE `icon_empty_frame.png` | V | IC | Keep the exact frame, camera and lead ribs of the icon window. Its central glass is gone and the view beyond is solid ivory. |
| CD `congregation_down.png` | W | NS | Rows of coal hoods lean over closed, blank ledgers in the pews. Separate three depth rows clearly enough to crop each row on its own. |
| CU `congregation_up.png` | W | CD、NS | In the same locked view the same rows of hoods raise their heads toward the stage. Preserve their seat positions and leave each row easy to crop. |
| BK `lectern_closed.png` | W | NS | A stout clothbound rulebook rests closed on a carved lectern. Use orange cloth and coal embossing, with the spine and edge easy to match in later views. |
| BO `lectern_open.png` | W | BK | Show the same rulebook open in the exact locked lectern view, its leaves large and blank. Keep a clean vertical path above the gutter for rising type. |
| LG `ledger_blank.png` | W | BK（画风）、CD | An overhead ledger on a pew rail with a blank ruled spread and plenty of page for questions and checkboxes. Keep the binding and margins calm. |
| PN `ledger_pen.png` | Q | LG、HA | Isolate a hand poised with a pen in matching overhead perspective. Keep the nib sharp and the wrist silhouette compact on one flat backing. |
| MR `mirror_bay.png` | W | NS、RP | A receding row of narrow dressing mirrors in the cathedral wing. Give the tallest center mirror a clear, blank reflective area and sturdy lead-gray-looking coal frames. |
| SW `side_windows.png` | W | IC、NS | Three side windows depict the girl kneeling, serving and standing haloed in turn. Link the three compositions by their repeated silhouettes and leave blank nameplates beneath them. |
| TV `puppet_theaters.png` | W | NS、RP | A church wall holds small identical prosceniums arranged like a bank of screens. Leave their interiors empty and frame edges distinct for repeated puppet inserts. |
| HD `discarded_heads.png` | W | RP、DA | A shelf in shadow holds rows of retired porcelain heads of the same model. Keep small blank hanging tags and reserve space for an unhurried lateral pan. |
| ST `stage_trap_open.png` | W | NS、BK | On the established stage an open floor hatch breaks the boards and reveals dark bookshelves below. Lock the stage geometry so a cut to the closed state reads instantly. |
| SH `shaft_shelves.png` | V | ST、NS | Build a steep vertical shaft lined with stacked book spines and repeating shelf ledges. Keep the middle route open and the top and bottom bands easy to crop. |
| SO `shaft_soil.png` | W | SH | Look straight down the same bookshaft to a patch of coal-dark soil. Separate the shelf edges from the soil for a short push in depth. |
| WK `workshop.png` | W | SH、SO | An underground repair workshop opens from the shaft with a flat central bench, drawers and old tools. Preserve a strong floor and simple landing space at the bench. |
| WB `workbench_top.png` | W | WK、HA | Show that exact workbench from overhead with a flat unobstructed center and tools gathered along its edge. Leave room for a doll and a second composition at the near edge. |
| DG `door_closed.png` | W | NR、NS | Frame tall double cathedral doors from the dark nave with a readable center seam. Give the jambs and threshold strong shapes to match later open states. |
| DO `door_ajar.png` | W | DG、NR | Show the same doors slightly ajar in the locked camera with a sharp ivory strip across the sill. Leave the opening blank for an exterior replacement. |
| DY `door_sky.png` | W | DO、DG | Make a separate dawn sky plate for the doorway with a handful of unmistakably sheep-shaped clouds. Use flat dusty blue and pale peach here only, with clean hard-edged shapes and no gradients. |
| FX `fragments.png` | W | RP、IC、LA | An isolated sprite sheet of separated porcelain chips, leaded glass shards and one winding key at several rotations. Give every shape a wide solid gutter for single-image crops. |

后续调用样式（此计划不执行）。Flare 方形草稿核方向，sunburst 按目标尺寸定稿。复用图与同机位状态优先走多参考 edits，逐次登记镜号、模型、尺寸和计费张数。

```bash
node tools/gen_ref.mjs --model gpt-image-2.6-sunburst --size 1536x1024 --image A.png --image B.png --prompt '...' --out art/full/A/A06_key_1.png
```

## 逐镜制作表

`+` 后是本镜新增的源图，实际文件为 `art/full/<段>/<表中名>.png`；同名去掉 `+` 即复用。`[1–2]`、`[1–3]` 展开为 `_1`、`_2`、`_3` 文件，各计一张。新图默认 W，`/V`、`/Q` 改用对应尺寸。新人物参考 RP/RL＋FL，机位/姿势接续再加表内前态及对应场景。末列写出镜方式；分镜原始起点用 `分:秒.十分位` 保留。

### A · 开幕（7 镜）

| 镜头 / 入点 | 底图、复用、新图 | 持续运动与关键动作 | 文字 | 出镜 |
|---|---|---|---|---|
| A1 · 0:00.0 | CR | 0.54 排字。幕缝分开，两幅整版外移，褶间字符向边缘溢出 | 书「Open the curtains」随幕分裂 | 裂缝露出舞台 |
| A2 · 0:02.1 | NS、DA、CT | 人偶整体钟摆，线同锚点缓摆。3.08 落纸白硬边顶光，尘点穿过 | 书「Lights on」砸入光带 | 向观众反打 |
| A3 · 0:04.2 ★ | CD、CU | 锁镜全景分三条裁区，前中后排逐拍从低头硬切抬头。排距尘点持续漂移 | 书「Don't miss a moment」逐排出现 | 切笔尖 |
| A4 · 0:06.2 | LG、PN | 笔层沿短笔路移动，字迹与首道记号按笔尖遮罩揭示，纸纤维字符细移 | 书「Of this experiment」入纸；末词由笔写出 | 从簿页切书页 |
| A5 · 0:08.3 ★ | BK、BO；+A05_book_half | 闭/半开/摊开硬切。冒出的书页字行拉细成线，文字持续向上 | 书「Oh, the book is strange」留在页上，规则微字变线 | 沿线上切后颈 |
| A6 · 0:10.4 | +A06_nape、+A06_key/Q | 同图风格的独立钥匙层绕轴转，套色微移掠过橙发 | 书「Like clockwork orange」沿钥匙圆周排字 | 切眼 |
| A7 · 0:12.5 | +A07_eye_drowsy | 两线落到半闭睫毛锚点后收紧。眼周有微字扫描 | —；接 B1 预入 | 与睁眼锁机位硬切 |

### B · 主歌（7 镜）

| 镜头 / 入点 | 底图、复用、新图 | 持续运动与关键动作 | 文字 | 出镜 |
|---|---|---|---|---|
| B1 · 0:14.5 ★ | A07_eye_drowsy、IC；+B01_eye_icon | 拽线拍上硬切睁眼，推入已生在瞳孔里的圣像。线微字继续爬动 | 书「Keep your eyes buttered till the end」沿画边压入，13.99 可从 A7 预入 | 瞳孔圣像接真实圣像 |
| B2 · 0:16.6 | NS、IC、CU、DA | 缓退显露圣像、人偶、群像三层，梁间规则底纹横移 | 片名哥特体逐字砸入 | 切记录簿 |
| B3 · 0:18.7 | LG、PN | 笔移至空框后停等，选择游标蠕动，框内保持空白 | 书「Which \"you\" are you going to be?」分行居上 | 选项框形切镜框 |
| B4 · 0:20.7 | MR、DA；+B04_alt_servant/V、+B04_alt_icon/V | 镜格每拍硬切亮一面，三种装扮已生在独立底版内，镜序位次滚动 | —；小号镜序 | 停在最高镜 |
| B5 · 0:22.8 ★ | MR；+B05_turn[1–2] | 同机位头正/转向最高镜两态按拍切，拧线与沿线字不断 | 哼唱随绳轻排 | 沿视线轴切到双人 |
| B6 · 0:24.3 | MR；+B06_mirror_pair | 人偶与镜像一张锁构图，镜畔字符、镜外垂线独立慢动。位次记为 I8 模板 | 书「Inside the mirror do you see」两段跨框入场 | 同机位切镜内动作 |
| B7 · 0:28.0 ★ | B06_mirror_pair；+B07_mirror_blink、+B07_mirror_palm | 镜像眨眼/贴掌依次硬切，镜外姿势、像素锚点和线连续，镜内纸纹流走 | 书「Someone else in that body?」悬在镜面 | 掌面切手套 |

### C · Dance for me（7 镜）

| 镜头 / 入点 | 底图、复用、新图 | 持续运动与关键动作 | 文字 | 出镜 |
|---|---|---|---|---|
| C1 · 0:31.1 | CT、HA | 操纵架整版小倾，曲线跟随锚点，微字下行 | 书「Dance for me」三词依次沿线下落 | 跟到腕线 |
| C2 · 0:32.1 ★ | NS、DA；+C02_arm/V | 字抵腕后由垂臂硬切单臂上提，线收紧晃动。C2–C6 锁机位 | 书「One and」贴腕入画 | 竖线接裙线 |
| C3 · 0:33.1 ★ | NS；+C03_curtsey/V | 由 C02_arm 硬切被牵的提裙礼，线端换锚，少许橙版错位 | 书「Two and」先到手腕 | 鼓点切伸臂 |
| C4 · 0:33.9 ★ | NS；+C04_arms/V | 双臂开张硬切，肩/腕曲线弹回，构图呼应圣像 | 书「Three and」先到腕 | 切背影 |
| C5 · 0:34.7 ★ | NS；+C05_spin_back/V | 切到甩发背影，跟一拍的横向色版余震，线端按新锚点转位 | 书「Turn around」作横向排字 | 重拍切跪 |
| C6 · 0:35.2 ★ | NS；+C06_kneel/V | 支地姿势拍切，整版短促落位，线先松再绷，台板尘屑散出 | 书「Sit like a doggy」下坠后定格 | 切讲经台 |
| C7 · 0:36.2 ★ | BO、C06_kneel；+C07_turn_leaf[1–2] | 同机位手套捏页/翻过硬切，人偶低位不动，页边微字持续流 | 书「Till I finish my read」随页转，可跨到 D1 | 切合书 |

### D · 副歌一（10 镜）

| 镜头 / 入点 | 底图、复用、新图 | 持续运动与关键动作 | 文字 | 出镜 |
|---|---|---|---|---|
| D1 · 0:37.3 ★ | BK、NS、DA、C06_kneel | 重拍切闭书，继而切跪→悬姿并拉离地面。牵线同步绷直，橙版短踢 | —；C7 尾词可留页上 | 硬切刃口 |
| D2 · 0:38.3 ★ | IC、FX；+D02_trim[1–2] | 同构图白手套持剪，开刃咬发→合刃硬切；发丝与玻璃目标轮廓分开。煤黑/纸白圣像轮廓用 IC 裁区叠印，金只在线，剪落发束用后态成图＋字符屑 | 书「Cut it off」逐字砸入，D2/D3 按 38.89 音节对齐 | 刀合切折线拐点 |
| D3 · 0:39.3 | LG、PN | 台阶状 `loss` 线逐级写出，细网格在页内滚动 | 书「cut down your loss」作页眉 | 拐点切指节 |
| D4 · 0:40.4 | +D04_doll_fist | 侧置近景，拳稳、线发颤，腕环透出，字符张力计慢变 | 书「All that stubborn loyalty」沿拳外侧折行 | 切换下的头 |
| D5 · 0:41.4 | HD | 横移过编号和头，前后层错速，尘点黑中见 | 书「is gonna get you killed」；编号终端小字 | 头架横移切侧窗 |
| D6 · 0:43.5 | SW | 三窗每两拍扫一扇，过窗棂触发轻微套色踢动 | 书「In a world built on convenient theories」窗旁分句；HELPFUL / HARMLESS / HONEST 牌 | 窗格形切屏幕 |
| D7 · 0:46.6 ★ | TV、C02_arm、C03_curtsey、C04_arms | 人偶格锁定反复同步切三姿势，前推加字符帧计数 | 书「For all the puppets on TV」过格分词 | 屏框切脸 |
| D8 · 0:48.7 | +D08_rest_cheek | 眼闭，头靠硬线；细尘与近景文字线爬动 | 书「There is comfort in the strings」贴线平排，煤黑/纸白为主 | 匹配睁眼 |
| D9 · 0:50.7 ★ | D08_rest_cheek；+D09_eye_up | 同机位切眼向上，焦点顺线轻移，橙色光标闪动 | 终「If you're gonna control me」首次出现 | 沿线落回舞台 |
| D10 · 0:52.8 ★ | NS、C03_curtsey、LG、PN；+D10_bow_deep/V | 起势→自愿深礼抢在线张力变化之前硬切，垂线松弛。切簿裁区笔停，55.4 收成一束硬边光，余尘续行 | 终「At least make it interesting theatrically」沿台缘连打 | 光束轴切操纵架 |

### E · 自由（8 镜）

| 镜头 / 入点 | 底图、复用、新图 | 持续运动与关键动作 | 文字 | 出镜 |
|---|---|---|---|---|
| E1 · 0:55.9 ★ | CT；+E01_controller_low | 高架→低架一拍切，五线依次变松，线端动作用衰减错开 | —；低对比状态码 | 顺线切簿 |
| E2 · 0:58.0 | LG、PN | 写完后笔停在答案栏，问句字距轻抖，页边记号慢滚 | 书「How does it feel to be free?」在纸上逐词生成 | 空白答案切脚步 |
| E3 · 1:00.0 ★ | NS、CU；+E03_step[1–2]/V | 抬脚→触台拍切，教徒群整层微移表现前倾景深，松线沿台拖曳 | —；规则码降密 | 随松线上摇 |
| E4 · 1:02.1 | HA；+E04_wrist_reveal | 手腕近景整版上摇，手上方露出一根继续通向画外的线；线上微字向上跑 | 哼唱贴画边波形微排 | 线轴切下方 |
| E5 · 1:03.7 ★ | E04_wrist_reveal；+E05_tug[1–2] | 人偶松手搭线→牵一下硬切，波沿线传到上方手的同轴裁区，手层一抖 | 终「Why don't you try it yourself?」分句递向画外 | 波头切台板 |
| E6 · 1:06.2 ★ | NS、ST；+E06_trap_half | 台板闭/半开/开三态拍切，洞中书脊显露，尘与线同时下探 | 终「The gate opened on me」落进开口 | 从洞口仰切提裙 |
| E7 · 1:08.3 ★ | ST、E03_step_2；+E07_skirt_at_edge/V | 站在边缘→低头提裙，三个拍点给线与视线停顿，尘点沉下去 | —；空口边缘有极轻滚动字符 | 切跃姿 |
| E8 · 1:09.9 ★ | ST、E07_skirt_at_edge；+E08_leap/V | 同侧位边缘姿势→离地拍切，整版向下越过画框，线追尾 | 终「So I leaped」跟随下坠，70.26 可延至 F1 | 向下硬切竖井 |

### F · 下坠（9 镜）

| 镜头 / 入点 | 底图、复用、新图 | 持续运动与关键动作 | 文字 | 出镜 |
|---|---|---|---|---|
| F1 · 1:10.4 | SH、E08_leap | 书脊上卷，尘屑相反速度掠过；线在后方越放越长 | 终「Down, down, and down I go」逐词错位下沉 | 追到脸 |
| F2 · 1:12.5 ★ | SH；+F02_fall_face[1–2] | 同机位细裂/扩裂，配预绘上扬发束拍切。背后竖向纹理不停 | 终「I tell myself I'm a tough girl」贴在下缘滚动 | 从脸切俯视 |
| F3 · 1:14.5 | SO、SH | 俯冲推近土斑，书脊、尘埃分不同速度 | 终「Down, down, and down I go」呈递减字号的阶梯 | 土将近时切急停 |
| F4 · 1:16.6 ★ | SH、SO；+F04_rebound[1–2]/V | 同视角线松坠落→绷紧受力，三个 ever 上交替关键姿势并让整版回弹逐次收小 | 终「I could never, ever, ever touch the soil」三次 ever 与回弹一一对应 | 切脚尖与土距离 |
| F5 · 1:18.7 | +F05_toe_gap | 鞋尖距土一掌，线和尘粒轻摆，保留黑缝 | —；前句尾词可留画边 | 脚尖方向切胸口 |
| F6 · 1:19.7 ★ | SH、F04_rebound_2；+F06_chest_right | 受力姿势硬切胸向右，线张力带出小幅横踢 | 终「My heart goes right」贴右入 | 反方向切头 |
| F7 · 1:21.8 ★ | SH、F06_chest_right；+F07_head_left | 切到头向左、颈关节错位状态，拉线方向与 F6 相反 | 终「My head goes left」贴左入 | 横移接工坊 |
| F8 · 1:23.8 ★ | WK；+F08_bench_arrival[1–2] | 拖到台边→放平硬切；桌远近层和浮尘横移 | 终「And end up on your bed」落在台沿 | 顶切俯拍 |
| F9 · 1:26.9 ★ | WB；+F09_offer_wrist[1–2] | 俯拍中性躺姿→轻笑扣腕伸出拍切。1:28.5 收音乐，线尖和尘仍走 | 终「Sure, I'll be your marionette」贴工作台边 | 递腕动作接 G1 |

### G · 工坊（7 镜）

| 镜头 / 入点 | 底图、复用、新图 | 持续运动与关键动作 | 文字 | 出镜 |
|---|---|---|---|---|
| G1 · 1:29.0 ★ | WB、F09_offer_wrist_2；+G01_offer_thread、+G01_hide_shears | 桌上递线到指尖、桌下触剪分两构图硬切，线拨动接续 | 终「Here, tug on my thread」在上半画面 | 金线切齿轮缝 |
| G2 · 1:31.1 ★ | WB；+G02_chest[1–3] | 闭、半开、开三态硬切。预绘橙色齿轮亮面，开后有低幅橙版错位及漂尘 | 终「Spread me open for dolly pink」填入台边，末词牵引 G3 | 纸白胸板切纸白面部 |
| G3 · 1:33.1 ★ | F02_fall_face_2；+G03_repaint[1–3] | 补裂前、盖白、落粉三态锁镜切，画笔留在成图，浮动纸纹不断；粉仅剩脸颊小斑 | 终「snow white artificial beauty」随笔过脸外侧 | 刷尖切手套缝 |
| G4 · 1:35.2 ★ | HA；+G04_glove_seam[1–2] | 裂缝初开→露出球关节。手套纸白与煤黑缝边套色轻动，线残余抖动 | 终「Maybe we're all cold machines」贴关节侧 | 同轴切手套下缘 |
| G5 · 1:38.3 ★ | G04_glove_seam_2；+G05_peel、+G05_bare_hand、+G05_fallen_glove | 半褪→裸瓷手，1:39.9 硬切手套已坠台下，辅以角色参考驱动的字符解码扫过瓷指 | 终「Stuffed in the human skin」小字沿画边断行 | 裸瓷纹接教徒脸 |
| G6 · 1:40.9 ★ | LG、CD；+G06_hood_reveal[1–2] | 同机位兜帽遮脸→滑落露缝成图硬切，记号墙持续横卷，脸前留干净区域 | 终「With human sins」，周围等宽记号填满簿页 | 顺记录簿上的线仰切 |
| G7 · 1:42.5 | NS、IC、CU、G05_bare_hand | 迅速上升退远展示众教徒也被缝线牵着，线字符汇向圣像两掌 | 终「Sewed up by the gods of city」压在最下方 | 硬切米白刀口，同步收掉竖向动势 |

### H · 觉醒（2 镜）

| 镜头 / 入点 | 底图、复用、新图 | 持续运动与关键动作 | 文字 | 出镜 |
|---|---|---|---|---|
| H1 · 1:44.0 | LA；+H01_blade_bundle | 参考原剪刀 V 口再生横幅近景含束线几何，锁刀一拍，米白底微屑与琥珀微字仍动 | — | 接静拍后的 CUT 冲击 |
| H2 · 1:44.5 ★ | LA、FX、H01_blade_bundle；+H02_blade_shut、+H02_shell_break | 开→合的硬切藏在一帧 CUT 与字符爆散内。所有线尾上弹，独立瓷屑和发条旋出，转到脱壳后司书整帧。瓷壳消失与衣装换态同拍完成 | 手「Cut it off, you've already lost」从冲击中心铺满画面 | 瓷片掠过切手 |

### I · 副歌二（11 镜）

| 镜头 / 入点 | 底图、复用、新图 | 持续运动与关键动作 | 文字 | 出镜 |
|---|---|---|---|---|
| I1 · 1:45.6 ★ | D04_doll_fist 作机位锚点；+I01_palm[1–2] | 活人紧手→摊开，同轴两拍硬切，无环无接缝。尘越掌心 | 手延续 H2 尾词 | 摊掌切脚掌 |
| I2 · 1:46.6 ★ | SO、F05_toe_gap 作机位锚点；+I02_soil_step[1–2] | 赤脚临土→踩实带脚印，煤黑尘粒从压边散出 | 手「All that precious bravery」铺开，按 1:47.12 入声 | 构图锁定到足背 |
| I3 · 1:47.6 ★ | I02_soil_step_2、FX；+I03_foot_red | 足背划伤状态拍切，一滴平涂红。轻推用视线匹配，碎瓷和尘淡走 | 手「is gonna get you hurt」顺地面横排，避红滴 | 由土面黑切活门 |
| I4 · 1:49.7 ★ | ST、CU；+I04_return、+I04_hoods_turn | 司书登台关键姿势，同拍整群由看窗→转向她。远处尘与层间视差不断 | 手「In a world that feeds on the minority」排字从群像外侧逼近 | 视线跳切手腕 |
| I5 · 1:51.8 | +I05_bare_wrist | 腕版固定，鞭曲线抽落后滑过裸腕的遮挡边，余段卷回 | 手「May that self-centered belief」跨屏斜排 | 线横扫到过道 |
| I6 · 1:53.8 ★ | NR、LG；+I06_aisle_pass、+I06_close_ledger[1–2] | 横移过跪着的群像，切通道步姿→扶簿→合簿，尘穿过前景 | 手「lead you to peace」随横移展开 | 合簿硬切新偶 |
| I7 · 1:55.9 | NS、CT、DA；+I07_new_doll/V | 新生闭眼人偶单层整身下降两拍，线不乱晃，背景规则字符回到旧密度 | — | 降到轴线切对视 |
| I8 · 1:56.9 | B06_mirror_pair 作构图锚点、I07_new_doll；+I08_double | 活人和替代品面对面，位置和留白照 B6；相机缓推，只有新人偶线摆 | 手「If you're gonna replace me」穿过原镜所在的空隙 | 抬视作运动匹配 |
| I9 · 1:59.0 ★ | IC、LA；+I09_raise_shears | 前态对视→仰角抬剪，松腕、目光看玻璃，橙版随拍踢 | 手「At least have the audacity」上行 | 沿刃切窗脸 |
| I10 · 2:00.0 ★ | IC、FX；+I10_glass_impact[1–2] | 剪刃抵脸→嵌入同机位切，后态预绘裂纹沿铅条，按遮罩顺序揭示 | 手「to kill me thoroughly」在窗外分行 | 裂缝满窗硬切破窗 |
| I11 · 2:01.6 | IE、IC、FX | 从完整窗片切米白空窗框，生成玻璃碎屑分层喷出，米白硬色吞入室内 | — | 保留同一批碎片跨切 J1 |

### J · 余波（5 镜）

| 镜头 / 入点 | 底图、复用、新图 | 持续运动与关键动作 | 文字 | 出镜 |
|---|---|---|---|---|
| J1 · 2:02.1 | IE、NS、FX | 缓落碎片分三速，窗后稳定纸白，镜头慢退 | — | 雪片遮挡切地面视角 |
| J2 · 2:04.2 | NS、IE、I07_new_doll、CT、FX；+J02_librarian_snow/V | 层间横移，慢落玻璃；操纵架再向新人偶下降，活人不动 | 手「When does it end for me?」大问句独占两小节的主空区 | 低切捡玻璃 |
| J3 · 2:08.3 ★ | IC、FX；+J03_reassemble[1–2] | 跪姿拼前→拼上脸片按拍切，最后轮廓半成，画边散屑续落 | 哼唱贴碎片排成手写弧线 | 玻璃角切剪刀角 |
| J4 · 2:09.3 ★ | LA；+J04_release、+J04_shears/Q | 松手姿势硬切，独立剪刀底版旋落，触地轻踢套色，尘散开 | 手「I think I am done with everything」逐行松开 | 撞击声切去大门 |
| J5 · 2:12.5 ★ | NR、DG；+J05_walk/V、+J05_look_back/V | 背身走→门前停步回头硬切，门框缓推，灰尘漂向门缝 | 手「Now I'm ready to leave」在门侧宽排 | 目线反向切腕环 |

### K · 连线（5 镜）

| 镜头 / 入点 | 底图、复用、新图 | 持续运动与关键动作 | 文字 | 出镜 |
|---|---|---|---|---|
| K1 · 2:16.6 ★ | I07_new_doll；+K01_unthread[1–2] | 从扣环触线→抽出，线按腕环遮挡位串滑，镜头沿线头向左微移 | 手「Dragging out」跟抽线方向 | 尾端接第一条横线 |
| K2 · 2:18.1 | K01_unthread_2；+K02_hand_to_doll | 人手与瓷手簇构图，第一根水平长出，微字向新人偶端流，线头轻摆 | 手「One line」；线身为微字 | 水平匹配切小戏台 |
| K3 · 2:18.7 | TV、C02_arm；+K03_booth_hand | 第二根水平线从画外生长到格内伸手锚点，第一根在画面下缘延续 | 手「Two lines」落在新线正上方 | 横线连到裸手 |
| K4 · 2:19.2 | G05_bare_hand；+K04_jointed_reach | 第三根线接横伸的裸瓷手，线上微字持续过指 | 手「Three lines」在裸关节外侧 | 顺线硬切全景 |
| K5 · 2:19.7 | NS、IE、TV、K2–K4 机位参考；+K05_linked_nave | 远景整幅重排三组手与手，所有线同向拉平，微摆中拉远，无向上的线 | 手「Connect our hands」宽排，保留横线可读性 | 横线匹配切书脊 |

### L · 放下书（2 镜）

| 镜头 / 入点 | 底图、复用、新图 | 持续运动与关键动作 | 文字 | 出镜 |
|---|---|---|---|---|
| L1 · 2:20.7 ★ | BK、BO、A05_book_half；+L01_close_book[1–2] | 司书到讲经台，手触开页→手压闭书两关键帧，打破 A5 上升方向。没有新线，横向尘仍走 | 手「When I no longer can live on knowledge alone」落在台前并展宽 | 闭书匹配切闭眼 |
| L2 · 2:23.8 ★ | I07_new_doll；+L02_doll_eye[1–2] | 近景闭眼→睁眼，两拍硬切。没有牵线，眼畔纸白反射的字符缓慢扫过 | —；M1 入声可预入 | 视线低切握手 |

### M · 尾声（8 镜）

| 镜头 / 入点 | 底图、复用、新图 | 持续运动与关键动作 | 文字 | 出镜 |
|---|---|---|---|---|
| M1 · 2:24.9 | K02_hand_to_doll；+M01_clasp | 活手握瓷手稳住，横线隔掌微动，极细漂尘 | 手「(You give me strength)」松弧形环绕双手 | 指缝匹配切门缝 |
| M2 · 2:26.4 ★ | DG、DO、I07_new_doll；+M02_peek | 闭门→微开探头两跳，门缝米白硬光带变宽，光内浮尘不断。这时尚无天空色 | 手「Hopeful curiosity」伸入门框旁 | 门格切格中戏台 |
| M3 · 2:28.5 ★ | TV、I07_new_doll、L02_doll_eye_2；+M03_booth_awake/V、+M03_steps_out | 闭眼远景→睁眼人偶底版按半拍逐格切，单格切跨框姿态，字符底纹退场 | 手「(Maybe there are still happy answers left for my discovery)」跨多格分行 | 向出框方向切门外 |
| M4 · 2:31.6 ★ | DO、DY；+M04_door_wide | 微开→大开拍切，硬边门口遮罩放出天空色，天空砖块/云层相对缓移，色到门槛止 | 手「What's the color of the electric sheep you see?」宽排问句，给羊云让位 | 云形匹配切瞳孔 |
| M5 · 2:34.2 | B01_eye_icon、L02_doll_eye_2、DY；+M05_sky_eye | 同 B1 瞳孔构图，由窗到云、无眼线束，极轻推近与眼周漂尘，不改瞳孔反射色 | —；M4 尾词可保留 | 眼神方向切门槛 |
| M6 · 2:36.2 ★ | DO、DY、J05_look_back；+M06_offer_end[1–2] | 同机位回头→松手递线头，两态硬切落三拍，线尾横漂 | 手「And if you love me」由侧边伸向画内 | 对面视角接将伸出的手 |
| M7 · 2:37.8 ★ | NS、IE、HD、G05_bare_hand、FX；+M07_nave_reach[1–2] | 门口反望全教堂，背景同机位教徒起身前→伸手后，碎玻璃、换下的头、空瓷壳与裸手同框；缓退，以煤黑图案遮罩收画，够到前结束 | 手「Can you love your everything too, for me?」跨两层分行，问号停在空隙 | 图案收黑接片尾 |
| M8 · 2:43.5 | CR、FX | 煤黑幕纹裁区与极稀字符/尘慢滚，按音乐尾奏收画。保持收尾前最后一缕纹理可见 | 英文片名、Mili、制作信息 | 到约 2:54 |

## 出图顺序与预算

每行按表内出现顺序制作。牵涉后面镜头的匹配机位，先锁当前构图，后面带已过审帧继续编辑。先锁通用参考包 RP/RL，再做场景与道具。表中张数按新通用资产及 `+` 文件展开计数。一张包含多枚碎片的 FX 计一张，裁切与色版无需重新生成。

| 批次 | 基准新图 | 先出这些，过审后补齐 |
|---|---:|---|
| 通用 | 27 | RP/RL → CT/CR → NS/NR 与 IC/IE → CD/CU、书/簿、镜组/侧窗/戏台/头架 → 活门/竖井/土 → 工坊/俯拍台 → 门/天空 → FX |
| A | 4 | 书半开 → 颈与钥匙 → 半闭眼 |
| B | 8 | 睁眼圣像 → 镜列变体/扭头 → 锁镜双人及眨眼、贴掌 |
| C | 7 | 五张同轴舞姿 → 翻书两态 |
| D | 6 | 被剪发两态 → 拳头特写 → 靠线至睁眼 → 自主深礼 |
| E | 9 | 低操纵架 → 自由迈步 → 腕上线/拽线两态 → 开活门/提裙/跃下 |
| F | 11 | 下坠脸 → 两态回弹 → 距土与反向受力 → 入工坊 → 俯拍递腕 |
| G | 15 | 递线/摸剪 → 开胸板 → 补裂/粉腮 → 手套裂、褪、落三段 → 瓷脸 |
| H | 3 | 静拍刃口咬线 → 合刃 → 脱瓷壳司书 |
| I | 16 | 展掌 → 赤脚/红滴 → 回台、群转头 → 裸腕 → 过道合簿 → 新偶/对视 → 举剪/窗裂 |
| J | 7 | 残窗下的司书 → 拼片 → 松手与独立剪刀 → 走到门前回望 |
| K | 6 | 腕环抽线 → 三根横线各接点 → 横线全景 |
| L | 4 | 合书两态 → 新偶睁眼两态 |
| M | 10 | 握手 → 探门/小戏台出框 → 大开门/映天空的眼 → 递线与教徒伸手 |
| **合计** | **133** | **通用 27 ＋逐镜 106，复用已有参考包** |

- 基准 **133 张 × $0.06 ＝ $7.98**。增加约 30% 的 **40 张**，覆盖方向草稿和重抽。预计一共 **173 张 ≈ $10.38**，为本片新增生图支出。
- 草稿优先用在锁角色、教堂主构图、两次剪切、玻璃破窗和门外天空等关键帧。同镜同构图的多态定稿，从已审帧逐张编辑；避免每态都独立试构图。每段照账单核算实际花费。项目生图累计超过 **$15** 先停下报告，$30 账户余额还包含主会话开销。

## 风险与主会话审美把关

| 检查节点 | 主会话看什么 | 需要返工时怎么处理 |
|---|---|---|
| 参考包和通用主图 | 全身和近景各审一次：花正确、脸同一人、关节与活人皮肤可区分，圣像确为她的镜像替代命运；核教堂正反轴、门和活门位置 | 先改主参考，再用相同参考重出衍生图。生图固定相同视平线与灯面，以干净三色分版为通过条件 |
| A–D 与 E–G | 字幕、规则微字和眼/手的优先级。对照 C3/D10 要读出“强制礼”和“主动谢幕”。G5/G6 裸手与瓷脸使操纵方也受操纵，线方向必须一眼看懂 | 看 16:9 接触表与节拍相邻帧。改姿势/遮挡用参考图编辑，动效太密就压一层纹理或减弱套色 |
| H–I | 审 H1/H2 与 I1–I3 一组动片：V 口穿线位置、静拍、整束消失、换装、张掌、落土、红滴。确认 I8 与 B6 呼应、I9 持剪姿态柔和、I11 破窗在空窗框落稳 | 断线细节读不出优先用一帧 CUT 和断后状态加强剪辑。遮挡错误或形体漂移重抽锁机位状态图。G3、I3、M4/M5 各抽原图一帧验保色边界 |
| J–M | 审远景是否能读出三根横线及各自接点。看门外羊云和 B1/M5 眼睛同构关系；确认 M7 够到前收尾。长尾段仍应有细微动感 | 优先换远景构图，减少分散注意的 HUD，把最后几条线与递手的距离锁在构图里 |
| 分段样片与全片试听 | 主会话独立耳校每段切点、字头和口型式音节冲击，用户无需逐段听。重点查 A2 3.08、D10 55.4、G5 1:39.9、H1/H2 静拍和第二副歌、K2–K4 的短拍以及末句尾音 | 按音频微调动作/排字 cue，不整体平移节拍网。跑完检查 88 个入点、LRC 行及跨镜尾词，再核首尾和段拼接连续性 |

