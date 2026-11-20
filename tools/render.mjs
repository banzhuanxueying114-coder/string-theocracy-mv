// Frame renderer: static server + Chromium DevTools + FFmpeg.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { createServer } from 'node:http';
import {
  createReadStream, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync,
  renameSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { sectionRanges } from '../mv/full/beatgrid.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GRID_FILE = path.join(ROOT, 'music/beatgrid.json');
const FULL_PAGE = 'mv/full/index.html';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.css': 'text/css', '.lrc': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.woff2': 'font/woff2',
};
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const resolved = (file) => path.resolve(ROOT, file);
const relative = (file) => path.relative(ROOT, file);
let SCALE = 2; // --scale 1 = 1920x1080 (legacy), 2 = 3840x2160
const FF_VIDEO = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-color_range', 'tv'];
const FF_AUDIO = ['-c:a', 'aac', '-b:a', '256k'];

function args() {
  const stringOptions = ['page', 'from', 'to', 'fps', 'out', 'fade', 'stills', 'dir', 'section', 'segments-dir', 'browser', 'audio', 'scale'];
  const boolOptions = ['full', 'segment', 'resume', 'no-resume', 'help'];
  return parseArgs({ options: Object.fromEntries([
    ...stringOptions.map((key) => [key, { type: 'string' }]),
    ...boolOptions.map((key) => [key, { type: 'boolean' }]),
  ]) }).values;
}

function number(value, label, min = 0) {
  if (value === '' || !Number.isFinite(Number(value)) || Number(value) < min) {
    throw new Error(`--${label} must be a number ≥ ${min}`);
  }
  return Number(value);
}

function browserPath(configured) {
  if (configured) return /[/\\]/.test(configured) ? resolved(configured) : configured;
  if (process.platform === 'win32') {
    for (const dir of [process.env['ProgramFiles(x86)'], process.env.ProgramFiles, process.env.LOCALAPPDATA].filter(Boolean)) {
      for (const app of ['Microsoft/Edge/Application/msedge.exe', 'Google/Chrome/Application/chrome.exe']) {
        const candidate = path.join(dir, app);
        if (existsSync(candidate)) return candidate;
      }
    }
  }
  if (process.platform === 'darwin') {
    for (const app of ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium']) {
      if (existsSync(app)) return app;
    }
  }
  return process.platform === 'win32' ? 'msedge.exe' : 'chromium';
}

function serve(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const file = resolved(`.${decodeURIComponent(url.pathname)}`);
    const rel = relative(file);
    if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    createReadStream(file).on('error', () => res.destroy()).pipe(res);
  } catch {
    res.writeHead(400).end('bad request');
  }
}

