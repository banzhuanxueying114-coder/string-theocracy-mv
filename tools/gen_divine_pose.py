from pathlib import Path
import subprocess
root = Path(__file__).resolve().parents[1]
node = Path.home() / '.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/node/bin/node.exe'
prompt = (root / 'art/gothic/icon-divine-prompt.txt').read_text(encoding='utf-8')
prompt = prompt.replace('右掌抬起赐福，左手垂于胸前。', '圣像双臂低于肩膀向左右斜下方舒展，手肘自然微弯，双手在腰部两侧远离身体，掌心朝上，十指自然展开，形成宽广而从容的接纳姿态，如神明接纳所有祈愿。双手都不得举到脸旁，不做单手赐福手势；双臂、双手与完整指尖全部入镜。')
prompt += '\n本张的核心是双臂向两侧打开、两只掌心向上的对称神性姿态，衣袖与礼服随双臂构成宽阔的扇形剪影。神像保持与窗面共面的玻璃材质。'
(root / 'art/gothic/icon-divine-openarms-prompt.txt').write_text(prompt, encoding='utf-8')
result = subprocess.run([str(node), 'D:/dpskhns/tools/gpt-image/generate.mjs', '--api', 'images', prompt, '--out', str(root / 'art/gothic/g5_divine_openarms.png')], cwd=root)
raise SystemExit(result.returncode)
