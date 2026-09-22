#!/usr/bin/env bash
# Tạo demo/index.html (file HTML chạy độc lập) từ demo/app.html.
# app.html là bản gốc duy nhất — sửa ở đó, rồi chạy: bash demo/build.sh
set -euo pipefail
d="$(cd "$(dirname "$0")" && pwd)"
{
  printf '<!doctype html>\n<html lang="vi">\n<head>\n'
  printf '<meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  printf '</head>\n<body style="margin:0">\n'
  cat "$d/app.html"
  printf '\n</body>\n</html>\n'
} > "$d/index.html"
echo "Đã tạo $d/index.html"
