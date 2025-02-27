// Скрипт для встановлення залежностей на Vercel
const { execSync } = require('child_process');

console.log('🚀 Початок встановлення залежностей для Vercel...');

try {
  // Встановлюємо пакети напряму
  console.log('📦 Встановлення @heroicons/react...');
  execSync('npm install @heroicons/react@2.2.0 --force', { stdio: 'inherit' });
  
  console.log('📦 Встановлення @react-hook/media-query...');
  execSync('npm install @react-hook/media-query@1.1.1 --force', { stdio: 'inherit' });
  
  console.log('📦 Встановлення tailwindcss та пов\'язаних пакетів...');
  execSync('npm install tailwindcss@3.4.1 postcss@8 autoprefixer@10.0.1 --force', { stdio: 'inherit' });
  
  console.log('✅ Всі залежності успішно встановлені!');
} catch (error) {
  console.error('❌ Помилка при встановленні залежностей:', error);
  process.exit(1);
} 