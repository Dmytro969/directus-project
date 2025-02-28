import { NextResponse } from 'next/server';
import { Product } from '@/types/product';

// Helper function to strip HTML tags
function stripHtmlTags(html: string | null) {
  if (!html) return '';
  return html.replace(/<\/?[^>]+(>|$)/g, '');
}

// Define interface for media item
interface MediaItem {
  directus_files_id: string | null | {
    id?: string;
    filename_download?: string;
    type?: string;
    filesize?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

// Функція для визначення, чи є файл відео за його ім'ям
function isVideoFile(filename: string | undefined): boolean {
  if (!filename) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.wmv', '.mkv', '.m4v'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return videoExtensions.includes(ext);
}

export async function GET() {
  try {
    // Прямо задаємо URL Directus без змінної середовища
    const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://suppinfo.directus.app';
    
    // Спочатку отримаємо публічний токен (якщо це можливо)
    let accessToken = '';
    try {
      const authResponse = await fetch(`${directusUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: process.env.DIRECTUS_ADMIN_EMAIL || 'admin@example.com',
          password: process.env.DIRECTUS_ADMIN_PASSWORD || 'admin-password'
        }),
        cache: 'no-store'
      });
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        accessToken = authData.data?.access_token;
      }
    } catch (_) {
      // Продовжуємо без токена
    }
    
    // Оновлюємо запит відповідно до нової структури API
    // Додаємо більше інформації про медіа файли, щоб коректно визначати їх тип
    const apiUrl = `${directusUrl}/items/products?fields=id,Name,is_new,Aroma,Effects,Type,thc_purity,thc_purity_value,Media.*,Media.directus_files_id.*`;
    
    try {
      // Додаємо можливі заголовки автентифікації
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Додаємо токен автентифікації, якщо ми його отримали
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(apiUrl, { 
        method: 'GET',
        headers,
        // Вимикаємо кеш для тестування
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Якщо з API нічого не прийшло, використовуємо приклад
      if (!data.data || data.data.length === 0) {
        // Повертаємо приклад з медіа даними
        return NextResponse.json({
          data: getExampleProducts()
        });
      }
      
      // Трансформуємо дані в формат, необхідний для фронтенду
      const transformedData = {
        data: Array.isArray(data.data) ? data.data.map((product: any) => {
          // Ініціалізуємо масиви для медіа та відео URL
          const mediaUrls: string[] = [];
          const videoUrls: string[] = [];
          
          // Перевіряємо, чи має продукт поле Media з розширеними даними
          if (product.Media && Array.isArray(product.Media)) {
            // Обробляємо кожен елемент Media, враховуючи різні можливі структури
            product.Media.forEach((mediaItem: any) => {
              // Спочатку перевіряємо, чи це об'єкт з directus_files_id
              if (mediaItem && typeof mediaItem === 'object') {
                if (mediaItem.directus_files_id) {
                  // Може бути string або об'єкт
                  if (typeof mediaItem.directus_files_id === 'string') {
                    const mediaUrl = `/api/media/${mediaItem.directus_files_id}`;
                    mediaUrls.push(mediaUrl);
                  } else if (typeof mediaItem.directus_files_id === 'object' && mediaItem.directus_files_id.id) {
                    const fileId = mediaItem.directus_files_id.id;
                    const mediaUrl = `/api/media/${fileId}`;
                    
                    // Перевірка на відео
                    if (mediaItem.directus_files_id.filename_download && 
                        isVideoFile(mediaItem.directus_files_id.filename_download)) {
                      videoUrls.push(mediaUrl);
                    } else {
                      mediaUrls.push(mediaUrl);
                    }
                  }
                } else if ('id' in mediaItem) {
                  // Якщо це просто об'єкт з id
                  const mediaUrl = `/api/media/${mediaItem.id}`;
                  mediaUrls.push(mediaUrl);
                }
              } else if (typeof mediaItem === 'number' || typeof mediaItem === 'string') {
                // Якщо це просто ID
                const mediaUrl = `/api/media/${mediaItem}`;
                mediaUrls.push(mediaUrl);
              }
            });
          }
          
          // Якщо медіа не знайдено, використовуємо плейсхолдер
          let mainImageUrl: string;
          if (mediaUrls.length > 0) {
            mainImageUrl = mediaUrls[0]; // Використовуємо перший елемент як основне зображення
          } else {
            const placeholderId = (typeof product.id === 'number' ? product.id : 1) % 3 + 1;
            mainImageUrl = `/placeholder-${placeholderId}.svg`;
            // Додаємо плейсхолдер у масив медіа
            mediaUrls.push(mainImageUrl);
          }
          
          return {
            ...product,
            image: mainImageUrl,
            mediaUrls: mediaUrls.length > 0 ? mediaUrls : null,
            videoUrls: videoUrls.length > 0 ? videoUrls : null,
            // Очищаємо HTML теги з текстових полів
            Aroma: stripHtmlTags(product.Aroma),
            Effects: stripHtmlTags(product.Effects),
            Type: product.Type ? stripHtmlTags(product.Type) : undefined
          };
        }) : []
      };
      
      return NextResponse.json(transformedData);
    } catch (error) {
      // У випадку помилки, використовуємо приклад
      console.error('API request error:', error);
      return NextResponse.json({
        data: getExampleProducts()
      });
    }
  } catch (error) {
    console.error('Error processing products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// Функція для отримання прикладу продуктів
function getExampleProducts() {
  return [
    {
      id: 7,
      Name: "🎂Wedding Cake 🎂",
      is_new: true,
      Aroma: "Sweet, creamy, with hints of vanilla, earthy undertones, and a touch of citrus (9/10).",
      Effects: "Relaxing, euphoric, with a calming body high that melts away stress and tension",
      Type: "Hybrid (Indica 60% / Sativa 40%)",
      thc_purity: "THC",
      thc_purity_value: 23,
      // Надаємо дані про медіа з правильною структурою для коректної обробки
      image: `/placeholder-1.svg`,
      mediaUrls: [`/placeholder-1.svg`],
      videoUrls: null
    }
  ];
} 