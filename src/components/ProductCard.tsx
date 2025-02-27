'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/types/product';
import styles from '@/styles/ProductCard.module.css';

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
  
  // Get all media URLs for the product
  const allMedia = React.useMemo(() => {
    const mediaArray: string[] = [];
    
    // Add main image
    if (product.image) {
      mediaArray.push(product.image);
    }
    
    // Add additional images if they exist
    if (product.mediaUrls && Array.isArray(product.mediaUrls)) {
      product.mediaUrls.forEach(url => {
        // Check to avoid duplicates
        if (!mediaArray.includes(url)) {
          mediaArray.push(url);
        }
      });
    }
    
    // Add videos if they exist
    if (product.videoUrls && Array.isArray(product.videoUrls)) {
      product.videoUrls.forEach(url => {
        // Check to avoid duplicates
        if (!mediaArray.includes(url)) {
          mediaArray.push(url);
        }
      });
    }
    
    return mediaArray;
  }, [product]);
  
  // Check if current media is video
  const isCurrentMediaVideo = currentMediaIndex < allMedia.length ? 
    isVideoFile(allMedia[currentMediaIndex]) : false;
  
  // State for tracking loading errors
  const [mediaError, setMediaError] = useState(false);
  
  // State for tracking video readiness
  const [videoReady, setVideoReady] = useState(false);
  
  // Determine if this is a mobile device
  const [isMobile, setIsMobile] = useState(false);
  
  // Reference to video element
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // State for tracking mouse hover
  const [isHovered, setIsHovered] = useState(false);
  
  // Check mobile device on component mount
  useEffect(() => {
    setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    
    // Add resize event listener
    const handleResize = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Image error handler
  const handleImageError = () => {
    setMediaError(true);
  };
  
  // Video error handler
  const handleVideoError = () => {
    console.error('Error loading video:', getCurrentVideoUrl());
    setMediaError(true);
    setVideoReady(false);
    
    // Show special message for mobile devices
    if (isMobile) {
      console.log('Video failed to load on mobile device');
      // Remove automatic transition so user can see error message
      // and decide what to do next
    }
  };
  
  // Function to handle video ready to play event
  const handleVideoCanPlay = () => {
    console.log('Video ready to play');
    setVideoReady(true);
    setMediaError(false);
    
    // Automatically play video only on desktop when mouse is hovered
    if (videoRef.current && isHovered && !isMobile) {
      videoRef.current.play().catch(error => {
        console.error('Error playing video automatically:', error);
      });
    }
  };
  
  // Add new function that will trigger when "Try again" button is clicked
  const handleRetryVideo = () => {
    console.log('Retrying video playback');
    setMediaError(false);
    setVideoReady(false);
    
    // Delay for reloading video
    setTimeout(() => {
      if (videoRef.current) {
        // Reload video
        videoRef.current.load();
        
        // On mobile devices try to play video after reloading
        if (isMobile) {
          videoRef.current.play().catch(err => {
            console.error('Error playing video after reload:', err);
            setMediaError(true);
          });
        }
      }
    }, 500);
  };
  
  // Mouse hover handlers
  const handleMouseEnter = () => {
    setIsHovered(true);
    
    // If there's a video and it's available, play it
    if (videoRef.current && isCurrentMediaVideo) {
      // For mobile devices, don't auto-play video
      // this helps reduce data usage
      if (!isMobile) {
        videoRef.current.play().catch((error) => {
          console.error('Error playing video automatically:', error);
          setMediaError(true);
        });
      }
    }
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    
    // If there's a video, stop it
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };
  
  // Function for navigating to the next media
  const nextMedia = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (allMedia.length > 1) {
      setCurrentMediaIndex((prev) => (prev + 1) % allMedia.length);
      setMediaError(false);
      setVideoReady(false);
    }
  };
  
  // Function for navigating to the previous media
  const prevMedia = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (allMedia.length > 1) {
      setCurrentMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
      setMediaError(false);
      setVideoReady(false);
    }
  };
  
  // Function to get image URL considering errors
  const getImageUrl = (): string => {
    if (mediaError || (isCurrentMediaVideo && !videoReady)) {
      const placeholderId = (typeof product.id === 'string' ? product.id.charCodeAt(0) : 1) % 3 + 1;
      return `/placeholder-${placeholderId}.svg`;
    }
    
    if (isCurrentMediaVideo) {
      // For video return a placeholder
      const placeholderId = (typeof product.id === 'string' ? product.id.charCodeAt(0) : 1) % 3 + 1;
      return `/placeholder-${placeholderId}.svg`;
    }
    
    if (currentMediaIndex >= 0 && currentMediaIndex < allMedia.length) {
      return allMedia[currentMediaIndex];
    }
    
    return product.image || '/placeholder-1.svg';
  };
  
  // Check if media navigation is available
  const hasNavigation = allMedia.length > 1;
  
  // Get current video URL
  const getCurrentVideoUrl = (): string | null => {
    try {
      if (currentMediaIndex >= 0 && currentMediaIndex < allMedia.length && isCurrentMediaVideo) {
        const videoUrl = allMedia[currentMediaIndex];
        
        // Check if URL is valid
        if (!videoUrl) return null;
        
        // Create URL object for validation
        const url = new URL(videoUrl, window.location.origin);
        
        // For mobile devices use additional logging
        if (isMobile) {
          console.log('Playing video on mobile device:', videoUrl, url.pathname);
        }
        
        return videoUrl;
      }
    } catch (e) {
      console.error('Error getting video URL:', e);
    }
    return null;
  };

  // Function to open video in fullscreen
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

  // Update useEffect to track changes in current media
  useEffect(() => {
    setMediaError(false);
    setVideoReady(false);
    
    // Add delay for mobile devices to reduce load
    const timer = setTimeout(() => {
      // If current media is video and user has hovered mouse,
      // start playback, but only on desktops
      if (videoRef.current && isHovered && isCurrentMediaVideo && !isMobile) {
        videoRef.current.play().catch((error) => {
          console.error('Error playing video:', error);
          setMediaError(true);
        });
      }
      
      // For mobile devices just check if we can play the video
      if (isCurrentMediaVideo && isMobile && videoRef.current) {
        const videoUrl = getCurrentVideoUrl();
        if (videoUrl) {
          console.log('Checking video support for mobile device:', videoUrl);
          
          // Set explicit video size for better mobile device support
          if (videoRef.current) {
            videoRef.current.width = 320;
            videoRef.current.height = 240;
          }
          
          // For mobile devices on iOS there are often restrictions on autoplay
          if (navigator && navigator.userAgent && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
            console.log('iOS device detected, video may not play automatically');
          }
        }
      }
    }, isMobile ? 500 : 0); // Delay for mobile devices
    
    return () => clearTimeout(timer);
  }, [currentMediaIndex, isHovered, isCurrentMediaVideo, isMobile]);

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
              controls={isMobile}
              onCanPlay={handleVideoCanPlay}
              onError={handleVideoError}
              style={{ background: '#f8f8f8' }}
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
                        .catch(err => {
                          console.error('Error playing video:', err);
                          setMediaError(true);
                        });
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
            <p>{isMobile ? 'Video unavailable on your device' : 'Video unavailable'}</p>
            <button 
              className={styles.retryButton}
              onClick={handleRetryVideo}
            >
              Try again
            </button>
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
              className={`${styles.mediaButton} ${styles.prevButton}`} 
              onClick={prevMedia}
              aria-label="Previous media"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button 
              className={`${styles.mediaButton} ${styles.nextButton}`}
              onClick={nextMedia}
              aria-label="Next media"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </>
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