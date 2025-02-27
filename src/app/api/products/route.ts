import { NextResponse } from 'next/server';

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

// Function to determine if a file is a video by its name
function isVideoFile(filename: string | undefined): boolean {
  if (!filename) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.wmv', '.mkv', '.m4v'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return videoExtensions.includes(ext);
}

export async function GET() {
  try {
    // Прямо задаємо URL Directus без змінної середовища
    const directusUrl = 'https://suppinfo.directus.app';
    
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
    
    // Оновлюємо запит, щоб отримати поле Media без mime_type, який викликає помилку 403
    const apiUrl = `${directusUrl}/items/products?fields=id,Name,THC,Aroma,Effects,is_new,Media.*,Media.directus_files_id.id,Media.directus_files_id.filename_download&limit=10`;
    
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
      
      // Використовуємо тестові дані, якщо з API нічого не прийшло
      if (!data.data || data.data.length === 0) {
        return NextResponse.json({
          data: createTestProducts()
        });
      }
      
      const transformedData = {
        data: Array.isArray(data.data) ? data.data.map((product: any) => {
          // Initialize arrays for media and video URLs
          const mediaUrls: string[] = [];
          const videoUrls: string[] = [];
          
          // Check if product has Media field and if it's an array
          if (product.Media && Array.isArray(product.Media) && product.Media.length > 0) {
            
            // Process each Media element
            product.Media.forEach((mediaItem: MediaItem) => {
              
              // Check various directus_files_id structure variants
              let fileId = null;
              let filename = null;
              
              if (mediaItem.directus_files_id) {
                if (typeof mediaItem.directus_files_id === 'string') {
                  // If it's a string - use it directly
                  fileId = mediaItem.directus_files_id;
                  
                  // Assume the file is an image if there's no additional information
                  mediaUrls.push(`/api/media/${fileId}`);
                } else if (typeof mediaItem.directus_files_id === 'object') {
                  // If it's an object - try to find ID and filename
                  
                  // Check if the object has id property
                  const fileObject = mediaItem.directus_files_id;
                  if (fileObject && fileObject.id) {
                    fileId = fileObject.id;
                    filename = fileObject.filename_download;
                    
                    // Create media URL through our proxy
                    const mediaUrl = `/api/media/${fileId}`;
                    
                    // Determine media type based on filename
                    if (filename && isVideoFile(filename)) {
                      videoUrls.push(mediaUrl);
                    } else {
                      mediaUrls.push(mediaUrl);
                    }
                  }
                }
              }
            });
          }
          
          // If no media found, use local placeholder
          let mainImageUrl: string;
          if (mediaUrls.length > 0) {
            mainImageUrl = mediaUrls[0]; // Use first element as main image
          } else {
            const placeholderId = (typeof product.id === 'number' ? product.id : 1) % 3 + 1;
            mainImageUrl = `/placeholder-${placeholderId}.svg`;
            // Add placeholder to media array for possible future use
            mediaUrls.push(mainImageUrl);
          }
          
          return {
            ...product,
            image: mainImageUrl,
            mediaUrls: mediaUrls.length > 0 ? mediaUrls : null,
            videoUrls: videoUrls.length > 0 ? videoUrls : null,
            // Clean HTML tags from text fields
            Aroma: stripHtmlTags(product.Aroma),
            Effects: stripHtmlTags(product.Effects)
          };
        }) : []
      };
      
      return NextResponse.json(transformedData);
    } catch (_) {
      // If an error occurred, return test data to continue development
      return NextResponse.json({
        data: createTestProducts()
      });
    }
  } catch (_) {
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// Function to create test products (used when API is unavailable)
function createTestProducts() {
  const products = [
    {
      id: 'test1',
      Name: 'Blue Dream',
      THC: '18%',
      Aroma: 'Berry, sweet',
      Effects: 'Relaxation, happiness, mood elevation',
      is_new: true,
      image: `/placeholder-1.svg`,
      mediaUrls: [`/placeholder-1.svg`],
      videoUrls: null
    },
    {
      id: 'test2',
      Name: 'OG Kush',
      THC: '24%',
      Aroma: 'Earthy, pine',
      Effects: 'Relaxation, euphoria, creativity',
      is_new: false,
      image: `/placeholder-2.svg`,
      mediaUrls: [`/placeholder-2.svg`],
      videoUrls: null
    },
    {
      id: 'test3',
      Name: 'Sour Diesel',
      THC: '21%',
      Aroma: 'Diesel, citrus',
      Effects: 'Energy, focus, creativity',
      is_new: true,
      image: `/placeholder-3.svg`,
      mediaUrls: [`/placeholder-3.svg`],
      videoUrls: [`/video-placeholder.txt`]
    }
  ];
  
  return products;
} 