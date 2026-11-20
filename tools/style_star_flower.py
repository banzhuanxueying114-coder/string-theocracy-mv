"""Compose a flower-center variant over the reference-generated style frames."""
from math import cos, pi, sin

from PIL import Image, ImageDraw, ImageFont

from style_frames import COAL, FONTS, LANCZOS, ORANGE, OUT, PAPER, contact_sheet

OUTPUT = OUT / 'star_flower'


def flower(frame, center, radius, rotation):
    # The rounded petals sit inside the existing rays. Use a local supersampled
    # layer so all pixels outside the ornament are inherited from the render.
    scale = 6
    half = round(radius * 1.2) + 3
    side = 2 * half
    layer = Image.new('RGBA', (side * scale, side * scale))
    draw = ImageDraw.Draw(layer)
    origin = half * scale
    r = radius * scale
    petals = 5
    points = []
    for i in range(360):
        angle = i * 2 * pi / 360
        edge = r * (.78 + .22 * cos(petals * (angle - rotation)))
        points.append((origin + edge * cos(angle), origin + edge * sin(angle)))
    draw.polygon(points, fill=PAPER)
    draw.line(points + points[:1], fill=COAL, width=max(4, round(r * .075)), joint='curve')

    for i in range(petals):
        angle = rotation + i * 2 * pi / petals
        # Tapered ink shapes suggest the folds without filling the petals.
        crease = []
        for length, offset in ((.24, -.055), (.51, -.02), (.66, .015), (.48, .052)):
            x = origin + r * (length * cos(angle) - offset * sin(angle))
            y = origin + r * (length * sin(angle) + offset * cos(angle))
            crease.append((x, y))
        draw.polygon(crease, fill=COAL)

    core = r * .22
    draw.ellipse((origin-core, origin-core, origin+core, origin+core),
                 fill=ORANGE, outline=COAL, width=max(3, round(r * .06)))
    layer = layer.resize((side, side), LANCZOS)
    frame.paste(layer, (center[0] - half, center[1] - half), layer.getchannel('A'))


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    design = (
        (1, (1425, 255), 10.5, (1380, 209, 1470, 299), 'SF1 / MAID'),
        (2, (1527, 205), 58, (1373, 31, 1707, 365), 'SF2 / LIBRARIAN'),
    )
    zoom = Image.new('RGB', (852, 458), PAPER)
    draw = ImageDraw.Draw(zoom)
    label = ImageFont.truetype(str(FONTS / 'consola.ttf'), 18)
    frames = []
    for index, center, radius, box, text in design:
        with Image.open(OUT / f'sf{index}.png') as image:
            frame = image.convert('RGB')
        flower(frame, center, radius, -pi / 2)
        frame.save(OUTPUT / f'sf{index}.png')
        x = 16 + (index - 1) * 426
        draw.text((x, 14), text, font=label, fill=COAL)
        zoom.paste(frame.crop(box).resize((394, 394), LANCZOS), (x, 45))
        frames.append(frame)
    zoom.save(OUTPUT / 'star_compare.png')
    with Image.open(OUT / 'sf3.png') as image:
        frames.append(image.convert('RGB'))
    contact_sheet(frames, OUTPUT / 'contact.jpg')


if __name__ == '__main__':
    main()
