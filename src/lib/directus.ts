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
    const products = await directus.request(
      readItems('products', {
        sort: ['-createdAt'],
        fields: ['id', 'name', 'description', 'price', 'images', 'isNew', 'createdAt']
      })
    ) as Product[];
    
    return products;
  } catch (error) {
    console.error('Помилка при отриманні продуктів:', error);
    return [];
  }
}

// Функція для отримання URL зображення з Directus
export function getImageUrl(imageId: string): string {
  if (!imageId) return '';
  return `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${imageId}`;
}

// Функція для форматування ціни
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 0
  }).format(price);
} 