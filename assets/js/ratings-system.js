'use strict';

/**
 * @file ratings-system.js
 * @description وحدة مستقلة لإدارة نظام التقييمات (جلب وإرسال) مع كاش محسّن
 */
const RatingSystem = (function () {

  const API_URL = "https://script.google.com/macros/s/AKfycbyu88YR5217U9w5iUPDbaC03gv9kpP8tkeSjglEyMrkAFaVuV-p11CKDKPghi_dj2sG3A/exec"; 

  // === CACHE SYSTEM ===
  const cache = {
    data: new Map(),
    DURATION: 5 * 60 * 1000, // 5 minutes
    
    get(key) {
      const item = this.data.get(key);
      if (item && Date.now() - item.timestamp < this.DURATION) {
        return item.value;
      }
      this.data.delete(key); // تنظيف البيانات المنتهية الصلاحية
      return null;
    },
    
    set(key, value) {
      this.data.set(key, {
        value: value,
        timestamp: Date.now()
      });
    },
    
    clear() {
      this.data.clear();
    },
    
    // تنظيف دوري للبيانات المنتهية الصلاحية
    cleanup() {
      const now = Date.now();
      for (const [key, item] of this.data.entries()) {
        if (now - item.timestamp >= this.DURATION) {
          this.data.delete(key);
        }
      }
    }
  };

  // تنظيف الكاش كل 10 دقائق
  setInterval(() => cache.cleanup(), 10 * 60 * 1000);

  // === HELPER FUNCTIONS ===
  
  /**
   * معالج أخطاء محسّن مع إعادة المحاولة
   */
  async function fetchWithRetry(url, options = {}, maxRetries = 2) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          timeout: 8000 // مهلة زمنية 8 ثوان
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt + 1} failed:`, error.message);
        
        // انتظار قصير قبل إعادة المحاولة
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * جلب التقييمات مع كاش محسّن
   */
  async function fetchRatings(courseId) {
    if (!courseId) {
      console.error("RatingSystem: fetchRatings called without a courseId.");
      return { average: 0, count: 0 };
    }

    // تحقق من الكاش أولاً
    const cacheKey = `ratings_${courseId}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Using cached ratings for course ${courseId}`);
      return cached;
    }

    try {
      const response = await fetchWithRetry(`${API_URL}?action=getRatings&courseId=${courseId}`);
      const data = await response.json();
      
      // التحقق من صحة البيانات
      const ratings = {
        average: Math.max(0, Math.min(5, parseFloat(data.average) || 0)),
        count: Math.max(0, parseInt(data.count) || 0)
      };
      
      // حفظ في الكاش
      cache.set(cacheKey, ratings);
      
      return ratings;
    } catch (error) {
      console.error("RatingSystem: Failed to fetch ratings:", error);
      return { average: 0, count: 0 };
    }
  }

  /**
   * إرسال تقييم جديد
   */
  async function submitRating(courseId, ratingValue) {
    // التحقق من صحة البيانات
    if (!courseId || !ratingValue || ratingValue < 1 || ratingValue > 5) {
      return { 
        status: "error", 
        message: "Invalid course ID or rating value" 
      };
    }

    let userIP = 'unknown';
    
    // جلب IP المستخدم مع معالجة أخطاء محسّنة
    try {
      const ipResponse = await fetchWithRetry('https://api.ipify.org?format=json', {}, 1);
      if (ipResponse.ok) {
        const ipData = await ipResponse.json();
        userIP = ipData.ip || 'unknown';
      }
    } catch (ipError) {
      console.warn("RatingSystem: Could not fetch user IP.", ipError);
    }
    
    try {
      const response = await fetchWithRetry(`${API_URL}?userIP=${userIP}`, {
        method: 'POST',
        redirect: 'follow',
        body: JSON.stringify({ 
          action: 'addRating', 
          courseId: courseId, 
          rating: ratingValue 
        }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      });
      
      const resultText = await response.text();
      const result = JSON.parse(resultText);
      
      // مسح الكاش للكورس المُحدّث
      if (result.status === 'success') {
        cache.data.delete(`ratings_${courseId}`);
        console.log(`Cache cleared for course ${courseId} after successful rating`);
      }
      
      return result;
    } catch (error) {
      console.error("RatingSystem: Failed to submit rating:", error);
      return { 
        status: "error", 
        message: `Submit failed: ${error.message}` 
      };
    }
  }

  /**
   * رسم النجوم مع دعم الأنصاف
   */
  const renderStars = (rating, isInteractive = false) => {
    let starsHTML = "";
    const numericRating = parseFloat(rating) || 0;
    const roundedRating = Math.round(numericRating * 2) / 2; // تقريب لأقرب نصف
    
    for (let i = 1; i <= 5; i++) {
      let starClass = "bi-star text-muted";
      
      if (i <= roundedRating) {
        starClass = "bi-star-fill text-warning";
      } else if (i - 0.5 === roundedRating) {
        starClass = "bi-star-half text-warning";
      }
      
      const interactiveClasses = isInteractive ? 'rating-star' : '';
      const interactiveStyle = isInteractive ? 'cursor:pointer; transition: color 0.2s ease;' : '';
      const ariaLabel = isInteractive ? `Rate ${i} stars` : '';
      
      starsHTML += `<i class="bi ${starClass} ${interactiveClasses}" 
                       style="${interactiveStyle}" 
                       data-value="${i}" 
                       title="${ariaLabel}"
                       aria-label="${ariaLabel}"></i>`;
    }
    return starsHTML;
  };

  /**
   * تهيئة أحداث النجوم التفاعلية مع تحسينات UX
   */
  function initializeStarEvents(container, onClickCallback) {
    if (!container) {
      console.warn("RatingSystem: No container provided for star events");
      return;
    }

    let currentSelection = 0;
    let isSubmitting = false;

    // النقر على النجوم
    container.addEventListener('click', (e) => {
      if (e.target.classList.contains('rating-star') && !isSubmitting) {
        currentSelection = parseInt(e.target.getAttribute('data-value'), 10);
        
        if (currentSelection && currentSelection >= 1 && currentSelection <= 5) {
          isSubmitting = true;
          container.style.pointerEvents = 'none';
          
          // تأثير بصري فوري
          updateStarsDisplay(container, currentSelection);
          
          // تنفيذ التقييم
          if (onClickCallback) {
            onClickCallback(currentSelection).finally(() => {
              isSubmitting = false;
            });
          }
        }
      }
    });

    // تأثير Hover
    container.addEventListener('mouseover', (e) => {
      if (e.target.classList.contains('rating-star') && !isSubmitting) {
        const hoverValue = parseInt(e.target.getAttribute('data-value'), 10);
        if (hoverValue) {
          updateStarsDisplay(container, hoverValue);
        }
      }
    });

    // العودة للحالة الأصلية عند مغادرة المؤشر
    container.addEventListener('mouseout', () => {
      if (!isSubmitting) {
        updateStarsDisplay(container, currentSelection);
      }
    });

    // دعم لوحة المفاتيح
    container.addEventListener('keydown', (e) => {
      if (isSubmitting) return;
      
      const focused = e.target;
      if (focused.classList.contains('rating-star')) {
        let newValue = currentSelection;
        
        switch(e.key) {
          case 'ArrowRight':
          case 'ArrowUp':
            newValue = Math.min(5, currentSelection + 1);
            e.preventDefault();
            break;
          case 'ArrowLeft':
          case 'ArrowDown':
            newValue = Math.max(1, currentSelection - 1);
            e.preventDefault();
            break;
          case 'Enter':
          case ' ':
            if (currentSelection > 0) {
              focused.click();
            }
            e.preventDefault();
            break;
        }
        
        if (newValue !== currentSelection) {
          currentSelection = newValue;
          updateStarsDisplay(container, newValue);
          
          // نقل التركيز للنجمة الجديدة
          const newStar = container.querySelector(`[data-value="${newValue}"]`);
          if (newStar) {
            newStar.focus();
          }
        }
      }
    });

    // جعل النجوم قابلة للتركيز
    container.querySelectorAll('.rating-star').forEach((star, index) => {
      star.setAttribute('tabindex', index === 0 ? '0' : '-1');
      star.setAttribute('role', 'button');
    });
  }

  /**
   * تحديث عرض النجوم
   */
  function updateStarsDisplay(container, rating) {
    container.querySelectorAll('.rating-star').forEach((star, index) => {
      const starValue = index + 1;
      star.className = star.className.replace(/bi-star-\w+/g, '');
      
      if (starValue <= rating) {
        star.className += ' bi-star-fill text-warning';
      } else {
        star.className += ' bi-star text-muted';
      }
    });
  }

  /**
   * مساعد لتنسيق النص
   */
  function formatRatingText(average, count) {
    if (count === 0) {
      return "No ratings yet";
    } else if (count === 1) {
      return "1 rating";
    } else {
      return `${count} ratings`;
    }
  }

  /**
   * تحديد ما إذا كان التقييم صالحاً للعرض
   */
  function isValidRating(ratings) {
    return ratings && 
           typeof ratings.average === 'number' && 
           typeof ratings.count === 'number' && 
           ratings.count > 0 && 
           ratings.average > 0;
  }

  // === PUBLIC API ===
  return {
    fetchRatings,
    submitRating,
    renderStars,
    initializeStarEvents,
    formatRatingText,
    isValidRating,
    
    // إدارة الكاش
    clearCache: () => cache.clear(),
    getCacheInfo: () => ({
      size: cache.data.size,
      duration: cache.DURATION
    }),
    
    // إعدادات متقدمة
    configure: (options = {}) => {
      if (options.cacheDuration && typeof options.cacheDuration === 'number') {
        cache.DURATION = options.cacheDuration;
      }
    }
  };
})();

// تصدير للاستخدام في environments مختلفة
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RatingSystem;
} else if (typeof window !== 'undefined') {
  window.RatingSystem = RatingSystem;
}

// إشعار بالتحميل
console.log('RatingSystem loaded successfully! 🌟');