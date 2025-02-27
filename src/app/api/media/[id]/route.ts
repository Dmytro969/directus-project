import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Новий формат роутингу для Next.js 15
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id; 
  
  try {
    // Спрощений доступ до Directus
    const directusUrl = 'https://suppinfo.directus.app';
    const fileUrl = `${directusUrl}/assets/${id}`;
    
    // Перевіряємо, чи це запит на відео і з мобільного пристрою
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = userAgent.includes('Mobile') || userAgent.includes('Android');
    
    // Журналюємо інформацію для діагностики
    console.log('Запит на медіа:', id, isMobile ? '(мобільний)' : '(десктоп)');
    
    // Якщо це тестове відео і запит з мобільного пристрою
    if (id === 'video-placeholder.txt') {
      // Замість відео повертаємо зображення з повідомленням
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
        console.error('Помилка при читанні плейсхолдера:', error);
      }
    }
    
    // Спроба отримати файл з Directus
    const response = await fetch(fileUrl, { 
      cache: 'no-store'
    });
    
    if (response.ok) {
      // Отримуємо та повертаємо файл
      const data = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      
      // Якщо це відео для мобільного пристрою, ми можемо конвертувати його в інший формат
      // Але для цього потрібен сервер із ffmpeg, тому просто повертаємо як є
      return new NextResponse(data, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }
    
    // Повертаємо плейсхолдер як запасний варіант
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
      // Повертаємо помилку, якщо нічого не знайдено
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Помилка при обробці запиту на медіа:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
} 