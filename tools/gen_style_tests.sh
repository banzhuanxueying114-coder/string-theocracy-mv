#!/usr/bin/env bash
# Generates the two style-test images for the MV with the user's gpt-image script.
# The script resolves its own API config (env, then HKCU\Environment); nothing here reads or prints the key.
set -u
NODE="${NODE:-node}"
GEN="D:/dpskhns/tools/gpt-image/generate.mjs"
OUT="D:/gemini work/art/style"
mkdir -p "$OUT"

"$NODE" "$GEN" --api images "Paper-cut toy theatre illustration made of layered cut paper with soft drop shadows between the layers, viewed straight on. A small proscenium stage with heavy curtains drawn open. At center stage hangs a faceless jointed marionette cut from cream-white paper, with a small glowing terracotta-orange eight-pointed starburst on its chest. Its strings are not threads: each string is a thin vertical line of tiny illegible typewriter letters rising into the darkness above the stage. In the foreground, black paper silhouettes of a seated audience of identical faceless figures holding clipboards. Strictly limited palette: warm cream paper, ink black, deep charcoal, terracotta orange. One warm spotlight from above, visible paper grain, subtle film grain. No readable text, no logos, no watermark. Cinematic 16:9 composition." --out "$OUT/style_A_stage.png" 2>&1 | tail -6
echo "stage exit: ${PIPESTATUS[0]}"

"$NODE" "$GEN" --api images "Character parts sheet for cutout puppet animation, flat front view, in a layered cut-paper style with visible paper grain. A faceless jointed marionette cut from cream-white paper with thin ink-black outlines and a terracotta-orange eight-pointed starburst on its chest. The body parts are laid out separately with clear empty space between them, none touching or overlapping: head, torso, two upper arms, two forearms, two hands, two thighs, two shins, two feet. Each part has a small round pivot hole at its joints. Background is one flat, uniform, pure chroma-key green with no shadows, no gradient and no texture. Palette of the parts: cream paper, ink black, terracotta orange only. No text, no labels, no logos, no watermark." --out "$OUT/style_A_puppet_parts.png" 2>&1 | tail -6
echo "parts exit: ${PIPESTATUS[0]}"

ls -la "$OUT"
