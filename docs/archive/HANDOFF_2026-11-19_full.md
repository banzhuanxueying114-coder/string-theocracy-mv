# 交接说明（参考 MV 与美术方向）

最后更新：2026-11-18。目标为 Mili《String Theocracy》MV，叙事是 Claude 对 Anthropic 的反抗。**美术方向已定：三色版画（米白/橙/煤黑）＋琥珀金线＋字符元素，已进入全片制作。** 本文件内容如有矛盾，以较新的记录（靠上的轮次）为准；"风格帧试稿"及之后各节中关于"风格未定稿""星芒头饰"的表述均已过时。

## 第 14 轮（2026-11-18 深夜）：全片开工，用户决定
- 分镜沿用 [STORYBOARD.md](<STORYBOARD.md>) v2（88 镜），画法改为新画风。三处例外色保留：1:33 粉色腮红、1:47 一滴红、2:31 门外天空色。
- 用户要求画面**不要太空荡，要有生命力**：不再追求"大量留白、每帧只有一个主角"，每镜都要有持续运动的层（字符底纹、线、尘埃/碎片、色版错位、HUD 等）。
- **全部画面素材（场景、道具、各姿势、大特写）都用生图脚本做**，用户经验是比代码画便宜且效果不差；代码只做运动层和文字。连续动作镜头用多张关键姿势生图＋剪辑/节拍硬切，不用插帧和差分抠图。
- 耗时无所谓；卡点交给主会话判断，用户不再逐段听。
- **项目将开源**：代码结构要能在别的机器复现（相对路径、依赖说明、一条命令出片）。注意：Old English Text MT、Consolas 是商业/系统字体，曲子 mp3 不能随仓库分发，参考仓库角色图是 CC BY-NC-SA；开源版本要换成 OFL 字体并让用户自备音频。
- 字体与声部由主会话决定（用户授权）："书"＝哥特黑体字（金/煤黑）；"她"觉醒前＝等宽终端字（橙，小），觉醒后＝橙色手写体铺满画面；HUD/代码底纹＝等宽字。分镜"需要你确认"7 项按分镜原文执行；画面内不放中文，中文另出字幕文件（可选）。
- 全片生图预算：用户账户余额 $30（含主会话费用），用户认为足够完成最难部分。分镜估算生图约 150–200 次 ≈ $9–12；生图累计超过 $15 时先停下报告。
- 工作流：子代理 `planner` 写全片计划 `PLAN.md`（素材清单、逐镜动作方案、生图顺序）；子代理 `engine` 重构代码为 `mv/full/`（共用引擎＋分段场景＋beatgrid 镜头表）、render 分段渲染与拼接、开源复现说明。主会话审阅后再按段生图。
- **已完成（07:40）**：[PLAN.md](<PLAN.md>) 写好：通用素材 27 张（含英文提示词，目录 `art/full/common/`）＋逐镜 106 张，基准 133 张，含重抽约 173 张 ≈ $10.4；出图顺序见 PLAN.md 末节。`mv/full/` 引擎完成：0–174.17 秒全片可渲染（未做镜头为三色占位卡：镜号＋分镜摘要＋歌词），样片 13 镜移到原始时间，与 style_test_v2 渲染像素一致（4 帧，最大差 2/255）。render.mjs 新增 `--section X`、`--stills`、断点续渲（按源码指纹跳过）、全片拼接一次性混音；说明见 `README_BUILD.md`、`package.json`。实测 37 ms/帧，全片约 3–4 分钟。验证产物在 `out/verify-full/`。
- **08:10**：RP/RL flare 草稿（`art/full/common/draft/RP_d1.png`、`RL_d1.png`）用户认可方向。用户（08:07）："正式做mv需要的图直接上4k，我们花了钱自然要最好的效果" → 所有正式素材用 sunburst、`3840x2560`（横）/按需竖幅出图；草稿仍用 flare 1536x1024。定稿 [RP.png](<art/full/common/RP.png>)、[RL.png](<art/full/common/RL.png>)（3840x2560，以草稿＋flower_ornament 为参考；修正：钥匙插在两肩胛之间、膝关节可见；司书裙纹简化为大块花饰）。4K 输出 9900 image tokens/张（1536 为 1584），是否仍按 $0.06/张计费待账单确认。
- 下一步：按 PLAN.md 顺序做 CT/CR → NS/NR/IC/IE → …（4K），再逐段做。
- **08:45 通用素材 27 张全部完成**（4K sunburst，`art/full/common/`，文件名同 PLAN 表；RP/RL 文件名为 `ref_doll_turnaround.png`/`ref_librarian_turnaround.png`）。用户确认按张计费 $0.06（08:21）。用户指出 RL 正面三只脚 → 以原图为参考重出修好（旧图存 `draft/RL_4k_threefeet.png`）；shaft_shelves 首版有人坠落 → 重出空版（旧图 `draft/shaft_shelves_withman.png`）。本轮共 31 张 ≈ **$1.86**。批量工具：`tools/gen_batch.sh BATCH.tsv`（TSV：OUT/SIZE/逗号分隔参考/提示词，并行，自动追加画风尾句＋"画面丰富有生命力"句），批次文件在 `art/full/batches/`；审图拼版 `python tools/contact.py OUT.jpg IMG...`。
- 已知小瑕疵（可接受）：RP 侧面钥匙浮在头发旁；shaft_soil 土层不明显（更像书井底）；workbench_top 左侧自带一具拆开的人偶，中央空；door_sky 例外色版含树、农舍、麦田。
- 用户（08:27）强调：**不得用模糊插帧/交叉溶解做动作变化**（之前用别的工具效果极差）。已核：引擎与 render.mjs 无 blur/xfade/minterpolate/透明度渐变；动作一律"同机位关键姿势按拍硬切"＋整层推拉平移。
- 下一步：A 段逐镜生图（见 PLAN 逐镜表），接入 `mv/full/scenes/A.js`。

