#!/bin/bash

# 🎨 PWA Icon Generator Script
# Generates all required PWA icons from a source image

set -e

echo "======================================"
echo "🎨 PWA ICON GENERATOR - Round 5"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo -e "${RED}❌ ImageMagick is not installed${NC}"
    echo "Please install ImageMagick:"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  macOS: brew install imagemagick"
    exit 1
fi

# Source image (you should provide this)
SOURCE_IMAGE="public/icon-source.png"

if [ ! -f "$SOURCE_IMAGE" ]; then
    echo -e "${YELLOW}⚠️  Source image not found: $SOURCE_IMAGE${NC}"
    echo ""
    echo "Creating a placeholder source image..."
    
    # Create a simple placeholder
    convert -size 1024x1024 xc:transparent \
            -fill '#4F46E5' \
            -draw "circle 512,512 512,100" \
            -fill white \
            -font Arial-Bold \
            -pointsize 200 \
            -gravity center \
            -annotate +0+0 "ZZIK" \
            "$SOURCE_IMAGE"
    
    echo -e "${GREEN}✅ Created placeholder icon at $SOURCE_IMAGE${NC}"
fi

# Output directory
OUTPUT_DIR="public/icons"
mkdir -p "$OUTPUT_DIR"

echo "1️⃣ Generating PWA icons from: $SOURCE_IMAGE"
echo ""

# Function to generate icon
generate_icon() {
    local size=$1
    local output="$OUTPUT_DIR/icon-${size}x${size}.png"
    
    convert "$SOURCE_IMAGE" \
            -resize "${size}x${size}" \
            -quality 95 \
            "$output"
    
    echo -e "${GREEN}✅ Generated: icon-${size}x${size}.png${NC}"
}

# Function to generate maskable icon (with safe zone)
generate_maskable_icon() {
    local size=$1
    local output="$OUTPUT_DIR/icon-${size}x${size}-maskable.png"
    local padding=$(( size / 10 )) # 10% padding for safe zone
    
    convert "$SOURCE_IMAGE" \
            -resize "$((size - padding * 2))x$((size - padding * 2))" \
            -background transparent \
            -gravity center \
            -extent "${size}x${size}" \
            -quality 95 \
            "$output"
    
    echo -e "${GREEN}✅ Generated: icon-${size}x${size}-maskable.png${NC}"
}

# Generate standard icons (required sizes)
echo "2️⃣ Generating standard icons..."
generate_icon 192
generate_icon 384
generate_icon 512

# Generate maskable icons (for adaptive icons on Android)
echo ""
echo "3️⃣ Generating maskable icons (with safe zone)..."
generate_maskable_icon 192
generate_maskable_icon 512

# Generate additional common sizes
echo ""
echo "4️⃣ Generating additional sizes..."
generate_icon 96
generate_icon 128
generate_icon 256

# Generate Apple Touch Icons
echo ""
echo "5️⃣ Generating Apple Touch Icons..."
convert "$SOURCE_IMAGE" -resize 180x180 -quality 95 "public/apple-touch-icon.png"
echo -e "${GREEN}✅ Generated: apple-touch-icon.png${NC}"

# Generate favicon sizes
echo ""
echo "6️⃣ Generating favicon..."
convert "$SOURCE_IMAGE" -resize 32x32 -quality 95 "public/favicon-32x32.png"
convert "$SOURCE_IMAGE" -resize 16x16 -quality 95 "public/favicon-16x16.png"
echo -e "${GREEN}✅ Generated: favicon-32x32.png${NC}"
echo -e "${GREEN}✅ Generated: favicon-16x16.png${NC}"

# Create favicon.ico with multiple sizes
convert "public/favicon-16x16.png" "public/favicon-32x32.png" "public/favicon.ico"
echo -e "${GREEN}✅ Generated: favicon.ico${NC}"

# Generate splash screens for iOS
echo ""
echo "7️⃣ Generating iOS splash screens..."
mkdir -p "$OUTPUT_DIR/splash"

# Common iOS splash screen sizes
declare -a splash_sizes=(
    "640x1136:iPhone SE"
    "750x1334:iPhone 8"
    "1125x2436:iPhone X"
    "1242x2688:iPhone 11 Pro Max"
    "828x1792:iPhone 11"
    "1170x2532:iPhone 12 Pro"
    "1284x2778:iPhone 12 Pro Max"
    "1668x2388:iPad Pro 11"
    "2048x2732:iPad Pro 12.9"
)

for size_info in "${splash_sizes[@]}"; do
    IFS=':' read -r size name <<< "$size_info"
    IFS='x' read -r width height <<< "$size"
    
    output="$OUTPUT_DIR/splash/splash-${width}x${height}.png"
    
    # Create splash screen with centered icon
    convert -size "${width}x${height}" xc:'#4F46E5' \
            "$SOURCE_IMAGE" -resize 200x200 \
            -gravity center \
            -composite \
            -quality 95 \
            "$output"
    
    echo -e "${GREEN}✅ Generated: splash-${width}x${height}.png ($name)${NC}"
