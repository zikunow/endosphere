'use strict';

// Compare the studio benefits without duplicating their content.
const studioBenefits = document.getElementById('studio-benefits');
const benefitsButtons = [...document.querySelectorAll('[data-benefits-choice]')];
const benefitsLayouts = ['cards', 'compact', 'numbered'];
function applyBenefitsLayout(choice, persist = false) {
  if (!benefitsLayouts.includes(choice)) choice = 'cards';
  if (studioBenefits) studioBenefits.dataset.benefitsLayout = choice;
  benefitsButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.benefitsChoice === choice)));
  if (persist) {
    try { localStorage.setItem('endo-spa-benefits-layout', choice); } catch { /* Optional storage. */ }
  }
}
let savedBenefitsLayout = 'cards';
try { savedBenefitsLayout = localStorage.getItem('endo-spa-benefits-layout') || savedBenefitsLayout; } catch { /* Use cards. */ }
applyBenefitsLayout(savedBenefitsLayout);
benefitsButtons.forEach(button => button.addEventListener('click', () => applyBenefitsLayout(button.dataset.benefitsChoice, true)));

// Collages and two circular, automatically advancing comparison sliders.
const concernGallery = document.getElementById('concern-gallery');
const concernGalleryButtons = [...document.querySelectorAll('[data-concern-gallery-choice]')];
const concernGalleryLayouts = ['strip', 'duo', 'editorial', 'wall', 'slider-one', 'slider-two'];
if (concernGallery) {
  const grid = concernGallery.querySelector('.local-concern-gallery-grid');
  const photos = [...grid.querySelectorAll('.local-concern-photo')];
  const originalParents = photos.map(photo => photo.parentElement);
  const controls = concernGallery.querySelector('.local-concern-slider-controls');
  const status = controls.querySelector('.local-concern-slider-status');
  const pauseButton = controls.querySelector('[data-concern-pause]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let timer;
  let layout = 'duo';
  let paused = motion.matches;
  let hovered = false;
  let focused = false;
  let inView = false;
  const isSlider = () => layout === 'slider-one' || layout === 'slider-two';
  function schedule() {
    clearTimeout(timer);
    if (!isSlider() || paused || hovered || focused || !inView || document.hidden || photos.length < 2) return;
    timer = setTimeout(() => advance(1), 5000);
  }
  function paint(animate = false) {
    const count = layout === 'slider-two' ? Math.min(2, photos.length) : 1;
    const visible = Array.from({ length: count }, (_, offset) => (active + offset) % photos.length);
    photos.forEach((photo, index) => { photo.hidden = !visible.includes(index); });
    // Put visible cards in reading order too, including the last-to-first pair.
    visible.forEach(index => {
      grid.append(photos[index]);
      if (animate && !motion.matches) photos[index].animate([{ opacity: .2, transform: 'translateX(12px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 320, easing: 'ease-out' });
    });
    status.textContent = visible.map(index => index + 1).join(' + ') + ' / ' + photos.length;
  }
  function advance(direction) {
    active = (active + direction + photos.length) % photos.length;
    paint(true);
    schedule();
  }
  function updatePauseButton() {
    pauseButton.textContent = paused ? 'Abspielen' : 'Pause';
    pauseButton.setAttribute('aria-label', paused ? 'Automatische Wiedergabe starten' : 'Automatische Wiedergabe pausieren');
  }
  function applyConcernGalleryLayout(choice, persist = false) {
    if (!concernGalleryLayouts.includes(choice)) choice = 'strip';
    clearTimeout(timer);
    layout = choice;
    concernGallery.dataset.concernGalleryLayout = choice;
    controls.hidden = !isSlider();
    concernGalleryButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.concernGalleryChoice === choice)));
    if (isSlider()) {
      photos.forEach(photo => grid.append(photo));
      active = 0;
      paint();
    } else if (choice === 'strip') {
      // Face comparisons first, then feet, thigh and body contour comparisons.
      [4, 3, 0, 1, 2].forEach(index => {
        if (!photos[index]) return;
        photos[index].hidden = false;
        grid.append(photos[index]);
      });
    } else {
      photos.forEach((photo, index) => { photo.hidden = false; originalParents[index].append(photo); });
    }
    updatePauseButton();
    schedule();
    if (persist) {
      try { localStorage.setItem('endo-spa-concern-gallery-layout', choice); } catch { /* Optional storage. */ }
    }
  }
  controls.querySelector('[data-concern-previous]').addEventListener('click', () => advance(-1));
  controls.querySelector('[data-concern-next]').addEventListener('click', () => advance(1));
  pauseButton.addEventListener('click', () => { paused = !paused; updatePauseButton(); schedule(); });
  grid.addEventListener('mouseenter', () => { hovered = true; schedule(); });
  grid.addEventListener('mouseleave', () => { hovered = false; schedule(); });
  concernGallery.addEventListener('focusin', event => { focused = grid.contains(event.target); schedule(); });
  concernGallery.addEventListener('focusout', event => { focused = grid.contains(event.relatedTarget); schedule(); });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => { paused = motion.matches; updatePauseButton(); schedule(); });
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; schedule(); }, { threshold: .15 }).observe(grid);
  concernGalleryButtons.forEach(button => button.addEventListener('click', () => applyConcernGalleryLayout(button.dataset.concernGalleryChoice, true)));
  let savedLayout = 'strip';
  try { savedLayout = localStorage.getItem('endo-spa-concern-gallery-layout') || savedLayout; } catch { /* Default to the filmstrip. */ }
  applyConcernGalleryLayout(savedLayout);
}

