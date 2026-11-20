#!/usr/bin/env bash
# 有声预览：tools/preview.sh SEG START_SEC [AUDIO_ADVANCE_MS] [OUT]
# AUDIO_ADVANCE_MS>0 表示声音相对画面提前（画面显得慢），<0 反之；默认 0。
set -e
seg=$1; start=$2; adv=${3:-0}; out=${4:-out/segments/${seg}_preview.mp4}
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "out/segments/$seg.mp4")
s=$(awk "BEGIN{printf \"%.4f\", $start + $adv/1000}")
ffmpeg -y -v error -i "out/segments/$seg.mp4" -ss "$s" -t "$dur" -i "music/String Theocracy.mp3" \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart "$out"
echo "wrote $out"
