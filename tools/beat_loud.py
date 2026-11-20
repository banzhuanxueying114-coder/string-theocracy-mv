"""Per-beat loudness and bass level on the 116 BPM grid, to place section boundaries and guess bar lines."""
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SR = 22050
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(ROOT / 'music/String Theocracy.mp3'), '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'],
                     capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype='<i2').astype(np.float32) / 32768
BEAT, T0 = 60 / 116.0, 0.033
nb = int((len(x) / SR - T0) / BEAT)
# crude low-pass (moving average ~ 6 ms twice) for bass
k = int(SR * 0.006)
lp = np.convolve(np.convolve(x, np.ones(k) / k, 'same'), np.ones(k) / k, 'same')
db, bass = [], []
for i in range(nb):
    a, b = int((T0 + i * BEAT) * SR), int((T0 + (i + 1) * BEAT) * SR)
    db.append(20 * np.log10(np.sqrt(np.mean(x[a:b] ** 2)) + 1e-6))
    # bass attack: energy in first 120 ms of the beat
    c = a + int(0.12 * SR)
    bass.append(20 * np.log10(np.sqrt(np.mean(lp[a:c] ** 2)) + 1e-6))
db, bass = np.array(db), np.array(bass)
print('beat index: time | dB of 8 beats   (beat 0 at 0.033 s, 0.5172 s each)')
for i in range(0, nb, 8):
    print(f'{i:3d} {T0 + i * BEAT:6.2f} | ' + ' '.join(f'{v:5.1f}' for v in db[i:i + 8]))
print('jumps (mean of next 4 beats minus mean of previous 4, |d| >= 2.5 dB):')
for i in range(4, nb - 4):
    d = db[i:i + 4].mean() - db[i - 4:i].mean()
    if abs(d) >= 2.5 and abs(d) >= max(abs(db[j:j + 4].mean() - db[j - 4:j].mean()) for j in (i - 1, i + 1)):
        print(f'  beat {i:3d}  {T0 + i * BEAT:6.2f}s  {d:+.1f} dB')
loud = [i for i in range(nb) if 36 < T0 + i * BEAT < 54 or 100 < T0 + i * BEAT < 122]
for m in (4,):
    print('bass attack by beat index mod 4 (loud sections):', [round(float(np.mean([bass[i] for i in loud if i % m == o])), 2) for o in range(m)])
    print('bass attack by beat index mod 8:', [round(float(np.mean([bass[i] for i in loud if i % 8 == o])), 2) for o in range(8)])