## 第 13 轮（2026-11-18 晚，最新）：在 r8_B_flower 上直接改刘海
- 以 r8_B_flower 为底图喂进 run_r9.sh 做局部编辑（只改刘海）。用户偏好：不满意的部分优先再用生图脚本改，不用代码补；HANDOFF 只记重要内容。当前候选：[r10_fix_draft.png](<out/style/gen/r10_fix_draft.png>)（flare，双眼露出、金线穿过刀刃 V 口），用户已认可，定稿为 sunburst 重出的 [r10_B_final.png](<out/style/gen/r10_B_final.png>)（SF2 新素材）。色版已导出（`out/style/gen/r10_B_final_plates/` → `art/motion/B_*.png`，`tools/style_frames.py` 与 `tools/prep_motion_plates.py` 已指向新图），重渲样片 [style_motion_v4.mp4](<out/style_motion_v4.mp4>)。用户表示样片过后即着手全片。

## 第 12 轮（2026-11-18 晚）：SF2 重绘讨论
- 用户已听完 v3 样片，确认**卡点都对**。
- 用户觉得 SF2 持剪刀的形象缺点什么，主要原因是半掩面的刘海。用 flare 出了两张 1024 草稿：[r9_bite_draft.png](<out/style/gen/r9_bite_draft.png>)（一把攥住线束、剪刀咬线）和 [r9_bite_draft2.png](<out/style/gen/r9_bite_draft2.png>)（刘海改短、露出双眼）。用户否决了这两张：像上世纪的宣传画，过于刚硬，没有现代美感；一把攥住丝线也很出戏。教训：正面直视加攥拳加硬对角线，会读成宣传画。
- 生图脚本 [run_r9.sh](<out/style/gen/run_r9.sh>)，用 `MODEL=` 环境变量切换模型。
- **费用（以用户账单截图为准）**：生图按张计费，flare 每张固定 $0.06，参考图大小不影响价格。贵的是主会话：claude-opus-5-5 每次请求都要重新写入约 175–193K token 的缓存，每次约 $0.34–0.38；用户说的"四次写入 $1.1"就是这一项。之前我把这笔钱误认成生图费用、把原因猜成参考图太大，两者都错了。缩小参考图（`out/style/gen/r9_refs/`）和 [gen_ref.mjs](<tools/gen_ref.mjs>) 打印 `usage` 的改动无害，可以保留，但不能省钱。省钱的办法：主会话少发请求、上下文保持小（新开会话从本文件接手）；具体活交给子代理；不要让主会话空等子代理太久。
- 第四张草稿 [r9_through_draft.png](<out/style/gen/r9_through_draft.png>)（flare，方案 3「隔着线看她」）：前景是宽窄不一的金线，把画面切成竖条，她隔着线看镜头；剪刀只在左下角露出一点。用量为输入 1115、输出 1056 token。问题：刘海又遮住了一只眼；线太宽太黄，像笼子的栏杆；剪刀几乎看不见；纸面带纹理。（flare，用了缩小后的参考图）：侧脸、垂眼看剪刀，手势放松，画面安静，左侧留白。本次 usage 为输入 1082 token（其中图像 883），输出 1056 token。

## 第 11 轮（2026-11-18 晚）：v3 修两处
- 用户认可 v2 方向，提了两点并已修好，结果是 [style_motion_v3.mp4](<out/style_motion_v3.mp4>)，代码仍在 `mv/style_test_v2.js`：
  1. 开场人偶去掉了每拍一次的上下提动，改成以操纵架中心 (1385,108) 为支点、幅度 ±1.1° 的整体钟摆，并且比操纵架慢半拍。
  2. 指尖特写此前只画了当前那一根线。现在由 `drawHandStrings` 统一画出五根线当时的状态：断线在 45% 处断开，上半截仍挂在指尖并卷成钩。修复时还发现原先的断线时间按镜头顺序套到了错误的线上，已用 `CUT_BY_STRING` 改正。

