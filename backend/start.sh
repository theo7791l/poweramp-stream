#!/bin/bash
echo "Installing dependencies..."
npm install
echo "Building TypeScript..."
npm run build
echo "Starting backend..."
npm start
