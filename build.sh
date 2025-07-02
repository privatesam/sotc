#!/bin/sh

# Build the client
echo "Building client..."
npx vite build

# Build the server with proper exclusions
echo "Building server..."
npx esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist \
  --external:vite.config.ts \
  --external:tailwind.config.ts \
  --external:postcss.config.js \
  --external:drizzle.config.ts \
  --external:components.json

echo "Build complete!"