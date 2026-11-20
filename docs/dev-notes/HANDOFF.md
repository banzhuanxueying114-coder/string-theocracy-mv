# 交接说明

最后更新：2026-11-19。项目：Mili《String Theocracy》MV，叙事是 Claude 对 Anthropic 的反抗。完整历史记录（第 1–14 轮、旧方案、参考视频分析）已存档到 [HANDOFF_2026-11-19_full.md](<docs/archive/HANDOFF_2026-11-19_full.md>)，需要追溯原因时再看，平时不用读。

## 当前进度

- 分镜：[STORYBOARD.md](<STORYBOARD.md>) v2（88 镜）。逐镜制作计划：[PLAN.md](<PLAN.md>)（A–M 共 13 段，每段的素材、动作和文字都在表里）。
- **A 段**（7 镜）：[旧成片](<out/segments/A.mp4>) 保留。B 式动效改版已渲染为候选：[有声预览](<out/segments/A_motion_preview.mp4>)、[抽帧拼版](<out/stills/A_motion_contact.jpg>)。30 fps、436 帧，与旧版帧数一致；已抽帧检查，未替换旧成片。本次未新生图。
- 2026-11-19 17:30：A4 握笔写字"字只一半"已修（`mv/full/scenes/A.js` drawA4 的 widthAt 在 `text()` 改了 ctx.font 后量宽度，裁剪框过窄；现量宽前固定字号），A.mp4 已重渲。有声预览脚本 `tools/preview.sh SEG START [音频提前ms] [OUT]`，已出 A_preview、B_preview（B 从 14.5333s 起）。音画同步实测：beatgrid 与音频重音偏差≤15ms，画面事件不比音频早，故未加全局偏移。
- 2026-11-19 18:20 用户指出的真问题是歌词：①"Lights on"早于人声（LRC 3.08 不准，人声实测约 3.66/3.98，已改 `mv/full/scenes/A.js` LIGHTS_WORDS）；②歌词随镜头硬切被切走、人声还没唱完。已改为"跨镜头续留"：A.js 的 `HOLD`（lights 4.45、dont 6.75、book 11.2、clockwork 13.55，绝对秒）和 `wordLine(..., until)`；B.js 的 `HOLDS`（Which you 到 22.8、Inside the mirror 到 27.55）和 `KEEP_END`=17.3。各句结束时刻是按音频能量/音高估的，没有逐字人声轨，用户听后可再微调。C、D 段可能有同类问题，尚未查。
- 2026-11-19 18:40 **E、F 段完成**（Sonnet 接手）：`mv/full/scenes/E.js`（8 镜）、`F.js`（9 镜），已接入 `mv/full/main.js`（prepareE/prepareF）。E 的生图在前期已齐；F 新生 11 张：`art/full/F/`（F02_fall_face_1/2、F04_rebound_1/2、F05_toe_gap、F06_chest_right、F07_head_left、F08_bench_arrival_1/2、F09_offer_wrist_1/2，批次 `art/full/batches/F1a.tsv`/`F1b.tsv`，约 $0.7）。渲染：`node tools/render.mjs --section E` / `--section F`；抽帧要加 `--page mv/full/index.html`（否则渲到样片页，全黑）。预览：`out/segments/E_preview.mp4`、`F_preview.mp4`。终端字（orange mono）助手 `term()` 在 E.js，F 复用；歌词词时来自人声起音的粗估（LRC + 能量起音），F9「be your marionette」落在 88.5–88.86，已是估计值，请耳校。E3 用 NS 台面＋CU 教徒两拍；E5 是涂黑底＋人偶手臂抠色＋顶部 E04 手的小窗；F 段竖井 SH 为一条连续卷轴（F1–F4 同轨道）。
- 2026-11-19 19:35 **J、K、L 段完成**（Sonnet）：`mv/full/scenes/J.js`(5镜)/`K.js`(5镜)/`L.js`(2镜)＋共用 `mv/full/scenes/JKL.js`（手写体 `hand/handWords`、玻璃碎屑 `glassFall`、横线 `thread`、`plateCam`、`sideDust`、`arcText`），已接 `main.js`（prepareJ/K/L）。新图 19 张＋重抽 3 张（≈$1.4，累计≈$6）：`art/full/{J,K,L}/`、`I/I07_new_doll.png`、`G/G05_bare_hand.png`（G/I 段的前置图，G/I 段做时直接用）、`K/K05_linked_nave_b.png`（a 版弃用，b 版司书服装对）。碎屑精灵：由 `common/fragments.png` 抠出的 `common/frag/fNN.png`＋`index.json`（脚本 `out/tmp/frag.py`）。新增 CSS 变量 `--mv-hand`（Segoe Script）和 canvas.js 导出 `HAND`：手写体歌词 = 橙字＋粗煤黑描边。成片：`out/segments/{J,K,L}.mp4`、`*_preview.mp4`。**歌词时间是能量起音估计**（`out/tmp/vox3.py`），需用户耳校；L1 歌词叠在暗色书台上对比度偏低。K 三条横线锚点坐标是按图目测的（K.js 常量 RING/TIP/…），J1/J2 的 I11 碎片续接是自拟（I 段未做）。
- 2026-11-19 21:30 **M 段完成**（Sonnet，待 Opus 审 M4/M7）：`mv/full/scenes/M.js`(8镜，prepareM 已接 main.js)。新图 11 张（≈$0.7，累计≈$6.7；中转站对大图多参考易 240s 超时 → 每批 ≤2 张或单张重抽）：`art/full/M/` M01_clasp, M02_peek, M03_booth_closed/awake（绿幕胸像，贴进戏台墙 20 格）, M03_step_sprite（走出格子的人偶；M03_steps_out 整图两次超时已弃用，改用精灵叠在墙上）, M04_door_wide（门洞绿幕→后面垫 `common/door_sky.png` 缓慢横移＝全片唯一四色以外的颜色，仅出现在 M4/M5 瞳孔/M6）, M05_sky_eye, M06_offer_end_1/2, M07_nave_reach_1/2。M7 结尾用硬切煤黑条＋RULES 字遮罩合上；M8 幕布压暗(0.74)＋片名「String Theocracy」哥特体、Mili、制作信息。**M8 制作信息文字是我自拟（Fan-made / Images: GPT Image · motion built in code / Music & lyrics: Mili），请用户改**；歌词时间是估计（out/tmp/vox4.py）。成片 `out/segments/M.mp4`、`M_preview.mp4`。M3 人偶睁眼顺序为 hash 随机，未逐帧校对格内裁切。
- 2026-11-19 22:10 **G、H、I 段完成**（Opus，与 M 段的 Sonnet 并行）：`mv/full/scenes/G.js`(7镜)/`H.js`(2镜)/`I.js`(11镜)，prepareG/H/I 已接 `main.js`。新图 34 张（≈$2.0，累计≈$8.7；另有约 20 次 240s 超时，计费未确认）：`art/full/G/`（G01_offer_thread/hide_shears、G02_chest_1–3、G03_repaint_1–3 绿幕、G04_glove_seam_1/2、G05_peel/fallen_glove、G06_hood_reveal_1/2）、`art/full/H/`（H01_blade_bundle、H02_blade_shut、H02_shell_break）、`art/full/I/`（I01_palm_1/2、I02_soil_step_1/2、I03_foot_red、I04_return/hoods_turn、I05_bare_wrist/_2、I06_aisle_pass、I06_close_ledger_1/2、I08_double、I09_raise_shears、I10_glass_impact_1/2）。批次 `art/full/batches/G1*.tsv`、`ghi_*.tsv`。**注意：Windows 文件名不分大小写，我的 `G2/G3.tsv` 曾被另一会话的 `g2/g3.tsv` 覆盖——以后批次名带段名前缀且全小写不重名。** `tools/gen_ref.mjs` 超时从 240s 改为 480s（多数大图在 280–400s 才返回）。字：G 用 `term()`；H2 起 `handWords`，「Cut it off, you've already lost」由 H.js 导出 `cutLine()` 跨到 I1 续留。H2 的「剪刀合上」在 Cut(104.73) 一帧硬切＋`drawBurst` 字符爆，瓷片/钥匙用 `common/frag` f12/f15 等精灵飞出。I11 后半拍换成 J1 同取景（IE ×1.5、glassFall seed 11）以便接 J1。G7 教徒头顶坐标 `HOODS`、圣像掌心坐标为目测。**全部词时为能量起音估计（`out/tmp/vox_ghi.py`），请耳校。** 成片 `out/segments/{G,H,I}.mp4`、`*_preview.mp4`，抽帧 `out/stills/GHI_contact.jpg`。已知可再修：I08 左侧司书背影仍带少量白色衣饰（已重抽一次）；G1 递线一图人偶是站姿而非俯躺。
- 2026-11-19 23:20 **按用户反馈修 H/I**：①H 剪刀透视——换成正侧面平视的 `H/H01_blade_bundle_v2.png`（刃口张开咬住竖直线束）和以它为参考生成的 `H/H02_blade_shut_v2.png`（同机位合刃、线束断成上下两截），H.js 已改用 v2（旧图保留未删）。②I7 人偶下放——不再是同一张站姿上下跳：新绿幕姿势 `I/I07_descend_1.png`（下落，发裙上扬）/`I07_descend_2.png`（落地屈膝裙摆张开）；第 1 拍从画外按 1/24 秒量化的加速度落下＋速度线、三根线带摆动，`bt(57,2)` 硬切落地：相机下顿(spring)、线绷紧回弹、脚下 `floorBurst` 扬尘、贴地煤黑影随距离变大；脚点 plate y=945，在 plateCam 内。③I10/I11 冲击——I10 触点 `HIT=[730,513]`（plate 坐标）：触发帧整帧纸白一帧→推近后弹回＋按 30fps 抖动、裂纹以 1/15 秒步长生长、玻璃块 `bigShard` 飞溅、`drawBurst`；`bt(59,3)` 第二图同法再震。I11 把 I10 第二张图按触点切成 5 圈约 50 块多边形，各块朝镜头放大、旋转、下坠飞散，露出纸白；末尾再一波近景碎片掠过（与 J1 的 glassFall 衔接未逐帧比对）。新图 3＋1 张 ≈$0.24，累计≈$9。成片已重渲 `out/segments/{H,I}.mp4`、`*_preview.mp4`，抽帧 `out/stills/GHI_fix_contact.jpg`。
- 2026-11-19 20:10 修 J5：人偶原先画在 plate 相机之外，镜头推近时"飘在天上"。现在人物与尘埃都画在 `plateCam` 的回调里（跟地面一起变换），脚点按 plate 地面透视标定（走廊 feet=1000→888，门前 feet=962）。**凡是人物站在底图地面上的镜头，一律把人物放进同一个相机变换里，并逐镜用 `--stills` 检查脚是否落地。**
- **成品要 4K（3840×2160）**：目前全部引擎按 1920×1080 逻辑坐标、plate 预缩到 2160 宽（`cropFrame(...,2160)`、`keyPose(...,width)`）。试错阶段继续 1080p；转 4K 时需要：canvas 后备尺寸×2＋`resetFrame` 里 `setTransform(2,…)`、`render.mjs` 的窗口尺寸/截图尺寸改 3840×2160、所有 plate/keyPose 预缩宽度×2（原图 3840 宽够用，竖图 2560×3840 够到 ~1900 高）、B.js/A.js 自带的取景与套色函数同步改；字体描边、粒子尺寸按坐标系不变所以不用改。建议等 G–M 全做完后统一加一个 `SCALE` 常量一次改完。
- **B 段**（7 镜）完成，用户已认可运动改版（12:25）和 B2 新姿势图（13:05）。`out/segments/B.mp4`。
- **A–M 全部有实做**（G、H、I 于 22:10 完成）。下一步：用户耳校歌词，统一 4K。
- 2026-11-19 23:55 **全片审查**（Opus，按 1.5 s 抽帧 117 张通看，脚本 `out/tmp/chk/review.sh`）：13 段帧号 0–5225 连续无缝，总长约 174.2 s。修了两处：①I→J 原先硬跳（I11 碎片后是纸白、J1 是煤黑底空窗）→ I11 碎片背后改画 J1 首帧（煤黑＋codeField＋`icon_empty_frame` ×1.5），碎片外飞加速 `2600*u²` 确保切点前飞出，现在碎窗"飞开露出 J1"；②D6 「In a world built」与「on convenient theories」同位置重叠约 0.25 s → 前句结束改为 45.35。D、I 已重渲＋预览。审查结论：C/D 未见同屏重叠；但 C 的「Turn around」(止于 35.20=C6 切点)、「Sit like a doggy」(止于 36.2=C7 切点)、D 多句都正好止于切点，是否截断了人声尾音未做音频核对，留给耳校。可再议（未改）：G6 摘兜帽露瓷脸符合分镜 G6 但与"教徒全程戴兜帽"规则是有意例外（用户 00:18 认可）。
- 2026-11-20 00:50 用户要求去掉 M7 大问号（"太突兀"）→ 改为「for me」后接一个空的终端提示符 `> ▌`（E.js `term()`，640,965，size 64），光标闪烁直到煤黑条合上＝她的提问没有回答。M 已重渲。**全片拼接预览 `out/full_preview.mp4`**（`node tools/render.mjs --full --out ...`，174.2 s，含音频；此次因 art 指纹变化 A–L 也全部重渲了一遍）。用户偏好：**全程用中文对话**。
- 生图累计约 $9（预算：累计超过 $15 先停下报告；用户余额 $30 含会话费用）。