// Compare treatment layouts without replacing the video or interrupting playback.
const treatmentSection = document.getElementById('behandlung');
const treatmentLayoutButtons = [...document.querySelectorAll('[data-treatment-choice]')];
const treatmentLayouts = ['split65', 'split60', 'cards', 'video-left'];
function applyTreatmentLayout(choice, persist = false) {
  if (!treatmentLayouts.includes(choice)) choice = 'split65';
  if (treatmentSection) treatmentSection.dataset.treatmentLayout = choice;
  treatmentLayoutButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.treatmentChoice === choice)));
  if (persist) {
    try { localStorage.setItem('endo-spa-treatment-layout', choice); } catch { /* Optional storage. */ }
  }
}
let savedTreatmentLayout = 'split65';
try { savedTreatmentLayout = localStorage.getItem('endo-spa-treatment-layout') || savedTreatmentLayout; } catch { /* Use 65/35. */ }
applyTreatmentLayout(savedTreatmentLayout);
treatmentLayoutButtons.forEach(button => button.addEventListener('click', () => applyTreatmentLayout(button.dataset.treatmentChoice, true)));

// One navigation for desktop and smaller windows.
const header = document.querySelector('.local-header');
const menuToggle = document.querySelector('.local-menu-toggle');
const navigation = document.getElementById('site-navigation');
const compactNavigation = window.matchMedia('(max-width: 1100px)');
function setMenu(open) {
  menuToggle.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
  navigation.inert = compactNavigation.matches && !open;
}
if (header && menuToggle && navigation) {
  setMenu(false);
  menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', event => { if (!header.contains(event.target)) setMenu(false); });
  header.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false); menuToggle.focus();
    }
  });
  compactNavigation.addEventListener('change', () => setMenu(false));
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--local-header-offset', Math.ceil(header.getBoundingClientRect().height + 20) + 'px');
  }).observe(header);
}

// Price tabs support mouse, arrows and Home/End.
document.querySelectorAll('[role="tablist"]').forEach(group => {
  const tabs = [...group.querySelectorAll('[role="tab"]')];
  function select(tab) {
    tabs.forEach(peer => {
      const active = peer === tab;
      peer.setAttribute('aria-selected', String(active));
      peer.tabIndex = active ? 0 : -1;
      document.getElementById(peer.getAttribute('aria-controls')).hidden = !active;
    });
  }
  tabs.forEach(tab => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 :
        (tabs.indexOf(tab) + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      select(tabs[index]); tabs[index].focus();
    });
  });
  select(tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0]);
});

// Direct research links also reveal their content.
function revealAnchor() {
  const target = document.getElementById(location.hash.slice(1));
  if (!target) return;
  if (target.matches('details')) target.open = true;
  let ancestor = target.parentElement;
  while (ancestor) {
    if (ancestor.matches('details')) ancestor.open = true;
    ancestor = ancestor.parentElement;
  }
}
window.addEventListener('hashchange', revealAnchor);
revealAnchor();

