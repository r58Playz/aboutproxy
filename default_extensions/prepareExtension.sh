#!/bin/bash

if [ $# -ne 1 ]; then
  echo "usage: prepareExtension.sh extensionFolder (no slash after the folder name please)"
  echo "Just zips up the folder for you."
  exit 1
fi

OLDPWD=$(pwd)

mkdir "${1}_dist"

cp -r "${1}"/* "${1}_dist/"

cd "${1}_dist"

zip "../$(basename ${1}).zip" *

cd "${OLDPWD}"

rm -r "${1}_dist"
