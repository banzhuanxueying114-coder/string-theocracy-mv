"""Render the three String Theocracy style studies with Pillow and NumPy only."""
import argparse
from functools import lru_cache
from math import cos, pi, sin
import os
from pathlib import Path
from random import Random

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'art' / 'ink'
OUT = ROOT / 'out' / 'style'
FONTS = Path(os.environ.get('WINDIR', 'C:/Windows')) / 'Fonts'
A = 'ink_A_maid_flower'
B = 'ink_B_librarian_cut'
C = 'ink_C_hand'
PAPER = (243, 226, 196)  # Exact solid inks sampled in all three sources.
ORANGE = (226, 114, 58)
COAL = (33, 24, 21)
GOLD = (166, 137, 87)
DARK_GOLD = (184, 154, 98)
SIZE = (1920, 1080)
S = 3
LANCZOS = Image.Resampling.LANCZOS


def mix(a, b, amount):
    return tuple(round(x + (y - x) * amount) for x, y in zip(a, b))


def pt(p):
    return tuple(round(x * S) for x in p)


def line(draw, points, ink, width=1):
    draw.line([pt(p) for p in points], fill=ink, width=max(1, round(width * S)), joint='curve')


def cubic(a, b, c, d, n=96):
    return [tuple((1-t)**3*w + 3*t*(1-t)**2*x + 3*t*t*(1-t)*y + t**3*z
                  for w, x, y, z in zip(a, b, c, d)) for t in (i / n for i in range(n + 1))]


def curve(draw, segments, ink, width=1):
    path = []
    for points in segments:
        path.extend(cubic(*points) if not path else cubic(*points)[1:])
    line(draw, path, ink, width)


def ring(draw, center, r, ink, width=1):
    x, y = center
    draw.ellipse(pt((x-r, y-r, x+r, y+r)), outline=ink, width=max(1, round(width*S)))


@lru_cache
def font(filename, size):
    return ImageFont.truetype(str(FONTS / filename), round(size*S))


def text(draw, pos, label, filename, size, ink, tracking=0):
    f = font(filename, size)
    x, y = pos
    if not tracking:
        draw.text(pt(pos), label, font=f, fill=ink, anchor='ls')
        return
    for char in label:
        draw.text(pt((x, y)), char, font=f, fill=ink, anchor='ls')
        x += f.getlength(char)/S + tracking


def badge(draw, x, y, label, ink):
    text(draw, (x, y), label, 'consola.ttf', 19, ink, 1.8)


@lru_cache
def plates(name):
    """Source masks are exclusive white RGBA. Ignore their white RGB values."""
    with Image.open(ART / (name + '.png')) as source:
        silhouette = np.asarray(source.getchannel('A')).copy()
    cover = []
    for suffix in 'cok':
        with Image.open(ART / (name + '_' + suffix + '.png')) as plate:
            cover.append(np.asarray(plate.getchannel('A'), dtype=np.float32))
    coverage = np.stack(cover)
    # The plate sum equals source alpha to within one count of file rounding.
    alpha = np.where(silhouette >= 5, silhouette, 0).astype(np.uint8)
    total = coverage.sum(axis=0)
    weights = coverage / np.maximum(total, 1)
    return alpha, weights


def figure_position(xy, scale, xy_in_source):
    return tuple(o + v*scale for o, v in zip(xy, xy_in_source))


def plate_image(mask):
    return Image.fromarray(np.uint8(np.clip(np.rint(mask), 0, 255)))


