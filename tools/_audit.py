import subprocess, numpy as np
SR=44100
raw=subprocess.run(["ffmpeg","-v","error","-i",r"music/String Theocracy.mp3","-t","16.5","-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True,check=True).stdout
x=np.frombuffer(raw,dtype=np.float32)
N,H=1024,64
win=np.hanning(N)
nfr=1+(len(x)-N)//H
idx=np.arange(N)[None,:]+H*np.arange(nfr)[:,None]
mag=np.abs(np.fft.rfft(x[idx]*win,axis=1))
fq=np.fft.rfftfreq(N,1/SR)
def onsets(lo,hi,th=0.5):
    m=np.log1p(300*mag[:,(fq>=lo)&(fq<hi)])
    f=np.maximum(m[1:]-m[:-1],0).sum(axis=1)
    k=int(0.012*SR/H)  # smooth 12ms
    f=np.convolve(f,np.ones(5)/5,mode='same')
    f=f/np.percentile(f,99.5)
    res=[]
    w=int(0.05*SR/H)
    for i in range(w,len(f)-w):
        if f[i]>=th and f[i]==f[i-w:i+w+1].max():
            # onset ~ rise start: walk back to 30% of peak
            j=i
            while j>0 and f[j]>0.3*f[i]: j-=1
            res.append((round((j+1)*H/SR+ (N*0.25)/SR,3),round(float(f[i]),2)))
    return res
all_on=sorted(onsets(60,9000,0.45))
cues={
 'curtain':1.067,'curtainPull':1.585,'light(Lights)':3.136,'on':3.654,
 'crowd1':4.700,'crowd2':5.206,'crowd3':5.723,'Dont':5.34,'missa':5.72,'moment':5.98,
 'pen/Of':6.880,'experiment':7.183,'underline':8.045,
 'page1':8.826,'page2':9.343,'Oh':9.74,'is':9.99,'strange':10.12,
 'key1':10.391,'key1stop':10.650,'key2':10.900,'key2stop':11.154,'key3':11.413,'key3stop':11.682,'key4':11.930,'key4stop':12.196,
 'hook1':13.004,'hook2':13.503,'tug':13.991,'Keep':13.99,'your':14.20,'eyes':14.43,'buttered':14.74,'till':15.08,'the':15.36,'end':15.67,
 'Open':0.54,'the2':0.82,'curtains':0.99,
}
for name,c in sorted(cues.items(),key=lambda kv:kv[1]):
    near=[(t,v) for t,v in all_on if abs(t-c)<=0.16]
    best=max(near,key=lambda tv:tv[1]) if near else None
    print(f"{name:14s} cue {c:7.3f}  nearest strong onset:", (f"{best[0]:.3f} (cue-onset = {1000*(c-best[0]):+.0f} ms, str {best[1]})" if best else 'none'))
