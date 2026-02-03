#!/bin/bash

# Configuration
WEBHOOK_URL="https://n8n.srv824812.hstgr.cloud/webhook-test/9be9d624-772f-4f20-8946-45ff51296d1f"
TEST_DIR="/Users/frutz/Desktop/Presta/Youtube/Claude Code DEMO 2/webhook_test"

# Fichiers
BG_IMAGE_1="$TEST_DIR/CleanShot 2026-02-02 at 22.18.37@2x.png"
BG_IMAGE_2="$TEST_DIR/CleanShot 2026-02-02 at 22.22.45@2x.png"
KEYWORDS_FILE="$TEST_DIR/keywords.md"

echo "=== YouTube Thumbnail Factory - Test Webhook ==="
echo ""

# Lire les keywords
KEYWORDS=$(cat "$KEYWORDS_FILE")
echo "Keywords: $KEYWORDS"
echo ""

# Encoder les images en base64
echo "Encodage des images en base64..."
BG1_BASE64=$(base64 -i "$BG_IMAGE_1")
BG2_BASE64=$(base64 -i "$BG_IMAGE_2")
echo "  - Image 1: $(echo "$BG1_BASE64" | wc -c | tr -d ' ') caracteres"
echo "  - Image 2: $(echo "$BG2_BASE64" | wc -c | tr -d ' ') caracteres"
echo ""

# Construire le payload JSON
PAYLOAD=$(cat <<EOF
{
  "Keywords": "$KEYWORDS",
  "Background Images": [
    {
      "filename": "CleanShot 2026-02-02 at 22.18.37@2x.png",
      "data": "$BG1_BASE64",
      "mimeType": "image/png"
    },
    {
      "filename": "CleanShot 2026-02-02 at 22.22.45@2x.png",
      "data": "$BG2_BASE64",
      "mimeType": "image/png"
    }
  ]
}
EOF
)

echo "Envoi du webhook..."
echo "URL: $WEBHOOK_URL"
echo ""

# Envoyer la requete
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Extraire le code HTTP et le body
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "=== Reponse ==="
echo "HTTP Code: $HTTP_CODE"
echo ""
echo "Body:"
echo "$BODY" | head -c 2000
if [ ${#BODY} -gt 2000 ]; then
  echo "..."
  echo "(reponse tronquee, ${#BODY} caracteres au total)"
fi
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "Webhook declenche avec succes!"
else
  echo "Erreur lors du declenchement du webhook"
fi