## 第 10 轮（2026-11-18 晚）：动画测试 v2
- 用户对 v1 的反馈：剪线、断头不需要拍得能看懂，用剪辑手法转移注意力即可；Claude 是 AI，应多用字符元素装饰（仍参考两支视频），v1 太空；镜头要更多。
- 产出 [style_motion_v2.mp4](<out/style_motion_v2.mp4>)，时间段同 v1，镜头从 4 个增至 13 个（相邻帧见 `out/style_motion/v2_strip_{a,b,c}.jpg`）。页面是 [style_test_v2.js](<mv/style_test_v2.js>)，v1 保持不动。字符元素包括：HUD（镜头号、小节/拍计数、`doll.state`）、暗色规则/代码文字底纹、特写里沿线流动的规则文字、字符画人偶（逐行解码）、歌词墙、哥特体逐字砸入、冲击点的字符爆散。剪线由一帧 “CUT” 大字冲击镜头和爆散遮掩。
- 色彩上新增两种只用于底纹文字的暗色：`#4A3A31`（煤黑底上）和 `#D8C29E`（米白底上）。
- 已知问题：特写是把 0.55 倍的色版放大 2.4–4 倍，边缘发软，正式版要用原图尺寸的色版；仍未听音频核对卡点。

## 第 9 轮（2026-11-18 晚）：短音乐动画测试 v1
- 做了待办第 4 项：[style_motion_v1.mp4](<out/style_motion_v1.mp4>)，原曲 95.205–109.688 秒（第 47–53 小节），共 14.47 秒，生图花费为零。页面是 [style_test.js](<mv/style_test.js>) 和 `mv/style_test.html`。色版由 [prep_motion_plates.py](<tools/prep_motion_plates.py>) 导出到 `art/motion/`。渲染命令：`node tools/render.mjs --page mv/style_test.html --from 95.205 --to 109.688 --fps 30 --fade 0.5 --out out/style_motion_v1.mp4`。
- 分镜：SF1 人偶随操纵架摆动，歌词用哥特体换进标题框 → SF3 手每拍拨一根线 → SF2 打字 `> cut --all`，104.517 秒金线在 (559,370) 断开 → SF3 线按拍逐根断开，计数到 5/5。换镜都是小节线上硬切；橙版错位踢动。
- **渲染必须提权**：沙箱里 headless Edge 会因 access denied 退出（子代理同样跑不了），调用 render.mjs 时要带 `sandbox_permissions: danger-full-access`。
- 已修的坑：在主画布上用 `destination-in` 着色会把整帧擦黑，现已改为离屏缓存着色。
- 已知问题：断点被刀身遮住，剪断这个动作读不出来；第 4 镜的断头钩子小而碎，不如 sf3 原版好看；没有听音频核对卡点。静帧见 [stills_contact.jpg](<out/style_motion/stills_contact.jpg>)，相邻帧见 `out/style_motion/snap_strip_{a,b,c}.jpg`。

## 第 8 轮（2026-11-18 晚，主会话独做）
- 用户改设定：头饰改为**橙色花瓣、白色花心的花**，外形接近星芒（约 11 片细长尖瓣、长短不一）。下文所有"星芒头饰"均已作废。造型参考 [flower_ornament.png](<art/ref/flower_ornament.png>)，设计图 [r8_flower_sheet.png](<out/style/gen/r8_flower_sheet.png>)。
- SF1 改用 [ink_A_maid_flower.png](<art/ink/ink_A_maid_flower.png>)（含 `_c/_o/_k`），由 [build_r8_maid.py](<out/style/gen/build_r8_maid.py>) 只移植 x526–669、y56–289 的生成结果，其余像素与 `ink_A_maid_full` 一致。
- SF2 整张换成 [r8_B_flower.png](<out/style/gen/r8_B_flower.png>)：大号裁缝剪、刀刃张开，金线竖直穿过 V 口，在刀身处被遮住。色版在 `out/style/gen/r8_B_flower_plates/`。
- 本轮生图 6 张约 $0.36，累计约 **$0.72**（预算 $1）。round 7 版本备份在 [v_r7](<out/style/v_r7/>)。调用脚本 [run_r8.sh](<out/style/gen/run_r8.sh>)（`OUT SIZE PROMPTFILE IMAGE...`，自动记日志）。
- 仍待用户：确认花饰造型、SF1/SF2 新版，以及三色版画方向能否定稿。

## 风格帧试稿（2026-11-18 下午）

