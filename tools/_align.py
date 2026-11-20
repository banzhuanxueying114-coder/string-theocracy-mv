import subprocess, sys, numpy as np
SR=22050
def aud(path, ss=None, t=None):
    cmd=["ffmpeg","-v","error"]
    if ss is not None: cmd+=["-ss",str(ss)]
    if t is not None: cmd+=["-t",str(t)]
    cmd+=["-i",path,"-vn","-ac","1","-ar",str(SR),"-f","f32le","-"]
    return np.frombuffer(subprocess.run(cmd,capture_output=True,check=True).stdout,dtype=np.float32)
src=aud(r"music/String Theocracy.mp3",0,20)
for f in ["A_motion_preview","A_retimed_preview","A_retimed_sync_check"]:
    a=aud(f"out/segments/{f}.mp4",None,10)
    n=len(a)
    # cross-correlate a against src via FFT
    L=1<<int(np.ceil(np.log2(len(src)+n)))
    c=np.fft.irfft(np.fft.rfft(src,L)*np.conj(np.fft.rfft(a,L)),L)
    k=int(np.argmax(c[:len(src)]))
    print(f,"audio offset into source = %.3f s"%(k/SR))
