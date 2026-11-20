import bpy, math, os
from mathutils import Vector
from pathlib import Path
R=Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=40;s.cycles.use_denoising=True
s.render.resolution_x=1440;s.render.resolution_y=1080;s.render.resolution_percentage=100
s.render.image_settings.file_format='PNG';s.render.fps=24
s.world.color=(.10,.10,.10)
def mat(name,c,rough=.8,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
skin=mat('warm porcelain',(.72,.56,.40));ivory=mat('linen',(.62,.59,.46));hair=mat('burnt copper',(.29,.065,.019));hair2=mat('copper highlight',(.43,.115,.032));dark=mat('ink teal velvet',(.018,.052,.049));gold=mat('aged brass',(.40,.25,.09),.4,.65);ink=mat('eyelashes',(.025,.015,.012));lips=mat('muted rose',(.32,.10,.065));stone=mat('cathedral',(.033,.057,.055))
def finish(o,m):
 o.data.materials.append(m)
 if o.type=='MESH':
  for p in o.data.polygons:p.use_smooth=True
 return o
def ell(name,loc,scale,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;return finish(o,m)
def curve(name,pts,r,m):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=24;c.bevel_depth=r;c.bevel_resolution=4;c.use_fill_caps=True;p=c.splines.new('BEZIER');p.bezier_points.add(len(pts)-1)
 for a,v in zip(p.bezier_points,pts):a.co=v;a.handle_left_type='AUTO';a.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,c);s.collection.objects.link(o);return finish(o,m)
def surface(name,verts,faces,m,sub=2):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);s.collection.objects.link(o);finish(o,m)
 if sub:mod=o.modifiers.new('sculpt smoothing','SUBSURF');mod.levels=sub
 return o
def rings(name,rows,m,n=64):
 v=[];f=[]
 for z,rx,ry,cy in rows:
  for j in range(n):a=j/n*math.tau;v.append((math.sin(a)*rx,cy-math.cos(a)*ry,z))
 for i in range(len(rows)-1):
  for j in range(n):a=i*n+j;b=i*n+(j+1)%n;f.append((a,b,b+n,a+n))
 return surface(name,v,f,m,2)
# Front of the character faces -Y. Shaped cross sections keep the jaw delicate.
rings('face',[(4.02,.035,.07,-.035),(4.06,.10,.12,-.01),(4.14,.19,.18,0),(4.28,.265,.225,0),(4.47,.29,.235,0),(4.65,.28,.22,.015),(4.79,.22,.18,.025),(4.85,.07,.07,.025)],skin)
rings('neck',[(3.77,.145,.115,0),(3.87,.12,.11,0),(4.02,.11,.10,0),(4.12,.13,.115,0)],skin)
ell('nose bridge',(0,-.23,4.34),(.029,.025,.095),skin);ell('nose tip',(0,-.259,4.275),(.039,.036,.030),skin)
for side in [-1,1]:
 ell('ear',(side*.274,.005,4.34),(.045,.04,.083),skin)
 curve('closed upper eyelid',[(side*.065,-.225,4.415),(side*.13,-.228,4.398),(side*.205,-.19,4.416)],.006,ink)
 curve('brow',[(side*.07,-.225,4.488),(side*.135,-.227,4.50),(side*.206,-.19,4.481)],.009,hair)
curve('lips',[(-.05,-.199,4.173),(0,-.216,4.168),(.047,-.199,4.176)],.006,lips)
# Smooth hair cap confined behind the hairline, keeping eyes and cheeks open.
v=[];f=[]
for i in range(15):
 for j in range(65):
  a=j/64*math.tau
  limit=1.05 if math.cos(a)>.25 else 1.78
  theta=.025+i/14*limit
  x=math.sin(theta)*math.sin(a)*.327;y=-math.sin(theta)*math.cos(a)*.279+.025;z=4.43+math.cos(theta)*.465
  v.append((x,y,z))
for i in range(14):
 for j in range(64):a=i*65+j;f.append((a,a+1,a+66,a+65))
surface('hair crown',v,f,hair)
# Hair locks are broad sculpted ribbons with shallow convex sections.
def lock(name,pts,width,m):
 v=[];f=[]
 for i,p in enumerate(pts):
  u=i/(len(pts)-1);w=width*(.55+.45*math.sin(u*math.pi))*(1-u*.85)
  for j in range(7):
   a=(j/6-.5)*2;v.append((p[0]+a*w,p[1]-.035*(1-a*a),p[2]))
 for i in range(len(pts)-1):
  for j in range(6):a=i*7+j;f.append((a,a+1,a+8,a+7))
 o=surface(name,v,f,m,2);so=o.modifiers.new('strand thickness','SOLIDIFY');so.thickness=.016;return o
for side in [-1,1]:
 for i in range(6):
  x=side*(.20+i*.028);y=.01+i*.06
  lock('long swept lock',[(x,y,4.68),(side*(.31+i*.026),y-.01,4.24),(side*(.34+i*.035),y-.005,3.77),(side*(.41+i*.046),y+.03,3.29),(side*(.58+i*.03),y+.03,2.8),(side*(.52+i*.02),y+.02,2.43)],.072,hair2 if i%3==0 else hair)
# Asymmetric sweeping fringe above the eye line.
for i in range(4):
 lock('swept fringe',[(-.16+i*.055,-.11,4.81),(-.18+i*.05,-.23,4.72),(-.10+i*.07,-.258,4.60),(.04+i*.06,-.235,4.52+i*.012)],.052,hair2 if i==1 else hair)
