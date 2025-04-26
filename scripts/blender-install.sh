#!/usr/bin/env bash
set -e

BLENDER_VERSION=4.0.2
BLENDER_TAR=blender-$BLENDER_VERSION-linux-x64.tar.xz
BLENDER_DIR=blender-$BLENDER_VERSION-linux-x64
BLENDER_URL=https://download.blender.org/release/Blender4.0/blender-4.0.2-linux-x64.tar.xz

# 1️⃣ Install dependencies
sudo apt-get update
sudo apt-get install -y software-properties-common python3-numpy libosmesa6 wget

# 2️⃣ Download official Blender release (with Draco support)
if [ ! -d "$HOME/$BLENDER_DIR" ]; then
  echo "2️⃣ Downloading Blender $BLENDER_VERSION from blender.org..."
  wget -O "$HOME/$BLENDER_TAR" "$BLENDER_URL"
  tar -xf "$HOME/$BLENDER_TAR" -C "$HOME"
fi

# 3️⃣ Add Blender to PATH for this session and future logins
if ! grep -q "$HOME/$BLENDER_DIR" ~/.profile; then
  echo "export PATH=\"$HOME/$BLENDER_DIR:\$PATH\"" >> ~/.profile
fi
export PATH="$HOME/$BLENDER_DIR:$PATH"

# 4️⃣ Setting up software GL…
export MESA_LOADER_DRIVER_OVERRIDE=softpipe
export LIBGL_ALWAYS_SOFTWARE=1

# 5️⃣ Verifying installation…
blender --version && echo "✅ Blender (official build) is ready for headless use with Draco support!"
