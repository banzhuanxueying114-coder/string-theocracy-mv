from pathlib import Path
import subprocess
root = Path(__file__).resolve().parents[1]
node = Path.home() / '.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/node/bin/node.exe'
prompt = (root / 'art/gothic/icon-divine-prompt.txt').read_text(encoding='utf-8')
result = subprocess.run([str(node), 'D:/dpskhns/tools/gpt-image/generate.mjs', '--api', 'images', prompt, '--out', str(root / 'art/gothic/g4_divine.png')], cwd=root)
raise SystemExit(result.returncode)
