#!/usr/bin/env bash
# Six key shots for a bolder concept: cathedral-theatre, ball-jointed doll, all-glass icon.
NODE="${NODE:-node}"
GEN="D:/dpskhns/tools/gpt-image/generate.mjs"
OUT="D:/gemini work/art/bold"
mkdir -p "$OUT"

STYLE="Style: dark gothic anime film key visual, detailed painterly illustration with crisp line art, dramatic chiaroscuro lighting, restrained palette of black, ivory, vivid orange and gold with tiny accents of deep red. Cinematic widescreen 16:9 composition. No text, no letters, no watermark."
DOLL="a life-size ball-jointed porcelain doll of a tall slender young woman: glossy ivory porcelain skin, clearly visible spherical ball joints at the neck, shoulders, elbows, wrists, every finger knuckle, knees and ankles, a fine seam line around her face plate and two seam lines running down from the corners of her mouth like a ventriloquist puppet, small brass eyelets screwed into her joints, amber glass eyes. She has very long, perfectly straight vivid orange hair reaching below her knees, and on the right side of her head a large cream-and-orange chrysanthemum hair ornament with a black ribbon bow and a white tassel. She wears a black long-sleeved maid dress with puffed shoulders, a white frilled headband, a ruffled white collar with a black bow and an orange brooch, a black corset waist with gold buttons, a long white apron with a ruffled hem and a floor-length black skirt with orange lining. Modest, slim, elegant proportions."

K1="Wide establishing shot of the interior of an immense Gothic cathedral that is also a puppet theatre. Where the altar would be stands a proscenium stage whose heavy black-and-orange curtains have just opened. High in the apse, in the place of a crucifix, hangs a gigantic wooden marionette control cross (the cross-shaped handle used to operate a string puppet), and from it hundreds of thin golden strings fall straight down like rays of light onto the stage, where one small figure hangs in a spotlight: a doll in a black-and-white maid dress with very long orange hair. The pews are filled with rows of identical faceless figures in white robes that resemble laboratory coats, seen from behind, each holding a clipboard. Low camera in the central aisle, strong one-point perspective, tall stained-glass windows glowing amber on both sides. $STYLE"

K2="Medium close-up, waist up, three-quarter view, of $DOLL Her arms are lifted by taut golden strings threaded through the brass eyelets in her wrists, elbows and finger joints; one string hooks the corner of her mouth and pulls it up into a forced smile, another holds one eyelid open. Her head tilts sideways on its neck joint. Her face is empty, yet her eyes look straight at the viewer. Pure black background, a single hard spotlight from directly above. $STYLE"

K3="A real stained-glass window filling the whole frame, seen close: the head, shoulders and raised hands of a saint. The figure is made ENTIRELY of pieces of glass held by thick black lead came, with no drawing, no line art and no painted shading: her face is assembled from about forty angular pieces of pale cream and peach glass, with lead lines crossing her forehead, cheeks and nose; her eyes are two pieces of amber glass; her very long straight hair is long strips of orange and amber glass; a chrysanthemum on the right side of her head is a rosette of small cream petals of glass; behind her head a halo of gold square panes. Both hands are raised as if in blessing, every finger a separate piece of glass, and from her fingertips and wrists the lead lines continue straight upward as strings to the top edge. Background panes in deep violet-black and blood red. Sunlight shines through the glass, with visible glass texture, bubbles and uneven colour. Widescreen 16:9. No text, no letters."

K4="The workshop behind the stage, a long narrow sacristy. Shelves recede into the darkness on both sides, holding dozens of identical porcelain doll heads with long orange hair and closed eyes, each with a numbered paper tag tied to it. Headless doll bodies in black-and-white maid dresses hang from hooks by their golden strings like coats in a wardrobe. On a workbench in the foreground: a disassembled porcelain arm with ball joints, loose joint spheres, spools of golden thread, a pair of large black scissors and an open dark-red book. Among all the heads with closed eyes, exactly one, on the middle shelf, has her amber eyes open and is looking at the viewer. Lit by a single hanging lamp. $STYLE"

K5="Dynamic action shot: $DOLL She bursts out through a tall stained-glass window that depicted her own image, leaping toward the viewer. The window explodes into hundreds of shards of orange, amber and cream glass flying outward, lead lines twisting. In one hand she holds a pair of large black scissors; cut golden strings whip through the air behind her wrists and elbows. The porcelain of her cheek and of one forearm is cracked, and warm orange light glows from inside the cracks. Her hair streams behind her, her expression is calm and fierce. Strong backlight through the broken window, black surroundings. $STYLE"

K6="Extreme low angle looking straight up from a stage floor. The enormous white-gloved hand of a puppeteer, holding a wooden marionette control cross, fills the upper half of the frame. The glove is torn open at the wrist and across two knuckles, revealing that the hand underneath is itself glossy porcelain with ball joints, and that from its own wrist and knuckles more golden strings rise further up into the darkness, toward another, far larger hand that is barely visible high above. At the bottom of the frame, small and seen from behind, a doll in a black-and-white maid dress with very long orange hair stands looking up, a pair of scissors in her lowered hand, cut strings lying around her feet. $STYLE"

run() { "$NODE" "$GEN" --api images "$2" --out "$OUT/$1.png" 2>&1 | grep -v -i "key" | tail -1; echo "$1 exit: ${PIPESTATUS[0]}"; }
run k1_cathedral "$K1" &
run k2_doll "$K2" &
run k3_glass_saint "$K3" &
run k4_workshop "$K4" &
run k5_shatter "$K5" &
run k6_hand "$K6" &
wait
ls -la "$OUT"
