from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[1]
p=root/'mv/sample.js'
shutil.copy2(p,root/'mv/sample_v3.js')
s=p.read_text(encoding='utf-8')
s=s.replace('view, layer, diffSprite','view, layer, mesh, diffSprite')
s=s.replace("'g4_hand_seam', 'g5_hand_half'", "'g6_believer', 'g5_hand_bare', 'i5_turn', ...['g4_hand','g4_plate','i8_arm','i8_plate','i5_hand','i5_plate','i7_doll','i7_plate','g5_flap'].map(x => `clean/${x}`), 'g4_hand_seam', 'g5_hand_half'")
a=s.index('    const o =',s.index("shot('G4'")); b=s.index('    dust(4',a)
s=s[:a]+'''    const o = { z: lerp(1.05, 1.16, ease(u)), fx: 0.5, fy: 0.3 };
    const wrist = [.763,.672], p=ease(prog(t,beat(185.5),beat(188))), rot=-.23*p;
    const m=view('clean/g4_plate',o);
    layer('clean/g4_hand',o,{pivot:wrist,rot});
    [[[.445,.3],[.65,.48]],[[.52,.2],[.69,.50]],[[.37,.34],[.47,.76]]].forEach(([a,b],i)=>
      string(m(...a),m(...(i<2?turn(b,wrist,rot):b)),{bend:sway(t,i,3),text:true,size:11,offset:i*7,alpha:.85}));
'''+s[b:]
a=s.index('    const hit =',s.index("shot('G5'"));b=s.index('    const p = prog(t, hit',a)
s=s[:a]+'''    const hit=beat(193), k=expoOut(prog(t,hit,hit+.5));
    const o={z:lerp(1.06,1.15,u),fx:.45,fy:.55}, m=view('g5_hand_bare',o);
    // Only a loose cloth tail falls. The wrist and mechanical fingers never travel with it.
    const fall=easeIn(prog(t,beat(191.5),hit+.15));
    if(fall<1) layer('clean/g5_flap',o,{pivot:[.39,.48],tx:-.04*fall,ty:.75*fall,rot:-.6*fall});
'''+s[b:]
a=s.index('    const [sx, sy]',s.index("shot('G6'")); b=s.index('    dust(6',a)
s=s[:a]+'''    const q=ease(prog(t,beat(195.2),beat(196.2)));
    const o={z:lerp(1.13,1.09,u),fx:.52,fy:.38}, m=view('g6_believer',o);
    // The face is uncovered by a sliding hood opening; no false face-shaped sprite flies away.
    g.save();
    const left=m(.30,0), right=m(.83,.66), cy=m(.5,.34)[1];
    const hh=(right[1]-left[1])*(1-q);
    g.beginPath();g.rect(left[0],cy-hh/2,right[0]-left[0],hh);g.clip();
    view('g6_hooded',o);g.restore();
    [[[.44,-.2],[.47,.1]],[[.6,-.2],[.585,.16]]].forEach(([a,b],i)=>string(m(...a),m(...b),{bend:sway(t,i,2),w:1.2,alpha:.65}));
'''+s[b:]
s=s.replace("{ z: 1.2, fx: 0.5, fy: 0.72, dy: lerp(-70, 0, down) }","{ z: 1.2, fx: 0.5, fy: 0.72 }")
a=s.index('    const o =',s.index("shot('I5'")); b=s.index('    [[0.5, 0.555',a)
s=s[:a]+'''    const o={z:lerp(1.05,1.10,u),fx:.55,fy:.4}, m=view('clean/i5_plate',o);
    const p=ease(prog(t,beat(216.2),beat(218.3))), wr=[.484,.398];
    mesh('clean/i5_hand',o,[.43,.02,.69,.44],pt=>{
      const w=ease(clamp((.42-pt[1])/.17));
      const dest=turn(pt,wr,-.16*(1-p));
      return [lerp(pt[0],dest[0],w),lerp(pt[1],dest[1],w)];
    },18,24);
'''+s[b:]
a=s.index('    const m = view(',s.index("shot('I7'")); b=s.index('    dust(11',a)
s=s[:a]+'''    const o={z:1.12,fx:.52,fy:.5}, m=view('clean/i7_plate',o);
    const fall=-.20*(1-easeOut(prog(lt,0,.72)))+.008*Math.sin((lt-.72)*13)*Math.exp(-Math.max(0,lt-.72)*5)*prog(lt,.72,.82);
    const drift=.003*Math.sin(lt*3);
    layer('clean/i7_doll',o,{ty:fall,tx:drift,rot:.007*Math.sin(lt*3),pivot:[.5,.15]});
    [[.5,.49,.14],[.47,.46,.27],[.55,.55,.29],[.44,.44,.5],[.57,.57,.48]].forEach(([tx,x,y],i)=>string([m(tx,0)[0],-20],m(x+drift,y+fall),{bend:sway(t,i,2),text:true,size:11,offset:i*5,alpha:.85}));
'''+s[b:]
a=s.index('    const o =',s.index("shot('I8'")); b=s.index('    [[0.74,',a)
s=s[:a]+'''    const o={z:lerp(1.04,1.10,u),fx:.5,fy:.4},m=view('clean/i8_plate',o);
    const p=ease(prog(t,beat(226.35),beat(229))), sh=[.35,.62],el=[.46,.66],wr=[.56,.51];
    // Continuous skinning: shoulder, elbow, then wrist, each with a delayed settle.
    const a=.26*(1-p), b=.72*(1-ease(prog(t,beat(226.6),beat(228.7))));
    mesh('clean/i8_arm',o,[.32,.34,.68,.75],pt=>{
      const fore=ease(prog(pt[0],.433,.51));
      const distal=turn(pt,el,b), bent=[lerp(pt[0],distal[0],fore),lerp(pt[1],distal[1],fore)];
      return turn(bent,sh,a);
    },28,22);
'''+s[b:]
p.write_text(s,encoding='utf-8')
print('v3 source preserved; v4 motion installed')
