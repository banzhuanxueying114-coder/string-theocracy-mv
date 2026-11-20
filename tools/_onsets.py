import subprocess, sys, numpy as np
SRC = "music/String Theocracy.mp3"
SR = 44100
raw = subprocess.run(["ffmpeg","-v","error","-i",SRC,"-t","18","-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True,check=True).stdout
x = np.frombuffer(raw, dtype=np.float32)
N, H = 2048, 256
win = np.hanning(N)
nfr = 1 + (len(x)-N)//H
idx = np.arange(N)[None,:] + H*np.arange(nfr)[:,None]
mag = np.abs(np.fft.rfft(x[idx]*win, axis=1))
freqs = np.fft.rfftfreq(N, 1/SR)
def flux(lo, hi):
    m = mag[:, (freqs>=lo)&(freqs<hi)]
    lm = np.log1p(200*m)
    f = np.maximum(lm[1:]-lm[:-1],0).sum(axis=1)
    return f
fps = SR/H
bands = {'low':(40,200),'mid':(200,2000),'hi':(2000,9000)}
for name,(lo,hi) in bands.items():
    f = flux(lo,hi)
    f = f/ (np.percentile(f,99)+1e-9)
    peaks=[]
    for i in range(2,len(f)-2):
        if f[i]>=0.45 and f[i]==f[i-2:i+3].max():
            peaks.append((round((i+1)*H/SR + N/2/SR - 0.0,3), round(float(f[i]),2)))
    # merge within 60ms
    out=[]
    for t,v in peaks:
        if out and t-out[-1][0]<0.06:
            if v>out[-1][1]: out[-1]=(t,v)
        else: out.append((t,v))
    print(name, [(t,v) for t,v in out if t<16])
