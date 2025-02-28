import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Допоміжна функція для визначення, чи це відео за MIME-типом або URL
function isVideoContent(contentType: string, url: string): boolean {
  // Перевірка за MIME-типом
  if (contentType.startsWith('video/')) {
    return true;
  }
  
  // Перевірка за URL-параметрами (для прямих запитів відео)
  const urlObj = new URL(url, 'http://localhost');
  if (urlObj.searchParams.get('type') === 'video') {
    return true;
  }
  
  // Перевірка за відомими відео-ідентифікаторами
  const knownVideoIds = ['ec4fff17-cafa-452e-a1a3-f75f5edfd2e6', 'video-placeholder.txt'];
  const pathParts = url.split('/');
  const fileId = pathParts[pathParts.length - 1]?.split('?')[0];
  
  return knownVideoIds.includes(fileId);
}

// Новий формат роутингу для Next.js 15
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Виправлено: використовуємо await для params, щоб уникнути помилки динамічних API у Next.js
  const id = await Promise.resolve(params.id);
  
  // Перевіряємо, чи запит містить параметр для відео
  const requestUrl = request.url;
  const isVideoRequest = requestUrl.includes('type=video');
  
  try {
    // Спрощений доступ до Directus
    const directusUrl = 'https://suppinfo.directus.app';
    const fileUrl = `${directusUrl}/assets/${id}`;
    
    // Спроба отримати файл з Directus
    const response = await fetch(fileUrl, { 
      cache: 'no-store'
    });
    
    if (response.ok) {
      // Отримуємо та повертаємо файл
      const data = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      
      // Перевіряємо чи це відео або зображення
      const isVideo = isVideoContent(contentType, request.url);
      
      // Якщо це відео, але запит не містить параметр type=video,
      // перенаправляємо на той самий URL, але з додатковим параметром
      if (isVideo && !isVideoRequest) {
        const url = new URL(request.url);
        url.searchParams.set('type', 'video');
        return NextResponse.redirect(url);
      }
      
      return new NextResponse(data, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
          // Додаємо заголовок для клієнта, щоб визначити тип медіа
          'X-Media-Type': isVideo ? 'video' : 'image'
        }
      });
    }
    
    // Якщо це тестове відео
    if (id === 'video-placeholder.txt') {
      const videoPath = path.join(process.cwd(), 'public', 'sample-video.mp4');
      
      try {
        const videoData = await fs.promises.readFile(videoPath);
        return new NextResponse(videoData, {
          headers: {
            'Content-Type': 'video/mp4',
            'Cache-Control': 'public, max-age=3600',
            'X-Media-Type': 'video'
          }
        });
      } catch (_) {
        // Відео не знайдено
      }
    }
    
    // Повертаємо плейсхолдер як запасний варіант
    const placeholderId = (parseInt(id) || 1) % 3 + 1;
    const placeholderPath = path.join(process.cwd(), 'public', `placeholder-${placeholderId}.svg`);
    
    try {
      const placeholderData = await fs.promises.readFile(placeholderPath);
      return new NextResponse(placeholderData, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
          'X-Media-Type': 'image'
        }
      });
    } catch (_) {
      // Повертаємо помилку, якщо нічого не знайдено
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Помилка при обробці медіа-файлу:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
} 