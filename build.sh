#!/bin/bash
# Build script for Render deployment
echo "Installing dependencies..."
npm install

echo "Rebuilding SQLite3 for current platform..."
npm rebuild sqlite3

echo "Build completed successfully!"
