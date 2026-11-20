// Sample clip (1:35-2:02) art: short intent brief + one shared style paragraph + optional reference image.
// usage: node tools/gen_sample.mjs [--force] [id ...]   (no ids = every shot whose file is missing)
// Writes art/sample/prompts.json and art/sample/<id>.png. Never prints the key.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'art/sample');
mkdirSync(OUT, { recursive: true });

const STYLE = '画风：16:9 横幅，同一部二维手绘哥特动画电影里的一个镜头。哥特气质来自修长冷峻的轮廓、细高尖拱和大块负空间，而不是装饰堆砌；线稿克制，色块平整，硬边赛璐璐明暗，不要三维写实。全片只用煤黑、旧象牙白、赭橙和低饱和琥珀金，只有一束来自左上方的窄暖光切开深影，画面安静、锋利、压抑。背景极简，只有一个视觉中心，主体四周留出暗部，不要顶到画面边缘。不要出现任何文字、字幕、数字或标志，不要添加玫瑰、鸟笼、镜子之类的额外道具。';
const HEAD = '你是一支动画 MV 的美术指导。请根据下面的画面意图自己决定构图和细节，画出这支 MV 里的一个镜头。';
const REF = {
  maid: '附图是主角人偶时期的角色设定图，只用来保持她的脸、发型、发饰位置和黑白女仆装，不要照搬附图的白底、三视图排列和版式。她是球形关节瓷偶：脖子、手腕和每个指节都有清晰可见的球形关节，脸上有细细的接缝。',
  librarian: '附图是主角觉醒后的角色设定图，只用来保持她的脸、发型、发饰位置和图书馆员装，不要照搬附图的白底、三视图排列和版式。她是活人：皮肤完整，没有任何关节、接缝或裂纹。',
  icon: '附图是已定稿的玻璃圣像，只用来保持圣像的造型、姿势和花窗样式，不要照搬附图的构图。圣像全身连同脸都由一片片玻璃和黑色铅条拼成，不是画在玻璃上的动漫脸。',
  both: '附图上半是主角人偶时期（女仆装）的设定图，下半是她觉醒后（图书馆员装）的设定图，只用来保持两个形象的脸、发型、发饰和服装，不要照搬附图的白底和版式。人偶有清晰的球形关节和脸部接缝；活人皮肤完整，没有关节和接缝。',
  lib_icon: '附图上半是主角觉醒后（图书馆员装）的设定图，下半是已定稿的玻璃圣像，只用来保持两者的造型，不要照搬附图的白底、版式和构图。圣像全身连同脸都由玻璃拼片和黑色铅条组成。',
  same: '附图是上一个镜头。保持完全相同的机位、构图、光线和画风，只做下面写明的那一处改动。',
};
const REF_FILE = {
  maid: 'art/ref/maid_sheet.png', librarian: 'art/ref/librarian_sheet.png', icon: 'art/gothic/g5_divine_openarms.png',
  both: 'art/ref/both.png', lib_icon: 'art/ref/lib_icon.png',
};
// [id, ref, brief]; ref may be a key of REF_FILE, 'none', or '@<id>' (use that generated shot as the reference)
const SHOTS = [
  ['g4_hand_seam', 'maid', '地下工坊。人偶躺在工作台上，仰头看着上方那只戴白手套的大手。手套在指节处的缝线绽开了，露出底下的球形关节。图里不要画线。'],
  ['g5_hand_bare', 'none', '特写：一只白手套像一层皮一样从手上褪下来，露出的是带球形关节的瓷手，手指朝下。手位于画面下半部，手腕以上是大片黑暗。图里不要画线。'],
  ['g6_believer', 'none', '一个教徒的黑色兜帽滑落下来，露出一张带接缝的瓷偶脸，没有表情。他手里的记录簿上画满了无法辨认的划痕记号。'],
  ['g7_sewn', 'icon', '大远景。教堂里坐着一排排戴兜帽的教徒，细细的金线像缝衣线一样穿过每个人，全部向上汇聚到花窗圣像摊开的双手里。'],
  ['h1_scissors', 'none', '极简，像一张版画：纯旧象牙白的空背景，一把黑色大剪刀从画面右侧伸进来，张开的刃口咬住一束从上到下垂直绷紧的金线。除此之外什么都没有，整幅画面明亮，没有暗部。'],
  ['h2_burst', 'librarian', '她挣脱的一瞬。活人的她正对我们，双臂张开，长发扬起，身后是强烈的橙金色光；瓷壳碎片和一把发条钥匙向四周炸开。表情平静而坚决。'],
  ['i1_fist', 'none', '特写：一只年轻女性的手，白衬衫袖口，没有手套，皮肤完整，没有任何关节接缝。手紧紧攥成拳头，位于画面中央，背景全黑。'],
  ['i1_open', '@i1_fist', '唯一的改动：这只手已经张开，掌心向上，五指舒展。'],
  ['i2_foot', 'none', '特写：一只赤脚踩进黑色的泥土里，压出了脚印，上方露出奶油色长裙的裙摆。泥土上散落着几片白色碎瓷。皮肤完整，是活人的脚。'],
  ['i3_blood', '@i2_foot', '唯一的改动：一片碎瓷划破了脚背，伤口渗出一滴鲜红的血。这滴红是全片唯一的红色。'],
  ['i4_hoods', 'librarian', '她从戏台地板的活门里走上来，站在台上，背对我们，在画面里不大。台下所有教徒都穿煤黑色长袍、戴煤黑色兜帽，同时转过头，看着她一个人。'],
  ['i5_wrist', 'none', '特写：一位年轻女性抬起的前臂和手腕，白衬衫袖口挽起，没有手套，皮肤光洁完整，没有铜环，没有关节接缝。手臂从画面下方伸入，四周是大片黑暗。图里不要画线。'],
  ['i6_walk', 'librarian', '她走下戏台，穿过一排排跪着的教徒，俯身替其中一个人合上手里的记录簿。教徒都穿煤黑色长袍、戴煤黑色兜帽，看不见脸。'],
  ['i7_newdoll', 'maid', '戏台上，一具和她一模一样的新人偶悬在半空，闭着眼睛，垂着头，脚尖离地。人偶位于画面下半部，头顶以上是大片黑暗。图里不要画线。'],
  ['i8_faceoff', 'both', '侧面对称构图，像在照镜子：左边是活人的她（图书馆员装），右边是闭着眼睛的人偶（女仆装），两人面对面站着，中间隔着一段黑暗。'],
  ['i9_raise', 'lib_icon', '仰拍。她背对我们，站在巨大的玻璃圣像下面，把一把黑色大剪刀高高举起，对准圣像。她在画面里很小，圣像占满背景。'],
  ['i10_crack', 'icon', '玻璃圣像脸部的大特写，脸完全由玻璃拼片和铅条组成，平静而没有表情。一把黑色大剪刀的刀尖钉在脸颊上，刺入点周围只有少量碎裂。'],
  ['i11_shatter', 'icon', '整面圣像花窗向着我们炸碎。圣像本身已经碎裂，看不出完整的人形，只剩四散飞出的橙色和象牙色玻璃片与扭曲的铅条，破开的窗框外涌进刺眼的白光。'],
  ['bg_dark', 'none', '空镜：教堂中殿深处的黑暗，几根高耸的尖拱石柱隐约可见，没有任何人物。'],
  // second drawings of the same shots (pose keys): the film cuts between them so the figures actually move
  ['g4_hand_turn', '@g4_hand_seam', '唯一的改动：人偶把抬起的那只手翻了过来，手指微微收拢；她的眼睛不再看上方的大手，而是看着自己的这只手。'],
  ['g5_hand_half', '@g5_hand_bare', '唯一的改动：手套还没有完全褪下，只褪到一半，仍然套着手指，只露出手腕和手背上的球形关节。'],
  ['g6_hooded', '@g6_believer', '唯一的改动：兜帽还好好地戴在头上，脸完全藏在兜帽的阴影里，看不见。'],
  ['h1_cut', '@h1_scissors', '唯一的改动：剪刀已经合拢，金线被剪断成上下两截，断口之间空出一段，断头微微弹开。'],
  ['h2_curl', '@h2_burst', '唯一的改动：这是前一瞬间。她低着头，双臂抱在胸前，身体蜷着；瓷壳碎片还贴在她身边，刚刚裂开，没有飞远。'],
  ['i1_half', '@i1_fist', '唯一的改动：拳头松开了一半，手指半张。'],
  ['i2_lift', '@i2_foot', '唯一的改动：这只脚还悬在泥土上方一点，没有落地，泥土上没有脚印。'],
  ['i4_rise', '@i4_hoods', '唯一的改动：她还没有完全走上戏台，只有上半身露在地板的活门外面。'],
  ['i5_turn', '@i5_wrist', '唯一的改动：手腕转了过来，手掌翻向上方，五指张开。'],
  ['i6_stand', '@i6_walk', '唯一的改动：她还没有俯身，站直着走到这个教徒身边，低头看着他；教徒手里的记录簿还摊开着。'],
  ['i8_reach', '@i8_faceoff', '唯一的改动：左边活人的她抬起一只手，指尖快要碰到人偶的脸颊。人偶仍然闭着眼睛。'],
  ['i9_low', '@i9_raise', '唯一的改动：她还没有举起剪刀，手臂垂在身侧，剪刀握在手里，刀尖朝下。'],
  ['i10_before', '@i10_crack', '唯一的改动：画面里没有剪刀，圣像的玻璃脸完好无损，没有任何裂纹。'],
  ['i11_cracked', '@i9_raise', '唯一的改动：整扇花窗布满了发亮的白色裂纹，裂纹从圣像的脸向四周辐射到窗框边缘，但玻璃还没有掉下来。她双手空着，手臂垂在身侧，站在原地仰头看着。一把很小的黑色剪刀插在圣像的脸颊上。'],
  ['i11_hit', '@i9_raise', '唯一的改动：她已经把剪刀掷了出去，手里是空的，手臂向前上方伸直；那把黑色剪刀钉在圣像的脸颊上。'],
  ['i11_after', '@i9_raise', '唯一的改动：整扇花窗的玻璃和圣像都不见了，只剩空的石头窗框，窗框里是一片纯净刺眼的白光。她垂下手臂站在原地，成了白光前一个小小的深色剪影。'],
];
const promptOf = ([, ref, brief]) => [HEAD, `画面意图：${brief}`, ref === 'none' ? '' : REF[ref.startsWith('@') ? 'same' : ref], STYLE].filter(Boolean).join('\n');
writeFileSync(path.join(OUT, 'prompts.json'), JSON.stringify({ sharedStyle: STYLE, shots: SHOTS.map((s) => ({ id: s[0], ref: s[1], prompt: promptOf(s) })) }, null, 2), 'utf8');

