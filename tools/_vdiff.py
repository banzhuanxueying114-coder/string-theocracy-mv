import subprocess, sys, numpy as np
path=sys.argv[1]; w,h=192,108
raw=subprocess.run(["ffmpeg","-v","error","-i",path,"-vf",f"scale={w}:{h},format=gray","-f","rawvideo","-"],capture_output=True,check=True).stdout
fr=np.frombuffer(raw,dtype=np.uint8).reshape(-1,h,w).astype(np.float32)
d=np.abs(fr[1:]-fr[:-1]).mean(axis=(1,2))
print(len(fr),"frames")
# peaks
th=np.percentile(d,90)
out=[]
for i in range(1,len(d)-1):
    if d[i]>=th and d[i]>=d[i-1] and d[i]>=d[i+1]:
        out.append((round((i+1)/30,3),round(float(d[i]),1)))
print(out)
np.save("out/tmpA/d.npy",d)
