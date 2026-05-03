#!/bin/bash

# v3.1.1 Build Script
# Creates a clean release ZIP for Chrome and Firefox, excluding all development and testing artifacts.

# Exit on error
set -e

VERSION="3.1.1"

# Check arguments
if [ "$1" == "chrome" ] || [ "$1" == "firefox" ]; then
  TARGETS=("$1")
else
  TARGETS=("chrome" "firefox")
fi

for TARGET in "${TARGETS[@]}"; do
  BUILD_DIR="build-$TARGET"
  ZIP_NAME="promptsync-${TARGET}-v${VERSION}.zip"
  
  echo "Building PromptSync PRO v${VERSION} for ${TARGET}..."
  
  # Clean up old build dir
  if [ -d "$BUILD_DIR" ]; then
    rm -rf "$BUILD_DIR"
  fi
  mkdir -p "$BUILD_DIR"
  
  # Copy essential files
  echo "Copying files..."
  # Copy the specific manifest as manifest.json
  cp "manifest.${TARGET}.json" "$BUILD_DIR/manifest.json"
  
  cp -r background "$BUILD_DIR/"
  cp -r claude-counter "$BUILD_DIR/"
  cp -r content "$BUILD_DIR/"
  cp -r icons "$BUILD_DIR/"
  cp -r popup "$BUILD_DIR/"
  cp -r storage "$BUILD_DIR/"
  cp -r utils "$BUILD_DIR/"
  cp -r vendor "$BUILD_DIR/"
  
  # Remove anything that shouldn't be in the production build
  find "$BUILD_DIR" -name ".DS_Store" -delete
  
  # Create ZIP
  echo "Creating ZIP for ${TARGET}..."
  cd "$BUILD_DIR"
  zip -qr "../$ZIP_NAME" *
  cd ..
  
  echo "✓ Build complete for ${TARGET}!"
  echo "Release archive: $ZIP_NAME"
  echo ""
done

echo "All builds finished successfully."
