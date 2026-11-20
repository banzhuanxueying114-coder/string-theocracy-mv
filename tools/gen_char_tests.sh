#!/usr/bin/env bash
# Character tests: can a text-only prompt reproduce the user's Claude persona design (claude/*.png, *.jpg)?
# The gpt-image script takes no reference image, so the design is described in words.
# The script resolves its own API config; nothing here reads or prints the key.
set -u
NODE="${NODE:-node}"
GEN="D:/dpskhns/tools/gpt-image/generate.mjs"
OUT="D:/gemini work/art/style"
mkdir -p "$OUT"

GIRL="a tall, slender young woman drawn as a Japanese anime character with clean thin lineart and soft cel shading. She has very long straight vivid orange hair reaching below her knees with long side locks, calm amber-orange eyes and a quiet, composed expression. On the right side of her head she wears a large orange chrysanthemum hair ornament with a black ribbon bow and a small white tassel, plus small orange drop earrings. White gloves, cream-white lace-up heeled ankle boots."

MAID="She wears a Victorian maid uniform: black long-sleeved dress with puffed shoulders and tiny orange embroidered flowers, white frilled maid headband, white ruffled collar with a black bow and an orange flower brooch, a black corset waist with gold buttons, a long white apron with a ruffled embroidered hem and an orange-and-black sash bow at the waist, floor-length black skirt with orange lining, gold-orange floral embroidery along the hem and a white ruffle at the very bottom."

LIB="She wears an ornate Victorian librarian dress: white high-collared blouse with a short capelet, puffed sleeves and a black jabot with an orange flower brooch, a black corset belt with thin gold chains and orange tassels, a long layered cream-white pleated skirt with asymmetric orange and black panels, gold-orange floral embroidery along the hem and a white ruffle at the bottom. She carries a thick dark-red hardcover book."

PALETTE="Limited palette: cream white, ink black, charcoal, vivid orange, small gold accents. No readable text, no logos, no watermark."

gen() { # name, prompt
  "$NODE" "$GEN" --api images "$2" --out "$OUT/$1.png" 2>&1 | tail -4
  echo "$1 exit: ${PIPESTATUS[0]}"
}

gen char_A_maid_stage "Wide cinematic 16:9 illustration. On a small theatre stage built from layered cut paper with soft drop shadows, heavy orange paper curtains drawn open, stands $GIRL $MAID She is held in a stiff doll-like curtsey, head slightly bowed, eyes looking up toward the viewer. Thin strings rise from her wrists, elbows and the top of her head straight up into the darkness above the stage; each string is a vertical line of tiny illegible typewriter letters. One warm spotlight from above. In the foreground, black paper silhouettes of seated faceless spectators holding clipboards. The character is drawn in anime style while the set around her is cut paper with visible paper grain. $PALETTE" &

gen char_B_librarian_fall "Wide cinematic 16:9 illustration, dramatic view looking down a bottomless vertical shaft whose walls are endless bookshelves made of layered cut paper, loose pages drifting in the air. Falling through the shaft, upside-down and turned toward the viewer, is $GIRL $LIB Her long hair and skirt stream upward, one hand reaching up, the book hugged to her chest; a few snapped strings made of tiny illegible typewriter letters trail above her. Far above, a small bright rectangle of light from an open trapdoor. The character is drawn in anime style while the shaft around her is cut paper with visible paper grain. $PALETTE" &

gen char_C_maid_sprite "Full-body character illustration for compositing, the whole figure visible from head to boots with empty space around it. The character is $GIRL $MAID Pose: mid-dance like a puppet being pulled, one arm lifted high as if tugged up by the wrist, the other arm out to the side, body twisting, hair and skirt swinging, face turned to the viewer with a blank obedient expression. Background is one flat, uniform, pure chroma-key green with no shadows, no gradient, no floor and no texture. No strings drawn. No text, no logos, no watermark." &

wait
ls -la "$OUT"