// Missing, incomplete or unloadable assets never expose empty public UI.
const media = window.endoMedia || { steps: {}, results: [] };
function loadPhoto(photo) {
  return new Promise(resolve => {
    if (!photo || typeof photo.src !== 'string' || !/^assets\/[\w./-]+\.(webp|png|jpe?g)$/i.test(photo.src) ||
        typeof photo.alt !== 'string' || !photo.alt.trim()) { resolve(null); return; }
    const img = new Image();
    img.alt = photo.alt;
    img.decoding = 'async';
    img.onload = () => { img.width = img.naturalWidth; img.height = img.naturalHeight; resolve(img); };
    img.onerror = () => resolve(null);
    img.src = photo.src;
  });
}
document.querySelectorAll('[data-step-media]').forEach(async slot => {
  const img = await loadPhoto(media.steps?.[slot.dataset.stepMedia]);
  if (!img) return;
  slot.append(img); slot.hidden = false;
});

const results = document.getElementById('ergebnisse');
const gallery = document.getElementById('results-dialog');
async function prepareResults() {
  if (!results || !gallery || !Array.isArray(media.results) || !media.results.length) return;
  const loaded = await Promise.all(media.results.map(async entry => {
    if (!entry || typeof entry.title !== 'string' || !entry.title.trim()) return null;
    const [before, after] = await Promise.all([loadPhoto(entry.before), loadPhoto(entry.after)]);
    return before && after ? { ...entry, beforeImage: before, afterImage: after } : null;
  }));
  const entries = loaded.filter(Boolean);
  if (!entries.length) return;
  let active = 0;
  let opener;
  const previous = gallery.querySelector('[data-gallery-previous]');
  const next = gallery.querySelector('[data-gallery-next]');
  function pairedImages(entry) {
    const pair = document.createElement('div');
    pair.className = 'local-result-pair';
    [['Vorher', entry.beforeImage], ['Nachher', entry.afterImage]].forEach(([label, image]) => {
      const figure = document.createElement('figure');
      const caption = document.createElement('figcaption');
      caption.textContent = label;
      figure.append(image.cloneNode(), caption); pair.append(figure);
    });
    return pair;
  }
  function show(index) {
    active = (index + entries.length) % entries.length;
    const entry = entries[active];
    gallery.querySelector('h2').textContent = entry.title;
    gallery.querySelector('.local-results-dialog-pair').replaceChildren(pairedImages(entry));
    gallery.querySelector('.local-results-caption').textContent = entry.caption || '';
    gallery.querySelector('.local-gallery-status').textContent = (active + 1) + ' / ' + entries.length;
    previous.disabled = next.disabled = entries.length === 1;
  }
  entries.forEach((entry, index) => {
    const card = document.createElement('article');
    card.className = 'local-result-card';
    const title = document.createElement('h3'); title.textContent = entry.title;
    const button = document.createElement('button');
    button.className = 'local-gallery-open'; button.type = 'button';
    button.textContent = 'Vergleich ansehen ↗';
    button.setAttribute('aria-label', entry.title + ': Vergleich ansehen');
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'results-dialog');
    button.addEventListener('click', () => { opener = button; show(index); gallery.showModal(); });
    card.append(pairedImages(entry), title, button);
    results.querySelector('.local-results-grid').append(card);
  });
  previous.addEventListener('click', () => show(active - 1));
  next.addEventListener('click', () => show(active + 1));
  gallery.querySelector('.local-gallery-close').addEventListener('click', () => gallery.close());
  gallery.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); show(active + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  gallery.addEventListener('click', event => {
    if (event.target !== gallery) return;
    const rect = gallery.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) gallery.close();
  });
  gallery.addEventListener('close', () => opener?.focus());
  results.hidden = false;
}
prepareResults();

// Three compositions of the supplied body and face animations.
const applicationGallery = document.querySelector('[data-application-layout]');
const applicationButtons = [...document.querySelectorAll('[data-application-choice]')];
function applyApplicationLayout(choice, persist = false) {
  if (!['editorial', 'cards', 'stage'].includes(choice)) choice = 'editorial';
  if (applicationGallery) applicationGallery.dataset.applicationLayout = choice;
  applicationButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.applicationChoice === choice)));
  if (persist) {
    try { localStorage.setItem('endo-spa-application-layout', choice); } catch { /* Optional preference. */ }
  }
}
let applicationLayout = 'editorial';
try { applicationLayout = localStorage.getItem('endo-spa-application-layout') || applicationLayout; } catch { /* Use editorial. */ }
applyApplicationLayout(applicationLayout);
applicationButtons.forEach(button => button.addEventListener('click', () => applyApplicationLayout(button.dataset.applicationChoice, true)));
