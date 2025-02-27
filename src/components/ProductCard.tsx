'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/types/product';
import styles from '@/styles/ProductCard.module.css';

// Функція перевірки, чи є URL відео файлом
function isVideoFile(url: string): boolean {
  // Перевірка за розширенням файлу
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.wmv', '.mkv'];
  const extensionMatch = url.match(/\.[0-9a-z]+$/i);
  if (extensionMatch && videoExtensions.includes(extensionMatch[0].toLowerCase())) {
    return true;
  }
  
  // Перевірка за відомими ID відео файлів
  const knownVideoIds = ['6f65b726-378e-4c07-aee6-95d197e6208b', 'video-placeholder.txt'];
  return knownVideoIds.some(id => url.includes(id));
}

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
  
  // Посилання на відео елемент
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Стан для відстеження наведення миші
  const [isHovered, setIsHovered] = useState(false);
  
  // Обробник помилки завантаження зображення
  const handleImageError = () => {
    setMediaError(true);
  };
  
  // Обробник помилки завантаження відео
  const handleVideoError = () => {
    setMediaError(true);
  };
  
  // Обробник готовності відео
  const handleVideoCanPlay = () => {
    setVideoReady(true);
    setMediaError(false);
  };
  
  // Обробники наведення миші
  const handleMouseEnter = () => {
    setIsHovered(true);
    
    // Якщо є відео і воно доступне, запускаємо його
    if (videoRef.current && isCurrentMediaVideo) {
      videoRef.current.play().catch(() => {
        setMediaError(true);
      });
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
  
  // Відстежуємо зміни поточного медіа
  useEffect(() => {
    setMediaError(false);
    setVideoReady(false);
    
    // Якщо поточне медіа є відео і користувач навів мишку,
    // почнемо відтворення
    if (videoRef.current && isHovered && isCurrentMediaVideo) {
      videoRef.current.play().catch(() => {
        setMediaError(true);
      });
    }
  }, [currentMediaIndex, isHovered, isCurrentMediaVideo]);
  
  // Отримуємо поточний відео URL
  const getCurrentVideoUrl = (): string | null => {
    if (currentMediaIndex >= 0 && currentMediaIndex < allMedia.length && isCurrentMediaVideo) {
      return allMedia[currentMediaIndex];
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
        {isCurrentMediaVideo && (
          <div className={styles.videoWrapper}>
            <video
              ref={videoRef}
              className={`${styles.productVideo} ${videoReady ? styles.videoReady : ''}`}
              width={300}
              height={300}
              src={getCurrentVideoUrl() || undefined}
              muted
              playsInline
              loop
              controls={isHovered || window.matchMedia('(max-width: 768px)').matches}
              onCanPlay={handleVideoCanPlay}
              onError={handleVideoError}
            />
            {videoReady && isHovered && !window.matchMedia('(max-width: 768px)').matches && (
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
            <p>Video unavailable</p>
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
      
      {/* Product information */}
      <div className={styles.info}>
        <h3 className={styles.name}>{product.Name}</h3>
        {product.THC && (
          <div className={styles.thc}>
            <span className={styles.thcLabel}>THC:</span> {product.THC}
          </div>
        )}
        {product.Aroma && (
          <div className={styles.aroma}>
            <span className={styles.aromaLabel}>Aroma:</span> {product.Aroma}
          </div>
        )}
        {product.Effects && (
          <div className={styles.effects}>
            <span className={styles.effectsLabel}>Effects:</span> {product.Effects}
          </div>
        )}
      </div>
    </div>
  );
} 