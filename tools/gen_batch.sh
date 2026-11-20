#!/usr/bin/env bash
# Usage: bash tools/gen_batch.sh BATCH.tsv   (lines: OUT<TAB>SIZE<TAB>REFS(comma-separated)<TAB>PROMPT)
# Runs all lines in parallel through out/style/gen/run_r9.sh; appends the fixed style tail to every prompt.
set -u
tail_txt='Modern three-ink relief print with flat ivory paper (#F3E2C4), Claude orange (#E2723A) and coal black (#211815), clean hard edges and closed color shapes. Rich, lived-in detail with large readable shapes; the scene feels alive, not empty. Solid fills, no shading gradients, glow, lettering or watermarks.'
tmp=$(mktemp -d)
i=0
while IFS=$'\t' read -r out size refs prompt; do
  [[ -z ${out:-} || $out == \#* ]] && continue
  i=$((i+1)); pf="$tmp/p$i.txt"; printf '%s %s\n' "$prompt" "$tail_txt" > "$pf"
  IFS=, read -ra r <<< "$refs"
  ( bash out/style/gen/run_r9.sh "$out" "$size" "$pf" "${r[@]}" > "$tmp/l$i.txt" 2>&1; echo "[$?] $out $(grep -o 'edits: .*' "$tmp/l$i.txt")" ) &
done < "$1"
wait
