require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

// Конфігурація Directus
const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const adminEmail = process.env.DIRECTUS_ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.DIRECTUS_ADMIN_PASSWORD || 'password';

// Функція для логіну в Directus
async function login() {
  try {
    const response = await axios.post(`${directusUrl}/auth/login`, {
      email: adminEmail,
      password: adminPassword,
    });
    return response.data.data.access_token;
  } catch (error) {
    console.error('Помилка при логіні в Directus:', error.message);
    throw error;
  }
}

// Функція для створення колекції продуктів
async function createProductsCollection(token) {
  try {
    // Перевіряємо, чи існує колекція
    try {
      await axios.get(`${directusUrl}/collections/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Колекція products вже існує');
      return;
    } catch (error) {
      if (error.response && error.response.status !== 404) {
        throw error;
      }
      // Якщо колекція не існує (404), продовжуємо створення
    }

    // Створюємо колекцію products
    await axios.post(
      `${directusUrl}/collections`,
      {
        collection: 'products',
        meta: {
          icon: 'shopping_bag',
          note: 'Колекція продуктів для інтернет-магазину',
          display_template: '{{Name}}',
          archive_field: 'status',
          archive_value: 'archived',
          unarchive_value: 'draft',
          sort_field: 'sort',
        },
        schema: {
          name: 'products',
          comment: 'Продукти інтернет-магазину',
        },
        fields: [
          {
            field: 'id',
            type: 'uuid',
            meta: {
              hidden: true,
              readonly: true,
              interface: 'input',
              special: ['uuid'],
            },
            schema: {
              is_primary_key: true,
              has_auto_increment: false,
            },
          },
          {
            field: 'Name',
            type: 'string',
            meta: {
              interface: 'input',
              width: 'full',
              note: 'Product name',
              required: true,
            },
          },
          {
            field: 'THC',
            type: 'string',
            meta: {
              interface: 'input',
              width: 'half',
              note: 'THC content',
              required: true,
            },
          },
          {
            field: 'Aroma',
            type: 'string',
            meta: {
              interface: 'input',
              width: 'half',
              note: 'Aroma',
              required: true,
            },
          },
          {
            field: 'Effects',
            type: 'text',
            meta: {
              interface: 'input-multiline',
              width: 'full',
              note: 'Effects',
              required: true,
            },
          },
          {
            field: 'image',
            type: 'uuid',
            meta: {
              interface: 'file-image',
              width: 'full',
              note: 'Product image',
            },
            schema: {
              is_nullable: true,
              foreign_key_table: 'directus_files',
            },
          },
          {
            field: 'is_new',
            type: 'boolean',
            meta: {
              interface: 'boolean',
              width: 'half',
              note: 'New product',
            },
            schema: {
              default_value: false,
            },
          },
        ],
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log('Products collection created successfully');
  } catch (error) {
    console.error('Error creating products collection:', error.message);
    throw error;
  }
}

// Головна функція
async function main() {
  try {
    console.log('Ініціалізація Directus...');
    const token = await login();
    await createProductsCollection(token);
    console.log('Ініціалізацію Directus успішно завершено!');
  } catch (error) {
    console.error('Помилка при ініціалізації Directus:', error);
    process.exit(1);
  }
}

main(); 