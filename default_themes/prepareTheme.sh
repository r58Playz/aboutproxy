#!/bin/bash

if [ $# -ne 1 ]; then
  echo "usage: prepareTheme.sh themeFolder (no slash after the folder name please)"
  echo "Replaces all references to google's color palette with the actual colors."
  exit 1
fi

source google_color_palette.sh

mkdir "${1}_dist"

cp -r "${1}"/* "${1}_dist/"

cat "${1}/manifest.json" | envsubst > "${1}_dist/manifest.json"

cd "${1}_dist"

zip "../${1}.zip" *

cd ..

rm -r "${1}_dist"
