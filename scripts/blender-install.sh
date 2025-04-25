#!/usr/bin/env bash
set -e

echo "1️⃣ Enabling universe repo…"
sudo apt-get update
sudo apt-get install -y software-properties-common
sudo apt-get install -y python3-numpy

sudo add-apt-repository --yes universe
sudo apt-get update

echo "2️⃣ Installing Blender + OSMesa…"
sudo apt-get install -y blender libosmesa6

echo "3️⃣ Setting up software GL…"
export MESA_LOADER_DRIVER_OVERRIDE=softpipe
export LIBGL_ALWAYS_SOFTWARE=1


echo "4️⃣ Verifying installation…"
blender --version && echo "✅ Blender is ready for headless use!"
