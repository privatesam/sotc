# SOTC (State of the Collection) - Watch Collection Management

A self-hostable web application for managing watch collections with comprehensive tracking, analytics, and image sharing capabilities.

## Features

- **Multiple Collections**: Create and manage different watch "boxes" (SOTC, wish list, etc.)
- **Detailed Watch Management**: Track purchase dates, service schedules, valuations, specifications
- **Image Management**: Upload and manage multiple images per watch with carousel display
- **Wear Tracking**: Daily wear logging with "WIT" (Wearing It Today) functionality
- **Analytics Dashboard**: Comprehensive wear statistics and streak tracking
- **Drag & Drop Organization**: Reorder watches within customizable grid layouts
- **Collection Sharing**: Export collection grids as images for social media
- **Mobile Optimized**: Responsive design for all screen sizes

## Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite with Drizzle ORM
- **File Storage**: Local filesystem for images
- **Build Tools**: Vite + ESBuild

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- At least 1GB of available disk space

### 1. Clone and Build

```bash
git clone <repository-url>
cd sotc-watch-collection
```

### 2. Create Data Directories

```bash
mkdir -p data/db data/uploads
```

### 3. Deploy with Docker Compose

```bash
docker-compose up -d
```

The application will be available at `http://localhost:5000`

### 4. Persistent Data

Your data is stored in bind mounts:
- `./data/db/` - SQLite database file
- `./data/uploads/` - Uploaded watch images

## Manual Docker Deployment

### Build the Image
```bash
docker build -t sotc-watch-collection .
```

### Run the Container
```bash
docker run -d \
  --name sotc \
  -p 5000:5000 \
  -v $(pwd)/data/db:/app/data/db \
  -v $(pwd)/data/uploads:/app/data/uploads \
  -e NODE_ENV=production \
  -e DATABASE_URL=file:/app/data/db/database.sqlite \
  --restart unless-stopped \
  sotc-watch-collection
```

## Development Setup

### Prerequisites
- Node.js 20 or higher
- npm

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

Access the development server at `http://localhost:5000`

### Build for Production
```bash
npm run build
npm start
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Application environment |
| `DATABASE_URL` | `file:./database.sqlite` | SQLite database path |
| `PORT` | `5000` | Application port |

### Docker Volumes

For persistent data, mount these directories:

- `/app/data/db` - Database storage
- `/app/data/uploads` - Image uploads

## Data Backup

To backup your collection data:

```bash
# Backup database
cp data/db/database.sqlite backup-$(date +%Y%m%d).sqlite

# Backup images
tar -czf images-backup-$(date +%Y%m%d).tar.gz data/uploads/
```

## Maintenance

### Update Application
```bash
docker-compose pull
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f sotc
```

### Database Maintenance
The SQLite database is maintenance-free for most use cases. For optimal performance with large collections (1000+ watches), consider running:

```bash
docker-compose exec sotc sqlite3 /app/data/db/database.sqlite "VACUUM;"
```

## Troubleshooting

### Container Won't Start
- Check if port 5000 is already in use
- Verify data directories exist and have proper permissions
- Check logs with `docker-compose logs sotc`

### Images Not Loading
- Verify the uploads directory is properly mounted
- Check file permissions on the uploads directory

### Database Issues
- Ensure the database directory is writable
- Check that DATABASE_URL environment variable is correct

## System Requirements

### Minimum
- 512MB RAM
- 1GB storage
- Single CPU core

### Recommended
- 1GB RAM
- 5GB storage (for image storage)
- 2 CPU cores

## Security Considerations

- The application is designed for self-hosting in trusted environments
- No built-in authentication (use reverse proxy with auth if needed)
- Uploaded images are stored locally without encryption
- Database contains no sensitive authentication data

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issue tracker.