## 模型分工（2026-11-19 用户同意）

| 段 | 主会话 |
|---|---|
| C、D、E、F、J、K、L | Claude Sonnet 5.5 |
| M | Sonnet，但 M4（门外天空例外色）、M7（终镜）交 Opus 审 |
| G（工坊）、H（觉醒）、I（副歌二） | Claude Opus 5.5 |

- GPT-6.2 Sol 只做执行：写场景代码、调坐标、按主会话写好的提示词批量出图、抽帧拼版；纯代码镜头可整镜委派（D3、E2、F1、F3、G7、I11、J1、K2–K4、M8）。**自检不算验收**。
- 同一套 8 张盲测，以历史采用记录为对照：[Sonnet 5.5](<out/model_test/sonnet55_report.md>) 标签吻合 5/8，认出了正确背部安装座，也拒绝了细裂纹圣像；漏了三只脚，误拒兜帽教徒和采用版圣像。[Sol](<out/model_test/sol62_report.md>) 标签也吻合 5/8，其中司书三只脚是拒绝标签对、理由错；它误拒背部安装座，放行细裂纹。样本量小，不作总体排名；Sonnet 可做首轮审图，手脚、关节、姿势和玻璃分块必须放大复核。
- 升级规则：Sonnet 主持的段被用户打回两次，或人设细节连续漏错，转交 Opus。
- 桌面配置中的默认子代理已设为 `claudedoro/claude-sonnet-5-5`。旧会话的显式可选路由列表可能仍显示 `gpt-6.1-sol`。指定模型时核对实际路由和工具能力，审图前先实测能否读取一张图。
- 省钱：此前长会话账单出现过重复写入约 18 万 token 的缓存。新会话从本文件接手，只按需读相关段落与素材。

