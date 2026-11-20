"""Send the GPT art director's prompts to the user's existing generator."""
import concurrent.futures
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
NODE = Path.home() / '.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/node/bin/node.exe'
GEN = Path('D:/dpskhns/tools/gpt-image/generate.mjs')

def generate(shot):
    target = ROOT / 'art/gothic' / (shot['id'] + '.png')
    result = subprocess.run([str(NODE), str(GEN), '--api', 'images', shot['prompt'], '--out', str(target)], capture_output=True, text=True, encoding='utf-8', errors='replace', cwd=ROOT)
    print(shot['id'], 'exit', result.returncode, flush=True)
    if result.returncode:
        print(result.stderr[-1500:], flush=True)
    else:
        print(target, flush=True)
    return result.returncode

if __name__ == '__main__':
    data = json.loads((ROOT / 'art/gothic/prompts.json').read_text(encoding='utf-8'))
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        codes = list(pool.map(generate, data['shots']))
    raise SystemExit(1 if any(codes) else 0)