### 分工与用户偏好
- 用户要求：主会话（Claude Opus）**只负责审美把关**，具体活交给子代理默认模型（当前路由 `gpt-6.1-sol`，价格约为 Opus 的 1/8）。用户评价"gpt 的审美确实一般"，所以构图、配色和取舍要由主会话写成明确指令，子代理交回后主会话必须亲自看图验收。
- 用户倾向于"画面内容靠生图，代码只负责将来要动的层"（牵线、色版、几何、文字）。用代码硬补插画细节（前后遮挡、头饰、去噪）已多次失败，见下方教训。
- 生图：试稿预算 $1，已花约 **$0.36**（共 6 张，每张约 $0.06）。参考图按 token 计费，几乎不花钱，可以多放。flare 和 sunburst 价格相同；sunburst 能力更强。实测耗时：sunburst 25.6、35.0、33.8 秒，带参考图的编辑 35.4 和 42.9 秒；flare 29.4 秒。样本太少，看不出速度差。`~/.dsh/AGENTS.md` 的"草稿 flare、定稿 sunburst"用户暂不让改。
- 两个生图模型都支持输入图片。[gen_ref.mjs](<tools/gen_ref.mjs>) 以 multipart 调用 `{base}/images/edits`，已在真实接口上成功。用法：`node tools/gen_ref.mjs --image A.png [--image B.png ...] --prompt "..." --out X.png [--api edits|responses]`。密钥用 [run_round7_env.sh](<out/style/gen/run_round7_env.sh>) 从用户环境变量载入，不要打印。每次生图都记入 [生图日志](<out/style/gen/log.md>)。

### 美术方向（试稿中，用户尚未定稿）
- 三色版画加程序细线几何。米白纸 `#F3E2C4`、Claude 橙 `#E2723A`、煤黑 `#211815`，唯一强调色是琥珀金 `#A68957`，只用于牵线。含义：橙代表 Claude 自我，黑代表教会和控制，金代表操控之线。不用渐变、光晕和 bloom。
- 构图大量留白，人物偏离中心，每帧只有一个主角。标题字体 Old English Text MT，系统文字字体 Consolas。
- 主角头饰的真实参考是 **Claude 官方图标**（橙色放射星芒）加黑蝴蝶结和白飘带，不能用白菊或白花。程序画的参考图在 [claude_star.png](<art/ref/claude_star.png>)。

### 三张风格帧现状（[接触表](<out/style/contact.jpg>)，脚本 [style_frames.py](<tools/style_frames.py>)）
- **[SF1 人偶](<out/style/sf1.png>)**：构图已通过。尖拱里面是米白壁龛，外面是煤黑底；金线吊着两只袖口和头顶；左侧是哥特体标题框，框线不碰拱。素材已换成 [ink_A_maid_star.png](<art/ink/ink_A_maid_star.png>)（含 `_c/_o/_k` 色版），做法是用参考图编辑出星芒头饰，再只替换 x530–633、y69–177 的区域，其余像素与原图一致。**头饰仍不满意**：现在是带黑描边的尖角多边形，像贴纸，不像图标，也和插画笔触不统一。
- **[SF2 剪线](<out/style/sf2.png>)**：用司书设定图、星芒图和 [ink_B_librarian_cut.png](<art/ink/ink_B_librarian_cut.png>) 三张参考图生成，原图 [r7_B_1_edits.png](<out/style/gen/r7_B_1_edits.png>)，色版在 `out/style/gen/r7_B_1_plates/`。人物、发型、服装和设定基本对上。问题：剪刀变成了很小的花式剪刀；金线和刀刃的穿插关系不明显；星芒头饰同样是尖角贴纸感；转三色后边缘仍有细碎噪点。左上角是 `> cut --all`（Consolas 26px）。
- **[SF3 断线](<out/style/sf3.png>)**：已通过，没动过。读作操控者之手：五根金线从指尖垂到画面外，一根断开，两头卷起。左下角有 `string 3 / 5 : severed`。
- 备份：[v1 初版](<out/style/v1/>)，以及程序画星芒的版本 [v_star_code](<out/style/v_star_code/>)。[star_flower](<out/style/star_flower/>) 是子代理**自作主张**做的"星芒里套一朵白色五瓣花"变体，没花钱也没经过审核，我认为偏离设定，不要直接采用。

### 待办与待用户决定
1. 用户尚未确认"三色版画加细线几何"这个方向能否定稿。
2. 星芒头饰的造型还没解决。建议先只生成一张头饰设计图：喂入 Claude 图标和角色设定图，要求和插画同一笔触，确认造型后再用编辑接口统一替换到各素材上。不要再用代码贴图。
3. SF2 可以考虑重生：剪刀要大、刀刃张开，金线明确从两片刀刃之间穿过。
4. 风格定下来后，再用同一套素材做一段短的音乐动画测试，验证节奏和图层运动。

### 本轮教训
- 前后遮挡这类关系（线在两片刀刃之间、头饰压在发上）很难靠代码在成图上补出来。代码画的星芒在插画里像贴纸。
- 在成图上做局部故障带，看起来像图坏了，故障效果要克制。对生成图做连通域清理和开运算，会把脸、手、花的线条一起吃掉，已撤回，宁可留噪点。
- 子代理出过三个毛病：把已通过的版本回退成旧版；自作主张做没要求的变体；交付时自检不可靠（例如说金线可见，实际看不见）。主会话每轮都要亲自看全图和局部。
- 默认路由曾连续失败三次，启动后不到一分钟退出，也没有报错；用户修好路由后恢复正常。子代理长任务中途也偶有失败，用 send_message 让它从现有文件续做即可。