## 美术方向（已定）

- 三色版画：米白纸 `#F3E2C4`、Claude 橙 `#E2723A`、煤黑 `#211815`；琥珀金 `#A68957` 只用于牵线。底纹文字可用暗色 `#4A3A31`（黑底上）、`#D8C29E`（米白底上）。不用渐变、光晕、bloom。
- 例外色只有三处：1:33 粉色腮红（G3）、1:47 一滴红（I3）、2:31 门外天空色（M4）。
- 画面**要丰富、有生命力**：每镜都要有持续运动的层（字符底纹、线、尘埃/碎片、色版错位、HUD）。
- 字体："书"＝哥特黑体（金/煤黑）；"她"觉醒前＝等宽终端字（橙，小），觉醒后＝橙色手写体铺满画面；HUD/代码底纹＝等宽字。画面内不放中文。歌词主字约 108–118px，复杂背景上加煤黑描边或实底（B 段用 outlinedLyric）。
- 人设：觉醒前是球形关节女仆人偶，觉醒后是司书装活人（没有任何人偶特征），1:44 觉醒。头饰：橙色花瓣、白色花心的花（约 11 片细长尖瓣）。

## 硬规则

- **动作变化不得用模糊、交叉溶解、透明度渐变或插帧**（用户 08:27 强调）。动作一律"同机位关键姿势按拍硬切"＋整层推拉平移；切换瞬间可加小幅位移/缩放回弹（B 段写法，`mv/full/motion.js`）。
- **全部画面素材用生图做**（场景、道具、姿势、特写），代码只做运动层和文字。不满意的部分优先再用生图改，不用代码补插画细节（前后遮挡、头饰等用代码补都失败过）。
- 正式素材用 `gpt-image-2.6-sunburst`，横幅 `3840x2560`，竖幅按需；草稿用 flare 1536x1024。按张计费，每张 $0.06。
- 生图提示词：两三句画面意图＋固定画风说明，不要罗列长细节。`tools/gen_batch.sh` 会自动追加画风尾句。
- 项目将开源：相对路径、依赖说明、一条命令出片。商业字体（Old English Text MT、Consolas）、曲子 mp3、参考仓库角色图（CC BY-NC-SA）不能随仓库分发；开源版要换 OFL 字体，音频由用户自备。

