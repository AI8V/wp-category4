// Complete Course Platform: Dynamic Content + Working Filters
(function () {
  "use strict";

  // === CONFIGURATION ===
  const CONFIG = {
    AUTO_APPLY: true,
    CARDS_PER_PAGE: 6,
    DEBOUNCE_DELAY: 300
  };

  // === UTILITIES ===
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // === CONTENT MANAGEMENT ===
  const ContentManager = {
    addCourse: (courseData) => {
      const newId = Math.max(...COURSE_DATA.courses.map(c => c.id)) + 1;
      const newCourse = {
        id: newId,
        ...courseData,
        date: new Date().toISOString().split('T')[0]
      };
      COURSE_DATA.courses.push(newCourse);
      ContentManager.updateCategoryCounts();
      return newCourse;
    },

    editCourse: (courseId, updatedData) => {
      const index = COURSE_DATA.courses.findIndex(c => c.id === courseId);
      if (index !== -1) {
        COURSE_DATA.courses[index] = { ...COURSE_DATA.courses[index], ...updatedData };
        ContentManager.updateCategoryCounts();
        return COURSE_DATA.courses[index];
      }
      return null;
    },

    deleteCourse: (courseId) => {
      const index = COURSE_DATA.courses.findIndex(c => c.id === courseId);
      if (index !== -1) {
        const deleted = COURSE_DATA.courses.splice(index, 1)[0];
        ContentManager.updateCategoryCounts();
        return deleted;
      }
      return null;
    },

    updateCategoryCounts: () => {
      Object.keys(COURSE_DATA.categories).forEach(cat => {
        COURSE_DATA.categories[cat].count = COURSE_DATA.courses.filter(c => c.category === cat).length;
      });
    },

    getCourses: () => COURSE_DATA.courses,
    getCourse: (id) => COURSE_DATA.courses.find(c => c.id === parseInt(id))
  };

// === COURSE CARD GENERATOR ===
function createCourseCard(course) {
  const priceDisplay = course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`;
  const priceClass = course.price === 0 ? 'text-success' : 'text-primary';

  const imageBase = `../${course.image.card}`;
  const finalFallbackImage = '../assets/img/course-fallback.jpg';

  return `
    <div class="col-12 col-md-6 col-lg-4 mb-4">
      <div class="card h-100 shadow-sm course-card"
            data-rating="${course.rating}"
            data-students="${course.students}"
            data-date="${course.date}"
            data-category="${course.category}"
            data-level="${course.level}">
        <div class="course-card-img-container">
          <picture>
            <source srcset="${imageBase}-small.webp 350w, ${imageBase}-large.webp 700w"
                    sizes="(max-width: 767px) 95vw, (max-width: 991px) 48vw, 32vw"
                    type="image/webp">

            <source srcset="${imageBase}-small.jpg 350w, ${imageBase}-large.jpg 700w"
                    sizes="(max-width: 767px) 95vw, (max-width: 991px) 48vw, 32vw"
                    type="image/jpeg">

            <img class="img-fluid card-img-top"
                  src="${imageBase}-large.jpg"
                  alt="${course.title}"
                  onerror="this.onerror=null; this.src='${finalFallbackImage}';"
                  width="400" height="210"
                  loading="lazy" fetchpriority="low" decoding="async">
          </picture>
          <span class="badge bg-${COURSE_DATA.categories[course.category]?.color || 'success'} course-category">${course.category}</span>
        </div>
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <p class="text-muted mb-0">${course.level}</p>
            <p class="price-text-gradient fw-bold ${priceClass} mb-0">${priceDisplay}</p>
          </div>
          <h3 class="card-title">${course.title}</h3>
          <div class="text-muted d-flex card-meta gap-3 border-top pt-2 mt-2">
            <span><span class="bi bi-people-fill icon-gold me-1" aria-hidden="true"></span> ${course.students} Students</span>
            <span><span class="bi bi-book-fill  icon-gold me-1" aria-hidden="true"></span> ${course.lessons} Lessons</span>
          </div>
        </div>
        <div class="course-card-overlay">
          <div class="d-flex align-items-center mb-2">
            <p class="mb-0 me-5">${course.level}</p>
            <p class="price-text-gradient fw-bold ${priceClass} mb-0 ms-5">${priceDisplay}</p>
          </div>
          <h3 class="card-title">${course.title}</h3>
          <div class="d-flex card-meta gap-3 border-top pt-2 mt-2">
            <span><span class="bi bi-people-fill  icon-gold me-1" aria-hidden="true"></span> ${course.students} Students</span>
            <span><span class="bi bi-book-fill  icon-gold me-1" aria-hidden="true"></span> ${course.lessons} Lessons</span>
          </div>
          <p class="course-description mb-2">${course.description}</p>
          <a class="btn btn-light" href="../course/course-details/index.html?id=${course.id}">View Detail</a>
        </div>
      </div>
    </div>
  `;
}

function optimizeVisibleImages() {
      const cards = qsa('.course-card');
      const visibleCards = cards.slice(0, 3);
      visibleCards.forEach(card => {
        const img = qs('img', card);
        if (img) {
          img.loading = 'eager';
          img.fetchPriority = 'high';
        }
      });
    }


  // === MAIN FILTER & SORT SYSTEM ===
  document.addEventListener("DOMContentLoaded", () => {
    const resultsCol = qs(".col-lg-9.mt-3") || qs(".col-lg-9");
    const container = resultsCol ? qs(".row", resultsCol) : null;

    if (!resultsCol || !container) {
      console.error("Course container not found.");
      return;
    }

    // Get all control elements
    const resetBtn = qs('button[aria-label="Reset all filters"]');
    const applyBtn = qs('button[aria-label="Apply selected filters"]');
    const sortBtn = qs('button[id^="sortDropdown"]') || qs("#sortDropdown");
    const sortMenu = sortBtn ? sortBtn.parentElement : null;
    const sortItems = sortMenu ? qsa(".dropdown-item", sortMenu) : qsa(".dropdown-item");
    const resultsText = qs("p.my-1", resultsCol);
    const searchInput = qs('input[id^="search-input"]') || qs("#search-input");
    const loadingSpinner = qs('div[id^="loading-spinner"]') || qs("#loading-spinner");
    const categoriesRoot = qs('ul[id^="categories-list"]') || qs("#categories-list");
    const mobileCategoriesRoot = qs('ul[id^="mobile-categories-list"]') || qs("#mobile-categories-list");

    // State
    let currentSort = { type: "average ratings" };
    let currentPage = 1;

    // Get default sort text
    const defaultSortText = (() => {
      if (!sortBtn) return "Average Ratings";
      const label = sortBtn.querySelector(".sort-label");
      const txt = (label ? label.textContent : sortBtn.textContent || "").trim();
      return txt || "Average Ratings";
    })();

    // === FILTER FUNCTIONS ===
    function readFilters() {
      const minRating = parseInt((qs("input[name='ratingFilter']:checked")?.value || "0"), 10) || 0;
      const searchTerm = (searchInput?.value || "").toLowerCase().trim();
      const activeCategories = categoriesRoot
        ? qsa(".form-check-input:checked", categoriesRoot).map(cb => cb.value)
        : [];
      const selectedLevel = (qs("input[name='levelFilter']:checked")?.value || "").trim();
      return { minRating, searchTerm, activeCategories, selectedLevel };
    }

    function applyFilters(courses, filters) {
      return courses.filter(course => {
        // Rating filter
        if (course.rating < filters.minRating) return false;

        // Search filter
        if (filters.searchTerm && !course.title.toLowerCase().includes(filters.searchTerm)) {
          return false;
        }

        // Level filter
        if (filters.selectedLevel &&
            filters.selectedLevel !== "" &&
            filters.selectedLevel.toLowerCase() !== "all" &&
            course.level !== filters.selectedLevel) {
          return false;
        }

        // Category filter
        if (filters.activeCategories.length > 0 &&
            !filters.activeCategories.includes(course.category)) {
          return false;
        }

        return true;
      });
    }

    function applySort(courses) {
      const sortType = (currentSort.type || "").toLowerCase();

      switch (sortType) {
        case "title a-z":
          return courses.sort((a, b) => a.title.localeCompare(b.title));
        case "title z-a":
          return courses.sort((a, b) => b.title.localeCompare(a.title));
        case "price low to high":
          return courses.sort((a, b) => a.price - b.price);
        case "price high to low":
          return courses.sort((a, b) => b.price - a.price);
        case "popular":
          return courses.sort((a, b) => b.students - a.students);
        case "newly published":
          return courses.sort((a, b) => new Date(b.date) - new Date(a.date));
        case "average ratings":
        default:
          return courses.sort((a, b) => b.rating - a.rating);
      }
    }

    // === UI UPDATE FUNCTIONS ===
    function updateSortUI() {
      if (!sortBtn) return;
      const label = sortBtn.querySelector(".sort-label");
      const match = sortItems.find(it => (it.innerText || "").trim().toLowerCase() === currentSort.type);
      const text = match ? (match.innerText || "").trim() : defaultSortText;

      if (label) label.textContent = text;
      else sortBtn.textContent = text;

      sortItems.forEach(it => it.classList.remove("active"));
      if (match) match.classList.add("active");
    }

    function updateCategoryCounts(filteredCourses) {
      // Calculate category counts from filtered courses
      const counts = {};
      Object.keys(COURSE_DATA.categories).forEach(cat => {
        counts[cat] = filteredCourses.filter(c => c.category === cat).length;
      });

      // Update both desktop and mobile category lists
      const updateCountsInList = (list) => {
        if (!list) return;
        qsa('.list-group-item', list).forEach(item => {
          const checkbox = qs('.form-check-input', item);
          const span = qs('span', item);
          if (checkbox && span) {
            const count = counts[checkbox.value] || 0;
            span.innerText = count.toString();

            // Disable empty categories
            if (count === 0) {
              item.classList.add('text-muted');
              checkbox.disabled = true;
            } else {
              item.classList.remove('text-muted');
              checkbox.disabled = false;
            }
          }
        });
      };

      updateCountsInList(categoriesRoot);
      updateCountsInList(mobileCategoriesRoot);
    }

    function renderPagination(totalItems) {
      const paginationBar = qs("#pagination-bar");
      if (!paginationBar) return;

      paginationBar.innerHTML = "";
      const totalPages = Math.ceil(totalItems / CONFIG.CARDS_PER_PAGE);
      if (totalPages <= 1) return;

      for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement("li");
        li.className = `page-item ${i === currentPage ? "active" : ""}`;
        const a = document.createElement("a");
        a.className = "page-link";
        a.href = "#";
        a.innerText = String(i);
        a.addEventListener("click", (e) => {
          e.preventDefault();
          if (currentPage === i) return;
          currentPage = i;
          processAndRender(false);
        });
        li.appendChild(a);
        paginationBar.appendChild(li);
      }
    }

    function toggleSpinner(show) {
      if (loadingSpinner) loadingSpinner.style.display = show ? "flex" : "none";
    }

    function updateURL() {
      const filters = readFilters();
      const params = new URLSearchParams();

      if (filters.activeCategories.length > 0) {
        params.set('categories', filters.activeCategories.join(','));
      }
      if (filters.minRating > 0) {
        params.set('rating', filters.minRating);
      }
      if (filters.selectedLevel && filters.selectedLevel.toLowerCase() !== 'all') {
        params.set('level', filters.selectedLevel);
      }
      if (filters.searchTerm) {
        params.set('search', filters.searchTerm);
      }

      const newUrl = params.toString() ?
        `${window.location.pathname}?${params.toString()}` :
        window.location.pathname;

      history.replaceState({path: newUrl}, '', newUrl);
    }

    // === MAIN PROCESSING FUNCTION ===
    function processAndRender(resetPage = false) {
      toggleSpinner(true);

      if (resetPage) currentPage = 1;

      setTimeout(() => {
        const filters = readFilters();

        // Start with all courses
        let allCourses = ContentManager.getCourses();

        // Apply filters EXCEPT category (for count calculation)
        let preFiltered = allCourses.filter(course => {
          if (course.rating < filters.minRating) return false;
          if (filters.searchTerm && !course.title.toLowerCase().includes(filters.searchTerm)) return false;
          if (filters.selectedLevel &&
              filters.selectedLevel !== "" &&
              filters.selectedLevel.toLowerCase() !== "all" &&
              course.level !== filters.selectedLevel) return false;
          return true;
        });

        // Update category counts based on pre-filtered results
        updateCategoryCounts(preFiltered);

        // Now apply category filter
        let filtered = preFiltered.filter(course => {
          return filters.activeCategories.length === 0 ||
                 filters.activeCategories.includes(course.category);
        });

        // Apply sorting
        filtered = applySort([...filtered]);

        // Pagination
        const total = filtered.length;
        const start = (currentPage - 1) * CONFIG.CARDS_PER_PAGE;
        const end = start + CONFIG.CARDS_PER_PAGE;
        const pageItems = filtered.slice(start, end);

        // Render results
        container.innerHTML = "";
        if (pageItems.length === 0) {
          container.innerHTML = `
            <div class="col-12 text-center my-5">
              <span class="bi bi-search fs-1  icon-gold mb-3" aria-hidden="true"></span>
              <h3 class="text-warning">No courses match your criteria</h3>
              <p class="text-light">Try adjusting your search or filter settings</p>
            </div>
          `;
        } else {
          pageItems.forEach((course, index) => {
            const courseHTML = createCourseCard(course);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = courseHTML;
            const courseElement = tempDiv.firstElementChild;

            // Add staggered animation
            courseElement.style.animationDelay = `${index * 0.1}s`;
            container.appendChild(courseElement);
          });
          optimizeVisibleImages();
        }

        // Update results text
        if (resultsText) {
          const displayStart = total ? start + 1 : 0;
          const displayEnd = Math.min(end, total);
          resultsText.innerText = `Showing ${displayStart}-${displayEnd} of ${total} results`;
        }

        renderPagination(total);
        updateURL();
        toggleSpinner(false);
      }, 30);
    }

    // === RESET FUNCTION ===
    function performReset() {
      if (searchInput) searchInput.value = "";

      qsa(".form-check-input").forEach(input => {
        if (input.type === "radio") {
          input.checked = (input.name === "ratingFilter" && input.value === "0") ||
                         (input.name === "levelFilter" && (input.value === "" || input.value.toLowerCase() === "all"));
        } else {
          input.checked = false;
        }
      });

      // Reset mobile filters too
      const mobileSearch = qs("#search-input-mobile");
      if (mobileSearch) mobileSearch.value = "";

      qsa("#mobileFilters input").forEach(input => {
        if (input.type === "radio") {
          input.checked = input.value === "" || input.value.toLowerCase() === "all" || input.value === "0";
        } else {
          input.checked = false;
        }
      });

      currentSort.type = defaultSortText.trim().toLowerCase() || "average ratings";
      updateSortUI();
      processAndRender(true);
    }

    // === EVENT LISTENERS ===

    // Reset button
    if (resetBtn) resetBtn.addEventListener("click", performReset);

    // Apply button (if not auto-apply)
    if (applyBtn && !CONFIG.AUTO_APPLY) {
      applyBtn.addEventListener("click", () => processAndRender(true));
    }

    // Auto-apply mode
    if (CONFIG.AUTO_APPLY) {
      if (applyBtn) applyBtn.disabled = true;

      // Search input with debouncing
      if (searchInput) {
        const debouncedSearch = debounce(() => processAndRender(true), CONFIG.DEBOUNCE_DELAY);
        searchInput.addEventListener("input", debouncedSearch);
      }

      // Filter inputs
      qsa(".form-check-input").forEach(input => {
        input.addEventListener("change", () => processAndRender(true));
      });
    }

    // Sort dropdown
    sortItems.forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        currentSort.type = (item.innerText || "").trim().toLowerCase();
        updateSortUI();
        processAndRender(true);
      });
    });

    // Mobile sync
    const mobileSearch = qs("#search-input-mobile");
    if (mobileSearch && searchInput) {
      mobileSearch.addEventListener("input", () => {
        searchInput.value = mobileSearch.value;
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }

    // Mobile buttons
    qs("#mobileApply")?.addEventListener("click", () => processAndRender(true));
    qs("#mobileReset")?.addEventListener("click", () => performReset());

    // === INITIALIZATION ===
    updateSortUI();

    // Apply URL filters if any
    const params = new URLSearchParams(window.location.search);
    if (params.has('categories') || params.has('rating') || params.has('level') || params.has('search')) {
      // Apply URL parameters to form
      const categories = params.get('categories');
      const rating = params.get('rating');
      const level = params.get('level');
      const search = params.get('search');

      if (categories && categoriesRoot) {
        const cats = categories.split(',');
        qsa('input[type="checkbox"]', categoriesRoot).forEach(c => {
          if (cats.includes(c.value)) c.checked = true;
        });
      }

      if (rating) {
        const ratingInput = qs(`input[name='ratingFilter'][value='${rating}']`);
        if (ratingInput) ratingInput.checked = true;
      }

      if (level) {
        const levelInput = qs(`input[name='levelFilter'][value='${level}']`);
        if (levelInput) levelInput.checked = true;
      }

      if (search && searchInput) {
        searchInput.value = decodeURIComponent(search);
      }
    }

    processAndRender(true);
  });

  // === PUBLIC API ===
  window.CourseManager = {
    updateCourse: (id, updates) => {
      const course = ContentManager.editCourse(id, updates);
      if (course) {
        // Re-trigger the filter system
        const event = new Event('change', { bubbles: true });
        document.dispatchEvent(event);
        console.log('Course updated:', course);
      }
      return course;
    },

    addNewCourse: (courseData) => {
      const course = ContentManager.addCourse(courseData);
      const event = new Event('change', { bubbles: true });
      document.dispatchEvent(event);
      console.log('Course added:', course);
      return course;
    },

    removeCourse: (id) => {
      const course = ContentManager.deleteCourse(id);
      if (course) {
        const event = new Event('change', { bubbles: true });
        document.dispatchEvent(event);
        console.log('Course removed:', course);
      }
      return course;
    },

    getCourses: () => ContentManager.getCourses(),

    bulkUpdate: (updates) => {
      updates.forEach(update => {
        if (update.id) {
          ContentManager.editCourse(update.id, update);
        }
      });
      const event = new Event('change', { bubbles: true });
      document.dispatchEvent(event);
    }
  };



  // Quick helpers
  window.quickAddCourse = (title, category, price = 0) => {
    return CourseManager.addNewCourse({
      title,
      category,
      price,
      level: "Beginner",
      students: 0,
      lessons: 1,
      rating: 5,
      description: `Learn about ${title.toLowerCase()}`,
      image: "assets/img/course-large.jpg",
      instructor: "New Instructor",
      tags: [title.toLowerCase().replace(/\s+/g, '-')]
    });
  };

  console.log('Complete Course Platform loaded! 🎉');
  console.log('Available functions:');
  console.log('- CourseManager.updateCourse(id, {title: "New Title"})');
  console.log('- CourseManager.addNewCourse({...})');
  console.log('- quickAddCourse("Course Name", "Category", 25.99)');

})();
