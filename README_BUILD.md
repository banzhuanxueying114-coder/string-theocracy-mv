# 构建 String Theocracy MV

## 准备环境

- Node.js 22 或更新版，无第三方 npm 依赖。
- 支持 `libx264` 和 AAC 的 FFmpeg，确保 `ffmpeg` 在 `PATH` 中。抽帧检查时也可用随 FFmpeg 一起安装的 `ffprobe`。
- 安装近期的 Chromium 系浏览器，如 Edge、Chrome 或 Chromium。脚本在 Windows 和 macOS 尝试常见 Edge / Chrome 安装位置，Linux 默认从 `PATH` 查找 `chromium`。可用 `--browser` 或 `MV_BROWSER` 指定可执行文件。
- 音频请自备并放在 `music/String Theocracy.mp3`。可用 `--audio` 或 `MV_AUDIO` 更换。全片时间轴以这首歌当前的节拍和 LRC 为基准，换音源应确认起始偏移一致。分段和静帧不需要音频。

相对路径以仓库根为基准。`--browser` 和 `--audio` 优先于同名用途的环境变量，可接收绝对路径。不要在 `file://` 下打开全片页面，浏览器需要通过 HTTP 读取模块、节拍和歌词。渲染脚本会自行启动本地静态服务。

## 渲染命令

```sh
# A 段，视频无音频、无淡入淡出
npm run render:section -- --section A

# G 到 I 段或任意秒数区间
npm run render:section -- --section G-I --out out/parts/G-I.mp4
npm run render:section -- --from 95.2 --to 109.7 --out out/parts/sample.mp4

# A–M 各段可续渲，最后拼接并加入音频
npm run render:full -- --fps 30 --out out/full.mp4
npm run render:full -- --fade 0.5 --audio "music/String Theocracy.mp3" --out out/full-faded.mp4

# 静帧与旧样片命令
node tools/render.mjs --page mv/full/index.html --stills 3.08,96.505,104.638333 --dir out/stills
node tools/render.mjs --page mv/style_test_v2.html --from 95.205 --to 109.688 --fps 30 --fade 0.5 --out out/legacy.mp4
```

`--segments-dir` 默认为 `out/segments`。全片模式直接复用同目录下单独渲染的 A–M 段，前提是帧率、时间范围与工程内容一致。每段编码成功后会写 `.complete.json`，续渲会检查标记及视频大小。更换浏览器或系统字体后用 `--no-resume` 重建中间文件，避免混用不同字形。每段结束后打印采集和含编码的平均毫秒每帧。

段间用同一个 `n / fps` 时间轴。段区间为左闭右开，起止边界向上对齐到整帧，全片 174.17 秒、30 fps 时为 5226 帧，视频 174.20 秒。`--fade` 只在 `--full` 的最终拼接阶段应用于画面和声音。旧模式保留原有音频淡入淡出行为。

## 字体

`mv/full/index.html` 中 `--mv-gothic` 和 `--mv-mono` 是 Canvas 使用的字体栈。装有 Old English Text MT 和 Consolas 的机器会优先使用这两款字体。它们不可随项目分发。开源构建可本地安装 SIL OFL 授权的 UnifrakturMaguntia、JetBrains Mono 或 Fira Code，或按其许可证随项目分发并用 `@font-face` 声明。其他系统可安装 Noto Sans CJK SC 以显示中文占位。替代字体的字宽、换行和沿线排字会有变化。逐像素对照请使用同款字体和浏览器。

## 新增镜头

`mv/full/index.html` 和 `main.js` 是入口。`engine/canvas.js` 提供三色板、图片加载、离屏着色、版面错位、打字、砸字、绘线、字符底纹和 HUD。`beatgrid.js` 将小节拍号转换成秒数，`timeline.js` 选镜头、取 LRC 歌词并绘制占位。`scenes/A.js` 至 `M.js` 对应 13 段。`scenes/sample.js` 保存原样片绘制函数及绝对时间，覆盖 95.205–109.688 秒。A–M 第一镜从节拍网格段首开始，其余分镜沿用 `STORYBOARD.md` 的秒数。

例如为 A2 填入正式绘制函数。数字 `2.1` 是秒数，字符串 `'2.1'` 是第 2 小节第 1 拍。

```js
import { scene } from '../timeline.js';
import { ctx, W, H, COAL, PAPER, text } from '../engine/canvas.js';

function drawA2(t, { lyric, localTime }) {
  ctx.fillStyle = COAL;
  ctx.fillRect(0, 0, W, H);
  text(lyric, 100, 240 + Math.min(localTime, 1) * 48, 62, PAPER);
}

// 在 A.js 的 shots 列表中替换 A2，并将第四列传给 scene。
// ['A2', '2.1', '顶光照亮舞台中央的人偶', drawA2]
export const example = scene('A', 'A2', '2.1', '顶光照亮舞台中央的人偶', drawA2);
```

`draw(t, context)` 的 `t` 为绝对秒数，`context` 提供 `localTime`、`lyric`、`bar`、`beat` 和 `shot`。只用传入时间计算动画，便可任意顺序渲染帧。未指定绘制函数时使用三色分镜板。样片区间内的时间点会被样片镜头优先接管。
