'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/types/product';
import styles from '@/styles/ProductCard.module.css';

// Функція перевірки, чи є URL відео файлом
function isVideoFile(url: string): boolean {
  // Перевіряємо, чи URL не є пустим або undefined
  if (!url || typeof url !== 'string') return false;
  
  try {
    // Перевірка за розширенням файлу
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.wmv', '.mkv'];
    const extensionMatch = url.match(/\.[0-9a-z]+$/i);
    
    if (extensionMatch && videoExtensions.includes(extensionMatch[0].toLowerCase())) {
      return true;
    }
    
    // Перевірка за відомими ID відео файлів
    const knownVideoIds = ['6f65b726-378e-4c07-aee6-95d197e6208b', 'video-placeholder.txt'];
    return knownVideoIds.some(id => url.includes(id));
  } catch (e) {
    // Якщо є помилка при обробці URL, повертаємо false
    console.error('Помилка при перевірці URL відео:', url, e);
    return false;
  }
}

// Додамо функцію для визначення, чи підтримується відео на пристрої
const checkVideoSupport = (videoUrl: string): boolean => {
  // Перевіряємо, чи URL не є пустим або undefined
  if (!videoUrl || typeof videoUrl !== 'string') return false;
  
  try {
    // Перевіряємо формат відео на сумісність з пристроєм
    const videoFormats = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      ogg: 'video/ogg',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo'
    };
    
    const ext = videoUrl.split('.').pop()?.toLowerCase() || '';
    const mimeType = (ext in videoFormats) ? videoFormats[ext as keyof typeof videoFormats] : '';
    
    if (!mimeType) return true; // Якщо не можемо визначити тип, припустимо, що підтримується
    
    // Перевіряємо підтримку через HTML5 video element
    const video = document.createElement('video');
    return video.canPlayType(mimeType) !== '';
  } catch (e) {
    // Якщо є помилка при перевірці підтримки, повертаємо false
    console.error('Помилка при перевірці підтримки відео:', videoUrl, e);
    return false;
  }
};