def figure(canvas, name, xy, scale, shifts=None):
    alpha, weights = plates(name)
    h, w = alpha.shape
    size = (round(w*scale), round(h*scale))
    if shifts is None:
        # Reconstruct registered ink RGB first, then resample premultiplied RGBA;
        # transparent white from the mask files can never bleed into the figure.
        rgb = np.uint8(np.rint(np.einsum('chw,ci->hwi', weights, (PAPER, ORANGE, COAL))))
        src = Image.fromarray(np.dstack((rgb, alpha))).resize(size, LANCZOS)
        canvas.paste(src, xy, src.getchannel('A'))
        return
    # Print from the full paper bed up: orange extends under the black areas
    # and only becomes visible there when the black pass slips out of register.
    cumulative = (alpha, alpha*(weights[1]+weights[2]), alpha*weights[2])
    for mask, offset, ink in zip(cumulative, shifts, (PAPER, ORANGE, COAL)):
        dest = tuple(x+d for x, d in zip(xy, offset))
        area = (*dest, dest[0]+size[0], dest[1]+size[1])
        canvas.paste(ink, area, plate_image(mask).resize(size, LANCZOS))


def surface(ink):
    return Image.new('RGB', pt(SIZE), ink)


def overlay(canvas, operation):
    layer = Image.new('RGBA', pt(SIZE))
    operation(ImageDraw.Draw(layer))
    layer = layer.resize(SIZE, LANCZOS)
    canvas.paste(layer, (0, 0), layer.getchannel('A'))


def arch_points(cx, apex, half, spring, base):
    left = (cx-half, spring)
    tip = (cx, apex)
    right = (cx+half, spring)
    rise = spring-apex
    return [(cx-half, base)] + cubic(left, (cx-half, spring-rise*.46),
                                     (cx-half*.49, apex+rise*.22), tip) + cubic(
        tip, (cx+half*.49, apex+rise*.22), (cx+half, spring-rise*.46), right)[1:] + [(cx+half, base)]


def strings_held(draw, xy, scale):
    # Anchors refer to the join of bare hand and cuff in the original A art.
    left, crown, right = (figure_position(xy, scale, p) for p in ((216, 255), (506, 85), (813, 311)))
    for origin, end, bow in [((1174, 111), left, -14), ((1385, 135), crown, 5), ((1596, 111), right, 18)]:
        x, y = origin
        u, v = end
        gap = v-y
        curve(draw, [(origin, (x+bow, y+gap*.38), (u+bow*.6, v-gap*.14), end)], DARK_GOLD, 2.5)
    # Face and wrist art stay intact; only the strings meet their surface.
    line(draw, [(1165, 108), (1605, 108)], GOLD, 4)
    line(draw, [(1385, 66), (1385, 134)], GOLD, 4)
    for p in ((1174, 108), (1596, 108), (1385, 108)):
        ring(draw, p, 5, GOLD, 1.25)


def draw_starburst(draw, center, radius):
    rng = Random(207)
    rays = []
    for i in range(11):
        angle = (-91 + i * 360 / 11 + rng.uniform(-6, 6)) * pi / 180
        ratio = (0.96 if i % 2 == 0 else 0.665) + rng.uniform(-0.04, 0.04)
        rays.append((cos(angle), sin(angle), radius * ratio))

    # Draw the union at each width, so the rays share one solid orange hub.
    for ink, border in ((PAPER, 4.5), (COAL, 1.5), (ORANGE, 0)):
        root = radius * .11 + border
        tip = radius * .03 + border
        for dx, dy, length in rays:
            def point(along, across):
                return (center[0] + dx * along - dy * across,
                        center[1] + dy * along + dx * across)

            end = length - radius * .03
            draw.polygon([pt(point(a, b)) for a, b in
                          ((0, -root), (end, -tip), (end, tip), (0, root))], fill=ink)
            x, y = point(end, 0)
            draw.ellipse(pt((x-tip, y-tip, x+tip, y+tip)), fill=ink)
        x, y = center
        draw.ellipse(pt((x-root, y-root, x+root, y+root)), fill=ink)


