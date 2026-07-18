/* =====================================================
   THE NAWABS FROM NORTH — SCRIPT.JS
   Handles: scroll fade-in animations, category filtering
   (used on menu.html), and active nav link highlighting.
   Nav is a simple always-visible horizontal row now, so
   no hamburger/toggle logic is needed.
   ===================================================== */

const navLinks = document.getElementById('navLinks');

/* -----------------------------------------------------
   2. SCROLL FADE-IN ANIMATIONS
   Any element with class "fade-in" starts hidden/lowered,
   then animates into place once it scrolls into view.
   Uses IntersectionObserver — efficient, no scroll-event
   listeners running constantly.
----------------------------------------------------- */
const fadeElements = document.querySelectorAll('.fade-in');

if (fadeElements.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-visible');
          observer.unobserve(entry.target); // animate once, then stop watching
        }
      });
    },
    {
      threshold: 0.15, // triggers when 15% of the element is visible
      rootMargin: '0px 0px -40px 0px'
    }
  );

  fadeElements.forEach(el => observer.observe(el));
}

/* -----------------------------------------------------
   3. CATEGORY BAR (used on menu.html)
   Chips are anchor links that jump straight to their
   matching section (each section's id matches the chip's
   data-category). We just handle the active-state styling
   here since the actual jump is native browser behavior.
----------------------------------------------------- */
const categoryChips = document.querySelectorAll('.category-chip');

if (categoryChips.length > 0) {
  categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      categoryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      // Keep the tapped chip visible within the scrollable bar
      chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  });

  // Scroll-spy: highlight the chip matching whichever section is in view
  const menuSections = document.querySelectorAll('.menu-section');
  if (menuSections.length > 0) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            categoryChips.forEach(c => {
              c.classList.toggle('active', c.dataset.category === id);
            });
          }
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    menuSections.forEach(section => sectionObserver.observe(section));
  }
}

/* -----------------------------------------------------
   4. AR PREVIEW MODAL (used on menu.html)
   Tapping "View in AR" opens a bottom-sheet modal with a
   <model-viewer> 3D preview. Its built-in AR button then
   launches native AR Quick Look (iOS) or Scene Viewer
   (Android) using the .usdz / .glb files for that dish.

   PERFORMANCE: the model-viewer library (~200KB) is NOT
   loaded upfront in the HTML. Instead we load it lazily,
   once, in the background after the page finishes
   rendering (see loadModelViewerLibrary below) so it never
   competes with your actual page content for bandwidth.
----------------------------------------------------- */
const arButtons = document.querySelectorAll('.ar-button');
const arModal = document.getElementById('arModal');
const arModalClose = document.getElementById('arModalClose');
const arModalTitle = document.getElementById('arModalTitle');
const arModelViewer = document.getElementById('arModelViewer');

let modelViewerLoaded = false;
let modelViewerLoading = false;

function loadModelViewerLibrary(onReady) {
  if (modelViewerLoaded) {
    onReady();
    return;
  }
  if (modelViewerLoading) {
    // Already fetching (e.g. background preload in progress) — wait for it
    document.addEventListener('model-viewer-ready', onReady, { once: true });
    return;
  }
  modelViewerLoading = true;
  const script = document.createElement('script');
  script.type = 'module';
  script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
  script.onload = () => {
    modelViewerLoaded = true;
    modelViewerLoading = false;
    document.dispatchEvent(new Event('model-viewer-ready'));
    onReady();
  };
  document.head.appendChild(script);
}

if (arButtons.length > 0 && arModal && arModelViewer) {
  // Quietly preload the library once the page is idle, so it's usually
  // ready before the customer even taps a button — without blocking
  // anything else from loading first.
  window.addEventListener('load', () => {
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 2000));
    idle(() => loadModelViewerLibrary(() => {}));
  });

  arButtons.forEach(button => {
    button.addEventListener('click', () => {
      const glbSrc = button.dataset.arGlb;
      const usdzSrc = button.dataset.arUsdz;
      const dishName = button.dataset.arName || 'Dish';

      arModalTitle.textContent = dishName;
      arModal.classList.add('active');
      document.body.style.overflow = 'hidden';

      loadModelViewerLibrary(() => {
        arModelViewer.setAttribute('src', glbSrc);
        arModelViewer.setAttribute('ios-src', usdzSrc);
      });
    });
  });

  function closeArModal() {
    arModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  arModalClose.addEventListener('click', closeArModal);

  // Tapping the dark backdrop (outside the sheet) also closes it
  arModal.addEventListener('click', (e) => {
    if (e.target === arModal) closeArModal();
  });
}

/* -----------------------------------------------------
   5. ACTIVE NAV LINK HIGHLIGHTING
   Automatically adds the "active" class (gold color) to
   whichever nav link matches the current page's filename.
----------------------------------------------------- */
const currentPage = window.location.pathname.split('/').pop() || 'index.html';

document.querySelectorAll('.nav-links a').forEach(link => {
  const linkPage = link.getAttribute('href');
  if (linkPage === currentPage) {
    link.classList.add('active');
  }
});


/* -----------------------------------------------------
   6. CONTACT FORM (used on contact.html)
   Submitting builds a prefilled WhatsApp message from the
   form fields and opens WhatsApp so the request goes
   straight to the restaurant's number.
----------------------------------------------------- */
const contactForm = document.getElementById('contactForm');
const RESTAURANT_WHATSAPP_NUMBER = '917993503300'; // no + or spaces, country code + number

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const date = document.getElementById('date').value;
    const guests = document.getElementById('guests').value;
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    let text = `Hello! I'd like to make a reservation at The Nawabs From North.%0A%0A`;
    text += `*Name:* ${fullName}%0A`;
    text += `*Phone:* ${phone}%0A`;
    if (date) text += `*Preferred Date:* ${date}%0A`;
    if (guests) text += `*Guests:* ${guests}%0A`;
    if (email) text += `*Email:* ${email}%0A`;
    if (message) text += `*Message:* ${message}%0A`;

    const whatsappUrl = `https://wa.me/${RESTAURANT_WHATSAPP_NUMBER}?text=${text}`;
    window.open(whatsappUrl, '_blank');
  });
}