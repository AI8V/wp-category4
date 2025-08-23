'use strict';
document.addEventListener("DOMContentLoaded", () => {
  // ==================================
  // 0. CONFIG (غيّر هذه القيم لموقعك)
  // ==================================
  const BRAND_NAME = "Your Brand Name"; // ✏️ غيّر للاسم الحقيقى
  const DOMAIN = "https://your-domain.com".replace(/\/+$/, ''); // ✏️ غيّر للدومين الحقيقى

  // ==================================
  // 2. HELPER FUNCTIONS
  // ==================================

  /**
   * عرض إشعار Toast
   * @param {string} message
   * @param {string} type - 'danger' | 'warning' | 'success' | 'info'
   */
  const showToast = (message, type = 'danger') => {
    const toastContainer = document.querySelector(".toast-container");
    if (!toastContainer) {
      console.error("Toast container not found!");
      return;
    }
    const toastId = `toast-${Date.now()}`;
    const toastHTML = `
      <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>`;
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    try {
      const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
      toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
      toast.show();
    } catch (err) {
      // إذا الـ bootstrap غير محمل، نعرض console ونعرض alert كبديل لطيف
      console.warn('Bootstrap toast not available:', err);
      setTimeout(() => { if (toastElement) toastElement.remove(); }, 5000);
    }
  };

  /**
   * توليد نجوم التقييم (fallback محلي)
   * @param {number} rating
   * @returns {string}
   */
  const renderStars = (rating) => {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      stars += `<i class="bi ${i <= rating ? "bi-star-fill text-warning" : "bi-star text-muted"}"></i>`;
    }
    return stars;
  };

  /**
   * Helper لتحديث أو إنشاء meta tags (يدعم name و property)
   * @param {'name'|'property'} attrType
   * @param {string} key
   * @param {string|number} value
   */
  const setMeta = (attrType, key, value) => {
    if (value === undefined || value === null) return;
    const selector = `meta[${attrType}="${key}"]`;
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrType, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', String(value));
  };

  /**
   * تحديث Meta tags و Open Graph و Twitter (لا يضيف مكررات، بل يحدث)
   * @param {object} course
   */
  const updateMetaTags = (course) => {
    document.title = `${course.title} | ${BRAND_NAME}`;

    setMeta('name', 'description', course.description);

    setMeta('property', 'og:title', course.title);
    setMeta('property', 'og:description', course.description);
    setMeta('property', 'og:type', course.price > 0 ? 'product' : 'article');
    setMeta('property', 'og:url', window.location.href);

    const imgPath = course.image && course.image.details ? course.image.details.replace(/^\/+/, '') : 'assets/img/course-fallback';
    const ogImage = `${DOMAIN}/${imgPath}-large.jpg`;
    setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height', '630');
    setMeta('property', 'og:site_name', BRAND_NAME);

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', course.title);
    setMeta('name', 'twitter:description', course.description);
    setMeta('name', 'twitter:image', ogImage);
  };

  /**
   * إضافة JSON-LD مُنظف وصالح - يستخدم ID فريد لكل كورس حتى لا يلمس سكريبتات أخرى
   * يضيف aggregateRating فقط إذا توفرت بيانات حقيقية
   * @param {object} course
   * @param {{average:number,count:number}|null} realRatings
   */
  const addSchemaMarkup = (course, realRatings = null) => {
    const scriptId = `jsonld-course-${course.id || 'unknown'}`;
    const existing = document.getElementById(scriptId);
    if (existing) existing.remove();

    const imgPath = course.image && course.image.details ? course.image.details.replace(/^\/+/, '') : 'assets/img/course-fallback';
    const imageUrl = `${DOMAIN}/${imgPath}-large.jpg`;

    const schema = {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": course.title,
      "description": course.description,
      "url": window.location.href,
      "image": imageUrl,
      "datePublished": course.date || undefined,
      "educationalLevel": course.level || undefined,
      "instructor": course.instructor ? { "@type": "Person", "name": course.instructor } : undefined,
      "provider": {
        "@type": "Organization",
        "name": BRAND_NAME,
        "sameAs": DOMAIN
      },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "price": (typeof course.price === 'number' ? course.price : undefined),
        "priceCurrency": (typeof course.price === 'number' ? "USD" : undefined),
        "availability": "https://schema.org/OnlineOnly"
      }
    };

    if (realRatings && Number(realRatings.count) > 0 && Number(realRatings.average) >= 0) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": Number(Number(realRatings.average).toFixed(2)),
        "bestRating": 5,
        "ratingCount": Number(realRatings.count)
      };
    }

    // نزيل الحقول undefined
    const cleanSchema = JSON.parse(JSON.stringify(schema));

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = scriptId;
    script.textContent = JSON.stringify(cleanSchema, null, 2);
    document.head.appendChild(script);
  };

  const renderHeader = (course) => {
    const headerContainer = document.getElementById("course-header");
    if (!headerContainer) return;

    const headerHTML = `
      <div class="text-center border-dark my-2">
        <h1 class="display-4 fw-bold text-warning mb-0">${course.title}</h1>
        <nav class="d-flex flex-column justify-content-between" aria-label="breadcrumb">
          <ol class="breadcrumb justify-content-center py-2 mb-0">
            <li class="breadcrumb-item my-1">
              <a class="text-decoration-none" href="../../index.html">
                <span class="h4 my-1">Home</span>
              </a>
            </li>
            <li class="breadcrumb-item my-1">
              <a class="text-decoration-none" href="../index.html">
                <span class="h4 my-1">Courses</span>
              </a>
            </li>
            <li class="breadcrumb-item active my-1" aria-current="page">
              <span class="text-secondary h4 my-1">${course.title}</span>
            </li>
          </ol>
        </nav>
      </div>
    `;
    headerContainer.innerHTML = headerHTML;
  };

  // ==================================
  // 3. MAIN LOGIC
  // ==================================
  const initializePage = () => {
    const content = document.getElementById("content");
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get("id");

    if (!courseId) {
      if (content) content.innerHTML = '';
      showToast('⚠ Course ID not specified.', 'danger');
      return;
    }

    const course = COURSE_DATA.courses.find(c => c.id === parseInt(courseId, 10));

    if (!course) {
      if (content) content.innerHTML = '';
      showToast('⚠️ The requested course was not found.', 'warning');
      return;
    }

    renderHeader(course);
    updateMetaTags(course);
    // ✅ لا نضيف السكيما هنا - سننتظر البيانات الحقيقية

    const fallbackImage = '../../assets/img/course-fallback.jpg';
    const imageBase = `../../${course.image.details}`;
    const priceDisplay = course.price === 0
      ? `<span class="text-success">Free</span>`
      : `<span class="text-success">$${course.price.toFixed(2)}</span>`;

    if (content) {
      content.innerHTML = `
      <div class="row">
        <div class="col-lg-6 mb-4 mb-lg-0">
          <picture>
             <source srcset="${imageBase}-small.webp 800w, ${imageBase}-large.webp 1200w" sizes="(max-width: 991px) 95vw, 50vw" type="image/webp">
             <source srcset="${imageBase}-small.jpg 800w, ${imageBase}-large.jpg 1200w" sizes="(max-width: 991px) 95vw, 50vw" type="image/jpeg">
             <img src="${imageBase}-large.jpg" alt="${course.title}" class="img-fluid rounded shadow"
                  width="600" height="400"
                  onerror="this.onerror=null; this.src='${fallbackImage}';"
                  loading="eager" fetchpriority="high" decoding="async">
          </picture>
        </div>
        <div class="col-lg-6">
          <h2 class="my-3 text-center text-light">About This Course</h2>
          <p class="text-warning">${course.description}</p>
          <p class="text-light"><strong>Instructor:</strong> ${course.instructor}</p>
          <p class="text-light"><strong>Category:</strong> ${course.category} | <strong>Level:</strong> ${course.level}</p>
          <p class="text-light"><span class="bi bi-people-fill icon-gold me-2"></span> ${course.students} Students Enrolled | <span class="bi bi-book-fill icon-gold me-2"></span> ${course.lessons} Lessons</p>
          <p class="text-light"><strong>Rating:</strong> <span id="rating-display" class="placeholder-glow"><span class="placeholder col-4"></span></span></p>
          <p class="fs-4 fw-bold text-light">Price: ${priceDisplay}</p>
          <a href="#" class="btn btn-warning btn-lg mt-3" id="enroll-btn">Enroll Now</a>
          <div class="card mt-4 shadow-sm rating-card-custom">
            <div class="card-body">
              <h3 class="h5 card-title">Rate this course</h3>
              <div class="fs-2" id="user-rating-stars" aria-label="Rate this course">
                <!-- سيتم ملؤه بواسطة JS -->
              </div>
              <small class="form-text text-muted" id="rating-feedback-text"></small>
            </div>
          </div>
        </div>
      </div>
    `;
    }

    const ratingStarsContainer = document.getElementById('user-rating-stars');
    const ratingDisplay = document.getElementById('rating-display');
    const ratingFeedbackText = document.getElementById('rating-feedback-text');
    const enrollBtn = document.getElementById('enroll-btn');

    // ============================
    // تحميل التقييمات الحقيقية وتحديث السكيما بعدها
    // ============================
    const loadRealRatings = async () => {
      try {
        if (typeof RatingSystem === 'undefined' || !RatingSystem.fetchRatings) {
          throw new Error('RatingSystem not available');
        }

        const dynamicRatings = await RatingSystem.fetchRatings(courseId);

        if (ratingDisplay) {
          ratingDisplay.className = '';
          if (dynamicRatings && Number(dynamicRatings.count) > 0) {
            // استخدم renderStars من RatingSystem إن توفرت، وإلا استخدم fallback
            const starsHtml = (RatingSystem.renderStars && typeof RatingSystem.renderStars === 'function')
              ? RatingSystem.renderStars(dynamicRatings.average)
              : renderStars(Math.round(dynamicRatings.average));
            ratingDisplay.innerHTML = `${starsHtml} (${dynamicRatings.count} ratings)`;
          } else {
            const starsHtml = (RatingSystem.renderStars && typeof RatingSystem.renderStars === 'function')
              ? RatingSystem.renderStars(0)
              : renderStars(0);
            ratingDisplay.innerHTML = `${starsHtml} (No ratings yet)`;
          }
        }

        // إضافة السكيما فقط إذا كانت هناك تقييمات حقيقية
        addSchemaMarkup(course, dynamicRatings && dynamicRatings.count ? dynamicRatings : null);

      } catch (error) {
        // إذا RatingSystem غير موجود أو فشل الطلب، نعرض fallback بدون تقييمات
        console.warn('Failed to load ratings or RatingSystem unavailable:', error);
        if (ratingDisplay) {
          ratingDisplay.className = '';
          const starsHtml = (typeof RatingSystem !== 'undefined' && RatingSystem.renderStars)
            ? RatingSystem.renderStars(0)
            : renderStars(0);
          ratingDisplay.innerHTML = `${starsHtml} (No ratings yet)`;
        }
        addSchemaMarkup(course, null);
      }
    };

    // ============================
    // إعداد النجوم التفاعلية (إن وُجد RatingSystem وإلا نعرض fallback ثابت)
    // ============================
    const setupInteractiveRatings = () => {
      if (!ratingStarsContainer) return;

      // إذا RatingSystem يدعم render & initializeStarEvents، نستخدمها
      if (typeof RatingSystem !== 'undefined' && RatingSystem.renderStars && RatingSystem.initializeStarEvents) {
        // ضع نجوم تفاعلية ابتدائية
        ratingStarsContainer.innerHTML = RatingSystem.renderStars(0, true);

        // تأكد من وجود عنصر نص يُحدّث لاحقًا (feedback)
        const ratingTextEl = ratingDisplay;

        RatingSystem.initializeStarEvents(ratingStarsContainer, async (ratingValue) => {
          // منع عدة نقرات متزامنة
          ratingStarsContainer.style.pointerEvents = 'none';
          if (ratingFeedbackText) ratingFeedbackText.textContent = 'Submitting your rating...';
          showToast('Submitting your rating...', 'info');

          // عطل زر التسجيل مؤقتًا لتجنب ضغط متكرر
          if (enrollBtn) enrollBtn.setAttribute('aria-disabled', 'true');

          try {
            const result = await RatingSystem.submitRating(courseId, ratingValue);

            if (result && result.status === 'success') {
              showToast('Thank you for your rating!', 'success');
              if (ratingFeedbackText) ratingFeedbackText.textContent = 'Your rating has been submitted!';
              const updatedRatings = await RatingSystem.fetchRatings(courseId);
              if (ratingDisplay) {
                const starsHtml = RatingSystem.renderStars
                  ? RatingSystem.renderStars(updatedRatings.average)
                  : renderStars(Math.round(updatedRatings.average));
                ratingDisplay.innerHTML = `${starsHtml} (${updatedRatings.count} ratings)`;
              }
              addSchemaMarkup(course, updatedRatings);
              // عرض النجوم المختارة كـ static بعد الإرسال
              ratingStarsContainer.innerHTML = RatingSystem.renderStars(ratingValue, false);
              ratingStarsContainer.style.pointerEvents = 'none';
              if (ratingFeedbackText) ratingFeedbackText.textContent = 'Thanks! You have rated this course.';
            } else {
              showToast(result && result.message ? result.message : 'An error occurred.', 'danger');
              if (ratingFeedbackText) ratingFeedbackText.textContent = `Error: ${result && result.message ? result.message : 'Could not submit rating.'}`;
              ratingStarsContainer.style.pointerEvents = 'auto';
            }
          } catch (err) {
            console.error('Error submitting rating:', err);
            showToast('Could not submit rating (network error).', 'danger');
            if (ratingFeedbackText) ratingFeedbackText.textContent = 'Network error: Could not submit rating.';
            ratingStarsContainer.style.pointerEvents = 'auto';
          } finally {
            if (enrollBtn) enrollBtn.removeAttribute('aria-disabled');
          }
        });

      } else {
        // fallback: نعرض نجوم ثابتة من الدالة المحلية ونشير لأن النظام غير متوفر حالياً
        ratingStarsContainer.innerHTML = renderStars(0);
        if (ratingFeedbackText) ratingFeedbackText.textContent = 'Rating system not available right now.';
      }
    };

    // ============================
    // انتظار تحميل RatingSystem (حدث + polling كـ fallback)
    // ============================
    const waitForRatingSystem = () => {
      if (typeof RatingSystem !== 'undefined' && RatingSystem.fetchRatings) {
        // loaded
        loadRealRatings();
        setupInteractiveRatings();
        return;
      }

      // استماع لحدث جاهزية إن وُجد (يوصى أن يطلقه ملف ratings-system.js بعد التعريف)
      const onReady = () => {
        window.removeEventListener('RatingSystemReady', onReady);
        loadRealRatings();
        setupInteractiveRatings();
      };
      window.addEventListener('RatingSystemReady', onReady);

      // polling fallback بدرجة أدنى للحفاظ على الأداء
      const poll = setInterval(() => {
        if (typeof RatingSystem !== 'undefined' && RatingSystem.fetchRatings) {
          clearInterval(poll);
          window.removeEventListener('RatingSystemReady', onReady);
          loadRealRatings();
          setupInteractiveRatings();
        }
      }, 500);
    };

    // بدء عملية الانتظار والتحميل
    waitForRatingSystem();

    // إن كان الـ RatingSystem محمّل مسبقاً
    if (typeof RatingSystem !== 'undefined' && RatingSystem.fetchRatings) {
      loadRealRatings();
      setupInteractiveRatings();
    }
  };

  initializePage();
});
