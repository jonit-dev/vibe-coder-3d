#!/usr/bin/env bash
# CI build script with dependency caching and metrics collection

set -euo pipefail

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Rust Build with Metrics${NC}"
echo ""

# Check for sccache
if command -v sccache >/dev/null 2>&1; then
    echo -e "${GREEN}✅ sccache detected${NC}"
    sccache --show-stats || true
else
    echo -e "${YELLOW}⚠️  sccache not installed, builds will be slower${NC}"
    echo "   Install with: cargo install sccache"
fi

# Check for cargo-chef
if ! command -v cargo-chef >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  cargo-chef not installed, skipping dependency caching${NC}"
    echo "   Install with: cargo install cargo-chef"
else
    echo -e "${GREEN}📋 Preparing dependency recipe...${NC}"
    cargo chef prepare --recipe-path target/recipe.json

    echo -e "${GREEN}🍳 Cooking dependencies...${NC}"
    cargo chef cook --recipe-path target/recipe.json --profile "${PROFILE:-dev-fast}"
fi

# Run build with metrics
echo ""
echo -e "${GREEN}🔨 Building with xtask...${NC}"
cargo run -p xtask -- build-metrics \
    --profile "${PROFILE:-dev-fast}" \
    --preset "${PRESET:-default}"

# Show sccache stats if available
if command -v sccache >/dev/null 2>&1; then
    echo ""
    echo -e "${GREEN}📊 sccache Statistics:${NC}"
    sccache --show-stats
fi

echo ""
echo -e "${GREEN}✨ Build complete!${NC}"
