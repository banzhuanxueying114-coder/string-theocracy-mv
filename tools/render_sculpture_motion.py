import bpy
from pathlib import Path
R=Path(__file__).resolve().parents[1]
s=bpy.context.scene
s.render.engine='CYCLES';s.cycles.samples=8;s.cycles.use_denoising=True
s.render.resolution_x=960;s.render.resolution_y=720;s.render.resolution_percentage=100
s.render.fps=24;s.frame_start=1;s.frame_end=64
s.render.image_settings.file_format='PNG';s.render.filepath=str(R/'out/sculpture_blender/frames/f_')
bpy.ops.render.render(animation=True)
