require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Directus Configuration
const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const adminEmail = process.env.DIRECTUS_ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.DIRECTUS_ADMIN_PASSWORD || 'password';

// Test product data
const testProducts = [
  {
    Name: 'OG Kush',
    THC: '20%',
    Aroma: 'Earthy, pine',
    Effects: 'Relaxation, euphoria, creativity',
    is_new: true,
  },
  {
    Name: 'Blue Dream',
    THC: '18%',
    Aroma: 'Berry, sweet',
    Effects: 'Relaxation, happiness, mood elevation',
    is_new: false,
  },
  {
    Name: 'Sour Diesel',
    THC: '22%',
    Aroma: 'Diesel, citrus',
    Effects: 'Energy, focus, creativity',
    is_new: true,
  },
  {
    Name: 'Girl Scout Cookies',
    THC: '25%',
    Aroma: 'Sweet, dessert',
    Effects: 'Euphoria, relaxation, happiness',
    is_new: false,
  },
  {
    Name: 'Purple Haze',
    THC: '16%',
    Aroma: 'Fruity, sweet',
    Effects: 'Creativity, euphoria, energy',
    is_new: true,
  },
];

// Function to login to Directus
async function login() {
  try {
    const response = await axios.post(`${directusUrl}/auth/login`, {
      email: adminEmail,
      password: adminPassword,
    });
    return response.data.data.access_token;
  } catch (error) {
    console.error('Error logging in to Directus:', error.message);
    throw error;
  }
}

// Function to upload an image
async function uploadImage(token, imagePath) {
  try {
    const formData = new FormData();
    const fileStream = fs.createReadStream(imagePath);
    formData.append('file', fileStream);
    
    const response = await axios.post(`${directusUrl}/files`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data.id;
  } catch (error) {
    console.error('Error uploading image:', error.message);
    return null;
  }
}

// Function to add test products
async function addTestProducts(token) {
  try {
    // Check if products already exist
    const response = await axios.get(`${directusUrl}/items/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (response.data.data.length > 0) {
      console.log('Products already exist, skipping test data addition');
      return;
    }
    
    console.log('Adding test products...');
    
    // Add each product
    for (const product of testProducts) {
      // Create product
      await axios.post(
        `${directusUrl}/items/products`,
        {
          ...product,
          // If there's an image, you can add it here
          // image: await uploadImage(token, 'path/to/image.jpg'),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    }
    
    console.log('Test products added successfully');
  } catch (error) {
    console.error('Error adding test products:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log('Adding test data to Directus...');
    const token = await login();
    await addTestProducts(token);
    console.log('Test data added successfully!');
  } catch (error) {
    console.error('Error adding test data:', error);
    process.exit(1);
  }
}

main(); 