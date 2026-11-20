"""Replate the generated ornament while preserving the original maid artwork."""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

from style_frames import ART, OUT, PAPER, ORANGE, COAL, print_labels


def main():
    base = ART / 'ink_A_maid_full'
    target = ART / 'ink_A_maid_star'
    source = OUT / 'gen' / 'r7_A_1_edits.png'
    with Image.open(source) as image:
        edit = np.asarray(image.convert('RGB'))
    with Image.open(base.with_suffix('.png')) as image:
        original = image.convert('RGBA')
    if edit.shape[:2] != (original.height, original.width):
        raise ValueError('Maid edit is not registered to the source canvas')

    # Local transplant includes the former white flower and the new rays.
    selection = Image.new('L', original.size)
    ImageDraw.Draw(selection).polygon([
        (532, 106), (551, 96), (567, 99), (574, 72), (589, 66),
        (595, 95), (613, 82), (622, 91), (618, 104), (632, 95),
        (639, 106), (612, 120), (639, 121), (638, 134), (609, 137),
        (636, 161), (628, 174), (609, 164), (601, 176), (585, 155),
        (571, 176), (558, 178), (552, 154), (541, 149), (534, 138),
        (530, 125),
    ], fill=255)
    replace = np.asarray(selection) > 0
    palette = np.array([PAPER, ORANGE, COAL], dtype=np.uint8)
    labels = print_labels(edit, palette)
    orange_rays = Image.fromarray(((labels == 1) & replace).astype(np.uint8) * 255)
    ray_outline = np.asarray(orange_rays.filter(ImageFilter.MaxFilter(5))) > 0
    rgba = np.array(original)
    original_alpha = rgba[:, :, 3].copy()
    # The returned edit is opaque on dark paper. Use the original silhouette
    # plus a narrow fringe around generated orange where the rays project out.
    alpha = np.where((labels != 2) | ray_outline, 255, original_alpha)
    rgba[replace, :3] = palette[labels[replace]]
    rgba[replace, 3] = alpha[replace]
    Image.fromarray(rgba).save(target.with_suffix('.png'))

    for index, suffix in enumerate('cok'):
        with Image.open(ART / f'{base.name}_{suffix}.png') as image:
            plate = image.convert('RGBA')
        coverage = np.array(plate.getchannel('A'))
        coverage[replace] = np.where(labels == index, alpha, 0)[replace]
        plate.putalpha(Image.fromarray(coverage))
        plate.save(ART / f'{target.name}_{suffix}.png')


if __name__ == '__main__':
    main()
