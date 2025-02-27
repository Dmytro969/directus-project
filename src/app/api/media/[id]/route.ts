import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// New routing format for Next.js 15
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id; 
  
  try {
    // Simplified access to Directus
    const directusUrl = 'https://suppinfo.directus.app';
    const fileUrl = `${directusUrl}/assets/${id}`;
    
    // Check if this is a video request from a mobile device
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = userAgent.includes('Mobile') || userAgent.includes('Android');
    
    // Log information for diagnostics
    console.log('Media request:', id, isMobile ? '(mobile)' : '(desktop)');
    
    // If this is a test video and request from mobile device
    if (id === 'video-placeholder.txt') {
      // Return an image with a message instead of video
      const placeholderId = 1;
      const placeholderPath = path.join(process.cwd(), 'public', `placeholder-${placeholderId}.svg`);
      
      try {
        const placeholderData = await fs.promises.readFile(placeholderPath);
        return new NextResponse(placeholderData, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      } catch (error) {
        console.error('Error reading placeholder:', error);
      }
    }
    
    // Try to get file from Directus
    const response = await fetch(fileUrl, { 
      cache: 'no-store'
    });
    
    if (response.ok) {
      // Get and return the file
      const data = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      
      // If this is a video for mobile device, we could convert it to another format
      // But this would require a server with ffmpeg, so we just return as is
      return new NextResponse(data, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }
    
    // Return a placeholder as fallback
    const placeholderId = (parseInt(id) || 1) % 3 + 1;
    const placeholderPath = path.join(process.cwd(), 'public', `placeholder-${placeholderId}.svg`);
    
    try {
      const placeholderData = await fs.promises.readFile(placeholderPath);
      return new NextResponse(placeholderData, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    } catch (_) {
      // Return error if nothing is found
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error processing media request:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
} 