'use strict';

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
      photos.forEach(photo => {
        photo.hidden = false;
        grid.append(photo);
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

const contactForm = document.querySelector('.local-contact-form');
contactForm?.addEventListener('submit', event => {
  event.preventDefault();
  const fields = new FormData(contactForm);
  const subject = encodeURIComponent(fields.get('Betreff'));
  const lines = [
    `Name: ${fields.get('Name')}`,
    `E-Mail: ${fields.get('E-Mail')}`,
  ];
  const phone = fields.get('Telefon').trim();
  if (phone) lines.push(`Telefon: ${phone}`);
  const message = fields.get('Nachricht').replace(/\r?\n/g, '\r\n');
  const body = encodeURIComponent([...lines, '', message].join('\r\n'));
  window.location.href = `${contactForm.action}?subject=${subject}&body=${body}`;
});

document.querySelectorAll('[data-contact-map-load]').forEach(button => {
  const template = button.closest('section').querySelector('template');
  if (!template) return;
  button.hidden = false;
  button.addEventListener('click', () => {
    const map = template.content.firstElementChild.cloneNode(true);
    template.replaceWith(map);
    button.hidden = true;
    map.focus({ preventScroll: true });
  }, { once: true });
});

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

document.querySelectorAll('.local-method-actions:not(.local-studio-photo-gallery)').forEach(methodActions => {
const methodActionsTrack = methodActions?.querySelector('.local-method-actions-track');
const methodActionsControls = methodActions?.querySelector('.local-method-actions-controls');
if (methodActionsTrack && methodActionsControls) {
  const previous = methodActionsControls.querySelector('[data-method-action-step="-1"]');
  const next = methodActionsControls.querySelector('[data-method-action-step="1"]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function updateMethodActionsControls() {
    previous.disabled = methodActionsTrack.scrollLeft < 1;
    next.disabled = methodActionsTrack.scrollLeft + methodActionsTrack.clientWidth >= methodActionsTrack.scrollWidth - 1;
  }

  let animationFrame;
  let destination;

  function stopMethodActionsAnimation() {
    if (animationFrame === undefined) return;
    cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
    destination = undefined;
    methodActionsTrack.classList.remove('is-animating');
  }

  [previous, next].forEach(button => {
    button.addEventListener('click', () => {
      const [first, second] = methodActionsTrack.children;
      const step = second.getBoundingClientRect().left - first.getBoundingClientRect().left;
      const start = methodActionsTrack.scrollLeft;
      const index = Math.round((destination ?? start) / step);
      const limit = methodActionsTrack.scrollWidth - methodActionsTrack.clientWidth;
      const target = Math.max(0, Math.min(limit, (index + Number(button.dataset.methodActionStep)) * step));
      if (target === destination) return;
      stopMethodActionsAnimation();
      if (reducedMotion.matches) {
        methodActionsTrack.scrollLeft = target;
        return;
      }

      const started = performance.now();
      destination = target;
      methodActionsTrack.classList.add('is-animating');
      function animate(now) {
        const progress = Math.min(1, Math.max(0, (now - started) / 520));
        const eased = (1 - Math.cos(Math.PI * progress)) / 2;
        methodActionsTrack.scrollLeft = start + (target - start) * eased;
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          stopMethodActionsAnimation();
        }
      }
      animationFrame = requestAnimationFrame(animate);
    });
  });
  for (const event of ['pointerdown', 'wheel', 'keydown']) {
    methodActionsTrack.addEventListener(event, stopMethodActionsAnimation, { passive: true });
  }
  reducedMotion.addEventListener('change', stopMethodActionsAnimation);
  methodActionsControls.hidden = false;
  methodActionsTrack.addEventListener('scroll', updateMethodActionsControls, { passive: true });
  new ResizeObserver(updateMethodActionsControls).observe(methodActionsTrack);
  updateMethodActionsControls();
}
});

// Studio photographs: three full portraits, gently advancing every eight seconds.
const studioGallery = document.getElementById('studio-gallery');
if (studioGallery) {
  const track = studioGallery.querySelector('.local-method-actions-track');
  const controls = studioGallery.querySelector('.local-method-actions-controls');
  const pause = controls.querySelector('[data-studio-gallery-pause]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motion.matches;
  let timer;
  let visible = false;
  let hovered = false;
  let focused = false;
  function schedule() {
    clearTimeout(timer);
    if (!paused && visible && !hovered && !focused && !document.hidden && track.scrollWidth > track.clientWidth + 1) {
      timer = setTimeout(() => { advance(1); schedule(); }, 8000);
    }
  }
  function advance(direction) {
    const cards = [...track.children];
    const step = cards[1].offsetLeft - cards[0].offsetLeft;
    const limit = track.scrollWidth - track.clientWidth;
    let target = track.scrollLeft + direction * step;
    if (direction > 0 && track.scrollLeft >= limit - 2) target = 0;
    if (direction < 0 && track.scrollLeft <= 2) target = limit;
    track.scrollTo({ left: Math.max(0, Math.min(limit, target)), behavior: motion.matches ? 'instant' : 'smooth' });
  }
  function updatePause() {
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? 'Automatisches Blättern starten' : 'Automatisches Blättern pausieren');
    pause.querySelector('path').setAttribute('d', paused ? 'M8 5v14l11-7z' : 'M7 5h4v14H7zm6 0h4v14h-4z');
    schedule();
  }
  controls.querySelectorAll('[data-method-action-step]').forEach(button => {
    button.addEventListener('click', () => { advance(Number(button.dataset.methodActionStep)); schedule(); });
  });
  pause.addEventListener('click', () => { paused = !paused; updatePause(); });
  studioGallery.addEventListener('mouseenter', () => { hovered = true; schedule(); });
  studioGallery.addEventListener('mouseleave', () => { hovered = false; schedule(); });
  studioGallery.addEventListener('focusin', () => { focused = true; schedule(); });
  studioGallery.addEventListener('focusout', event => { focused = studioGallery.contains(event.relatedTarget); schedule(); });
  track.addEventListener('pointerdown', () => clearTimeout(timer), { passive: true });
  track.addEventListener('pointerup', schedule, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => { paused = motion.matches; updatePause(); });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }, { threshold: .15 }).observe(studioGallery);
  const intro = document.querySelector('.local-studio-intro');
  const photo = intro.querySelector('.local-studio-image');
  function alignStudioGallery() {
    const inset = Math.max(0, photo.getBoundingClientRect().left - intro.getBoundingClientRect().left);
    studioGallery.style.setProperty('--studio-gallery-inset', `${inset}px`);
    schedule();
  }
  new ResizeObserver(alignStudioGallery).observe(intro);
  controls.hidden = false;
  updatePause();
  alignStudioGallery();
}
