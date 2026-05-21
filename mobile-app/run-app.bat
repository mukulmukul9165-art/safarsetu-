@echo off
title SafarSetu Metro Bundler
echo Setting up workspace environment on Drive D...
set TEMP=d:\temp
set TMP=d:\temp
set EXPO_HOME=d:\temp\.expo
set EXPO_CACHE_DIR=d:\temp\.expo-cache

echo Starting Metro Bundler...
npx expo start
