'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types/product';
import styles from '@/styles/ProductCard.module.css';

// Спочатку спробуємо імпортувати з heroicons, якщо не вдасться, використаємо внутрішню версію
let ChevronLeftIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
let ChevronRightIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;

try {
  const heroicons = require('@heroicons/react/24/outline');
  ChevronLeftIcon = heroicons.ChevronLeftIcon;
  ChevronRightIcon = heroicons.ChevronRightIcon;
} catch (e) {
  // Створюємо прості компоненти для SVG
  ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      width="24"
      height="24"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.5L8.5 12l6.5-7.5" />
    </svg>
  );
  
  ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      width="24"
      height="24"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 19.5l7.5-7.5-7.5-7.5" />
    </svg>
  );
}

// Альтернативна функція для useMediaQuery, якщо бібліотека недоступна
function useMediaQueryFallback(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);
  
  return matches;
}

// Підключаємо useMediaQuery з бібліотеки або використовуємо наш fallback
let useMediaQuery: (query: string) => boolean;

try {
  useMediaQuery = require('@react-hook/media-query').useMediaQuery;
} catch (e) {
  useMediaQuery = useMediaQueryFallback;
}

// Function to check if a URL is a video file
function isVideoFile(url: string): boolean {
  // Check if URL is empty or undefined
  if (!url || typeof url !== 'string') return false;
  
  try {
    // Check by file extension
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.wmv', '.mkv'];
    const extensionMatch = url.match(/\.[0-9a-z]+$/i);
    
    if (extensionMatch && videoExtensions.includes(extensionMatch[0].toLowerCase())) {
      return true;
    }
    
    // Check by known video file IDs
    const knownVideoIds = ['6f65b726-378e-4c07-aee6-95d197e6208b', 'video-placeholder.txt'];
    return knownVideoIds.some(id => url.includes(id));
  } catch (e) {
    // If there's an error processing the URL, return false
    console.error('Error checking video URL:', url, e);
    return false;
  }
}

// Add function to check if video is supported on the device
const checkVideoSupport = (videoUrl: string): boolean => {
  // Check if URL is empty or undefined
  if (!videoUrl || typeof videoUrl !== 'string') return false;
  
  try {
    // Check video format compatibility with the device
    const videoFormats = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      ogg: 'video/ogg',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo'
    };
    
    const ext = videoUrl.split('.').pop()?.toLowerCase() || '';
    const mimeType = (ext in videoFormats) ? videoFormats[ext as keyof typeof videoFormats] : '';
    
    if (!mimeType) return true; // If we can't determine the type, assume it's supported
    
    // Check support via HTML5 video element
    const video = document.createElement('video');
    return video.canPlayType(mimeType) !== '';
  } catch (e) {
    // If there's an error checking support, return false
    console.error('Error checking video support:', videoUrl, e);
    return false;
  }
};

// Product card component
export default function ProductCard({ product }: { product: Product }) {
  // State for managing navigation between media elements
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Check if device is mobile using a media query
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Get all media URLs for the product
  const mediaUrls = product.mediaUrls || [];
  const videoUrls = product.videoUrls || [];
  const allMedia = [...mediaUrls, ...videoUrls];
  const hasNavigation = allMedia.length > 1;
  
  // State for tracking video readiness
  const [videoReady, setVideoReady] = useState(false);
  
  // Check if current media is a video
  const isCurrentMediaVideo = allMedia[currentMediaIndex] ? isVideoFile(allMedia[currentMediaIndex]) : false;
  
  // Get all media URLs for the product
  const allMediaMemo = React.useMemo(() => {
    const mediaArray: string[] = [];
    
    // Add media URLs
    if (product.mediaUrls && product.mediaUrls.length > 0) {
      mediaArray.push(...product.mediaUrls);
    }
    
    // Add video URLs
    if (product.videoUrls && product.videoUrls.length > 0) {
      mediaArray.push(...product.videoUrls);
    }
    
    // If no media, use the main image
    if (mediaArray.length === 0 && product.image) {
      mediaArray.push(product.image);
    }
    
    return mediaArray;
  }, [product]);
  
  // Handle mouse enter/leave for hover state
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  
  // Handle navigation to previous/next media
  const prevMedia = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMediaIndex((prevIndex) => (prevIndex === 0 ? allMedia.length - 1 : prevIndex - 1));
    setMediaError(false);
    setVideoReady(false);
    setIsLoading(true);
  };
  
  const nextMedia = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMediaIndex((prevIndex) => (prevIndex === allMedia.length - 1 ? 0 : prevIndex + 1));
    setMediaError(false);
    setVideoReady(false);
    setIsLoading(true);
  };
  
  // Video error handling
  const handleVideoError = () => {
    setMediaError(true);
    setVideoReady(false);
  };
  
  const handleImageError = () => {
    setMediaError(true);
    setIsLoading(false);
  };
  
  const handleRetryVideo = () => {
    setMediaError(false);
    setVideoReady(false);
    
    // Reset video element
    if (videoRef.current) {
      videoRef.current.load();
    }
  };
  
  // Handle video ready state
  const handleVideoCanPlay = () => {
    setVideoReady(true);
  };
  
  // Fullscreen handling for video
  const openFullscreen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
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
        {allMedia.length > 0 ? (
          <>
            {isCurrentMediaVideo ? (
              <video
                ref={videoRef}
                className={styles.productVideo}
                src={allMedia[currentMediaIndex]}
                controls
                width={isMobile ? 240 : 300}
                height={isMobile ? 240 : 300}
                style={{ objectFit: isMobile ? 'contain' : 'cover', backgroundColor: '#f8f8f8' }}
                onError={handleVideoError}
                onCanPlay={handleVideoCanPlay}
              />
            ) : (
              <>
                {isLoading && <div className={styles.loadingSpinner} />}
                <Image
                  className={styles.productImage}
                  src={allMedia[currentMediaIndex]}
                  alt={`${product.Name} - фото ${currentMediaIndex + 1}`}
                  width={isMobile ? 240 : 300}
                  height={isMobile ? 240 : 300}
                  quality={90}
                  priority={currentMediaIndex === 0}
                  loading={currentMediaIndex === 0 ? "eager" : "lazy"}
                  sizes="(max-width: 480px) 240px, (max-width: 768px) 280px, 300px"
                  onLoad={() => setIsLoading(false)}
                  onLoadingComplete={() => setIsLoading(false)}
                  onError={handleImageError}
                />
              </>
            )}
            
            {/* Navigation buttons */}
            {hasNavigation && (
              <>
                <button
                  className={`${styles.mediaButton} ${styles.prevButton}`}
                  onClick={prevMedia}
                  aria-label="Попереднє зображення"
                >
                  <ChevronLeftIcon className={styles.buttonIcon} />
                </button>
                <button
                  className={`${styles.mediaButton} ${styles.nextButton}`}
                  onClick={nextMedia}
                  aria-label="Наступне зображення"
                >
                  <ChevronRightIcon className={styles.buttonIcon} />
                </button>
                <div className={styles.mediaNavigation}>
                  {currentMediaIndex + 1} / {allMedia.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className={styles.noImage}>Зображення відсутнє</div>
        )}
      </div>
      
      {/* Product information */}
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