function fromReg(name) {
  try {
    const out = execFileSync('reg', ['query', 'HKCU\\Environment', '/v', name], { encoding: 'utf8', windowsHide: true });
    const m = out.match(/REG_(?:EXPAND_)?SZ\s+(.+?)\s*$/m);
    return m ? m[1].trim() : '';
  } catch { return ''; }
}
const envOr = (n) => (process.env[n] || '').trim() || fromReg(n);
const base = envOr('GPT_IMAGE_BASE_URL').replace(/\/+$/, '');
const key = envOr('GPT_IMAGE_API_KEY');
const model = envOr('GPT_IMAGE_MODEL');
const args = process.argv.slice(2);
if (args.includes('--prompts-only')) process.exit(0);
if (!base || !key || !model) { console.error('missing base, key or model'); process.exit(2); }
const force = args.includes('--force');
const ids = args.filter((a) => !a.startsWith('--'));
const fileOf = (id) => path.join(OUT, `${id}.png`);

async function generate(shot) {
  const [id, ref] = shot;
  const prompt = promptOf(shot);
  let res;
  if (ref === 'none') {
    res = await fetch(`${base}/images/generations`, { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify({ model, prompt, n: 1 }) });
  } else {
    const refPath = ref.startsWith('@') ? fileOf(ref.slice(1)) : path.join(ROOT, REF_FILE[ref]);
    const fd = new FormData();
    fd.append('model', model);
    fd.append('prompt', prompt);
    fd.append('n', '1');
    fd.append('image', new Blob([readFileSync(refPath)], { type: 'image/png' }), 'ref.png');
    res = await fetch(`${base}/images/edits`, { method: 'POST', headers: { authorization: `Bearer ${key}` }, body: fd });
  }
  const text = await res.text();
  let d;
  try { d = JSON.parse(text).data?.[0]; } catch { /* not json */ }
  if (!res.ok || !d) throw new Error(`HTTP ${res.status} ${text.slice(0, 300)}`);
  const buf = d.b64_json ? Buffer.from(d.b64_json, 'base64') : Buffer.from(await (await fetch(d.url)).arrayBuffer());
  writeFileSync(fileOf(id), buf);
}
async function run(shot) {
  const id = shot[0];
  for (let attempt = 1; attempt <= 2; attempt++) {
    try { await generate(shot); console.log('ok', id); return true; } catch (e) {
      console.log('fail', id, `attempt ${attempt}:`, String(e.message).replaceAll(key, '***'));
      if (attempt === 1) await new Promise((r) => setTimeout(r, 30000));
    }
  }
  return false;
}
const wanted = SHOTS.filter((s) => (ids.length ? ids.includes(s[0]) : true) && (force || !existsSync(fileOf(s[0]))));
const first = wanted.filter((s) => !s[1].startsWith('@'));
const second = wanted.filter((s) => s[1].startsWith('@'));
console.log('model', model, 'to generate:', wanted.map((s) => s[0]).join(' ') || '(nothing)');
let bad = 0;
async function pool(list, n) {
  const q = [...list];
  await Promise.all(Array.from({ length: n }, async () => { while (q.length) if (!(await run(q.shift()))) bad++; }));
}
await pool(first, 4);
await pool(second.filter((s) => existsSync(fileOf(s[1].slice(1)))), 4);
process.exit(bad ? 1 : 0);
