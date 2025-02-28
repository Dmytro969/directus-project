import { createDirectus, rest, readItems } from '@directus/sdk';
import { Product } from '../types/product';

// Налаштування клієнта Directus
const directus = createDirectus(process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055')
  .with(rest());

// Інтерфейс для колекцій Directus
interface DirectusCollections {
  products: Product;
}

// Функція для отримання всіх продуктів
export async function getProducts(): Promise<Product[]> {
  try {
    // Робимо реальний запит до Directus API з новою структурою полів
    const products = await directus.request(
      readItems('products', {
        sort: ['-id'],
        fields: ['id', 'Name', 'is_new', 'Aroma', 'Effects', 'Type', 'thc_purity', 'thc_purity_value', 'Media']
      })
    ) as Product[];
    
    return products;
  } catch (error) {
    console.error('Помилка при отриманні продуктів:', error);
    
    // У випадку помилки, використовуємо приклад даних для демонстрації
    const exampleData = [
      {
        id: 7,
        Name: "🎂Wedding Cake 🎂",
        is_new: true,
        Aroma: "Sweet, creamy, with hints of vanilla, earthy undertones, and a touch of citrus (9/10).",
        Effects: "Relaxing, euphoric, with a calming body high that melts away stress and tension",
        Type: "Hybrid (Indica 60% / Sativa 40%)",
        thc_purity: "THC",
        thc_purity_value: 23,
        Media: [
          {
            id: 8,
            directus_files_id: {
              id: "12345",
              filename_download: "wedding-cake.jpg"
            }
          },
          {
            id: 9,
            directus_files_id: {
              id: "67890",
              filename_download: "wedding-cake-video.mp4"
            }
          }
        ]
      }
    ];
    
    return exampleData;
  }
}

// Функція для отримання URL зображення з Directus
export function getImageUrl(imageId: string | number): string {
  if (!imageId) return '';
  return `/api/media/${imageId}`;
}

// Функція для створення повного URL до зображення
export function getFullImageUrl(imageId: string | number): string {
  return `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${imageId}`;
}

// Функція для визначення, чи є файл відео за його ім'ям
export function isVideoFile(filename: string): boolean {
  if (!filename) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.wmv', '.mkv', '.m4v'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return videoExtensions.includes(ext);
} 