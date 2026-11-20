// Node 22+. Run only when a new generation is authorized.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { basename, dirname, extname } from 'node:path';
import { parseArgs } from 'node:util';

const defaultConfig = 'D:/dpskhns/tools/gpt-image/config.json';
const types = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
function env(name) {
  if (process.env[name]?.trim()) return process.env[name].trim();
  if (process.platform === 'win32') {
    try {
      return execFileSync('reg.exe', ['query', 'HKCU\\Environment', '/v', name], {
        encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'],
      }).match(/REG_(?:EXPAND_)?SZ\s+([^\r\n]+)/)?.[1]?.trim();
    } catch { return undefined; }
  }
}

async function main() {
  const { values: v } = parseArgs({ options: {
    image: { type: 'string', multiple: true }, prompt: { type: 'string' },
    model: { type: 'string' }, size: { type: 'string' }, out: { type: 'string' },
    config: { type: 'string' }, api: { type: 'string', default: 'edits' },
    'text-model': { type: 'string', default: 'gpt-4.1' },
  } });
  if (!v.image || !v.prompt?.trim() || !v.out || !['edits', 'responses'].includes(v.api)) {
    throw new Error('Usage: node tools/gen_ref.mjs --image REFERENCE.png [--image REFERENCE.png ...] --prompt PROMPT --out OUTPUT.png [--api edits|responses]');
  }
  let cfg = {};
  try {
    const text = await readFile(v.config || defaultConfig, 'utf8');
    cfg = JSON.parse(text.replace(/^\uFEFF/, '').replace(/^\s*\/\/[^\n]*$/gm, ''));
  } catch (err) { if (err.code !== 'ENOENT' || v.config) throw new Error('Unable to read image configuration'); }
  const key = env('GPT_IMAGE_API_KEY') || cfg.apiKey;
  const base = (env('GPT_IMAGE_BASE_URL') || cfg.baseUrl || cfg.base || '').replace(/\/+$/, '');
  const model = v.model || env('GPT_IMAGE_MODEL') || 'gpt-image-2.6-sunburst';
  const size = v.size || '1536x1024';
  if (!key || !base) throw new Error('Missing image API key or base URL');
  const prompt = v.prompt.trim();
  const images = await Promise.all(v.image.map(async file => {
    const type = types[extname(file).toLowerCase()];
    if (!type) throw new Error(`Unsupported reference format: ${basename(file)}`);
    return { name: basename(file), type, bytes: await readFile(file) };
  }));
  const headers = { Authorization: `Bearer ${key}` };
  let body;
  if (v.api === 'edits') {
    body = new FormData();
    for (const [field, value] of Object.entries({ prompt, model, size, n: '1' })) body.set(field, value);
    for (const img of images) body.append('image[]', new Blob([img.bytes], { type: img.type }), img.name);
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({ model: v['text-model'], input: [{ role: 'user', content: [
      { type: 'input_text', text: prompt }, ...images.map(img => ({ type: 'input_image', image_url: `data:${img.type};base64,${img.bytes.toString('base64')}` })),
    ] }], tools: [{ type: 'image_generation', model, size }], tool_choice: { type: 'image_generation' } });
  }
  const started = performance.now();
  try {
    const url = `${base}/${v.api === 'edits' ? 'images/edits' : 'responses'}`;
    const result = await fetch(url, { method: 'POST', headers, body, signal: AbortSignal.timeout(480_000) });
    if (!result.ok) {
      const safe = (await result.text()).replaceAll(key, '[redacted]');
      throw new Error(`HTTP ${result.status}: ${safe.slice(0, 2000)}`);
    }
    const json = await result.json().catch(() => { throw new Error('Relay returned invalid JSON'); });
    const data = json.data?.[0];
    const encoded = data?.b64_json || json.output?.find(item => item.type === 'image_generation_call')?.result;
    let bytes;
    if (encoded) bytes = Buffer.from(encoded, 'base64');
    else if (data?.url) {
      const image = await fetch(data.url, { signal: AbortSignal.timeout(60_000) });
      if (!image.ok) throw new Error(`Image download: HTTP ${image.status}`);
      bytes = Buffer.from(await image.arrayBuffer());
    }
    if (!bytes?.length) throw new Error('Relay returned no image bytes');
    await mkdir(dirname(v.out), { recursive: true });
    await writeFile(v.out, bytes);
    console.log(v.out);
    // Token usage reported by the relay, so the real cost can be checked against the bill.
    if (json.usage) console.log(`usage: ${JSON.stringify(json.usage)}`);
  } catch (err) {
    throw new Error(String(err.message).replaceAll(key, '[redacted]'));
  } finally { console.error(`${v.api}: ${((performance.now() - started) / 1000).toFixed(3)}s`); }
}
main().catch(err => { console.error(err.message); process.exitCode = 1; });
