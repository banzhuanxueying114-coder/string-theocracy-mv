"""Rough tempo + loudness-envelope analysis of the song (numpy only)."""
import subprocess, sys
import numpy as np

SRC = "music/String Theocracy.mp3"
SR = 22050

raw = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", SRC, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
    capture_output=True, check=True,
).stdout
x = np.frombuffer(raw, dtype=np.float32)
print(f"samples={len(x)} dur={len(x)/SR:.2f}s")

# Spectral-flux onset envelope
N, H = 1024, 256
win = np.hanning(N)
nfr = 1 + (len(x) - N) // H
idx = np.arange(N)[None, :] + H * np.arange(nfr)[:, None]
mag = np.abs(np.fft.rfft(x[idx] * win, axis=1))
logm = np.log1p(100 * mag)
flux = np.maximum(logm[1:] - logm[:-1], 0).sum(axis=1)
flux = flux - np.convolve(flux, np.ones(43) / 43, mode="same")
flux = np.maximum(flux, 0)
fps = SR / H

# Tempo by autocorrelation over 60-200 BPM
ac = np.correlate(flux, flux, mode="full")[len(flux) - 1:]
cands = []
for bpm in np.arange(60, 200.01, 0.25):
    lag = 60 * fps / bpm
    s = sum(np.interp(lag * k, np.arange(len(ac)), ac) for k in (1, 2, 3, 4))
    cands.append((s, bpm))
cands.sort(reverse=True)
print("tempo candidates (score, bpm):")
for s, b in cands[:8]:
    print(f"  {b:7.2f}  {s:.0f}")

# Loudness per second-ish window, to see the song's sections
rms = np.sqrt((x[idx] ** 2).mean(axis=1))
step = int(round(fps * 2))
print("\n2s loudness blocks (dB rel. max):")
blocks = [rms[i:i + step].mean() for i in range(0, len(rms), step)]
mx = max(blocks)
for i, b in enumerate(blocks):
    db = 20 * np.log10(b / mx + 1e-9)
    bar = "#" * max(0, int(40 + db * 2))
    print(f"{i*2:4d}s {db:6.1f} {bar}")