# Refined tailored silhouette.
rings('bodice',[(2.72,.31,.20,0),(2.83,.30,.19,0),(3.12,.32,.21,0),(3.35,.42,.24,0),(3.55,.45,.235,0),(3.69,.32,.15,0),(3.79,.13,.10,0)],ivory)
rings('corset',[(2.76,.315,.208,0),(2.79,.317,.21,0),(2.99,.333,.228,0),(3.05,.34,.23,0)],dark)
rings('skirt',[(.48,.94,.59,0),(.54,.96,.61,0),(.8,.90,.57,0),(1.35,.73,.49,0),(2.1,.49,.33,0),(2.72,.31,.20,0),(2.76,.31,.20,0)],dark)
for i in range(9):
 a=(i/8-.5)*2.5
 curve('skirt seam',[(math.sin(a)*r,-math.cos(a)*r*.65-.012,z) for z,r in [(.56,.93),(1.25,.75),(2,.51),(2.75,.31)]],.004,gold)
# Capelet constructed as fabric surfaces, not separate primitives.
for side in [-1,1]:
 surface('capelet',[(side*.11,-.09,3.78),(side*.37,-.14,3.73),(side*.62,-.03,3.53),(side*.56,-.21,3.30),(side*.30,-.31,3.42),(side*.17,-.23,3.64)],[(0,1,5),(1,2,4,5),(2,3,4)],ivory,2)
 curve('collar piping',[(side*.11,-.11,3.80),(side*.17,-.24,3.64),(side*.30,-.315,3.42),(side*.56,-.215,3.30)],.009,gold)
for z in [3.18,3.30,3.42,3.54]:ell('bodice button',(0,-.248,z),(.018,.012,.018),gold)
ell('cameo',(0,-.199,3.68),(.044,.015,.06),gold)
# Hanging sleeve on far side.
curve('far sleeve',[(-.43,0,3.57),(-.57,-.02,3.28),(-.57,-.06,3.04)],.11,ivory);curve('far forearm',[(-.57,-.06,3.05),(-.55,-.11,2.79),(-.46,-.17,2.59)],.060,skin)
ell('far hand',(-.45,-.17,2.49),(.065,.04,.115),skin)
# Animated foreground arm: preserve actual pivot locations.
bpy.ops.object.empty_add(location=(.43,0,3.57));shoulder=bpy.context.object;shoulder.name='shoulder control'
upper=curve('upper sleeve',[(.43,0,3.57),(.53,-.015,3.33),(.55,-.02,3.04)],.10,ivory)
upper.parent=shoulder;upper.matrix_parent_inverse=shoulder.matrix_world.inverted()
bpy.ops.object.empty_add(location=(.55,-.02,3.04));elbow=bpy.context.object;elbow.name='elbow control';elbow.parent=shoulder;elbow.matrix_parent_inverse=shoulder.matrix_world.inverted()
fore=curve('forearm',[(.55,-.02,3.04),(.56,-.05,2.79),(.57,-.07,2.57)],.056,skin)
items=[fore,ell('palm',(.57,-.07,2.49),(.064,.037,.10),skin)]
for i in range(4):
 x=.52+i*.031;l=[.12,.16,.15,.11][i];items.append(curve('finger',[(x,-.07,2.44),(x+(i-1.5)*.008,-.09,2.38),(x+(i-1.5)*.012,-.10,2.44-l)],.011,skin))
items.append(curve('thumb',[(.62,-.07,2.51),(.67,-.08,2.45),(.68,-.09,2.40)],.015,skin))
for o in items:o.parent=elbow;o.matrix_parent_inverse=elbow.matrix_world.inverted()
for frame,angle,bend in [(1,0,0),(48,-.66,-.92),(64,-.66,-.92)]:
 shoulder.rotation_euler.y=angle;shoulder.rotation_euler.x=-angle*.4;shoulder.keyframe_insert(data_path='rotation_euler',frame=frame)
 elbow.rotation_euler.x=bend;elbow.keyframe_insert(data_path='rotation_euler',frame=frame)
# Ivory flower at left temple.
for i in range(9):
 a=i*math.tau/9;o=ell('flower petal',(-.274+math.sin(a)*.07,-.16,4.62+math.cos(a)*.07),(.024,.013,.055),ivory);o.rotation_euler.y=a
ell('flower heart',(-.274,-.181,4.62),(.032,.014,.032),gold)
# Tall architectural masses create depth, with an offset halo and dark recesses.
for x in [-4,-2,0,2,4]:
 curve('gothic arch',[(x-1,1.7,1),(x-1,1.7,4.4),(x-.70,1.7,5.45),(x,1.7,6.05),(x+.70,1.7,5.45),(x+1,1.7,4.4),(x+1,1.7,1)],.055,stone)
for rad in [1.04,1.085]:curve('halo',[(math.sin(i/96*math.tau)*rad,.68,4.37+math.cos(i/96*math.tau)*rad) for i in range(97)],.008,gold)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,.1));finish(bpy.context.object,stone)
def area(name,loc,power,col,size,target):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.color=col;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
area('warm softbox',(-3,-4,7),650,(1,.82,.63),4,(0,0,3.7));area('copper rim',(2,2,5.4),900,(1,.38,.12),3,(0,0,3.6));area('cool fill',(3,-2,4.8),120,(.53,.73,.78),3,(0,0,4))
bpy.ops.object.camera_add(location=(2.8,-9.3,5.0));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,3.71))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=5.2;s.camera=cam
s.view_settings.view_transform='AgX';s.render.film_transparent=False
s.frame_start=1;s.frame_end=64;s.frame_set(48)
(R/'out/sculpture_blender').mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'out/sculpture_blender/study.blend'))
s.render.filepath=str(R/'out/sculpture_blender/portrait.png');bpy.ops.render.render(write_still=True)
