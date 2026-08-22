#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "Building web..."
npm run build

echo "Syncing to Android..."
npx cap sync

echo "Building APK..."
cd android
JAVA_HOME=/home/zubariel/Downloads/Code/jdk21 ./gradlew assembleRelease

cp app/build/outputs/apk/release/app-release.apk ../apk/ZapQR-v1.2.0.apk
echo "Done: apk/ZapQR-v1.2.0.apk"
