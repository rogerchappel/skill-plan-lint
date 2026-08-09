#!/usr/bin/env bash
set -euo pipefail

package_dir=$(mktemp -d "${TMPDIR:-/tmp}/skill-plan-lint-package.XXXXXX")
trap 'rm -rf "$package_dir"' EXIT

npm pack --pack-destination "$package_dir" >/dev/null
tar -xzf "$package_dir"/*.tgz -C "$package_dir"
cd "$package_dir/package"

npm install --ignore-scripts --no-audit --no-fund
node scripts/verify-package.mjs .
bash scripts/validate.sh
