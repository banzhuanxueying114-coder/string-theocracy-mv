"""Beat grid for music/String Theocracy.mp3: exact tempo, beat phase, bar phase, drift, and where each lyric line falls.
Writes music/beatgrid.json. numpy only; audio decoded by ffmpeg."""
import json
import re
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'music/String Theocracy.mp3'
SR, HOP, NFFT = 22000, 220, 1024  # 100 analysis frames per second
FPS = SR / HOP

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(SRC), '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'],
                     capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype='<i2').astype(np.float32) / 32768
n = 1 + (len(x) - NFFT) // HOP
win = np.hanning(NFFT).astype(np.float32)
S = np.empty((n, NFFT // 2 + 1), dtype=np.float32)
for a in range(0, n, 2000):
    b = min(n, a + 2000)
    idx = np.arange(NFFT)[None, :] + HOP * np.arange(a, b)[:, None]
    S[a:b] = np.abs(np.fft.rfft(x[idx] * win, axis=1))
L = np.log1p(100 * S)
flux = np.maximum(np.diff(L, axis=0), 0)
T0 = (HOP + NFFT / 2) / SR  # time of flux[0]


def smooth(v, k):
    return np.convolve(v, np.ones(k) / k, mode='same')


def prep(v):
    v = v - smooth(v, 51)
    v = np.maximum(v, 0)
    g = np.exp(-0.5 * (np.arange(-6, 7) / 2.0) ** 2)
    return np.convolve(v, g / g.sum(), mode='same')


env = prep(flux.sum(1))
low = prep(flux[:, :7].sum(1))  # below ~150 Hz
rms = np.sqrt(smooth((x ** 2), SR // 2))
dur = len(x) / SR
print(f'duration {dur:.2f}s frames {len(env)}')

frames = np.arange(len(env))
lo_f, hi_f = int((14 - T0) * FPS), int((150 - T0) * FPS)


def score(period, phases, e=env):
    ks = np.arange(0, (hi_f - lo_f) / period)
    pos = lo_f + phases[:, None] + ks[None, :] * period
    return np.interp(pos, frames, e).mean(1)


best = []
for bpm in np.arange(60, 200, 0.05):
    p = 60 * FPS / bpm
    ph = np.arange(0, p, 1.0)
    s = score(p, ph)
    best.append((s.max(), bpm, ph[s.argmax()]))
best.sort(reverse=True)
print('coarse top:', [(round(b, 2), round(s, 3)) for s, b, _ in best[:8]])

# keep a tempo in 90..180 as the beat level
cands = [b for b in best if 90 <= b[1] <= 180]
bpm0 = cands[0][1]
fine = []
for bpm in np.arange(bpm0 - 0.6, bpm0 + 0.6, 0.002):
    p = 60 * FPS / bpm
    ph = np.arange(0, p, 0.25)
    s = score(p, ph)
    fine.append((s.max(), bpm, ph[s.argmax()]))
fine.sort(reverse=True)
_, bpm, phase = fine[0]
period = 60 * FPS / bpm
beat_sec = 60 / bpm
print(f'fine bpm {bpm:.3f}  beat {beat_sec*1000:.2f} ms  runner-ups {[round(b,3) for _, b, _ in fine[1:4]]}')

# first beat time >= 0
t_first = (lo_f + phase) / FPS + T0
t_first -= np.floor(t_first / beat_sec) * beat_sec
print(f'beat phase: first beat at {t_first:.3f}s')

# drift: best local phase per 16 s window with fixed period
print('drift (ms, local grid minus global grid):')
row = []
for w0 in range(8, int(dur) - 16, 8):
    a, b = int((w0 - T0) * FPS), int((w0 + 16 - T0) * FPS)
    ph = np.arange(-period / 2, period / 2, 0.25)
    k0 = np.ceil((a - (lo_f + phase)) / period)
    ks = np.arange(k0, k0 + (b - a) / period - 1)
    pos = lo_f + phase + ph[:, None] + ks[None, :] * period
    s = np.interp(pos, frames, env).mean(1)
    row.append(f'{w0}s:{ph[s.argmax()] / FPS * 1000:+.0f}')
print('  ' + '  '.join(row))

# beats and bar phase
beats = np.arange(t_first, dur, beat_sec)


def at(e, t, r=4):
    i = int(round((t - T0) * FPS))
    return e[max(0, i - r): i + r + 1].max() if 0 <= i < len(e) else 0.0


sel = [(i, t) for i, t in enumerate(beats) if 14 < t < 150]
for meter in (3, 4):
    lows = [np.mean([at(low, t) for i, t in sel if i % meter == o]) for o in range(meter)]
    alls = [np.mean([at(env, t) for i, t in sel if i % meter == o]) for o in range(meter)]
    print(f'meter {meter}: low-band by offset {[round(float(v), 3) for v in lows]}  full-band {[round(float(v), 3) for v in alls]}')
lows4 = [np.mean([at(low, t) for i, t in sel if i % 4 == o]) for o in range(4)]
bar_off = int(np.argmax(lows4))
print('assumed 4/4, downbeat offset (beat index mod 4):', bar_off)

# off-beat strength (swing / half-beat check)
half = np.mean([at(env, t + beat_sec / 2) for _, t in sel])
third = np.mean([at(env, t + beat_sec * 2 / 3) for _, t in sel])
on = np.mean([at(env, t) for _, t in sel])
print(f'on-beat {on:.3f}  half-beat {half:.3f}  swing(2/3) {third:.3f}')

bar0 = t_first + bar_off * beat_sec
bar_sec = 4 * beat_sec
while bar0 - bar_sec >= -1e-6:
    bar0 -= bar_sec
print(f'bar 1 starts at {bar0:.3f}s, bar length {bar_sec:.3f}s')

# loudness per bar
print('bar: start  dB')
line = []
nb = int((dur - bar0) / bar_sec)
for k in range(nb):
    a, b = int((bar0 + k * bar_sec) * SR), int((bar0 + (k + 1) * bar_sec) * SR)
    seg = x[max(a, 0):b]
    db = 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-6)
    line.append(f'{k + 1}:{bar0 + k * bar_sec:6.2f} {db:5.1f}')
for i in range(0, len(line), 6):
    print('  ' + ' | '.join(line[i:i + 6]))

# lyrics on the grid
print('lyrics (time  bar.beat  text):')
for m in re.finditer(r'\[(\d+):(\d+\.\d+)\]\s*(.*)', (ROOT / 'music/String Theocracy.lrc').read_text(encoding='utf-8')):
    t = int(m.group(1)) * 60 + float(m.group(2))
    q = (t - bar0) / beat_sec
    print(f'  {t:7.2f}  {int(q // 4) + 1:3d}.{q % 4 + 1:4.2f}  {m.group(3)}')

(ROOT / 'music/beatgrid.json').write_text(json.dumps({
    'bpm': round(float(bpm), 3), 'beatSec': beat_sec, 'firstBeat': float(t_first), 'bar1': float(bar0),
    'barSec': bar_sec, 'meter': 4, 'duration': dur}, indent=2), encoding='utf-8')