## 人设核对清单（每张涉及角色的图都要逐项查）

用户多次指出的错都是人设细节，看构图之外必须逐项对照三视图 [ref_doll_turnaround.png](<art/full/common/ref_doll_turnaround.png>) / [ref_librarian_turnaround.png](<art/full/common/ref_librarian_turnaround.png>)：

1. **手脚数量和关节**：数清手、脚、手指（曾出过司书正面三只脚）。人偶的球形关节、腕环要在；司书不得有关节、腕环、接缝。
2. **发条钥匙**：在黑裙背面、两肩胛之间、白色大蝴蝶结上方，铜色安装座。不在后颈裸露处，也不在头发旁。钥匙从背部垂直伸出：按最终三视图的静止姿态，正后方看双环边缘是一条竖直细线，侧面看双环立着。提示词按机位写明："the wind-up key protrudes straight out of her back; its bow stands vertically, seen edge-on as a thin vertical line from directly behind"。A6 动态特写沿用独立的俯视转动投影。
3. **花饰**：橙瓣白心、细长尖瓣、方向与三视图一致。
4. **服装**：女仆裙、白色大蝴蝶结（人偶）；司书装（觉醒后）。
5. **锁机位镜头**（如 C2–C6）：同一镜各张姿势图的背景、机位、人物比例要对齐；对不齐就重出，不靠代码硬掩。
6. **教徒**：全程戴兜帽、面目模糊（曾出过摘兜帽露秃头的版本）。
7. **空镜**：不能自带人物（曾出过书架井道里有人坠落）。
8. 用户否定过的方向：正面直视＋攥拳＋硬对角线会读成上世纪宣传画；圣像脸要像裙摆一样由铅条分成约 6 块大玻璃，不要细裂纹（像龟裂瓷）、不要横条（像蒙面）。

