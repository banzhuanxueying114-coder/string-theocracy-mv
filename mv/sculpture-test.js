import * as T from './three.module.js';
// Procedural sculpture: actual depth, lights, occlusion and articulated arm.
const canvas=document.querySelector('#c');
const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setSize(1920,1080);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const scene=new T.Scene();scene.background=new T.Color('#172326');scene.fog=new T.Fog('#172326',12,30);
const camera=new T.PerspectiveCamera(30,1920/1080,.1,80);camera.position.set(6.8,4.4,12.6);camera.lookAt(.1,3.15,0);
const mat=(c,r=1,metal=0)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:metal});
const skin=mat('#ead5b7',.87),skinShade=mat('#cdb697'),hair=mat('#a84b27',.88),hairHi=mat('#cf6e36',.87),hairDark=mat('#713923'),dress=mat('#253d3d'),cream=mat('#d5ceb5'),gold=mat('#ac8854',.48,.45),black=mat('#30302d'),lip=mat('#a76855'),stone=mat('#314343');
function mesh(geo,m,parent=scene){const o=new T.Mesh(geo,m);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function ell(parent,m,x,y,z,sx,sy,sz){const o=mesh(new T.SphereGeometry(1,40,28),m,parent);o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o}
function tube(parent,points,r,m,radii){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const geo=new T.TubeGeometry(curve,56,r,8,false);if(radii){const pos=geo.attributes.position;const frames=curve.computeFrenetFrames(56,false);for(let i=0;i<=56;i++){const p=curve.getPointAt(i/56),rr=radii(i/56);for(let j=0;j<=8;j++){const a=j/8*Math.PI*2,v=frames.normals[i].clone().multiplyScalar(-Math.cos(a)*rr).addScaledVector(frames.binormals[i],Math.sin(a)*rr).add(p);pos.setXYZ(i*9+j,v.x,v.y,v.z)}}geo.computeVertexNormals()}return mesh(geo,m,parent)}
function between(parent,a,b,r1,r2,m){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);const o=mesh(new T.CylinderGeometry(r2,r1,d.length(),24),m,parent);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o}
function lathe(parent,profile,m,zscale=1){const o=mesh(new T.LatheGeometry(profile.map(([x,y])=>new T.Vector2(x,y)),96),m,parent);o.scale.z=zscale;return o}
const world=new T.Group();scene.add(world);world.rotation.y=-.14;
// Layered bell silhouette, waist and bodice.
lathe(world,[[.08,.43],[1.05,.48],[1.1,.55],[1.03,.7],[.91,1.08],[.76,1.65],[.57,2.18],[.38,2.73],[.35,2.94]],dress,.66);
// Fold panels follow the curved skirt instead of being decals.
for(let i=0;i<11;i++){const a=(i/11)*Math.PI*2;const pts=[];for(let j=0;j<6;j++){const y=.56+j*.43,r=1.06-(y-.56)*.315;pts.push([Math.sin(a)*r,y,Math.cos(a)*r*.66])}tube(world,pts,.012,i%2?gold:black)}
lathe(world,[[.35,2.72],[.38,2.9],[.42,3.15],[.54,3.55],[.49,3.73],[.27,3.94]],cream,.64);
lathe(world,[[.355,2.77],[.37,2.86],[.39,3.02],[.40,3.11]],dress,.7);
for(let y=2.83;y<3.1;y+=.12){const belt=mesh(new T.TorusGeometry(.38,.014,8,80),gold,world);belt.rotation.x=Math.PI/2;belt.position.y=y;belt.scale.y=.71}
for(let y=3.17;y<3.69;y+=.12)ell(world,gold,0,y,.335,.025,.025,.014);
// Neck and gently inclined portrait.
ell(world,skin,0,3.99,0,.145,.32,.15);
const head=new T.Group();head.position.set(0,4.44,.015);head.rotation.set(.06,-.12,-.065);world.add(head);
// Hand-shaped head mesh: narrow jaw, round brow, no primitive sphere face.
const rows=[[-.49,.07,.13],[-.43,.17,.205],[-.31,.255,.25],[-.13,.31,.28],[.07,.322,.285],[.26,.29,.26],[.43,.21,.20],[.52,.06,.07]];
const vertices=[],indices=[];for(let i=0;i<rows.length;i++){const [y,rx,rz]=rows[i];for(let k=0;k<=64;k++){const a=k/64*Math.PI*2;vertices.push(Math.sin(a)*rx,y,Math.cos(a)*rz)}}for(let i=0;i<rows.length-1;i++)for(let k=0;k<64;k++){const a=i*65+k,b=a+65;indices.push(a,b,a+1,a+1,b,b+1)}
const facegeo=new T.BufferGeometry();facegeo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));facegeo.setIndex(indices);facegeo.computeVertexNormals();mesh(facegeo,skin,head);
ell(head,skin,-.305,-.08,0,.065,.115,.055);ell(head,skin,.305,-.08,0,.065,.115,.055);
// Small bridge and sculpted nose tip; closed eyelids avoid glass doll eyes.
ell(head,skin,.005,-.09,.273,.044,.13,.043);ell(head,skin,.005,-.18,.31,.05,.037,.056);
for(const side of [-1,1]){tube(head,[[side*.07,-.035,.274],[side*.14,-.064,.268],[side*.225,-.042,.235]],.009,black);tube(head,[[side*.065,.048,.277],[side*.14,.07,.274],[side*.215,.065,.245]],.012,hairDark)}
tube(head,[[-.063,-.294,.239],[0,-.3,.257],[.06,-.292,.237]],.009,lip);
// Hair cap with an open face: swept radial strips, then individually tapered locks.
for(let i=0;i<23;i++){const a=-Math.PI*.47+i/22*Math.PI*1.94;const x=Math.sin(a),z=Math.cos(a);tube(head,[[x*.04,.52,z*.04],[x*.22,.41,z*.22],[x*.34,.18,z*.31],[x*.35,-.16,z*.29]],.06,i%3===0?hairHi:hair,u=>.028+Math.sin(Math.PI*u)*.048)}
// Swept fringe: arcs across the brow, not a helmet across the eyes.
for(let i=0;i<6;i++){const x=-.27+i*.085; tube(head,[[x*.35,.49,.19],[x-.08,.32,.31],[x-.02,.15,.32],[x+.07,.04+(i%2)*.04,.283]],.05,i%2?hair:hairHi,u=>.006+Math.sin(Math.PI*(.05+u*.9))*.052)}
for(const side of [-1,1])for(let i=0;i<4;i++){tube(head,[[side*(.27+i*.015),.26,.04-i*.065],[side*(.35+i*.035),-.18,.10-i*.08],[side*(.31+i*.05),-.58,.15-i*.09],[side*(.40+i*.02),-.83,.22-i*.1]],.05,i%2?hairHi:hair,u=>(1-u)*.059+.007)}
// Long locks below the head, visibly thick ribbons of sculpted hair.
const locks=[];for(let i=0;i<15;i++){const a=1.0+i/14*4.3,x=Math.sin(a),z=Math.cos(a);const points=[[x*.26,4.69,z*.22-.08],[x*.38,4.18,z*.33-.1],[x*.48,3.58,z*.42-.13],[x*.65,2.91,z*.5-.13],[x*.67,2.28,z*.51-.02],[x*.45,1.93,z*.52+.08]];let o=tube(world,points,.07,i%4===0?hairHi:i%3===0?hairDark:hair,u=>Math.sin(Math.PI*(.13+u*.85))*.087+.005);locks.push(o)}
// Flower and ribbon at the temple.
const flower=new T.Group();flower.position.set(-.29,.21,.23);flower.rotation.y=-.4;head.add(flower);for(let i=0;i<9;i++){let a=i*Math.PI*2/9;const p=ell(flower,cream,Math.sin(a)*.095,Math.cos(a)*.095,.015,.038,.079,.013);p.rotation.z=-a}ell(flower,gold,0,0,.032,.052,.052,.018);
tube(head,[[-.34,.18,.15],[-.41,-.17,.08],[-.38,-.52,.02]],.017,black);
// Collar points lie on the shoulders; cameo emphasizes the neckline.
for(const side of [-1,1]){const o=mesh(new T.ConeGeometry(.20,.34,3),dress,world);o.position.set(side*.18,3.77,.23);o.rotation.z=side*.6;o.rotation.x=.5}
ell(world,gold,0,3.73,.34,.066,.083,.022);ell(world,hairHi,0,3.73,.365,.037,.052,.011);
// Back arm, resting beside the skirt.
ell(world,cream,-.49,3.64,0,.22,.24,.23);between(world,[-.51,3.6,0],[-.65,3.05,.12],.14,.10,cream);ell(world,cream,-.65,3.05,.12,.105,.10,.105);between(world,[-.65,3.05,.12],[-.58,2.56,.35],.083,.06,skin);ell(world,skin,-.58,2.48,.35,.082,.13,.04);
// Foreground arm uses a real shoulder and elbow hierarchy.
const shoulder=new T.Group();shoulder.position.set(.48,3.65,.015);world.add(shoulder);ell(shoulder,cream,0,-.06,0,.22,.245,.21);between(shoulder,[0,-.07,0],[0,-.62,0],.125,.085,cream);const elbow=new T.Group();elbow.position.y=-.62;shoulder.add(elbow);ell(elbow,skin,0,0,0,.087,.087,.085);between(elbow,[0,0,0],[0,-.55,0],.08,.05,skin);
const hand=new T.Group();hand.position.y=-.57;elbow.add(hand);ell(hand,skin,0,-.075,0,.075,.12,.036);
for(let i=0;i<4;i++){let x=-.057+i*.038,l=[.12,.17,.16,.12][i];tube(hand,[[x,-.13,0],[x*1.35,-.18-l*.4,.015],[x*1.65,-.15-l,.025]],.014,skin,u=>.015-u*.005)}tube(hand,[[.065,-.07,0],[.12,-.13,.01],[.14,-.18,.025]],.019,skin);
const cuff=mesh(new T.TorusGeometry(.057,.014,8,30),gold,elbow);cuff.position.y=-.5;cuff.rotation.x=Math.PI/2;
// Ground and cathedral: recessed arches with warm side light.
const ground=mesh(new T.PlaneGeometry(200,200),mat('#293735'));ground.rotation.x=-Math.PI/2;ground.position.y=.04;
const disk=mesh(new T.CylinderGeometry(1.52,1.58,.12,96),stone);disk.position.y=.1;
for(let i=0;i<7;i++){const x=(i-3)*2.4,z=-3.5;between(scene,[x,0,z],[x,6.4,z],.09,.09,stone);tube(scene,[[x,4.4,z],[x+.18,5.3,z],[x+1.2,6.5,z],[x+2.22,5.3,z],[x+2.4,4.4,z]],.065,stone)}
const halo=mesh(new T.TorusGeometry(1.18,.017,10,140),gold);halo.position.set(0,4.44,-1.02);const halo2=mesh(new T.TorusGeometry(1.27,.009,8,140),gold);halo2.position.copy(halo.position);
for(let i=0;i<24;i++){const a=i*Math.PI/12;between(scene,[Math.sin(a)*1.32,4.44+Math.cos(a)*1.32,-1.03],[Math.sin(a)*1.43,4.44+Math.cos(a)*1.43,-1.03],.009,.009,gold)}
scene.add(new T.HemisphereLight('#dfeddf','#27332d',1.6));
function area(c,int,p,target){const l=new T.DirectionalLight(c,int);l.position.set(...p);l.target.position.set(...target);scene.add(l,l.target);return l}
const key=area('#ffe4b6',4.3,[-4,8,6],[0,3,0]);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-6;key.shadow.camera.right=6;key.shadow.camera.top=8;key.shadow.camera.bottom=-4;key.shadow.normalBias=.025;
area('#ed7d3b',5.5,[1,6,-3],[0,3,0]);area('#9bbfbe',1.3,[5,5,3],[0,3,0]);
const ease=u=>{u=Math.max(0,Math.min(1,u));return u*u*(3-2*u)};
function draw(raw){const t=raw>=100?raw-102.5:raw,u=ease(t/2.1);shoulder.rotation.set(-.16-u*.60,0,.08+u*.68);elbow.rotation.x=-.15-u*.85;elbow.rotation.z=-u*.26;hand.rotation.z=u*.12;head.rotation.z=-.065+u*.04;head.rotation.y=-.12-u*.10;for(let i=0;i<locks.length;i++)locks[i].rotation.x=Math.sin(t*1.8+i*.3)*.004;renderer.render(scene,camera);return 'sculpture'}
window.MV={ready:Promise.resolve(),info:()=>({technique:'procedural 3D sculpture / real lights / hierarchical joints',duration:2.6}),draw,frame(t,mime='image/jpeg',q=.95){draw(t);return canvas.toDataURL(mime,q).split(',')[1]}};
let playing=!new URLSearchParams(location.search).has('t'),time=Number(new URLSearchParams(location.search).get('t')||0),last=0;document.querySelector('#play').onclick=()=>playing=!playing;if(!playing)document.querySelector('#play').style.display='none';function loop(ms){if(playing&&last)time=(time+(ms-last)/1000)%3.4;last=ms;draw(time);requestAnimationFrame(loop)}requestAnimationFrame(loop);
