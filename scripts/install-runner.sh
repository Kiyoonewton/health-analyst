#!/usr/bin/env bash
# One-time setup of a self-hosted GitHub Actions runner for the
# Kiyoonewton/health-analyst repo, wired so that its checkouts land in
# /root/kiyoo/health-analyst/_work (see .github/workflows/deploy.yml for why).
#
# Usage:
#   ./install-runner.sh <registration-token>
#
# Get <registration-token> from:
#   https://github.com/Kiyoonewton/health-analyst/settings/actions/runners/new
# (token expires after ~1 hour, so run this script soon after copying it)
set -euo pipefail

TOKEN="${1:?Usage: install-runner.sh <registration-token>}"
RUNNER_DIR="/opt/actions-runner-healthanalyst"
WORK_DIR="/root/kiyoo/health-analyst/_work"
REPO_URL="https://github.com/Kiyoonewton/health-analyst"
RUNNER_VERSION="$(curl -fsSL https://api.github.com/repos/actions/runner/releases/latest | grep -m1 '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/')"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this as root." >&2
  exit 1
fi

mkdir -p "$RUNNER_DIR" "$WORK_DIR"
cd "$RUNNER_DIR"

ARCH="$(uname -m)"
case "$ARCH" in
  x86_64) RUNNER_ARCH="x64" ;;
  aarch64) RUNNER_ARCH="arm64" ;;
  *) echo "Unsupported arch: $ARCH" >&2; exit 1 ;;
esac

if [ ! -f ./config.sh ]; then
  echo "Downloading actions-runner v${RUNNER_VERSION} (${RUNNER_ARCH})..."
  curl -fsSL -o actions-runner.tar.gz \
    "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz"
  tar xzf actions-runner.tar.gz
  rm actions-runner.tar.gz
fi

./config.sh \
  --url "$REPO_URL" \
  --token "$TOKEN" \
  --name "healthanalyst-host" \
  --work "$WORK_DIR" \
  --labels "self-hosted,healthanalyst" \
  --unattended \
  --replace

./svc.sh install root
./svc.sh start

echo
echo "Runner installed and started as a systemd service."
echo "Check status with: $RUNNER_DIR/svc.sh status"
echo "View logs with:    journalctl -u actions.runner.* -f"
