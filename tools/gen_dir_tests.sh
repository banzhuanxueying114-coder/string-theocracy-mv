#!/usr/bin/env bash
# Three different art directions, same pipeline idea (few generated character pieces, the rest drawn in code).
NODE="${NODE:-node}"
GEN="D:/dpskhns/tools/gpt-image/generate.mjs"
OUT="D:/gemini work/art/style"

WHO="a tall, slender adult anime woman with very long, perfectly straight vivid orange hair reaching below her knees, long side locks framing her face, calm amber-orange eyes and a composed expression; on the right side of her head a large cream-and-orange chrysanthemum hair ornament with a black ribbon bow and a white tassel; small orange drop earrings; white gloves; cream lace-up heeled ankle boots. Modest, slim, elegant proportions."
MAID="She wears a black long-sleeved maid dress with puffed shoulders, a white frilled headband, a ruffled white collar with a black bow and an orange brooch, a black corset waist with gold buttons, a long white apron with a ruffled hem, and a floor-length black skirt with orange lining."
POSE="Full body, head to toe, seen from the front. She hangs like a marionette: both wrists lifted up and outward at shoulder height as if pulled by invisible strings, hands drooping, head tilted slightly down, eyes half-open and looking down, feet together with toes barely touching the ground. Do not draw any strings."

P1="Refined pen-and-ink editorial illustration, like a plate in a beautifully typeset book: thin, confident black fountain-pen outlines of even weight, sparse fine hatching for shadow, and only two flat spot colours, vivid orange (hair, brooch, skirt lining) and solid black (dress). Every white area is left as bare white paper. No gradients, no soft shading, no grey tones, no background elements. Subject: $WHO $MAID $POSE Pure white background, generous margin on all sides, nothing cropped, no text, no signature."

P2="High-quality modern anime cel illustration, crisp clean line art, flat two-tone cel shading, like a key visual from a theatrical anime film. Subject: $WHO $MAID $POSE Dramatic stage lighting: a single warm spotlight from directly above, bright highlights on the top of the head, shoulders and forearms, the lower half of the figure falling into deep shadow. Background: pure flat chroma-key green, completely uniform, no floor, no cast shadow, generous margin on all sides, nothing cropped, no text."

P3="A tall Gothic stained-glass window with a pointed arch, seen straight on, glowing as if backlit, surrounded by pure black. Thick black lead lines divide the picture into many small pieces of coloured glass with visible glass texture: amber, vivid orange, cream white and deep black-violet, with small accents of deep blue and blood red. In flat, frontal, icon-like stained-glass style the window depicts $WHO $MAID She hangs as a marionette in the centre, her wrists lifted by thin golden threads that descend from a large gloved hand at the top of the arch; behind her head a halo made of a ring of small square panes; at the bottom of the window, rows of closed books. Ornamental border. No text, no letters. The whole window is visible, with black margin around it."

run() { "$NODE" "$GEN" --api images "$2" --size "$3" --out "$OUT/$1.png" 2>&1 | grep -v -i "key" | tail -2; echo "$1 exit: ${PIPESTATUS[0]}"; }
run dir_1_ink_page "$P1" 1024x1536 &
run dir_2_cel_stage "$P2" 1024x1536 &
run dir_3_glass "$P3" 1024x1536 &
wait
ls -la "$OUT" | grep dir_