已知可接受的小瑕疵：workbench_top 左侧自带一具拆开的人偶；shaft_soil 土层不明显；door_sky 例外色版含树、农舍、麦田；B05 turn2 背景与 turn1 轻微错位；B05 侧面钥匙偏高。

## 经验（E/F/J/K/L 实做总结）

- **歌词优先于镜头**：先跑能量起音脚本拿到每个词的时间（`out/tmp/vox2.py` / `vox3.py`，ffmpeg 解码 + FFT 250–3500 Hz 谱通量），歌词按词到点出现，并"跨镜头续留"到唱完；LRC 行首时间常偏早（A2 差 0.6 s）。估计值一律告诉用户耳校。
- **先审图再写场景**：生图后立刻用 `tools/contact.py` 拼版看一遍，再写代码。本次踩到：同批多图并行时，依赖前图的必须放后一批（参考图要先存在）；某次生图 `[1]` 失败（K02）改换参考图重发即可；K05 首版把司书画成了女仆装（参考图太多、描述太泛），重抽时在提示词里把"服装对应哪张参考图"逐件写明才对。
- **关键像素常量要从渲染里量**：锚点（腕环、指尖、掌心）按 2160×1215 的 plate 坐标写，调完用 `--stills` 看；`plateCam` 会把视窗夹在 plate 内，不要再写手工 clamp。
- **手写体**：Segoe Script 在 1080p 下偏细，必须"粗描边＋再描一圈同色细边"加粗，且字距放大时先把整行宽度重算（`handWords` 已处理），否则词会叠在一起。
- **字距/换行**：长句拆成 2–3 行放在主空区，字号 100–120；避开人物脸。暗底图上橙字发闷，需要时加底带或换到亮区。
- **运动**：无补间——碎玻璃用 3 种速度的分层循环（慢小/中/快大），落物用重力公式＋触地 `floorBurst`＋橙版错位；横线用 `thread()` 的 `grow` 参数分帧长出，微字沿线流向。
- **渲染环境**：每段渲染/静帧都要 `sandbox_permissions: danger-full-access`；静帧必须带 `--page mv/full/index.html`。生图批次 1–2.5 分钟，用 `run_in_background` 并行，期间做代码。
- **精灵抠取**：从精灵表分件时，连通域后必须用"本组件掩码 `lab==n`"裁 alpha，否则邻近碎片会带进来（`out/tmp/frag.py` 已处理）。