async function openRenderer(page, browser) {
  const server = createServer(serve);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const profile = mkdtempSync(path.join(tmpdir(), 'mv-render-'));
  const child = spawn(browser, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--hide-scrollbars',
    '--mute-audio', '--no-first-run', `--window-size=${1920 * SCALE},${1080 * SCALE}`, '--force-device-scale-factor=1',
    '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--force_high_performance_gpu', ...(process.env.MV_BROWSER_FLAGS ? process.env.MV_BROWSER_FLAGS.split(' ') : []), 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'inherit'] });
  let failure, socket;
  child.on('error', (error) => { failure = new Error(`Cannot start ${browser}: ${error.message}. Set --browser or MV_BROWSER.`); });
  child.on('exit', (code) => { failure ??= new Error(`Browser exited early (${code})`); });
  const closed = once(child, 'close').catch(() => {});
  async function close() {
    socket?.close();
    child.kill();
    await Promise.race([closed, pause(1000)]);
    server.closeAllConnections();
    server.close();
    try { rmSync(profile, { recursive: true, force: true }); }
    catch { console.warn(`Temporary browser profile remains at ${profile}`); }
  }

  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 150 && !failure && !existsSync(portFile); i++) await pause(100);
    if (failure) throw failure;
    if (!existsSync(portFile)) throw new Error('Browser did not open a DevTools port');
    const port = readFileSync(portFile, 'utf8').split('\n')[0].trim();
    const endpoint = `http://127.0.0.1:${port}/json/list`;
    let target;
    for (let i = 0; i < 50 && !target && !failure; i++) {
      target = await fetch(endpoint).then((response) => response.json())
        .then((list) => list.find((item) => item.type === 'page')).catch(() => undefined);
      if (!target) await pause(100);
    }
    if (!target) throw failure ?? new Error('No DevTools page found');
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((ok, no) => {
      socket.onopen = ok;
      socket.onerror = () => no(new Error('Cannot connect to DevTools socket'));
    });
    let sequence = 0;
    const pending = new Map();
    socket.onmessage = ({ data }) => {
      const message = JSON.parse(data);
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result);
    };
    socket.onclose = () => {
      for (const request of pending.values()) request.reject(new Error('DevTools socket closed'));
      pending.clear();
    };
    const cdp = (method, params = {}) => new Promise((resolve, reject) => {
      if (socket.readyState !== WebSocket.OPEN) { reject(new Error('DevTools socket closed')); return; }
      const id = ++sequence;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
    async function evaluate(expression) {
      const reply = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (reply.exceptionDetails) throw new Error(reply.exceptionDetails.exception?.description ?? reply.exceptionDetails.text);
      return reply.result.value;
    }
    const pageURL = page.split('/').map(encodeURIComponent).join('/');
    await cdp('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/${pageURL}?scale=${SCALE}` });
    let ready = false;
    for (let i = 0; i < 100 && !ready; i++) {
      ready = await evaluate('typeof window.MV === "object"').catch(() => false);
      if (!ready) await pause(100);
    }
    if (!ready) throw new Error(`Page did not expose window.MV: ${page}`);
    const info = await evaluate('MV.ready.then(() => MV.info())');
    console.log('page ready:', JSON.stringify(info));
    return { evaluate, close };
  } catch (error) {
    await close();
    throw error;
  }
}

function startFFmpeg(flags, pipe = false) {
  const proc = spawn('ffmpeg', ['-y', '-v', 'error', ...flags], { stdio: [pipe ? 'pipe' : 'ignore', 'inherit', 'inherit'] });
  const done = once(proc, 'close').then(([code]) => {
    if (code !== 0) throw new Error(`ffmpeg exit ${code}`);
  });
  done.catch(() => {}); // Observed below, including exits while capturing a frame.
  proc.stdin?.on('error', () => {}); // A failed FFmpeg process may close stdin before 'close'.
  return { proc, done };
}

function fades(duration, amount, intro = amount) {
  const filters = [];
  if (intro > 0) filters.push(`afade=t=in:st=0:d=${Math.min(duration, intro)}`);
  if (amount > 0) filters.push(`afade=t=out:st=${Math.max(0, duration - amount)}:d=${Math.min(duration, amount)}`);
  return filters.length ? ['-af', filters.join(',')] : [];
}

async function renderClip({ getRenderer, fps, out, count, timeAt, audio, from, fade }) {
  const { evaluate } = await getRenderer();
  mkdirSync(path.dirname(out), { recursive: true });
  const temporary = `${out}.${process.pid}.part.mp4`;
  const duration = count / fps;
  const input = ['-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-'];
  const sound = audio ? ['-ss', String(from), '-t', String(duration), '-i', audio] : [];
  const mapping = audio ? ['-map', '0:v', '-map', '1:a'] : ['-map', '0:v', '-an'];
  const encoding = audio ? [...fades(duration, fade, 0.05), ...FF_AUDIO, '-shortest'] : [];
  const { proc, done } = startFFmpeg([...input, ...sound, ...mapping, ...FF_VIDEO, ...encoding, '-movflags', '+faststart', temporary], true);
  const started = performance.now();
  let frameMs = 0;
  try {
    for (let n = 0; n < count; n++) {
      const begun = performance.now();
      const encoded = await Promise.race([evaluate(`MV.frame(${timeAt(n)}, 'image/jpeg', 0.95)`), done.then(() => { throw new Error('ffmpeg exited before all frames'); })]);
      const buffer = Buffer.from(encoded, 'base64');
      frameMs += performance.now() - begun;
      if (!proc.stdin.write(buffer)) await Promise.race([
        once(proc.stdin, 'drain'), done.then(() => { throw new Error('ffmpeg exited before all frames'); }),
      ]);
      if (n % 120 === 0 || n === count - 1) console.log(`frame ${n + 1}/${count}  ${((performance.now() - started) / 1000).toFixed(1)}s`);
    }
    proc.stdin.end();
    await done;
    renameSync(temporary, out);
  } finally {
    if (proc.exitCode === null && proc.signalCode === null) {
      proc.kill();
      await done.catch(() => {});
    }
    rmSync(temporary, { force: true });
  }
  const elapsed = performance.now() - started;
  console.log(`wrote ${relative(out)} (${count} frames, ${duration.toFixed(3)}s, ${(frameMs / count).toFixed(1)} ms/frame capture, ${(elapsed / count).toFixed(1)} ms/frame with encoding)`);
  return { count, frameMs, elapsed };
}

function frameBoundary(seconds, fps) {
  return Math.ceil(seconds * fps - 1e-8);
}

function sourceFingerprint(page) {
  const hash = createHash('sha256').update(page).update(String(SCALE)).update('\0');
  function add(file) {
    if (!existsSync(file)) return;
    if (statSync(file).isDirectory()) {
      for (const child of readdirSync(file, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        if (child.isDirectory() || child.isFile()) add(path.join(file, child.name));
      }
    } else {
      hash.update(relative(file).split(path.sep).join('/')).update('\0').update(readFileSync(file)).update('\0');
    }
  }
  for (const file of [resolved('tools/render.mjs'), resolved(path.dirname(page)), resolved('art/motion'), GRID_FILE, resolved('music/String Theocracy.lrc')]) add(file);
  // Production art is large; fingerprint it by path, size and mtime instead of bytes.
  // Draft and batch folders never feed the page.
  function addMeta(dir) {
    if (!existsSync(dir)) return;
    for (const child of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, child.name);
      if (child.isDirectory()) { if (child.name !== 'draft' && child.name !== 'batches') addMeta(file); }
      else if (child.isFile()) {
        const { size, mtimeMs } = statSync(file);
        hash.update(relative(file).split(path.sep).join('/')).update(`\0${size}\0${mtimeMs}\0`);
      }
    }
  }
  addMeta(resolved('art/full'));
  return hash.digest('hex');
}

function completed(out, marker, key) {
  try {
    const metadata = JSON.parse(readFileSync(marker, 'utf8'));
    return metadata.key === key && metadata.size > 0 && metadata.size === statSync(out).size;
  } catch { return false; }
}

async function renderSegment({ range, out, fps, fingerprint, resume, getRenderer }) {
  const startFrame = frameBoundary(range.start, fps);
  const count = frameBoundary(range.end, fps) - startFrame;
  if (count < 1) throw new Error(`${range.id} has no frames at ${fps} fps`);
  const marker = `${out}.complete.json`;
  const key = JSON.stringify({ fingerprint, fps, startFrame, count });
  if (resume && completed(out, marker, key)) {
    console.log(`skip ${relative(out)} (${count} completed frames)`);
    return { out, count };
  }
  rmSync(marker, { force: true });
  const stats = await renderClip({ getRenderer, fps, out, count, timeAt: (n) => (startFrame + n) / fps });
  const markerTemp = `${marker}.${process.pid}.part`;
  try {
    writeFileSync(markerTemp, JSON.stringify({ key, size: statSync(out).size }));
    renameSync(markerTemp, marker);
  } finally { rmSync(markerTemp, { force: true }); }
  return { out, ...stats };
}

async function concatFull(segments, segmentDir, out, fps, audio, fade) {
  const list = path.join(segmentDir, `concat-${process.pid}.ffconcat`);
  const temp = `${out}.${process.pid}.part.mp4`;
  const duration = segments.reduce((sum, part) => sum + part.count, 0) / fps;
  const entries = segments.flatMap(({ out: file, count }) => [`file '${path.basename(file)}'`, `duration ${(count / fps).toFixed(9)}`]);
  writeFileSync(list, ['ffconcat version 1.0', ...entries, ''].join('\n'));
  mkdirSync(path.dirname(out), { recursive: true });
  const fadeDuration = Math.min(duration / 2, fade);
  const video = fadeDuration > 0
    ? ['-vf', `fade=t=in:st=0:d=${fadeDuration},fade=t=out:st=${duration - fadeDuration}:d=${fadeDuration}`, ...FF_VIDEO]
    : ['-c:v', 'copy'];
  try {
    await startFFmpeg(['-f', 'concat', '-safe', '1', '-i', list, '-i', audio, '-map', '0:v', '-map', '1:a',
      ...video, ...fades(duration, fadeDuration), ...FF_AUDIO, '-t', String(duration), '-movflags', '+faststart', temp]).done;
    renameSync(temp, out);
    console.log(`wrote ${relative(out)} (${duration.toFixed(3)}s, audio muxed once)`);
  } finally {
    rmSync(list, { force: true });
    rmSync(temp, { force: true });
  }
}

function selectSection(sections, value) {
  const [first, last = first, extra] = value.toUpperCase().split('-');
  const start = sections.find((section) => section.id === first);
  const end = sections.find((section) => section.id === last);
  if (extra != null || !start || !end || start.start > end.start) throw new Error(`Unknown section span: ${value}`);
  return { id: first === last ? first : `${first}-${last}`, start: start.start, end: end.end };
}

async function main() {
  const options = args();
  SCALE = number(options.scale ?? '2', 'scale', 1);
  if (SCALE === 2) FF_VIDEO.splice(FF_VIDEO.indexOf('medium'), 1, 'slow'), FF_VIDEO.splice(FF_VIDEO.indexOf('16'), 1, '14');
  if (options.help) {
    console.log('node tools/render.mjs --full [--out out/full.mp4] [--fade 0.5]\n' +
      'node tools/render.mjs --section A|G-I [--out out/part.mp4]\n' +
      'node tools/render.mjs --segment --from 95 --to 110 --out out/part.mp4\n' +
      'node tools/render.mjs --page mv/style_test_v2.html --from 95.205 --to 109.688 --out out/sample.mp4\n' +
      'Options: --fps, --browser, --audio, --segments-dir, --no-resume, --stills 0,3.08, --dir');
    return;
  }
  const segmented = options.full || options.segment || options.section != null;
  if (options.full && (options.section != null || options.segment || options.from != null || options.to != null)) throw new Error('--full uses all beatgrid sections');
  if (options.section != null && (options.from != null || options.to != null)) throw new Error('Choose --section or --from/--to');
  const page = options.page ?? (segmented ? FULL_PAGE : 'mv/index.html');
  const browser = browserPath(options.browser ?? process.env.MV_BROWSER);
  const fps = number(options.fps ?? '30', 'fps', 1);
  const fade = number(options.fade ?? (segmented ? '0' : '0.4'), 'fade');
  const audio = resolved(options.audio ?? process.env.MV_AUDIO ?? 'music/String Theocracy.mp3');
  if (!options.stills && (options.full || !segmented) && !existsSync(audio)) throw new Error(`Audio missing: ${audio}. Use --audio or MV_AUDIO.`);
  let renderer;
  const getRenderer = async () => (renderer ??= await openRenderer(page, browser));
  try {
    if (options.stills != null) {
      const { evaluate } = await getRenderer();
      const dir = resolved(options.dir ?? 'out/stills');
      mkdirSync(dir, { recursive: true });
      for (const cue of options.stills.split(',')) {
        const t = number(cue, 'stills');
        const data = await evaluate(`MV.frame(${t}, 'image/png')`);
        const file = path.join(dir, `t${t.toFixed(2).padStart(6, '0')}.png`);
        writeFileSync(file, Buffer.from(data, 'base64'));
        console.log('still', relative(file));
      }
      return;
    }

    if (!segmented) {
      const from = number(options.from ?? '0', 'from');
      const to = number(options.to ?? '10', 'to');
      const count = Math.round((to - from) * fps);
      if (count < 1) throw new Error('Empty render range');
      await renderClip({ getRenderer, fps, out: resolved(options.out ?? 'out/sample.mp4'), count,
        timeAt: (n) => from + n / fps, audio, from, fade });
      return;
    }

    const grid = JSON.parse(readFileSync(GRID_FILE, 'utf8'));
    const sections = sectionRanges(grid);
    const segmentDir = resolved(options['segments-dir'] ?? 'out/segments');
    const fingerprint = sourceFingerprint(page);
    const resume = !options['no-resume'];
    const segment = (range, out) => renderSegment({ range, out, fps, fingerprint, resume, getRenderer });
    if (options.full) {
      const out = resolved(options.out ?? 'out/full.mp4');
      if (sections.some(({ id }) => path.join(segmentDir, `${id}.mp4`) === out)) throw new Error('Full output path collides with a segment');
      const parts = [];
      for (const section of sections) parts.push(await segment(section, path.join(segmentDir, `${section.id}.mp4`)));
      await concatFull(parts, segmentDir, out, fps, audio, fade);
      const rendered = parts.filter((part) => part.elapsed != null);
      if (rendered.length) {
        const count = rendered.reduce((sum, part) => sum + part.count, 0);
        const avg = rendered.reduce((sum, part) => sum + part.elapsed, 0) / count;
        console.log(`render average: ${avg.toFixed(1)} ms/frame with encoding (${count} frames)`);
      }
    } else {
      const range = options.section != null ? selectSection(sections, options.section) : {
        id: 'range', start: number(options.from ?? '0', 'from'), end: number(options.to ?? String(grid.duration), 'to'),
      };
      if (range.end > grid.duration || range.end <= range.start) throw new Error(`Invalid segment range ${range.start}–${range.end}`);
      await segment(range, options.out ? resolved(options.out) : path.join(segmentDir, `${range.id}.mp4`));
    }
  } finally {
    await renderer?.close();
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
