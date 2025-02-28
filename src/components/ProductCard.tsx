'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/types/product';
import styles from '@/styles/ProductCard.module.css';

// Функція перевірки, чи є URL відео файлом
function isVideoFile(url: string): boolean {
  // Перевірка за розширенням файлу
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.wmv', '.mkv', '.m4v', '.ogg'];
  const extensionMatch = url.match(/\.[0-9a-z]+$/i);
  if (extensionMatch && videoExtensions.includes(extensionMatch[0].toLowerCase())) {
    return true;
  }
  
  // Перевірка за відомими ID відео файлів або частинами URL, які вказують на відео
  const knownVideoIds = ['6f65b726-378e-4c07-aee6-95d197e6208b', 'video-placeholder.txt', 'video', 'ec4fff17-cafa-452e-a1a3-f75f5edfd2e6'];
  return knownVideoIds.some(id => url.toLowerCase().includes(id));
}

// Додамо функцію для визначення, чи підтримується відео на пристрої
const checkVideoSupport = (videoUrl: string): boolean => {
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
};

// Функція для очищення HTML-тегів
function stripHtmlTags(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<\/?[^>]+(>|$)/g, '');
}

// Компонент карточки продукту
export default function ProductCard({ product }: { product: Product }) {
  // Стан для керування навігацією між медіа елементами
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  // Отримання всіх медіа URL для продукту
  const allMedia = React.useMemo(() => {
    const mediaArray: string[] = [];
    const videosFound: boolean[] = [];
    
    // Додаємо основне зображення
    if (product.image) {
      mediaArray.push(product.image);
      // Додатково перевіряємо, чи це не відео
      videosFound.push(isVideoFile(product.image));
    }
    
    // Додаємо додаткові зображення, якщо вони є
    if (product.mediaUrls && Array.isArray(product.mediaUrls)) {
      product.mediaUrls.forEach(url => {
        // Перевіряємо, щоб не додавати дублікати
        if (!mediaArray.includes(url)) {
          mediaArray.push(url);
          videosFound.push(isVideoFile(url));
        }
      });
    }
    
    // Додаємо відео, якщо вони є
    if (product.videoUrls && Array.isArray(product.videoUrls)) {
      product.videoUrls.forEach(url => {
        // Перевіряємо, щоб не додавати дублікати
        if (!mediaArray.includes(url)) {
          mediaArray.push(url);
          videosFound.push(true);
        }
      });
    }
    
    // Перевіряємо кожен URL на наявність відео
    for (let i = 0; i < mediaArray.length; i++) {
      if (!videosFound[i]) {
        videosFound[i] = isVideoFile(mediaArray[i]);
      }
    }
    
    return { 
      mediaArray, 
      isVideoMedia: videosFound,
      hasVideo: videosFound.some(v => v) 
    };
  }, [product]);
  
  // Перевірка, чи є поточне медіа відео
  const isCurrentMediaVideo = currentMediaIndex < allMedia.mediaArray.length ? 
    allMedia.isVideoMedia[currentMediaIndex] : false;
  
  // Стан для відстеження помилок завантаження
  const [mediaError, setMediaError] = useState(false);
  
  // Стан для відстеження готовності відео
  const [videoReady, setVideoReady] = useState(false);
  
  // Стан для блокування операцій відтворення, щоб запобігти конфліктам
  const [isVideoPlaybackLocked, setIsVideoPlaybackLocked] = useState(false);
  
  // Визначення, чи це мобільний пристрій
  const [isMobile, setIsMobile] = useState(false);
  
  // Посилання на відео елемент
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Стан для відстеження наведення миші
  const [isHovered, setIsHovered] = useState(false);
  
  // Посилання на таймери для очищення
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add a flag to track video reset to prevent constant pausing/playing
  const isResettingVideo = useRef<boolean>(false);
  
  // Додаємо стан для відстеження, чи було відео успішно запущено
  const [videoStarted, setVideoStarted] = useState(false);
  
  // Додатковий прапорець для відстеження поточної операції
  const isHandlingPlayback = useRef<boolean>(false);
  
  // Додаю посилання на контейнер зображення
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
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
      // Можна додати специфічну для мобільних пристроїв логіку
      console.log('Відео не вдалося завантажити на мобільному пристрої');
    }
  };
  
  // Оновлений обробник готовності відео
  const handleVideoCanPlay = () => {
    console.log('Video ready to play');
    setVideoReady(true);
    setMediaError(false);
    
    // Якщо відео готове і миша наведена, почнемо відтворення
    if (isHovered && !isMobile && videoRef.current && !isHandlingPlayback.current) {
      safePlayVideo();
    }
  };
  
  // Оновлена безпечна функція для відтворення відео 
  const safePlayVideo = async () => {
    if (isVideoPlaybackLocked || !videoRef.current || !isCurrentMediaVideo || isResettingVideo.current) return;
    if (isHandlingPlayback.current) return; // Додатковий захист від багаторазових викликів
    
    try {
      isHandlingPlayback.current = true; // Встановлюємо прапорець обробки
      setIsVideoPlaybackLocked(true);
      
      // Перевірка поточного стану відео
      if (videoRef.current.readyState >= 2 && !videoRef.current.paused) {
        // Відео вже відтворюється - нічого не робимо
        return;
      }
      
      // Перевірка готовності до відтворення
      if (videoRef.current.readyState < 2) {
        console.log('Video not ready yet, waiting...');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Запобігаємо постійному перезапуску відео
      if (!videoRef.current.paused) {
        console.log('Video already playing');
        return;
      }
      
      // Відтворюємо відео
      setVideoReady(true);
      console.log('Starting video playback');
      
      await videoRef.current.play()
        .then(() => {
          setVideoStarted(true);
          console.log('Video playback started successfully');
        })
        .catch(error => {
          if (error.name !== 'AbortError') {
            console.error('Error playing video:', error);
            setMediaError(true);
          } else {
            console.log('Play() call was interrupted');
          }
        });
    } finally {
      // Затримка на розблокування щоб уникнути швидких повторних викликів
      setTimeout(() => {
        setIsVideoPlaybackLocked(false);
        isHandlingPlayback.current = false; // Скидаємо прапорець обробки
      }, 300);
    }
  };
  
  // Оновлена безпечна функція для паузи відео
  const safePauseVideo = () => {
    if (!videoRef.current || isResettingVideo.current) return;
    if (isHandlingPlayback.current) return; // Додатковий захист
    
    // Очищаємо усі таймери
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    
    try {
      isHandlingPlayback.current = true;
      videoRef.current.pause();
    } catch (error) {
      console.error('Error pausing video:', error);
    } finally {
      setTimeout(() => {
        isHandlingPlayback.current = false;
      }, 100);
    }
  };
  
  // Оновлений обробник наведення миші
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    
    // Зупиняємо відео при виході курсора
    if (videoRef.current && !videoRef.current.paused && !isHandlingPlayback.current) {
      safePauseVideo();
    }
  };
  
  // Функція для навігації до наступного медіа
  const nextMedia = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (allMedia.mediaArray.length > 1) {
      setCurrentMediaIndex((prev) => (prev + 1) % allMedia.mediaArray.length);
      setMediaError(false);
      setVideoReady(false);
    }
  };
  
  // Функція для навігації до попереднього медіа
  const prevMedia = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (allMedia.mediaArray.length > 1) {
      setCurrentMediaIndex((prev) => (prev - 1 + allMedia.mediaArray.length) % allMedia.mediaArray.length);
      setMediaError(false);
      setVideoReady(false);
    }
  };
  
  // Функція для відкриття відео на повний екран
  const openFullscreen = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    console.log("Attempting to open fullscreen...");
    
    if (!videoRef.current) {
      console.warn("Video reference is not available");
      return;
    }
    
    try {
      // Запобігаємо запуску відео, якщо воно на паузі
      if (videoRef.current.paused) {
        videoRef.current.play().catch(err => {
          console.error("Error playing video before fullscreen:", err);
        });
      }
      
      // Затримка перед відкриттям повноекранного режиму
      setTimeout(() => {
        if (!videoRef.current) return;
        
        console.log("Opening fullscreen mode...");
        
        // Спочатку тестуємо стандартний API
        if (videoRef.current.requestFullscreen) {
          videoRef.current.requestFullscreen().catch(err => {
            console.error("Error requesting fullscreen:", err);
            tryAlternativeFullscreen();
          });
        } else {
          tryAlternativeFullscreen();
        }
        
        function tryAlternativeFullscreen() {
          if (!videoRef.current) return;
          
          // Альтернативні методи для різних браузерів
          if ((videoRef.current as any).webkitRequestFullscreen) {
            (videoRef.current as any).webkitRequestFullscreen();
          } else if ((videoRef.current as any).mozRequestFullScreen) {
            (videoRef.current as any).mozRequestFullScreen();
          } else if ((videoRef.current as any).msRequestFullscreen) {
            (videoRef.current as any).msRequestFullscreen();
          } else {
            console.warn("Fullscreen API is not supported in this browser");
          }
        }
      }, 100);
    } catch (error) {
      console.error("Error in fullscreen function:", error);
    }
  };
  
  // Компонент для відображення відео з підтримкою відображення плейсхолдера
  const VideoComponent = ({ src, poster }: { src: string | null, poster: string }) => {
    if (!src) return null;
    
    return (
      <div className={styles.videoWrapper}>
        <video
          ref={videoRef}
          className={`${styles.productVideo} ${videoReady ? styles.videoReady : ''}`}
          width={300}
          height={300}
          src={src}
          muted
          playsInline
          preload="auto"
          poster="" // Видаляємо постер, щоб не перекривати відео
          // Видаляємо атрибут loop, щоб запобігти зациклюванню
          controls={isHovered || isMobile}
          onCanPlay={handleVideoCanPlay}
          onError={handleVideoError}
          controlsList="nodownload"
          onPlay={() => {
            console.log('Video playback started');
            setVideoReady(true);
            setVideoStarted(true);
          }}
          onPause={() => {
            console.log('Video paused');
          }}
          onEnded={() => {
            // Коли відео закінчилося, повертаємо його на початок, але не запускаємо автоматично
            console.log('Video playback ended');
            if (videoRef.current) {
              // Затримка перед скиданням часу для уникнення циклу подій
              setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                }
              }, 50);
            }
          }}
        />
        {!videoReady && (
          <div className={styles.videoLoadingPlaceholder}>
            <div className={styles.loaderSpinner}></div>
            <span>Loading video...</span>
          </div>
        )}
        {videoReady && (
          <button 
            className={styles.fullscreenButton}
            onClick={(e) => {
              console.log("Fullscreen button clicked");
              e.stopPropagation();
              e.preventDefault();
              openFullscreen();
            }}
            aria-label="View fullscreen"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M3 3h7v2H5v5H3V3m11 0h7v7h-2V5h-5V3m-9 11v7h7v-2H5v-5H3m11 5h5v-5h2v7h-7v-2z"/>
            </svg>
          </button>
        )}
      </div>
    );
  };
  
  // Компонент для відображення зображення з обробкою помилок
  const ImageComponent = ({ src, alt }: { src: string, alt: string }) => {
    return (
      <div onClick={handleMediaClick} style={{ width: '100%', height: '100%', cursor: 'pointer' }}>
        <Image
          src={src}
          alt={alt}
          className={styles.productImage}
          width={300}
          height={300}
          onError={handleImageError}
          priority={currentMediaIndex === 0}
          unoptimized={src.startsWith('/api/media/')} // Не оптимізуємо через Next Image для API медіа
        />
      </div>
    );
  };
  
  // Доробка функції getImageUrl - повертає тільки URL зображення
  const getImageUrl = (): string => {
    if (mediaError || (isCurrentMediaVideo && !videoReady)) {
      const placeholderId = (typeof product.id === 'string' ? product.id.charCodeAt(0) : 1) % 3 + 1;
      return `/placeholder-${placeholderId}.svg`;
    }
    
    // Ніколи не повертаємо відео URL для зображення
    if (currentMediaIndex >= 0 && currentMediaIndex < allMedia.mediaArray.length && !isCurrentMediaVideo) {
      return allMedia.mediaArray[currentMediaIndex];
    }
    
    return product.image || '/placeholder-1.svg';
  };
  
  // Нова функція для визначення, чи потрібно використовувати прямий URL або <Image>
  const shouldUseDirectUrl = (url: string): boolean => {
    // Для відео або API URL використовуємо прямий URL
    return isVideoFile(url) || url.startsWith('/api/media/');
  };
  
  // Отримуємо поточний відео URL
  const getCurrentVideoUrl = (): string | null => {
    if (currentMediaIndex >= 0 && currentMediaIndex < allMedia.mediaArray.length && isCurrentMediaVideo) {
      try {
        const currentUrl = allMedia.mediaArray[currentMediaIndex];
        
        // Перевіряємо URL для відео
        if (isVideoFile(currentUrl)) {
          // Якщо URL містить 'api/media', забезпечуємо, щоб не використовувати Next.js Image
          if (currentUrl.includes('/api/media/')) {
            // Для API URL додаємо параметр, щоб уникнути обробки через Image
            const url = new URL(currentUrl, window.location.origin);
            url.searchParams.set('type', 'video');
            return url.toString();
          }
          
          // Для мобільних пристроїв можна додати додаткову логіку вибору формату
          if (isMobile) {
            console.log('Відтворення відео на мобільному пристрої:', currentUrl);
          }
          
          return currentUrl;
        }
      } catch (error) {
        console.error('Помилка при отриманні URL відео:', error);
      }
    }
    return null;
  };
  
  // Функція для перевірки, чи є медіа навігація
  const hasNavigation = allMedia.mediaArray.length > 1;
  
  // Оновлена функція для обробки кліків по контейнеру медіа
  const handleMediaContainerClick = (e: React.MouseEvent) => {
    // Якщо це зображення, обробляємо через новий метод відкриття на повний екран
    if (!isCurrentMediaVideo) {
      openImageFullscreen(e);
      return;
    }
    
    // Якщо це відео на мобільному, змінюємо стан відтворення
    if (isMobile && isCurrentMediaVideo && videoRef.current) {
      console.log('Media container clicked on mobile for video');
      if (videoRef.current.paused) {
        safePlayVideo();
      } else {
        safePauseVideo();
      }
    }
  };
  
  // Ключова зміна - оновлений useEffect для кращої роботи з відео
  useEffect(() => {
    // Очищаємо стани при зміні медіа
    if (!isCurrentMediaVideo) {
      setVideoReady(false);
      setVideoStarted(false);
    }
    
    setMediaError(false);
    setIsVideoPlaybackLocked(false);
    
    // Очищаємо таймери при зміні медіа
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    
    // Встановлюємо прапорці для безпечної зміни медіа
    isResettingVideo.current = true;
    isHandlingPlayback.current = false;
    
    // Додаємо затримку для зменшення навантаження
    const timer = setTimeout(() => {
      isResettingVideo.current = false;
    }, isMobile ? 300 : 100);
    
    return () => {
      clearTimeout(timer);
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      
      // Забезпечуємо зупинку відео при демонтажі
      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch (e) {
          // Ігноруємо помилки при очищенні
        }
      }
    };
  }, [currentMediaIndex, isCurrentMediaVideo, isMobile]);

  // Спрощений useEffect для відстеження наведення миші та автовідтворення
  useEffect(() => {
    if (!isCurrentMediaVideo || !videoRef.current || isResettingVideo.current) {
      return;
    }
    
    // Використовуємо більший таймер для стабільності
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    
    // Встановлюємо новий таймер з більшою затримкою
    playbackTimerRef.current = setTimeout(() => {
      // Перевіряємо, чи не змінився стан
      if (!isCurrentMediaVideo || !videoRef.current) return;
      
      if (isHovered && !isMobile) {
        if (videoRef.current.paused && !isHandlingPlayback.current) {
          // Перевіряємо стан готовності відео
          if (videoRef.current.readyState >= 2) {
            safePlayVideo();
          }
        }
      } else {
        if (!videoRef.current.paused && !isHandlingPlayback.current) {
          safePauseVideo();
        }
      }
    }, 300); // Більша затримка для стабільності
    
    return () => {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    };
  }, [isHovered, isCurrentMediaVideo, isMobile, videoReady]);

  // Новий метод для відкриття зображення на повний екран
  const openImageFullscreen = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (isCurrentMediaVideo) {
      // Якщо це відео, використовуємо існуючий метод
      openFullscreen(e);
      return;
    }
    
    // Створюємо контейнер для повноекранного режиму
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.transition = 'opacity 0.3s ease';
    container.style.opacity = '0';
    
    // Створюємо зображення
    const img = document.createElement('img');
    img.src = getImageUrl();
    img.style.maxWidth = '95%';
    img.style.maxHeight = '90%';
    img.style.objectFit = 'contain';
    img.style.boxShadow = '0 5px 30px rgba(0, 0, 0, 0.3)';
    img.style.transform = 'scale(0.95)';
    img.style.transition = 'transform 0.3s ease';
    
    // Додаємо елементи до документа
    container.appendChild(img);
    document.body.appendChild(container);
    
    // Застосовуємо анімацію з невеликою затримкою
    setTimeout(() => {
      container.style.opacity = '1';
      img.style.transform = 'scale(1)';
    }, 30);
    
    // Додаємо обробник для закриття при натисканні
    container.onclick = () => {
      container.style.opacity = '0';
      img.style.transform = 'scale(0.95)';
      
      // Видаляємо елемент після завершення анімації
      setTimeout(() => {
        document.body.removeChild(container);
      }, 300);
    };
  };

  // Новий обробник для натискання на зображення
  const handleMediaClick = (e: React.MouseEvent) => {
    // Відкриваємо зображення на повний екран при натисканні
    if (!isCurrentMediaVideo) {
      openImageFullscreen(e);
    } else if (isMobile) {
      // Для відео на мобільних пристроях залишаємо стару логіку
      handleMediaContainerClick(e);
    }
  };

  return (
    <div 
      className={styles.card}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Badge "New" */}
      {product.is_new && (
        <div className={styles.newBadge}>
          New
        </div>
      )}
      
      {/* Container for media */}
      <div 
        className={styles.mediaContainer}
        onClick={(e) => handleMediaContainerClick(e)}
        ref={imageContainerRef}
      >
        {/* Змінена логіка відображення медіа */}
        {isCurrentMediaVideo ? (
          <VideoComponent 
            src={getCurrentVideoUrl()} 
            poster={getImageUrl()} 
          />
        ) : (
          <ImageComponent 
            src={getImageUrl()} 
            alt={product.Name || 'Product image'} 
          />
        )}
        
        {/* Показуємо спеціальне повідомлення про помилку для відео */}
        {isCurrentMediaVideo && mediaError && (
          <div className={styles.videoErrorPlaceholder}>
            <p>{isMobile ? 'Tap to play video' : 'Video unavailable'}</p>
            <button 
              className={styles.retryButton}
              onClick={(e) => {
                e.stopPropagation();
                setMediaError(false);
                setVideoReady(false);
                // Small delay before retry
                setTimeout(() => {
                  if (videoRef.current) {
                    videoRef.current.load();
                    if (!isMobile) {
                      videoRef.current.play().catch(err => {
                        console.error('Error during replay:', err);
                      });
                    }
                  }
                }, 300);
              }}
            >
              Try again
            </button>
          </div>
        )}
        
        {/* Navigation elements */}
        {hasNavigation && (
          <>
            {/* Navigation counter - показуємо тільки на десктопі */}
            {!isMobile && (
              <div className={styles.mediaNavigation}>
                <span className={styles.mediaCounter}>
                  {currentMediaIndex + 1} / {allMedia.mediaArray.length}
                </span>
              </div>
            )}
            
            {/* Navigation buttons */}
            <button 
              className={styles.prevButton} 
              onClick={prevMedia}
              aria-label="Previous media"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            <button 
              className={styles.nextButton} 
              onClick={nextMedia}
              aria-label="Next media"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>
          </>
        )}
      </div>
      
      {/* Інформація про продукт */}
      <div className={styles.info}>
        <h3 className={styles.name}>{stripHtmlTags(product.Name)}</h3>
        
        {/* THC/Purity першим */}
        {product.thc_purity && (
          <p className={styles.thc}>
            <span className={styles.thcLabel}>{product.thc_purity}:</span> 
            <span className={styles.thcValue}>
              {product.thc_purity_value !== null && product.thc_purity_value !== undefined 
                ? `${product.thc_purity_value}%` 
                : ''}
            </span>
          </p>
        )}
        
        {/* Type другим */}
        {product.Type && (
          <p className={styles.type}>
            <span className={styles.typeLabel}>Type:</span> 
            <span className={styles.typeValue}>{stripHtmlTags(product.Type)}</span>
          </p>
        )}
        
        <p className={styles.aroma}>
          <span className={styles.aromaLabel}>Aroma:</span> 
          <span className={styles.aromaValue}>{stripHtmlTags(product.Aroma)}</span>
        </p>
        <p className={styles.effects}>
          <span className={styles.effectsLabel}>Effects:</span> 
          <span className={styles.effectsValue}>{stripHtmlTags(product.Effects)}</span>
        </p>
      </div>
    </div>
  );
} 