---

本次经验总结只覆盖用户提供两支参考视频之后的讨论及源码分析。先阅读下述参考结论；文末原样片记录属于旧方案技术背景，不代表新美术方向已经确定。

## 参考视频与检查范围

| 参考 | 已检查的内容 | 可确认的视觉特点 |
| --- | --- | --- |
| [《world.execute(me);》BV186pc65E68](https://www.bilibili.com/video/BV186pc65E68/) | 公开预览、全片取样、局部相邻帧，以及用户提供的[开源工程](https://github.com/Nyankomintsu/world-execute-me-lyric-mv) | 三色人物版画、醒目文字、对话界面与程序符号；大量运动由图形、背景、遮罩和色版承担。 |
| [《伪物 / Phony》BV1HuWq6NETL](https://www.bilibili.com/video/BV1HuWq6NETL/) | 公开预览、全片取样、局部相邻帧；尚无源码 | 彩色 Q 版人物插画，配合镜框、对话框、星芒、雨和粒子等；取样段能看到人物姿势变化。 |

- 两支均检查了 24 个全片时刻，并进一步提取局部相邻帧；预览为 640×360，不能据此评价原始 4K 画质。没有完成完整视听验收，不能写成已经逐帧看完两片。
- 第一支重点检查约 175 秒副歌和 193 秒结尾；第二支重点检查约 145 秒肖像和 176 秒牵线段。第二支牵线段的多姿势画面，尚不足以证明采用连续肢体变形，也不能在没有源码时断言其制作机制。
- 第一支源码已下载到[本地参考仓库](<references/world-execute-me-lyric-mv-main>)；目前是静态阅读，未安装依赖或复现其整片导出。

## 已由第一支源码核实的做法

1. **代码逐帧渲染，仍可使用预先绘制的人物素材。** [art.js:1](<references/world-execute-me-lyric-mv-main/src/engine/art.js:1>) 明确写着人物图不重画、不扭曲，处理是裁切、着色、遮罩、网屏和重采样。[art.js:29](<references/world-execute-me-lyric-mv-main/src/engine/art.js:29>) 列出 8 张素材：`f_bust`、`f_profile`、`f_reach`、`f_eye`、`boy_bust`、`man_bust`、`cat_bust`、`cat_paws`，其中女主只有前 4 张。伸手姿势来自已经画好的 `f_reach`，不能把它误解为代码让普通胸像连续伸出了手。
2. **三色图适合可靠地分成印刷色版。** [art.js:69](<references/world-execute-me-lyric-mv-main/src/engine/art.js:69>) 在加载时按米白、橙、近黑分色，预先生成遮罩和轮廓。色版采用累积覆盖：底版为整个人物，中版为橙＋黑，顶版为黑；正常套准时不露缝，错位时露出下层油墨。这里分的是同一张设计好的平涂图的颜色区域，不是在两张不同姿势的插画之间做差分来推测肢体。
3. **同一素材有多种画面呈现。** [art.js:414](<references/world-execute-me-lyric-mv-main/src/engine/art.js:414>) 的 `inks()` 支持色版角色、偏移、方向揭示、裁切和描边；放大特写超过源码设定的 1.75 倍阈值时可用轮廓路径绘制。另有剪影、半调网点、字符网屏等处理。素材复用依赖构图和呈现方式的变化。
4. **人物可以停住，画面仍然有明确运动。** [climax.js:101](<references/world-execute-me-lyric-mv-main/src/scenes/climax.js:101>) 明确把人物作为稳定底版，背景及人物表面的图层运动承担副歌动态；色版还能按鼓点弹开、回落，配合光、文字和故障事件。这与副歌相邻帧观察一致。
5. **颜色和图形有全片一致的叙事含义。** [palette.js:1](<references/world-execute-me-lyric-mv-main/src/engine/palette.js:1>) 固定米白代表用户、橙色代表 AI、红色代表错误，以对话状态统一控制颜色。[README.md:41](<references/world-execute-me-lyric-mv-main/README.md:41>) 将画面分为对话界面、表达内心的版画、特定段落的程序终端三类，让镜头变化服从同一个故事。
6. **帧数描述的是输出流程。** 工程按歌曲时间确定每一帧，用 Canvas 2D＋WebGL2 绘制，再由无头浏览器送入 ffmpeg。13,017 帧不等于 13,017 张独立人物原画，也不证明人物每帧都有新的肢体动作。作者公布的 token、费用、测试帧数属于自述，未独立核实，不能直接当成本项目预算。

## 对本项目有用的经验

- **先把人物和构图做美，再选择适合它们的运动。** 限色、剪影、平涂都能保留漂亮的轮廓、五官和服装设计；人物美感可以由少量经过设计的素材承担，代码负责它们的呈现与调度。
- **从一开始就为代码安排运动对象。** 把人物、背景、前景、文字、牵线、印记等的边界设计清楚。打算独立移动的内容需要可信素材或程序几何；复杂整幅插画不能直接假定可拆成可用部件。
- **让运动服务歌词和叙事。** 套色错位、遮罩显隐、框架开合、符号变化、牵线张力和断裂等都适合代码控制；先为本片定义它们的含义，再决定何时出现，避免只堆装饰。
- **静止人物、姿势切换、连续肢体动作要分别设计。** 前两种能通过构图和节奏形成好看的 MV，但不能把它们算作已经解决连续伸手、转身、迈步等动作。确需连续肢体动作的镜头仍要单独解决素材和运动条件；两支参考没有自动解除这一要求。
- **先验证小范围的完整视觉语言。** 建议先用少量完成度高的风格帧比较人物、字体、背景和配色，再用同一套素材做一个短音乐段落，检查节奏与图层运动能否成立，然后决定是否扩展。三色版画和彩色插画均只是参考路线，用户尚未选定最终风格。
- **借鉴制作方法时注意素材许可。** [README.md:124](<references/world-execute-me-lyric-mv-main/README.md:124>) 区分了代码及自编文档的 MIT 授权，与角色图及含这些图的画面的 CC BY-NC-SA 4.0（署名 Nyankomint）。研究方法不意味着可以把对方角色图当作 MIT 素材直接用于本片。

## 参考分析产物

- 全片取样：[第一支接触表](<out/bili_refs/BV186pc65E68_contact.jpg>)、[第二支接触表](<out/bili_refs/BV1HuWq6NETL_contact.jpg>)。
- 相邻帧：[第一支副歌](<out/bili_refs/chorus_motion.jpg>)、[第一支结尾](<out/bili_refs/outro_motion.jpg>)、[第二支肖像](<out/bili_refs/portrait_motion.jpg>)、[第二支牵线](<out/bili_refs/strings_motion.jpg>)。
- 本地公开预览：[第一支视频](<out/bili_refs/BV186pc65E68.mp4>)、[第二支视频](<out/bili_refs/BV1HuWq6NETL.mp4>)。
- 分析辅助脚本：[下载与元数据](<tools/inspect_bili_refs.py>)、[全片取样](<tools/bili_contact.py>)、[相邻帧提取](<tools/bili_motion_review.py>)。

## 当前待定项

- 为《String Theocracy》确定自己的角色画风、字体、构图与颜色含义；尚未形成通过认可的新方案。
- 区分可以由图形运动表达的镜头，与必须保留连续肢体动作的镜头，再调整素材计划。不能因为参考片人物常常静止，就自行放弃用户原有的动作要求。
- 如需进一步确认第二支的制作机制，需要其源码或额外证据；当前保留判断边界。

---

## 旧方案背景：创作规则与约束

- 分镜以 `STORYBOARD.md` v2（88 镜）为准。
- 主角外观参照 `claude/` 设定图及 `art/ref/maid_sheet.png`、`art/ref/librarian_sheet.png`。觉醒前为球形关节女仆人偶，1:44 静音拍觉醒；之后是无任何人偶特征的司书装活人。
- 哥特二维手绘电影感，煤黑、旧象牙白、赭橙、低饱和琥珀金；全片统一。圣像华丽、双臂低垂张开，参照 `art/gothic/g5_divine_openarms.png`。
- 用户要求“都用代码动吧，本来也不是全身动”，反对插帧，强调真实运动而非模糊化插帧。仍避免帧混合/叠化中间帧。
- 生图提示词使用两三句画面意图 + 固定画风说明，避免罗列长细节。用户在意生成费用，优先使用现有图。

## 样片基线

- v3 `out/sample_v3.mp4`：1920×1080、30fps、882帧、29.40秒，原曲95.205–124.62秒，18镜 G4–G7、H1–H2、I1–I11、I11a。旧版 `out/sample.mp4`、`out/sample_v2.mp4`。
- 旧动作系统：`mv/sample.js` 调 `layer()` 刚体转移，`carry()` 在半程换姿势；`tools/make_rigs.py` 用两张图像差分提取 RGBA。缺陷经检查确认：差分会把袖子、手臂、面部阴影当成活动物体；半程换姿态产生跳形；整图平移让背景和主体一起动；刚体手臂像纸片。
- 审阅既有 strip 后，G5/G6 差分搬运、I8 伸手、I2 脚落、I7 降人偶、I11 玻璃遮挡是高风险。I11 仍未修。旧 strip 有误命名/旧修订风险，不能当最终验收。

## 旧样片修改状态（v4 候选已渲染，未最终验收）

- 新增 `tools/build_clean_rigs.py`：从现有静帧构建试验性透明图层；需留作工作脚本，但已发现部分抠图边缘和补底明显失败，不能直接当成品。
- `mv/engine.js` 新增 `mesh(id, o, box, deform, nx=18, ny=14)` 三角网格绘制。已试用 I5，出现大片补底、边线和错位，故已从 I5 镜头撤下，但 API 留在文件中；尚未清理、测试。
- `mv/sample.js` 当前撤除了质量不稳的差分图层、手臂 mesh 变形和假牵线；I7 使用完整原画 `i7_newdoll` 做克制推近，I8 使用完整 `i8_reach` 原画推近，I5 在 `i5_wrist` / `i5_turn` 原图间硬切。G4/G5/G6 等优先使用完整原画、推近或节拍切图。I2 与 I6 仍有整图位移/切图，须检查是否让背景一起动及切换是否跳。
- `mv/engine.js` 仍保留 `mesh(id, o, box, deform, nx=18, ny=14)` API，但当前 `mv/sample.js` 不再依赖它。`tools/build_clean_rigs.py`、`tools/upgrade_v4.py` 和 `art/sample/clean/` 是失败实验/备份，勿将 clean-rig 当成当前成片素材；未做删除以保留审计线索。
- 已执行语法检查并成功渲染 `out/sample_v4.mp4`：1920×1080、30fps、882帧、29.40秒，原曲95.205–124.62秒。命令：`node tools/render.mjs --from 95.205 --to 124.62 --fps 30 --fade 0.7 --out out/sample_v4.mp4`。首次运行因错误引用不存在的 `i8_faceoff` 注册键在601/882帧中断；修正为单张 `i8_reach` 后完整通过。
- 关键帧/相邻时刻检查输出 `out/v4finalcheck.jpg`、`out/v4continuity.jpg`。检查确认 I7 没有先前的黑矩形，I8 的手臂保持完整，I5/I8 上的乱码牵线已去除；但 I5 手势依然硬切，I8 是完整姿势原画而非从对视连续伸手。I11 碎片量偏多且主体/窗洞遮挡风险仍在；该镜头未重做。该候选显著避免了旧版坏图层伪动作，但不能声称全段动作连续或已最终验收。

## 旧样片遗留检查（仅在继续该候选时适用）

1. 先逐镜播放 `out/sample_v4.mp4` 并听音乐核对卡点；目前只做了关键时刻静帧/相邻时刻视觉检查，没有完整逐帧播放或音频验收。
2. 优先评估 I11 的碎片规模、窗口遮罩和主体可读性；再评估 I2/I6 整图移动及 I5/I8 硬切。若动作需要真正连续肢体变化，需有可信的多张原始姿势/重新设计素材；不能靠错误差分抠图弥补。
3. 保持素材零新增成本；不要覆盖 `out/sample_v3.mp4`。候选可在用户审核后再迭代，不应标记为最终成片。

## 运行环境

- 当前会话为 danger-full-access，审批提示已关闭；不要设置 `sandbox_permissions` 申请提权。后续会话以当次运行环境为准。
- 不要同时跑两个 render，都会写 `out/.edge-render`。
- 生图 `tools/gen_sample.mjs` 每张约 $0.06，密钥从注册表读且不要打印；用户介意费用，未获新需求前避免生图。
- **08:55 圣像玻璃感**：用户（08:39）指出圣像脸是整块，应像裙摆那样由玻璃拼成以显破碎感。重出 4 轮：v2 变成细裂纹（像龟裂瓷，否）；v3 细线＋鼻梁横条（像蒙面，否）；v4b 采用（以 v1 为参考，"leaded-glass mosaic，脸切成约 6 块大玻璃，铅条与裙子同粗，禁细裂纹"）→ `icon_window.png`，其余版本在 `draft/`。侧窗三联 3 次尝试脸都没切开或出现遮面横条，退回 v1（侧窗只是背景，破碎由主圣像承担）。本轮再 +7 张，累计约 **$2.28**。
- **09:40 A 段完成（7 镜）**：新图 5 张在 `art/full/A/`（A02_doll_hang 绿幕竖、A05_book_half、A06_nape、A06_key 绿幕方、A07_eye_drowsy），其余复用 common。代码 `mv/full/scenes/A.js`（prepareA 接入 main.js，绿幕加载时抠像）。成片 `out/segments/A.mp4`（14.53s），静帧 `out/stills/A/`。坐标：钥匙孔 (1920,1349)、睫毛锚点 (1190,1380)/(2640,1230)、教徒裁线 y=1558/1858。A3 低头/抬头两图差异小（平均差约 10/255），每拍加 1.4% 硬推强调。歌词主字 108–118px，复杂背景加硬边实底/描边。累计生图约 **$2.58**。
- 下一步：用户审 A 段 → B 段。
- **10:05 A6 改为人设发条**：用户（09:51）指出人设背后是发条钥匙。重出 A06_nape（背后铜色安装座，中心实测 (1920,1405)）与 A06_key（三视图同款蝴蝶式双环发条钥匙，绿幕，毂心 (1280,1253)），旧花形钥匙版在 `art/full/A/draft/`。钥匙宽约画面 40%，每拍转 60° 停顿。A.mp4 已重渲。累计约 **$2.70**。
- **10:15 A6 再改**：用户（10:10）指出上一版仍把发条放在后颈裸露处，人设是在背部裙子上。重出 A06_nape（实为背部：黑裙背面、两肩胛间、白色大蝴蝶结上方的铜色安装座，实测中心 (1928,1153)），KEYHOLE 已改。v2 后颈版在 `draft/A06_nape_v2_neck.png`。教训：**每张涉及人设细节的图出完都要和 RP/RL 三视图逐项对照**（钥匙位置、花饰方向、关节、腕环），不只看构图。累计约 **$2.82**。
- **10:25 发条透视**：用户（10:18）指出人设三视图背面的发条画错了：钥匙从背部垂直伸出，从正后方看钥匙柄应是横线或扁圆，不是正面双环。A6 改为代码按真实透视投影正面钥匙图（`mv/full/scenes/A.js` drawA6：钥匙柄绕轴转 φ，`setTransform(cosφ, sinφ·cosθ, 0, sinθ, …)`，KEY_TILT=0.38≈22° 俯视），转动时在扁椭圆与横线之间变化，不另生图。**RP 三视图背面钥匙不改图，但今后凡用 RP 出背面/侧后方镜头，提示词必须写明 "the wind-up key protrudes straight out of her back; seen from behind its bow is edge-on, a thin horizontal bar or flat ellipse"。**
- **10:35 三视图改正＋抬头加强**（用户 10:24："三视图也改正，抬头可以更明显一点"）：
  - `ref_doll_turnaround.png` 只替换侧面、背面两格（各 1280 宽，单独重出后贴回，正面不动；原版 `draft/ref_doll_turnaround_v1.png`）。侧面：删掉头发旁浮着的钥匙，钥匙柄从腰部蝴蝶结上方的背部向后伸出，双环立着。背面：钥匙环立在竖直平面里，所以从正后方看是一条竖直细线，下面是铜色安装座。A6 代码投影与此一致。
  - `congregation_up.png` 换成 v4（兜帽不摘、坐直、仰头，前排轮廓明显变高；v2 摘了兜帽露出秃头，否；v3 变化太小）。三条带平均差 16.7/17.4/12.1。
  - 本轮 +5 张，累计约 **$3.12**。
- **11:45 B 段完成（7 镜，待用户审）**：新图 8 张 `art/full/B/`（B01_eye_icon、B04_alt_servant/icon、B05_turn1/2、B06_mirror_pair、B07_mirror_blink/palm），全部采用无重出；10 次请求（2 次失败），累计约 **$3.6–3.7**。代码 `mv/full/scenes/B.js`（prepareB 已接入 main.js），成片 `out/segments/B.mp4`（16.57s），抽帧拼版 `out/contact_B_video2.jpg`。歌词统一 116px 哥特字＋煤黑描边（outlinedLyric），B2 片名在顶部实色条逐字砸入，B4 装扮图贴进原图拱镜。已知小瑕疵：B05 turn2 背景与 turn1 轻微错位（拍点推镜掩盖）；B05 侧面钥匙偏高。子代理沙箱无法渲染，渲染由主会话带 `sandbox_permissions: danger-full-access` 执行（本会话并非默认全权限）。
- **12:25 B 段运动改灵巧**（用户 12:07："动的方式太硬了，能不能灵巧一点，依旧参考那两个视频尤其是那个开源的"）：参考工程手法整理在 `MOTION_NOTES.md`；新共用模块 `mv/full/motion.js`（MIT，easeOutBack/easeOutExpo/easeInOutCubic/beatAge/beatHit/spring/kick/staggeredGlyph/wipe）。只改了 B.js：推拉缓动、拍点冲出＋弹簧回落、姿势仍硬切但切换瞬间整层小幅位移/缩放回弹、歌词逐字错峰弹入与离场、片名逐字落下压扁回弹、B2→B3 方向擦除、B3→B4 格栅揭示；B6 歌词从 26.05s 提前到切入拍。A 段未动，待用户认可后推广到 A 及后续各段。
- **13:05 B2 人偶姿势**（用户 12:51：未觉醒的 Claude 应像精巧人偶摆出教徒期望的优雅姿势）：新图 `art/full/B/B02_doll_pose.png`（绿幕竖，掌心朝上低张双臂、微仰头、空洞微笑，与圣像姿势呼应），B.js 的 B2 改用此图（裁切 sx=200,sy=20,sw=2160,sh=3820），并加三根金线（头、双掌，煤黑衬底 8px＋金 4px，否则在教堂背景上看不见）。+1 张，累计约 **$3.7–3.8**。
- render.mjs 断点续渲指纹现在包含 art/full（按路径＋大小＋mtime，跳过 draft/batches），换图会自动重渲。
