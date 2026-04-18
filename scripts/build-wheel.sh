#!/usr/bin/env bash
# Build the dashboard, copy it into the Python package's static/ directory,
# and build a Python wheel that includes it.
#
# This is the load-bearing integration point between the two packages.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DASHBOARD_DIR="$REPO_ROOT/packages/dashboard"
SDK_STATIC_DIR="$REPO_ROOT/packages/tracebloom/src/tracebloom/static"

echo "==> Building dashboard"
(cd "$DASHBOARD_DIR" && pnpm build)

echo "==> Copying dashboard build into SDK static/"
rm -rf "$SDK_STATIC_DIR"
mkdir -p "$SDK_STATIC_DIR"
cp -R "$DASHBOARD_DIR/dist/dashboard/." "$SDK_STATIC_DIR/"
# Preserve .gitkeep so an empty checkout stays valid.
touch "$SDK_STATIC_DIR/.gitkeep"

echo "==> Building Python wheel"
(cd "$REPO_ROOT/packages/tracebloom" && uv build)

echo "==> Done"
ls -la "$REPO_ROOT/packages/tracebloom/dist"
