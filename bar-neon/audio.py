"""Sonido ambiente de bar sintetizado (sin muestras): zumbido de neón, jazz suave, encendedor, caladas, exhalación y vaso."""
import sys, wave
import numpy as np
SR=48000; DUR=157/24; N=int(SR*DUR); t=np.arange(N)/SR
rng=np.random.default_rng(8); out=np.zeros((N,2))
def lp(x,fc):
    k=np.exp(-2*np.pi*fc/SR); y=np.empty_like(x); a=0.0
    for i,v in enumerate(x): a=(1-k)*v+k*a; y[i]=a
    return y
def hp(x,fc): return x-lp(x,fc)
def bp(x,lo,hi): return lp(hp(x,lo),hi)
def add(sig,start,pan=0.0,gain=1.0):
    i=int(start*SR); n=min(len(sig),N-i)
    if n<=0: return
    out[i:i+n,0]+=sig[:n]*gain*np.sqrt(.5*(1-pan)); out[i:i+n,1]+=sig[:n]*gain*np.sqrt(.5*(1+pan))
def smooth(x,a,b,c,d):  # envolvente trapezoidal
    return np.interp(x,[a,b,c,d],[0,1,1,0],left=0,right=0)
# --- ambiente: ruido de sala + zumbido de neón con apagones breves
room=lp(rng.standard_normal(N),500); room/=np.abs(room).max()
buzz=sum(np.sin(2*np.pi*120*k*t+k)*a for k,a in [(1,1),(2,.45),(3,.3),(5,.15)])
dip=1-0.9*(smooth(t,2.70,2.72,2.92,2.95)*(np.sin(t*190)>0))-0.8*smooth(t,4.0,4.01,4.07,4.09)
add(room,0,0,.05); add(buzz*dip*(0.7+0.3*np.sin(2*np.pi*.4*t)),0,0,.018)
# chasquidos eléctricos en los parpadeos
for tt in (2.71,2.78,2.86,2.93,4.0,4.05):
    n=int(.012*SR); add(rng.standard_normal(n)*np.exp(-np.arange(n)/(.003*SR)),tt,.1,.12)
# --- jazz lejano: acordes Dm9 -> G13 con tremolo y notas sueltas tipo piano eléctrico
def ep(f,l=1.6):
    n=int(l*SR); x=np.arange(n)/SR
    s=np.sin(2*np.pi*f*x)+.35*np.sin(2*np.pi*2*f*x)*np.exp(-x/.5)+.12*np.sin(2*np.pi*4.01*f*x)*np.exp(-x/.15)
    return s*np.minimum(x/.01,1)*np.exp(-x/.7)
for tt,notes in [(0.2,(146.8,220,261.6,329.6)),(2.0,(196,246.9,293.7,349.2)),(3.8,(146.8,220,261.6,329.6)),(5.4,(196,246.9,293.7))]:
    for k,f in enumerate(notes): add(ep(f,2.2),tt+k*.05,-.3+k*.2,.035)
for tt,f in [(.9,587.3),(1.5,523.3),(2.9,440),(4.5,587.3),(5.1,698.5)]: add(ep(f,1.2),tt,.25,.02)
# --- encendedor / ignición (≈1.2 s)
n=int(.07*SR); add(hp(rng.standard_normal(n),3000)*np.exp(-np.arange(n)/(.02*SR)),1.15,0,.12)
n=int(.5*SR); x=np.arange(n)/SR; add(bp(rng.standard_normal(n),800,4000)*smooth(x,0,.03,.15,.5),1.2,0,.05)
# --- roce de tela al subir y bajar la mano
for tt,l in [(.7,1.3),(3.95,1.3)]:
    n=int(l*SR); x=np.arange(n)/SR; add(lp(rng.standard_normal(n),900)*smooth(x,0,.5,.8,l),tt,-.4,.07)
# --- calada: inhalación + crepitar de la brasa
n=int(1.0*SR); x=np.arange(n)/SR; add(bp(rng.standard_normal(n),600,2600)*smooth(x,0,.5,.8,1.0),2.2,0,.08)
cr=np.zeros(int(1.3*SR)); idx=rng.integers(0,len(cr),60)
for i in idx: cr[i]=rng.uniform(.3,1)*(1 if rng.random()>.5 else -1)
add(hp(lp(cr,7000),1500)*smooth(np.arange(len(cr))/SR,0,.1,1.0,1.3)*14,2.3,.2,.07)
# --- exhalación
n=int(1.4*SR); x=np.arange(n)/SR; add(bp(rng.standard_normal(n),900,3200)*smooth(x,0,.35,.7,1.4),3.55,0,.07)
# --- vaso (≈5.5 s)
n=int(.9*SR); x=np.arange(n)/SR
add((np.sin(2*np.pi*3150*x)+.6*np.sin(2*np.pi*4720*x)+.3*np.sin(2*np.pi*6900*x))*np.exp(-x/.18)*np.minimum(x/.001,1),5.55,-.55,.05)
# --- reverb corta de sala, mezcla y limitador suave
irn=int(SR*1.2); ir=rng.standard_normal((irn,2))*np.exp(-np.arange(irn)/(.3*SR))[:,None]; ir/=np.sqrt((ir**2).sum(0))
M=1<<int(np.ceil(np.log2(N+irn)))
wet=np.stack([np.fft.irfft(np.fft.rfft(out[:,c],M)*np.fft.rfft(ir[:,c],M),M)[:N] for c in range(2)],1)
mix=out+.3*wet; mix*=(np.minimum(t/.15,1)*np.minimum((DUR-t)/.4,1))[:,None]
mix=np.tanh(mix/np.abs(mix).max()*1.15)*.85
with wave.open(sys.argv[1],'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix*32767).astype('<i2').tobytes())
