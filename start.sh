#!/bin/sh

# Create data directories if they don't exist
mkdir -p /app/data/db
mkdir -p /app/data/uploads

# Set proper permissions
chmod 755 /app/data/db
chmod 755 /app/data/uploads

# Note: Database initialization will happen automatically when the app starts
# The application uses DatabaseStorage which handles table creation

# Start the application
exec npm start