def sf1():
    stage = surface(COAL)
    d = ImageDraw.Draw(stage)
    portal = arch_points(1385, 42, 325, 488, 1140)
    d.polygon([pt(p) for p in portal], fill=PAPER)
    line(d, arch_points(1385, 22, 344, 486, 1140), PAPER, 1)
    line(d, arch_points(1385, 73, 299, 492, 1140), COAL, 1)

    # The type sits on the same architectural axes as the portal rail.
    rule = PAPER
    line(d, [(128, 341), (1004, 341)], rule)
    line(d, [(128, 341), (128, 733)], rule)
    line(d, [(128, 733), (1004, 733)], rule)
    text(d, (155, 315), 'I / THE PUPPET', 'consola.ttf', 23, PAPER, 3.2)
    text(d, (153, 500), 'String', 'OLDENGL.TTF', 159, PAPER)
    text(d, (149, 663), 'Theocracy', 'OLDENGL.TTF', 158, PAPER)

    frame = stage.resize(SIZE, LANCZOS)
    xy, scale = (1105, 188), .55
    figure(frame, A, xy, scale)
    overlay(frame, lambda draw: strings_held(draw, xy, scale))
    return frame


def registration(draw, p, ink, r=14):
    x, y = p
    ring(draw, p, r, ink)
    line(draw, [(x-r-6, y), (x+r+6, y)], ink)
    line(draw, [(x, y-r-6), (x, y+r+6)], ink)


def print_labels(pixels, palette):
    # Reduce luminance weight so warm pale highlights stay on the cream plate.
    rgb_to_yiq = np.array(((.299, .587, .114), (.596, -.274, -.322),
                           (.211, -.523, .312)), dtype=np.float32)
    weights = np.array((.55, 1, 1), dtype=np.float32)
    features = (pixels @ rgb_to_yiq.T) * weights
    centers = (palette @ rgb_to_yiq.T) * weights
    return np.stack([((features - center) ** 2).sum(axis=2)
                     for center in centers]).argmin(axis=0)


def generated_sf2():
    """Crop the selected reference generation and reduce it to print inks."""
    source = OUT / 'gen' / 'r10_B_final.png'
    with Image.open(source) as image:
        image = image.convert('RGB').crop((0, 0, 1536, 864)).resize(SIZE, LANCZOS)
    pixels = np.asarray(image)
    palette = np.array((PAPER, ORANGE, COAL, GOLD), dtype=np.uint8)
    labels = print_labels(pixels, palette[:3])

    # The generated thread runs straight down at x≈557–561 (1920 scale).
    left, right = 552, 567
    strip = pixels[:, left:right].astype(np.int16)
    red, green, blue = strip.transpose(2, 0, 1)
    gold = (red - blue > 85) & (green - blue > 45) & (green > 105)
    # Behind the scissors: where coal ink lies on both sides, the steel covers it.
    behind = (labels[:, left - 3] == 2) & (labels[:, right + 3] == 2)
    band = labels[:, left:right]
    band[gold & behind[:, None]] = 2
    band[gold & ~behind[:, None]] = 3

    layer_dir = OUT / 'gen' / 'r10_B_final_plates'
    layer_dir.mkdir(parents=True, exist_ok=True)
    for index, suffix in enumerate('cokg'):
        Image.fromarray((labels == index).astype(np.uint8) * 255).save(layer_dir / f'{suffix}.png')
    result = Image.fromarray(palette[labels])
    result.save(layer_dir / 'composite.png')
    return result


def sf2():
    frame = generated_sf2()
    def rules(draw):
        registration(draw, (104, 560), COAL, 11)
        line(draw, [(126, 560), (196, 560)], COAL)
        line(draw, [(1785, 97), (1820, 97), (1820, 132)], COAL)

    overlay(frame, rules)
    label_font = ImageFont.truetype(str(FONTS / 'consola.ttf'), 26)
    ImageDraw.Draw(frame).text((90, 90), '> cut --all', font=label_font, fill=COAL, anchor='lt')
    return frame


