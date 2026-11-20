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
def flux(lo,hi):
    m=np.log1p(300*mag[:,(fq>=lo)&(fq<hi)])
    f=np.maximum(m[1:]-m[:-1],0).sum(axis=1)
    f=np.convolve(f,np.ones(5)/5,mode='same')
    return f/np.percentile(f,99.5)
bands={'low':flux(40,250),'mid':flux(250,2500),'hi':flux(2500,10000)}
def peaks(f,th=0.35):
    w=int(0.04*SR/H); out=[]
    for i in range(w,len(f)-w):
        if f[i]>=th and f[i]==f[i-w:i+w+1].max():
            j=i
            while j>0 and f[j]>0.3*f[i]: j-=1
            out.append(((j+1)*H/SR+0.0105, float(f[i])))  # window centre bias 0.5*N/SR*... use rise start + ~10ms
    return out
P={b:peaks(f) for b,f in bands.items()}
hits={
 'curtain split':1.067,'curtain pull':1.585,'Lights beam':3.136,'crowd1':4.700,'crowd2':5.206,'crowd3':5.723,
 'pen touch':6.880,'experiment':7.183,'underline':8.045,'page half':8.826,'page open':9.343,
 'key1 stop':10.650,'key2 stop':11.154,'key3 stop':11.682,'key4 stop':12.196,
 'hook1':13.004,'hook2':13.503,'tug':13.991}
for name,c in hits.items():
    row=[]
    for b,pk in P.items():
        near=[(t,v) for t,v in pk if -0.16<=t-c<=0.12]
        if near:
            t,v=max(near,key=lambda a:a[1]); row.append(f"{b}:{t:.3f}({1000*(t-c):+.0f}ms,{v:.1f})")
    print(f"{name:14s} {c:7.3f}  "+"  ".join(row))