// Компонент карточки продукту
export default function ProductCard({ product }: { product: Product }) {
  // Стан для керування навігацією між медіа елементами
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  // Отримання всіх медіа URL для продукту
  const allMedia = React.useMemo(() => {
    const mediaArray: string[] = [];
    
    // Додаємо основне зображення
    if (product.image) {
      mediaArray.push(product.image);
    }
    
    // Додаємо додаткові зображення, якщо вони є
    if (product.mediaUrls && Array.isArray(product.mediaUrls)) {
      product.mediaUrls.forEach(url => {
        // Перевіряємо, щоб не додавати дублікати
        if (!mediaArray.includes(url)) {
          mediaArray.push(url);
        }
      });
    }
    
    // Додаємо відео, якщо вони є
    if (product.videoUrls && Array.isArray(product.videoUrls)) {
      product.videoUrls.forEach(url => {
        // Перевіряємо, щоб не додавати дублікати
        if (!mediaArray.includes(url)) {
          mediaArray.push(url);
        }
      });
    }
    
    return mediaArray;
  }, [product]);
  
  // Перевірка, чи є поточне медіа відео
  const isCurrentMediaVideo = currentMediaIndex < allMedia.length ? 
    isVideoFile(allMedia[currentMediaIndex]) : false;
  
  // Стан для відстеження помилок завантаження
  const [mediaError, setMediaError] = useState(false);
  
  // Стан для відстеження готовності відео
  const [videoReady, setVideoReady] = useState(false);
  
  // Визначення, чи це мобільний пристрій
  const [isMobile, setIsMobile] = useState(false);
  
  // Посилання на відео елемент
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Стан для відстеження наведення миші
  const [isHovered, setIsHovered] = useState(false);
  
  // Перевірка мобільного пристрою при монтуванні компонента
  useEffect(() => {
    setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    
    // Додаємо прослуховувач зміни розміру екрана
    const handleResize = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Обробник помилки завантаження зображення
  const handleImageError = () => {
    setMediaError(true);
  };
  
  // Обробник помилки завантаження відео
  const handleVideoError = () => {
    console.error('Помилка завантаження відео:', getCurrentVideoUrl());
    setMediaError(true);
    setVideoReady(false);
    
    // Показуємо спеціальне повідомлення для мобільних пристроїв
    if (isMobile) {
      console.log('Відео не вдалося завантажити на мобільному пристрої');
      // Видаляємо автоматичний перехід, щоб користувач міг бачити повідомлення про помилку
      // і самостійно вирішувати, що робити далі
    }
  };
  
  // Обробник готовності відео
  const handleVideoCanPlay = () => {
    console.log('Відео готове до відтворення');
    setVideoReady(true);
    setMediaError(false);
    
    // Якщо це мобільний пристрій, спробуємо автоматично встановити постер
    if (isMobile && videoRef.current) {
      try {
        // Створюємо зображення-постер з першого кадру відео
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const posterUrl = canvas.toDataURL('image/jpeg');
          videoRef.current.poster = posterUrl;
        }
      } catch (e) {
        console.error('Не вдалося створити постер для відео:', e);
      }
    }
  };
  
  // Обробники наведення миші
  const handleMouseEnter = () => {
    setIsHovered(true);
    
    // Якщо є відео і воно доступне, запускаємо його
    if (videoRef.current && isCurrentMediaVideo) {
      // Для мобільних пристроїв не починаємо автоматичне відтворення відео
      // це допоможе зменшити використання трафіку
      if (!isMobile) {
        videoRef.current.play().catch((error) => {
          console.error('Помилка автоматичного відтворення відео:', error);
          setMediaError(true);
        });
      }
    }
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    
    // Якщо є відео, зупиняємо його
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };
  
  // Функція для навігації до наступного медіа
  const nextMedia = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (allMedia.length > 1) {
      setCurrentMediaIndex((prev) => (prev + 1) % allMedia.length);
      setMediaError(false);
      setVideoReady(false);
    }
  };
  
  // Функція для навігації до попереднього медіа
  const prevMedia = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (allMedia.length > 1) {
      setCurrentMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
      setMediaError(false);
      setVideoReady(false);
    }
  };
  
  // Функція отримання URL зображення з урахуванням помилок
  const getImageUrl = (): string => {
    if (mediaError || (isCurrentMediaVideo && !videoReady)) {
      const placeholderId = (typeof product.id === 'string' ? product.id.charCodeAt(0) : 1) % 3 + 1;
      return `/placeholder-${placeholderId}.svg`;
    }
    
    if (isCurrentMediaVideo) {
      // Для відео повертаємо плейсхолдер
      const placeholderId = (typeof product.id === 'string' ? product.id.charCodeAt(0) : 1) % 3 + 1;
      return `/placeholder-${placeholderId}.svg`;
    }
    
    if (currentMediaIndex >= 0 && currentMediaIndex < allMedia.length) {
      return allMedia[currentMediaIndex];
    }
    
    return product.image || '/placeholder-1.svg';
  };
  
  // Функція для перевірки, чи є медіа навігація
  const hasNavigation = allMedia.length > 1;
  
  // Оновимо useEffect для відстеження змін поточного медіа
  useEffect(() => {
    setMediaError(false);
    setVideoReady(false);
    
    // Додамо затримку для мобільних пристроїв, щоб зменшити навантаження
    const timer = setTimeout(() => {
      // Якщо поточне медіа є відео і користувач навів мишку,
      // почнемо відтворення, але тільки на десктопах
      if (videoRef.current && isHovered && isCurrentMediaVideo && !isMobile) {
        videoRef.current.play().catch((error) => {
          console.error('Помилка відтворення відео:', error);
          setMediaError(true);
        });
      }
      
      // Для мобільних пристроїв просто перевіримо, чи можемо ми відтворити відео
      if (isCurrentMediaVideo && isMobile && videoRef.current) {
        const videoUrl = getCurrentVideoUrl();
        if (videoUrl) {
          const isSupported = checkVideoSupport(videoUrl);
          if (!isSupported) {
            console.warn('Формат відео не підтримується на цьому пристрої:', videoUrl);
            setMediaError(true);
            // Видаляємо автоматичний перехід, щоб користувач міг бачити повідомлення про помилку
          }
        }
      }
    }, isMobile ? 500 : 0); // Затримка для мобільних пристроїв
    
    return () => clearTimeout(timer);
  }, [currentMediaIndex, isHovered, isCurrentMediaVideo, isMobile]);
  
  // Отримуємо поточний відео URL
  const getCurrentVideoUrl = (): string | null => {
    try {
      if (currentMediaIndex >= 0 && currentMediaIndex < allMedia.length && isCurrentMediaVideo) {
        const videoUrl = allMedia[currentMediaIndex];
        
        // Перевіряємо, чи URL валідний
        if (!videoUrl) return null;
        
        // Створюємо URL об'єкт для перевірки
        const url = new URL(videoUrl, window.location.origin);
        
        // Для мобільних пристроїв використовуємо додаткове логування
        if (isMobile) {
          console.log('Відтворення відео на мобільному пристрої:', videoUrl, url.pathname);
        }
        
        return videoUrl;
      }
    } catch (e) {
      console.error('Помилка при отриманні URL відео:', e);
    }
    return null;
  };

  // Функція для відкриття відео на повний екран
  const openFullscreen = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen();
      } else if ((videoRef.current as any).msRequestFullscreen) {
        (videoRef.current as any).msRequestFullscreen();
      }
    }
  };

  return (
    <div 
      className={styles.card}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Badge "New" */}
      {product.is_new && <div className={styles.newBadge}>New</div>}
      
      {/* Container for media */}
      <div className={styles.mediaContainer}>
        {/* Show image if current media is image or video not ready */}
        {!isCurrentMediaVideo && (
          <Image
            src={getImageUrl()}
            alt={product.Name}
            className={styles.productImage}
            width={300}
            height={300}
            onError={handleImageError}
            priority={currentMediaIndex === 0}
          />
        )}
        
        {/* Show video if current media is video */}
        {isCurrentMediaVideo && !mediaError && (
          <div className={styles.videoWrapper}>
            <video
              ref={videoRef}
              className={`${styles.productVideo} ${videoReady ? styles.videoReady : ''}`}
              width={300}
              height={300}
              src={getCurrentVideoUrl() || undefined}
              muted
              playsInline
              preload="metadata"
              poster={getImageUrl()}
              loop
              controls={isHovered || isMobile}
              onCanPlay={handleVideoCanPlay}
              onError={handleVideoError}
            />
            {!videoReady && !mediaError && (
              <div className={styles.videoLoading}>
                <div className={styles.loadingSpinner}></div>
              </div>
            )}
            {videoReady && !mediaError && isMobile && (
              <div 
                className={styles.playButtonOverlay}
                onClick={() => {
                  if (videoRef.current) {
                    if (videoRef.current.paused) {
                      videoRef.current.play()
                        .catch(err => console.error('Помилка відтворення відео:', err));
                    } else {
                      videoRef.current.pause();
                    }
                  }
                }}
              >
                <div className={styles.playButton}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            )}
            {videoReady && (isHovered || isMobile) && (
              <button 
                className={styles.fullscreenButton}
                onClick={openFullscreen}
                aria-label="View fullscreen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M3 3h7v2H5v5H3V3m11 0h7v7h-2V5h-5V3m-9 11v7h7v-2H5v-5H3m11 5h5v-5h2v7h-7v-2z"/>
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Show placeholder if video has error */}
        {isCurrentMediaVideo && mediaError && (
          <div className={styles.videoErrorPlaceholder}>
            <p>{isMobile ? 'Відео недоступне на вашому пристрої' : 'Video unavailable'}</p>
            {isMobile && (
              <button 
                className={styles.retryButton}
                onClick={() => {
                  setMediaError(false);
                  setVideoReady(false);
                  // Невелика затримка перед повторною спробою
                  setTimeout(() => {
                    if (videoRef.current) {
                      videoRef.current.load();
                    }
                  }, 500);
                }}
              >
                Спробувати знову
              </button>
            )}
          </div>
        )}
        
        {/* Navigation elements */}
        {hasNavigation && (
          <>
            {/* Navigation counter */}
            <div className={styles.mediaNavigation}>
              <span className={styles.mediaCounter}>
                {currentMediaIndex + 1} / {allMedia.length}
              </span>
            </div>
            
            {/* Navigation buttons */}
            <button 
              className={styles.prevButton} 
              onClick={prevMedia}
              aria-label="Previous media"
            >
              &#8249;
            </button>
            <button 
              className={styles.nextButton} 
              onClick={nextMedia}
              aria-label="Next media"
            >
              &#8250;
            </button>
          </>
        )}
      </div>
      
      {/* Інформація про продукт */}
      <div className={styles.info}>
        <h3 className={styles.name}>{product.Name}</h3>
        <p className={styles.thc}>
          <span className={styles.thcLabel}>THC:</span> {product.THC}%
        </p>
        <p className={styles.aroma}>
          <span className={styles.aromaLabel}>Aroma:</span> {product.Aroma}
        </p>
        <p className={styles.effects}>
          <span className={styles.effectsLabel}>Effects:</span> {product.Effects}
        </p>
      </div>
    </div>
  );
} 