def recoiling_strings(draw, xy, scale):
    tips = [figure_position(xy, scale, p) for p in
            ((380, 485), (550, 680), (846, 758), (1050, 720), (1200, 635))]
    # The controller's five fingertips each own one thread. Four remain taut.
    for i in (0, 1, 3, 4):
        x, y = tips[i]
        dx = (-30, -12, 0, 17, 36)[i]
        curve(draw, [((x, y), (x-8, y+145), (x+dx-5, 920), (x+dx, 1100))], GOLD, 2.5)
    x, y = tips[2]
    curve(draw, [((x, y), (x-2, y+85), (x-38, 735), (x-47, 775)),
                 ((x-47, 775), (x-59, 818), (x-7, 822), (x-13, 791)),
                 ((x-13, 791), (x-17, 779), (x-30, 782), (x-31, 791))], GOLD, 2.5)
    curve(draw, [((x+2, 898), (x-17, 884), (x-37, 910), (x-18, 925)),
                 ((x-18, 925), (x+20, 955), (x+9, 1015), (x+15, 1100))], GOLD, 2.5)
    text(draw, (155, 978), 'string 3 / 5 : severed', 'consola.ttf', 19, COAL, .8)


def sf3():
    frame = Image.new('RGB', SIZE, PAPER)
    xy, scale = (580, 50), .77
    # Continue the source sleeve beyond its flat image boundary into offscreen.
    ImageDraw.Draw(frame).polygon(((1178, 51), (1475, 51), (1501, 0), (1203, 0)), fill=COAL)
    figure(frame, C, xy, scale)
    overlay(frame, lambda draw: recoiling_strings(draw, xy, scale))
    return frame


def tooth(image, seed, dark):
    """Sparse, deterministic tooth in the ink/paper palette, without glow."""
    a = np.asarray(image).copy()
    rng = np.random.default_rng(seed)
    target = np.array(COAL if not dark else PAPER, dtype=np.int16)
    flecks = rng.random(a.shape[:2]) < .13
    base = a[flecks].astype(np.int16)
    a[flecks] = base + np.rint((target-base)*.012).astype(np.int16)
    return Image.fromarray(a)


def contact_sheet(frames, output=None):
    sheet = Image.new('RGB', (1976, 490), PAPER)
    draw = ImageDraw.Draw(sheet)
    face = ImageFont.truetype(str(FONTS / 'consola.ttf'), 16)
    draw.text((24, 19), 'STRING THEOCRACY / STYLE STUDIES', font=face, fill=COAL)
    draw.line((24, 49, 1952, 49), fill=COAL)
    labels = ('01 / THE PUPPET', '02 / OUT OF REGISTER', '03 / SEVERED')
    for i, (frame, label) in enumerate(zip(frames, labels)):
        x = 24 + 648*i
        sheet.paste(frame.resize((632, 356), LANCZOS), (x, 65))
        draw.rectangle((x, 65, x+631, 420), outline=COAL)
        draw.text((x, 439), label, font=face, fill=COAL)
    sheet.save(output or OUT / 'contact.jpg', quality=94, subsampling=0)


def star_comparison(frames):
    sheet = Image.new('RGB', (852, 458), PAPER)
    draw = ImageDraw.Draw(sheet)
    label = ImageFont.truetype(str(FONTS / 'consola.ttf'), 18)
    for frame, box, x, name in (
        (frames[0], (1380, 210, 1468, 298), 16, 'SF1 / MAID'),
        (frames[1], (1374, 28, 1706, 360), 442, 'SF2 / LIBRARIAN'),
    ):
        draw.text((x, 14), name, font=label, fill=COAL)
        sheet.paste(frame.crop(box).resize((394, 394), LANCZOS), (x, 45))
    sheet.save(OUT / 'star_compare.png')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--frame', type=int, choices=(1, 2, 3), help='Save one study for review before continuing.')
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    for i, render in enumerate((sf1, sf2, sf3), 1):
        if args.frame is not None and args.frame != i:
            continue
        frame = tooth(render(), i, dark=i == 1)
        frame.save(OUT / f'sf{i}.png')
        print(f'Saved sf{i}.png / {frame.width}x{frame.height}')
    if all((OUT / f'sf{i}.png').exists() for i in (1, 2, 3)):
        frames = [Image.open(OUT / f'sf{i}.png').convert('RGB') for i in (1, 2, 3)]
        contact_sheet(frames)
        star_comparison(frames)


if __name__ == '__main__':
    main()
