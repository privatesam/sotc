#!/bin/sh

# Create data directories if they don't exist
mkdir -p /app/data/db
mkdir -p /app/data/uploads

# Set proper permissions
chmod 755 /app/data/db
chmod 755 /app/data/uploads

# Initialize database if it doesn't exist
if [ ! -f "/app/data/db/database.sqlite" ]; then
    echo "Initializing database..."
    npm run db:push
fi

# Start the application
exec npm start