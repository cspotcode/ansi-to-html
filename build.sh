#!/usr/bin/env bash
set -euo pipefail
shopt -s inherit_errexit

__dirname="$(CDPATH= cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$__dirname"

yarn
yarn webpack
chmod +x ./ansi-to-html
