/* --------------------------------------------------------------------------
   SKETCH BEAUTY SALON - INTERACTIVE JAVASCRIPT
   -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Mobile Menu Toggle ---
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');

  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const icon = mobileBtn.querySelector('i');
      if (icon) {
        if (navLinks.classList.contains('active')) {
          icon.className = 'fas fa-times';
        } else {
          icon.className = 'fas fa-bars';
        }
      }
    });

    // Close menu when clicking outside or link click
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const icon = mobileBtn.querySelector('i');
        if (icon) icon.className = 'fas fa-bars';
      });
    });
  }

  // --- 2. Interactive Hero Slider ---
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.slider-dot');
  const prevBtn = document.getElementById('prevSlide');
  const nextBtn = document.getElementById('nextSlide');

  if (slides.length > 0) {
    let currentSlide = 0;
    let slideInterval;

    const showSlide = (index) => {
      slides.forEach(slide => slide.classList.remove('active'));
      dots.forEach(dot => dot.classList.remove('active'));

      currentSlide = (index + slides.length) % slides.length;

      slides[currentSlide].classList.add('active');
      if (dots[currentSlide]) {
        dots[currentSlide].classList.add('active');
      }
    };

    const nextSlide = () => {
      showSlide(currentSlide + 1);
    };

    const prevSlide = () => {
      showSlide(currentSlide - 1);
    };

    if (nextBtn) nextBtn.addEventListener('click', () => {
      nextSlide();
      resetTimer();
    });

    if (prevBtn) prevBtn.addEventListener('click', () => {
      prevSlide();
      resetTimer();
    });

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        showSlide(idx);
        resetTimer();
      });
    });

    const startTimer = () => {
      slideInterval = setInterval(nextSlide, 5000);
    };

    const resetTimer = () => {
      clearInterval(slideInterval);
      startTimer();
    };

    startTimer();
  }

  // --- 3. Work Gallery Filter (Home & Portfolio) ---
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.work-card');

  if (filterBtns.length > 0 && galleryItems.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active class on filter buttons
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');

        galleryItems.forEach(item => {
          const itemCategory = item.getAttribute('data-category');

          if (filterValue === 'all' || itemCategory === filterValue) {
            item.style.display = 'block';
            setTimeout(() => {
              item.style.opacity = '1';
              item.style.transform = 'translateY(0)';
            }, 50);
          } else {
            item.style.opacity = '0';
            item.style.transform = 'translateY(10px)';
            setTimeout(() => {
              item.style.display = 'none';
            }, 300);
          }
        });
      });
    });
  }

  // --- 4. Contact Us Form Handling (Connected to MongoDB API) ---
  const contactForm = document.getElementById('appointmentForm');
  const formSuccessAlert = document.getElementById('formSuccessAlert');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        emailAddr: document.getElementById('emailAddr').value.trim(),
        phoneNum: document.getElementById('phoneNum').value.trim(),
        cityServed: document.getElementById('cityServed') ? document.getElementById('cityServed').value : 'Central City',
        serviceType: document.getElementById('serviceType') ? document.getElementById('serviceType').value : 'General Inquiry',
        preferredDate: document.getElementById('preferredDate') ? document.getElementById('preferredDate').value : '',
        userMessage: document.getElementById('userMessage') ? document.getElementById('userMessage').value.trim() : ''
      };

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

      try {
        const apiBaseUrl = window.API_BASE_URL || '';
        const response = await fetch(`${apiBaseUrl}/api/contact`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        if (result.success) {
          if (formSuccessAlert) {
            formSuccessAlert.style.display = 'block';
            formSuccessAlert.className = 'form-alert success';
            formSuccessAlert.innerHTML = '✨ <strong>Thank you!</strong> Your appointment request has been saved to the database. Our team will contact you shortly.';

            contactForm.reset();
            formSuccessAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            setTimeout(() => {
              formSuccessAlert.style.display = 'none';
            }, 8000);
          }
        } else {
          alert('Submission Error: ' + (result.message || 'Could not save submission.'));
        }
      } catch (err) {
        console.error('Backend server not reachable.', err);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        alert('Could not connect to the booking server. Please try again later.');
      }
    });
  }
});
