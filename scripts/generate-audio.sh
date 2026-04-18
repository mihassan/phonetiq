#!/usr/bin/env bash
# generate-audio.sh
# Extracts all unique words from the local D1 database, generates TTS audio
# using macOS `say` command, and uploads to local R2 bucket.
#
# Prerequisites:
#   - macOS (uses `say`)
#   - wrangler configured in api/
#   - Local D1 database seeded (npm run db:seed:local in api/)
#
# Usage:
#   ./scripts/generate-audio.sh           # Generate all missing audio
#   ./scripts/generate-audio.sh --force   # Regenerate all audio (overwrite)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
API_DIR="$PROJECT_ROOT/api"
AUDIO_DIR="$PROJECT_ROOT/.audio-cache"
FORCE=false

if [[ "${1:-}" == "--force" ]]; then
  FORCE=true
fi

mkdir -p "$AUDIO_DIR"

echo "📖 Extracting unique words from D1..."
WORDS_JSON=$(cd "$API_DIR" && npx wrangler d1 execute phonetiq-db --local \
  --command="SELECT DISTINCT word FROM (SELECT word1 AS word FROM word_pairs UNION SELECT word2 AS word FROM word_pairs) ORDER BY word;" \
  --json 2>/dev/null)

# Parse words from JSON output
WORDS=$(echo "$WORDS_JSON" | node -e "
  const data = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  const rows = data[0].results;
  rows.forEach(r => console.log(r.word));
")

TOTAL=$(echo "$WORDS" | wc -l | tr -d ' ')
echo "🔊 Found $TOTAL unique words to process"

GENERATED=0
SKIPPED=0

while IFS= read -r word; do
  # Sanitize filename (lowercase, remove apostrophes)
  FILENAME=$(echo "$word" | tr '[:upper:]' '[:lower:]' | tr -d "'" | tr ' ' '-')
  M4A_PATH="$AUDIO_DIR/${FILENAME}.m4a"

  if [[ -f "$M4A_PATH" && "$FORCE" == "false" ]]; then
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  # Generate audio using macOS say (Samantha voice = US English female)
  say -v Samantha -r 150 --file-format=mp4f -o "$M4A_PATH" "$word" 2>/dev/null

  GENERATED=$((GENERATED + 1))
  printf "\r  Generated: %d / %d (skipped: %d)" "$GENERATED" "$TOTAL" "$SKIPPED"
done <<< "$WORDS"

echo ""
echo "✅ Audio generation complete: $GENERATED generated, $SKIPPED skipped"
echo ""

echo "📤 Uploading to local R2 bucket..."
UPLOADED=0
for m4a in "$AUDIO_DIR"/*.m4a; do
  BASENAME=$(basename "$m4a")
  cd "$API_DIR" && npx wrangler r2 object put "phonetiq-audio/$BASENAME" --file="$m4a" --local 2>/dev/null
  UPLOADED=$((UPLOADED + 1))
  printf "\r  Uploaded: %d" "$UPLOADED"
done

echo ""
echo "✅ Upload complete: $UPLOADED files uploaded to local R2"
