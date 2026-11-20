// An independent, deterministic vector motion study. No raster character assets.
const cv=document.querySelector('canvas'),g=cv.getContext('2d');
const C={ink:'#171c1b',paper:'#e7dfc8',muted:'#959984',orange:'#cc6239',gold:'#b59b64',dark:'#303a35'};
const clamp=x=>Math.max(0,Math.min(1,x)),s=(t,a,b)=>{let u=clamp((t-a)/(b-a));return u*u*(3-2*u)},mix=(a,b,u)=>a+(b-a)*u;
const pt=(x,y)=>({x,y});
function path(d,fill,stroke=null,w=2){g.beginPath();g.fillStyle=fill;const p=new Path2D(d);if(fill)g.fill(p);if(stroke){g.strokeStyle=stroke;g.lineWidth=w;g.stroke(p)}}
function line(a,b,col=C.paper,w=2){g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.strokeStyle=col;g.lineWidth=w;g.stroke()}
function ellipse(x,y,rx,ry,col){g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=col;g.fill()}
function text(txt,x,y,size,col=C.paper,font='Georgia'){g.fillStyle=col;g.font=`${size}px ${font}`;g.fillText(txt,x,y)}
function ik(a,b,l1,l2,side=1){const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(.001,Math.hypot(dx,dy));const len=Math.min(d,l1+l2-.01),base=Math.atan2(dy,dx),q=Math.acos(Math.max(-1,Math.min(1,(l1*l1+len*len-l2*l2)/(2*l1*len))));return pt(a.x+Math.cos(base+side*q)*l1,a.y+Math.sin(base+side*q)*l1)}
function limb(a,b,wa,wb,fill){const angle=Math.atan2(b.y-a.y,b.x-a.x),nx=-Math.sin(angle),ny=Math.cos(angle);path(`M${a.x+nx*wa} ${a.y+ny*wa} Q${(a.x+b.x)/2+nx*wa} ${(a.y+b.y)/2+ny*wa} ${b.x+nx*wb} ${b.y+ny*wb} L${b.x-nx*wb} ${b.y-ny*wb} Q${(a.x+b.x)/2-nx*wa} ${(a.y+b.y)/2-ny*wa} ${a.x-nx*wa} ${a.y-ny*wa}Z`,fill,C.ink,3)}
function backdrop(t){g.fillStyle=C.ink;g.fillRect(0,0,1920,1080);
// Architectural repetition stays still so body movement is unambiguous.
for(let i=0;i<7;i++){const x=115+i*282;path(`M${x-108} 902 L${x-108} 330 Q${x-108} 220 ${x} 112 Q${x+108} 220 ${x+108} 330 L${x+108} 902`,null,C.dark,3);line(pt(x,170),pt(x,902),C.dark,2)}
g.save();g.translate(1130,370);for(let i=0;i<16;i++){g.save();g.rotate(i*Math.PI/8);path('M-12 -150 L-29 -206 L0 -259 L29 -206 L12 -150Z',i%2?C.dark:'#555b47');g.restore()}for(const r of [142,272,286]){g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.strokeStyle=C.gold;g.lineWidth=1.4;g.stroke()}g.restore();
path('M0 908 L1920 908 L1920 1080 L0 1080Z','#202724');line(pt(90,908),pt(1830,908),C.gold,2);
for(let i=0;i<12;i++)line(pt(80+i*164,909),pt(-450+i*260,1080),C.dark,1);
// Restrained print hatching; fixed in screen space, no animated noise.
g.globalAlpha=.12;for(let i=0;i<100;i++){let x=(i*173)%1920,y=(i*271)%1080;line(pt(x,y),pt(x+16,y-7),C.paper,1)}g.globalAlpha=1;
text('STRING THEOCRACY',110,105,23,C.paper);text('MOTION STUDY / 01',110,139,13,C.gold,'monospace');
}
function hand(w,rot,open,t){g.save();g.translate(w.x,w.y);g.rotate(rot);path('M-9 8 Q-13 -8 -9 -22 Q0 -31 10 -20 L12 3 Q5 13 -9 8Z',C.paper,C.ink,2.5);
// Each finger is an articulated polyline, with continuous knuckle flexion.
for(let i=0;i<4;i++){const x=-8+i*5.5,spread=(i-1.5)*.24*open,ang=-Math.PI/2+spread;const length=[22,29,27,21][i],curl=(1-open)*2.1;
let a=pt(x,-19),b=pt(a.x+Math.cos(ang)*length*.58,a.y+Math.sin(ang)*length*.58),c=pt(b.x+Math.cos(ang+curl)*length*.42,b.y+Math.sin(ang+curl)*length*.42);
g.lineCap='round';line(a,b,C.ink,6.8);line(b,c,C.ink,6.8);line(a,b,C.paper,3.5);line(b,c,C.paper,3.5)}
const thumb=pt(14+open*6,-11-open*9);line(pt(8,0),thumb,C.ink,8);line(pt(8,0),thumb,C.paper,4);g.restore()}
function arm(a,w,open,front,awake,t){let e=ik(a,w,94,91,front?1:-1);limb(a,e,front?25:20,16,front?C.paper:C.muted);ellipse(a.x,a.y,21,23,front?C.paper:C.muted);limb(e,w,14,8,front?C.paper:C.muted);ellipse(e.x,e.y,11,11,front?C.paper:C.muted);
if(awake<.99){g.globalAlpha=1-awake;ellipse(e.x,e.y,7,7,C.ink);ellipse(e.x,e.y,4,4,C.gold);g.globalAlpha=1}
const ang=Math.atan2(w.y-e.y,w.x-e.x)+Math.PI/2;hand(w,ang,open,t);return e}
function leg(hip,foot,back=false){let knee=ik(hip,pt(foot.x,foot.y-8),102,102,-1);limb(hip,knee,15,11,back?C.muted:C.paper);ellipse(knee.x,knee.y,10,10,back?C.muted:C.paper);limb(knee,pt(foot.x,foot.y-9),10,6,back?C.muted:C.paper);path(`M${foot.x-7} ${foot.y-15} Q${foot.x+7} ${foot.y-10} ${foot.x+27} ${foot.y-6} Q${foot.x+34} ${foot.y+2} ${foot.x+17} ${foot.y+3} L${foot.x-12} ${foot.y+2}Z`,back?C.muted:C.paper,C.ink,3)}
function character(t){const lift=s(t,.3,1.65),release=s(t,2.02,2.35),awake=s(t,2.35,3.25),reach=s(t,2.8,3.9),step=s(t,4.25,5.6),swing=s(t,4.35,5.3),land=s(t,5.1,5.65);
const root=step*66, bob=-Math.sin(step*Math.PI)*9+Math.sin(release*Math.PI)*8;
g.save();g.translate(1040+root,900+bob);g.scale(1.18,1.18);
const wrist=pt(mix(mix(43,154,lift),168,reach),mix(mix(-271,-421,lift),-360,release)+Math.sin(t*7)*1.4*(1-release));
const shoulder=pt(13,-372),backW=pt(-44+Math.sin(t*2)*2,-254+awake*7);
// Hair ribbons deform behind the body, with phase delay along their length.
for(let i=0;i<5;i++){const x=-58+i*20,flow=Math.sin(t*2.8-i*.6)*5+Math.sin(step*Math.PI)*(-24-i*3);path(`M${x} -481 Q${x-36} -361 ${x-12+flow} -240 Q${x+12+flow} -164 ${x-42+flow} -120 Q${x+37+flow} -150 ${x+32+flow} -235 Q${x+13} -355 ${x+26} -475Z`,i%2?C.orange:'#a84b30',C.ink,3);line(pt(x+12,-410),pt(x+11+flow,-251),C.gold,1)}
arm(pt(-37,-368),backW,.25+awake*.35,false,awake,t);
// Foot locations are world-anchored during contact, independent of the translating pelvis.
const rear=pt(-22-root/1.18,0),front=pt(24+swing*112-root/1.18,-Math.sin(swing*Math.PI)*35);
leg(pt(-22,-200),rear,true);leg(pt(10,-202),front,false);
const hem=Math.sin(t*2.3)*3-Math.sin(step*Math.PI)*14;
path(`M-47 -337 Q-57 -291 -88 -226 L${-110+hem} -132 Q-32 -108 67 -135 L${48+hem*.4} -231 Q28 -290 24 -337Z`,C.ink,C.paper,3);
path(`M-29 -327 Q-37 -268 -67 -157 Q-11 -141 45 -158 Q24 -267 16 -327Z`,C.paper,C.ink,3);
path('M-14 -314 L-19 -165 L8 -161 L7 -314Z',C.orange);
for(let i=0;i<5;i++){let x=-69+i*29;path(`M${x} -164 l7 11 -9 9 -7 -11Z`,C.gold)}
path('M-44 -386 Q-59 -368 -46 -332 L25 -332 Q34 -355 12 -388 L-7 -397Z',C.paper,C.ink,3);
path('M-39 -379 L-30 -336 L15 -336 L11 -377 L-7 -356Z',C.ink);path('M-43 -335 L27 -335 L30 -318 L-47 -318Z',C.ink,C.gold,2);
path('M-14 -402 L-15 -381 L-1 -366 L12 -386 L9 -411Z',C.paper,C.ink,3);
// A slight head lift is independent of the torso.
g.save();g.translate(-3,-445);g.rotate(mix(.16,-.05,awake));
path('M-44 -24 Q-51 -65 -10 -72 Q31 -70 35 -25 L28 23 Q19 50 -3 51 Q-31 42 -40 13Z',C.orange,C.ink,3);
path('M-19 -40 Q15 -47 24 -24 L27 -5 L39 5 L27 11 L25 30 Q15 43 1 39 L-18 25 L-29 -6Z',C.paper,C.ink,3);
path('M-38 -41 Q-13 -67 23 -42 L28 -10 L8 -25 L10 -5 L-5 -21 L-19 -5 L-20 26 L-34 9Z',C.orange,C.ink,3);
line(pt(11,-5),pt(25,-2),C.ink,3);ellipse(21,-1,2.4,3.5,C.ink);line(pt(17,23),pt(25,22-awake*2),C.orange,2);
g.globalAlpha=1-awake;path('M-6 23 L3 30 L0 36',null,C.ink,1.5);g.globalAlpha=1;
// Flower is a reusable geometric emblem, not tiny costume embroidery.
g.save();g.translate(-25,-39);for(let i=0;i<8;i++){g.rotate(Math.PI/4);ellipse(0,-12,4,9,C.paper)}ellipse(0,0,7,7,C.ink);ellipse(0,0,3,3,C.orange);g.restore();g.restore();
arm(shoulder,wrist,.1+.9*s(t,2.65,3.65),true,awake,t);
// Strings attach to the actual animated wrist and collapse after the cut.
if(t<2.02){line(pt(110,-730),wrist,C.gold,1.4);line(pt(-65,-730),backW,C.gold,1.1)}else if(t<3.4){const u=t-2.02;path(`M110 ${-730-u*310} Q${190+u*120} ${-530-u*100} ${wrist.x+u*50} ${wrist.y-u*450}`,null,C.gold,1.6);path(`M${wrist.x} ${wrist.y} Q${wrist.x+90*u} ${wrist.y+70} ${wrist.x+80*u} ${wrist.y+100+u*130}`,null,C.gold,1.2)}
// Scissors visibly close at the string, then leave the composition.
if(t>1.55&&t<2.65){let enter=s(t,1.55,1.9),exit=s(t,2.13,2.65);g.save();g.translate(wrist.x+12+160*(1-enter)+exit*240,wrist.y-66-exit*110);g.rotate(-.5);let blade=mix(.48,.035,s(t,1.9,2.05));for(let side of [-1,1]){g.save();g.rotate(side*blade);path('M0 0 L-10 -66 L6 -10 L4 28 L-4 28Z',C.paper,C.ink,2);g.beginPath();g.ellipse(0,38,10,14,0,0,Math.PI*2);g.strokeStyle=C.orange;g.lineWidth=5;g.stroke();g.restore()}ellipse(0,0,4,4,C.orange);g.restore()}
g.restore();return {awake,step}}
function draw(raw){const t=raw>=100?raw-102.5:raw;g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;backdrop(t);const state=character(t);
let stage=t<2.02?'01 / PULLED':t<4.25?'02 / RELEASED':'03 / SELF-DIRECTED';text(stage,112,747,16,C.gold,'monospace');
if(t<2.02){text('Dance',105,365,99);text('for me.',105,467,99);line(pt(112,504),pt(530,504),C.gold,2);text('THE WRIST LEADS.',112,546,17,C.muted,'monospace')}
else {const u=s(t,2.02,2.32);g.save();g.globalAlpha=u;text('Cut',105,365,112,C.orange);text('it off.',105,478,112,C.orange);line(pt(112,514),pt(530,514),C.orange,2);text(t<4.25?'THE HAND OPENS.':'THE BODY CHOOSES.',112,555,17,C.paper,'monospace');g.restore()}
text('INK / IVORY / VERMILION',112,981,13,C.muted,'monospace');text('VECTOR PERFORMANCE   •   6.2 s',1390,981,13,C.muted,'monospace');
// Progress marks are a small study annotation, away from the artwork.
for(let i=0;i<3;i++){g.fillStyle=t>=[0,2.02,4.25][i]?C.orange:C.dark;g.fillRect(112+i*144,802,128,3)}return stage}
window.MV={ready:Promise.resolve(),info:()=>({duration:6.2,images:0,technique:'procedural vector / articulated limbs / anchored feet'}),draw,frame(t,mime='image/jpeg',q=.95){draw(t);return cv.toDataURL(mime,q).split(',')[1]}};
const seek=document.querySelector('#seek'),button=document.querySelector('#play'),label=document.querySelector('#time');let playing=true,last=0,time=0;const query=new URLSearchParams(location.search);if(query.has('t')){playing=false;time=Number(query.get('t'));document.querySelector('#controls').style.display='none'}
button.onclick=()=>{playing=!playing;button.textContent=playing?'Pause':'Play'};seek.oninput=()=>{time=+seek.value;playing=false;button.textContent='Play'};
function loop(ms){if(playing&&last)time=(time+(ms-last)/1000)%6.2;last=ms;draw(time);seek.value=time;label.textContent=time.toFixed(2)+' / 6.20';requestAnimationFrame(loop)}requestAnimationFrame(loop);
