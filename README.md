# Product Catalog Website

A single-page website built with Next.js and Directus for product management.

## Technologies Used

- **Frontend**: Next.js with Tailwind CSS
- **Backend**: Directus Cloud (headless CMS)

## Features

- Responsive product catalog
- Product details with images and videos
- Video autoplay on hover
- Minimalist design

## Media Support

### Video Features

The application supports both images and videos from Directus:

- **Auto-play on hover**: Videos automatically play when a user hovers over product cards
- **Video indicators**: A small play icon appears on cards that have video content
- **Smooth transitions**: Animations ensure a seamless experience when switching between static images and videos
- **Optimized loading**: Videos only load when needed to preserve bandwidth

### Media Management

The product catalog supports multiple media types:
- Images (jpg, png, webp)
- Videos (mp4, webm)

Videos are managed through the Directus media library alongside images. The API endpoint automatically categorizes media files based on their MIME types and provides separate arrays for image and video URLs.

## Quick Start

### Option 1: Using Directus Cloud (recommended)

This project is configured to use Directus Cloud at https://suppinfo.directus.app.

To run the project:

```bash
npm install
npm run dev
```

This will start the Next.js development server, which will connect to the Directus Cloud instance.

### Option 2: Using Docker (local development)

```bash
npm run setup
```

This will:
1. Start Directus using Docker
2. Initialize the database with the required structure
3. Populate the database with test data
4. Start the Next.js development server

**Note**: This option requires Docker and Docker Compose to be installed.

### Option 3: Without Docker (local development)

```bash
npm run setup:local
```

This will:
1. Install Directus locally
2. Initialize the database with the required structure
3. Populate the database with test data
4. Start the Next.js development server

## Environment Setup

Create a `.env.local` file in the root directory with the following content:

```
# Directus API URL
NEXT_PUBLIC_DIRECTUS_URL=https://suppinfo.directus.app
```

If you want to use a local Directus instance instead, change the URL to:

```
NEXT_PUBLIC_DIRECTUS_URL=http://localhost:8055
```

## Managing Directus

### Cloud Instance

The Directus Cloud instance is managed through the Directus Cloud dashboard. You can access it at:
https://suppinfo.directus.app/admin

### Local Instance

If you're running Directus locally:

```bash
# Start Directus
npm run directus:start

# Stop Directus
npm run directus:stop

# Initialize the database structure
npm run directus:init

# Populate with test data
npm run directus:seed
```

## Development

```bash
# Run Next.js development server
npm run dev

# Run both Directus and Next.js (local development only)
npm run dev:all
```

## Working with Media Files

### Adding Videos to Products

To add videos to products:

1. Log in to Directus admin panel
2. Navigate to the Media Library
3. Upload your video file (mp4 or webm format recommended)
4. Go to the Products collection
5. Edit a product and add the video to its "Media" field
6. Save the product

The frontend will automatically detect the video and show a video indicator on the product card.

### Video Format Recommendations

For optimal performance:
- Use MP4 format with H.264 codec for maximum browser compatibility
- Keep videos under 10MB for faster loading
- Use short videos (5-10 seconds) for product showcases
- Optimize resolution for web (720p is usually sufficient)

## Troubleshooting

### API Error 500

If you see an error when loading products, make sure:

1. You can access the Directus Cloud instance at https://suppinfo.directus.app
2. Your `.env.local` file has the correct Directus URL
3. If using a local instance, ensure Directus is running
4. Check the browser console for specific error messages

### Image Loading Issues

If images fail to load:

1. Verify that the Directus Cloud instance has the correct permissions set for assets
2. Check that the access token in the image URL is correct
3. Try using a different browser or clearing your cache

### Video Playback Issues

If videos don't play:

1. Check if the browser supports the video format (MP4/H.264 has the best support)
2. Verify that the video file is not corrupted by downloading it directly
3. Some browsers block autoplay - check browser console for warnings
4. Ensure the video size is reasonable for web delivery

### HTML Content in Product Fields

If you see HTML tags (like `<p>`) displayed in product fields:

1. Make sure your API endpoint is properly cleaning HTML tags using the stripHtmlTags function
2. Check if your Directus instance is configured to save HTML content in text fields
3. If you want to render HTML instead of stripping it, use dangerouslySetInnerHTML in your React components, but be cautious about security implications

## License

MIT