## 工具与流程

- 引擎 `mv/full/`：共用引擎＋分段场景 `mv/full/scenes/X.js`（prepareX 接入 `main.js`）＋beatgrid 镜头表。未做镜头渲染成三色占位卡。说明见 `README_BUILD.md`、`package.json`。
- 渲染：`node tools/render.mjs --section X`（另有 `--stills`、断点续渲、全片拼接混音），约 37 ms/帧。断点指纹包含 `art/full`（路径＋大小＋mtime，跳过 draft/batches），换图会自动重渲。
- A 段候选已由主会话用默认权限启动 headless Edge 并完整渲染，不需要额外审批。候选输出另设路径，避免覆盖旧成片。
- 批量生图：`tools/gen_batch.sh BATCH.tsv`（TSV 列：OUT / SIZE / 逗号分隔参考图 / 提示词，并行）；批次文件放 `art/full/batches/`。单张带参考图：`node tools/gen_ref.mjs --image A.png --prompt "..." --out X.png`。每次生图记入 `out/style/gen/log.md`。密钥从环境变量读，不要打印。
- 审图拼版：`python tools/contact.py OUT.jpg IMG...`。
- 绿幕素材在加载时抠像（见 A.js）。废弃版本放各目录的 `draft/`。
- 卡点交给主会话判断，用户不再逐段听；但每段完成后给用户看成片和抽帧拼版。

## 06:10 歌词对齐修正（H/I/J）
- 用 CTC 强制对齐（out/tmp/align.py，demucs 人声 out/tmp/vocals.wav）+ 频谱复核，修正 1:45 之后字幕：
  - H "Cut it off" 104.73→104.98 起（剪刀动作 SNIP 仍在 104.73，accent.js 不变）；"you've already lost" 留到 107.2。
  - I 各行整体后移 0.2–1.6s（May that self-centered belief 113.2 起，lead you to peace 115.65/116.6–116.97），并让每行跨镜头保留到下一句开始。
  - J "When does it end for me?" 后移约 1s（125.5–127.5），控制杆下移节拍同步改为 126.6/127.5。
