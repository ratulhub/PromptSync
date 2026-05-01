#!/bin/bash

# v3.0 PRO Build Script
# Creates a clean release ZIP, excluding all development and testing artifacts.

# Exit on error
set -e

VERSION="3.1.0"
BUILD_DIR="build"
ZIP_NAME="promptsync-v${VERSION}.zip"
CRX_NAME="promptsync-v${VERSION}.crx"

echo "Building PromptSync PRO v${VERSION}..."

# Clean up old build dir
if [ -d "$BUILD_DIR" ]; then
  rm -rf "$BUILD_DIR"
fi
mkdir -p "$BUILD_DIR"

# Copy essential files
echo "Copying files..."
cp manifest.json "$BUILD_DIR/"
cp -r background "$BUILD_DIR/"
cp -r content "$BUILD_DIR/"
cp -r icons "$BUILD_DIR/"
cp -r popup "$BUILD_DIR/"
cp -r storage "$BUILD_DIR/"
cp -r utils "$BUILD_DIR/"
cp -r vendor "$BUILD_DIR/"

# Remove anything that shouldn't be in the production build
# e.g., macOS index files
find "$BUILD_DIR" -name ".DS_Store" -delete

# Create ZIP
echo "Creating ZIP..."
cd "$BUILD_DIR"
zip -qr "../$ZIP_NAME" *
cd ..

echo "✓ Build complete!"
echo "Release archive: $ZIP_NAME"
echo ""
echo "Note: Users MUST extract the ZIP file and use 'Load unpacked' in chrome://extensions."
echo "Pasting the ZIP directly does not work in developer mode."