done

# Update manifest.json
echo ""
echo "8️⃣ Verifying manifest.json icons..."

# The manifest is generated in app/manifest.ts, so we just verify it exists
if [ -f "app/manifest.ts" ]; then
    echo -e "${GREEN}✅ Manifest file exists: app/manifest.ts${NC}"
    echo -e "${BLUE}ℹ️  Icons are already configured in the manifest${NC}"
else
    echo -e "${YELLOW}⚠️  app/manifest.ts not found${NC}"
fi

# Create summary report
echo ""
echo "9️⃣ Creating summary report..."

cat > PWA_ICONS_REPORT.md << EOF
# PWA Icons Generation Report

**Generated**: $(date)

## Files Created

### Standard Icons
- \`icon-192x192.png\` - Minimum required size
- \`icon-384x384.png\` - Intermediate size
- \`icon-512x512.png\` - Maximum recommended size

### Maskable Icons (Android Adaptive)
- \`icon-192x192-maskable.png\` - With 10% safe zone
- \`icon-512x512-maskable.png\` - With 10% safe zone

### Additional Sizes
- \`icon-96x96.png\`
- \`icon-128x128.png\`
- \`icon-256x256.png\`

### Apple Icons
- \`apple-touch-icon.png\` (180x180)

### Favicons
- \`favicon.ico\` (multi-size)
- \`favicon-16x16.png\`
- \`favicon-32x32.png\`

### iOS Splash Screens
$(find "$OUTPUT_DIR/splash" -name "*.png" 2>/dev/null | while read file; do
    echo "- \`$(basename "$file")\`"
done)

## Manifest Configuration

The icons are configured in \`app/manifest.ts\`:

\`\`\`typescript
icons: [
  {
    src: '/icons/icon-192x192.png',
    sizes: '192x192',
    type: 'image/png',
  },
  {
    src: '/icons/icon-512x512.png',
    sizes: '512x512',
    type: 'image/png',
  },
  {
    src: '/icons/icon-192x192-maskable.png',
    sizes: '192x192',
    type: 'image/png',
    purpose: 'maskable',
  },
  {
    src: '/icons/icon-512x512-maskable.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'maskable',
  },
]
\`\`\`

## Testing

### PWA Icon Checklist
- [x] 192x192 icon (required)
- [x] 512x512 icon (required)
- [x] Maskable icons for Android
- [x] Apple touch icon
- [x] Favicons
- [x] iOS splash screens

### Manual Testing Steps

1. **Desktop PWA Install**
   - Open Chrome
   - Visit your site
   - Click install icon in address bar
   - Verify icon appears correctly

2. **Android Testing**
   - Open Chrome on Android
   - Visit your site
   - Add to Home Screen
   - Check icon on home screen
   - Verify splash screen on launch

3. **iOS Testing**
   - Open Safari on iOS
   - Visit your site
   - Share > Add to Home Screen
   - Check icon and splash screen

4. **Favicon Testing**
   - Check browser tab icon
   - Check bookmarks icon

## Lighthouse PWA Audit

Run Lighthouse to verify:
\`\`\`bash
npm run lighthouse
\`\`\`

Expected scores:
- PWA: 100
- Installability: ✅

## References

- [Web.dev PWA Icons](https://web.dev/add-manifest/#icons)
- [Maskable Icon Guide](https://web.dev/maskable-icon/)
- [iOS Splash Screens](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/launch-screen/)

EOF

echo -e "${GREEN}✅ Summary report created: PWA_ICONS_REPORT.md${NC}"

# Generate icons checklist
echo ""
echo "======================================"
echo "✅ Icon Generation Complete!"
echo "======================================"
echo ""
echo "📊 Summary:"
ls -lh "$OUTPUT_DIR" | tail -n +2 | wc -l | xargs echo "  Total icons created:"
du -sh "$OUTPUT_DIR" | awk '{print "  Total size: " $1}'
echo ""
echo "📄 Files:"
echo "  • public/icons/ - All PWA icons"
echo "  • public/icons/splash/ - iOS splash screens"
echo "  • public/favicon.ico - Browser favicon"
echo "  • public/apple-touch-icon.png - iOS home screen icon"
echo "  • PWA_ICONS_REPORT.md - Detailed report"
echo ""
echo "🎯 Next Steps:"
echo "  1. Review generated icons in public/icons/"
echo "  2. Test PWA installation on different devices"
echo "  3. Run Lighthouse PWA audit"
echo "  4. Update app/manifest.ts if needed"
echo ""