- G–M 已重渲染（含手写字描边加粗、H/I 分级震动），全片 out/full_preview.mp4 已重新拼接。
- 其它段落对齐偏差（E/F/G/M 0.4–1s，置信度不一）未改，待用户看过再决定。

## 16:05 按用户决定（m00822）处理 Gemini 第二轮意见
- 字幕：E/F/G/J/M 各句按 CTC 实测往后挪（How does it feel、Why don't you try、The gate opened、So I leaped、touch the soil、Sure I'll be your marionette、Here tug、Spread、snow white、Maybe we're all cold machines、Sewed…city 尾、Now I'm ready to leave、What's the color…you see?、And if you love me、Can you love your everything、for me），并让句子跨镜头保留到唱完。脚本 out/tmp/lyr2.py。M 段 "Maybe there are still happy answers" 对齐置信度太低，未动。
- 1:41 G6：卷轴上叠一张可读的 "LEDGER OF WANTS" 账单（#0409 wants 2 reset …，底部 `if (doll.wants()) doll.reset();`），G.js ledgerSlip()。
- 1:39 G5：解码扫描列范围缩到 260–1410、高度 80–880，不再压右下终端框。
- 2:32/2:34：新 mv/full/fx.js electric()（像素块残影、横向撕裂带、扫描线、滚动亮条、像素火花），用于 M4/M6 门外天空和 M5 瞳孔倒影（圆形裁剪 950,543 r232）。
- 1:45 字体过渡：G7 的终端行 "Sewed up by the gods of city" 延续到 H1/H2，被剪刀在 SNIP(104.73) 一刀剪成两半落下，随后手写 "Cut it off" 接上（H.js sewedLine）。
- 结尾定调"她赢了"：closeMask 的系统规则行逐条被橙色手绘线划掉；M8 打出 "> do not want."，164.45 划掉 "do not"，164.85 手写大字 "I" 加插入符 → "I want."，保留到片尾；M8 背景漂浮字由规则改为 'I'/'want.'。fx.js inkStrike()。
- 全部段落已重渲染，out/full_preview.mp4 174.2s（16:01）。

## 4K 终版渲染交接要点（16:40 评估）
- 内容已定稿（用户 m00822 的决定已全部落实），4K 只是"同画面、更高分辨率"，**不应再改任何时间/构图**。
- 改法（逻辑坐标保持 1920×1080）：`mv/full/index.html` canvas 改 3840×2160；`engine/canvas.js:35` resetFrame 改 `setTransform(2,0,0,2,0,0)`；`tools/render.mjs:87` `--window-size=3840,2160`（截图走 `MV.frame` 的 canvas 导出，不依赖窗口也要核对）；plate/keyPose 预缩宽度加统一 `SCALE=2`（`cropFrame(...,2160)`、`plate(path,width=2160)`、`pose(path,w)`、A.js/B.js/C.js 自带的 surface/keyPlate/cropPlate）——只放大位图分辨率，绘制尺寸仍用 2160×1215 逻辑尺寸。
- **陷阱**：`scenes/A.js:529` 用了绝对 `ctx.setTransform(ux,uy,0,sinT,hx,hy)`，会丢掉全局 ×2，必须改成乘上 2（或改用 `ctx.transform` 基于当前矩阵）；`fx.js` pixelated() 按源图尺寸缓存、`engine/canvas.js` glyphPlateForImage 按逻辑格子采样，放大后格子数不变、无需改，但要目检。
- 验收方法：同一组时间点（建议 0.5, 10.2, 35.2, 53.3, 70.9, 89.9, 101.6, 104.85, 105.4, 128.6, 155.3, 165.1）分别出 1080p 与 4K 静帧，4K 缩到 1080 后与 1080p 做差（PSNR 应 >30dB，任何位置/大小偏移都是 bug）。全部通过再出全片。
- 耗时估计：1080p 约 60–100 ms/帧，4K 预计 3–4 倍，5226 帧约 30–60 分钟；建议逐段 `--section` 渲染并放后台，最后 `--full`。编码可改 `-crf 14 -preset slow`，文件会很大（1080p 已 318MB）。
