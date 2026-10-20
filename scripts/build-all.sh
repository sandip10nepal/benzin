#!/usr/bin/env bash
set -e

echo "==========================================="
echo " Building Benzin SaaS Suite (All Sub-Apps)"
echo "==========================================="

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

echo "1. Building Shared Contracts & Admin Dashboard..."
npm --prefix "$DIR/admin-app" run build

echo "2. Building Express Backend..."
npm --prefix "$DIR/backend" run build

echo "3. Exporting Customer Web App & Syncing to Backend Public Distribution..."
npm --prefix "$DIR/customer-app" run export:web
rm -rf "$DIR/backend/public/_expo"
cp -R "$DIR/customer-app/dist/_expo" "$DIR/backend/public/"
cp "$DIR/customer-app/dist/index.html" "$DIR/backend/public/index.html"

echo "==========================================="
echo " All Benzin Sub-Apps Built Successfully!"
echo "==========================================="
