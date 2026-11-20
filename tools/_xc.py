import subprocess, sys, numpy as np
SR=44100; H=int(SR/30)  # 30fps hop aligned to frames
raw=subprocess.run(["ffmpeg","-v","error","-i",r"music/String Theocracy.mp3","-t","14.6","-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True,check=True).stdout
x=np.frombuffer(raw,dtype=np.float32)
N=2048; win=np.hanning(N)
def env(shift_s=0):
    frames=[]
    for k in range(int(14.5*30)+2):
        c=int((k/30+shift_s)*SR)   # centre at frame time
        seg=x[max(0,c-N//2):c+N//2]
        if len(seg)<N: seg=np.pad(seg,(0,N-len(seg)))
        frames.append(np.abs(np.fft.rfft(seg*win)))
    m=np.log1p(200*np.array(frames))
    return np.maximum(m[1:]-m[:-1],0).sum(axis=1)
a=env()
def vid(path):
    w,h=192,108
    r=subprocess.run(["ffmpeg","-v","error","-i",path,"-vf",f"scale={w}:{h},format=gray","-f","rawvideo","-"],capture_output=True,check=True).stdout
    fr=np.frombuffer(r,dtype=np.uint8).reshape(-1,h,w).astype(np.float32)
    return np.abs(fr[1:]-fr[:-1]).mean(axis=(1,2))
def norm(v):
    v=np.log1p(v); v=v-np.convolve(v,np.ones(15)/15,mode='same'); return np.maximum(v,0)
for p in sys.argv[1:]:
    d=vid(p); n=min(len(a),len(d))
    A=norm(a[:n]); D=norm(d[:n]); res=[]
    for lag in range(-9,10):
        if lag>=0: s=np.dot(A[:n-lag],D[lag:])
        else: s=np.dot(A[-lag:],D[:n+lag])
        res.append((lag,round(float(s/np.sqrt(np.dot(A,A)*np.dot(D,D))),3)))
    best=max(res,key=lambda r:r[1])
    print(p,"best lag frames (video later than audio if +):",best,"| zero:",[r for r in res if r[0]==0][0])
