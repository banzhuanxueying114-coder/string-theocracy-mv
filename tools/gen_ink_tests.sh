#!/usr/bin/env bash
# Style test 2: three-flat-ink print silhouettes of the user's Claude persona (reference look: world-execute-me-lyric-mv).
# Only the character is generated; paper, strings, type and layout are drawn in code afterwards.
# The gpt-image script resolves its own API config; nothing here reads or prints the key.
set -u
NODE="${NODE:-node}"
GEN="D:/dpskhns/tools/gpt-image/generate.mjs"
OUT="D:/gemini work/art/style"
mkdir -p "$OUT"

INK="Flat graphic silhouette illustration in the style of a three-colour screen print or cut-paper stencil. Use exactly three flat solid inks and nothing else: vivid orange, warm cream, and near-black brown-black. No gradients, no shading, no soft shadows, no outlines, no texture, no glow, no fourth colour. Forms are built from bold flat shapes with sharp, angular negative-space cuts, like a linocut of an anime character. Hair is flat orange with black cut-in strands; skin and white cloth are flat cream; dark cloth and shadows are flat near-black."

WHO="The character is a tall slender young woman with very long straight hair reaching below her knees and long side locks, and on the right side of her head a large daisy-like chrysanthemum hair ornament with a ribbon bow and hanging ribbon tails. Modest, slim proportions."

BG="The background is one flat, uniform, pure chroma-key green with nothing else on it. Leave empty green margin on all four sides; nothing is cropped. No text, no logos, no watermark."

gen() { # name, size, prompt
  "$NODE" "$GEN" --api images "$3" --size "$2" --out "$OUT/$1.png" 2>&1 | tail -4
  echo "$1 exit: ${PIPESTATUS[0]}"
}

gen ink_A_maid_full 1024x1536 "$INK $WHO She wears a long Victorian maid dress: black bodice with puffed sleeves, frilled cream headband, cream apron with a ruffled hem, floor-length black skirt with an orange lining showing at the hem, cream heeled boots. Full body from head to boots, front view. Pose: a marionette hanging limp from invisible strings, both wrists lifted and bent as if pulled up from above, head tipped forward so that the whole face is hidden in flat black shadow under her fringe (no eyes, no mouth), toes barely touching the ground, hair and skirt hanging straight down. Do not draw the strings. $BG" &

gen ink_B_librarian_cut 1024x1536 "$INK $WHO She wears a cream high-collared blouse with a short capelet and puffed sleeves, a black jabot with a round orange brooch, and a black corset belt. Bust portrait down to the waist, three-quarter view. Pose: chin raised, one eye open and looking straight at the viewer, the other eye hidden behind her fringe, calm and defiant; one hand raised beside her head holding a large pair of open tailor's scissors drawn as a flat black shape; a few locks of hair swept sideways. $BG" &

gen ink_C_hand 1536x1024 "$INK A single large human hand reaching down from the top edge of the picture, seen from slightly below, fingers spread and curled like a puppeteer's hand; the hand and wrist are flat near-black with a few cream cut-in highlights and a cream shirt cuff with one round orange cufflink. Around each fingertip is a small tied loop. Do not draw any strings or threads. Only the hand, cuff and the start of a black sleeve; no body, no face. $BG" &

wait
ls -la "$OUT" | grep ink_
