'use strict';

// One navigation for desktop and smaller windows.
const header = document.querySelector('.local-header');
const menuToggle = document.querySelector('.local-menu-toggle');
const navigation = document.getElementById('site-navigation');
const compactNavigation = window.matchMedia('(max-width: 1250px)');
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

document.querySelectorAll('.local-method-actions:not(.local-photo-carousel)').forEach(methodActions => {
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

// Photo and video galleries: pause automatic browsing during video playback.
document.querySelectorAll('.local-photo-carousel').forEach(studioGallery => {
  const slideDelay = 3000;
  const slidesPerAdvance = studioGallery.classList.contains('local-results-photo-gallery') ? 3 : 1;
  const track = studioGallery.querySelector('.local-method-actions-track');
  if (!track?.children.length) return;
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
    if (!paused && visible && !hovered && !focused && !document.hidden && ![...track.querySelectorAll('video')].some(video => !video.paused && !video.ended) && track.scrollWidth > track.clientWidth + 1) {
      timer = setTimeout(() => { advance(1); schedule(); }, slideDelay);
    }
  }
  function advance(direction) {
    const cards = [...track.children];
    if (cards.length < 2) return;
    const step = (cards[1].offsetLeft - cards[0].offsetLeft) * slidesPerAdvance;
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
  const galleryVideos = [...track.querySelectorAll('video')];
  const videoVisibility = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.intersectionRatio < .5) entry.target.pause(); });
  }, { root: track, threshold: .5 });
  galleryVideos.forEach(video => {
    videoVisibility.observe(video);
    video.addEventListener('play', () => {
      galleryVideos.forEach(other => { if (other !== video) other.pause(); });
      schedule();
    });
    video.addEventListener('pause', schedule);
    video.addEventListener('ended', schedule);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) galleryVideos.forEach(video => video.pause());
    schedule();
  });
  motion.addEventListener('change', () => { paused = motion.matches; updatePause(); });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }, { threshold: .15 }).observe(studioGallery);
  const intro = studioGallery.classList.contains('local-studio-photo-gallery') ? document.querySelector('.local-studio-intro') : null;
  const photo = intro?.querySelector('.local-studio-image');
  function alignStudioGallery() {
    if (intro && photo) {
      const inset = Math.max(0, photo.getBoundingClientRect().left - intro.getBoundingClientRect().left);
      studioGallery.style.setProperty('--studio-gallery-inset', `${inset}px`);
    }
    schedule();
  }
  new ResizeObserver(alignStudioGallery).observe(intro || studioGallery);
  controls.hidden = false;
  updatePause();
  alignStudioGallery();
});

// Independent exit-intent and ten-second triggers; the first show cancels both.
const trialOffer = document.getElementById('trial-offer');
if (trialOffer) {
  const seenKey = 'endo-spa-trial-offer-seen-v1';
  const started = Date.now();
  let shown = false;
  let offerTimer;
  let previousFocus;
  try { shown = sessionStorage.getItem(seenKey) === '1'; } catch { /* In-memory once-only fallback. */ }
  function showTrialOffer() {
    if (shown || document.hidden || document.querySelector('dialog[open]')) return;
    shown = true;
    clearTimeout(offerTimer);
    document.removeEventListener('mouseout', onOfferExit);
    document.removeEventListener('visibilitychange', onOfferVisibility);
    try { sessionStorage.setItem(seenKey, '1'); } catch { /* Optional storage. */ }
    previousFocus = document.activeElement;
    trialOffer.showModal();
    document.documentElement.classList.add('local-offer-open');
  }
  function onOfferExit(event) {
    if (!event.relatedTarget && event.clientY <= 0 && Date.now() - started >= 1500) showTrialOffer();
  }
  function onOfferVisibility() {
    if (!document.hidden && Date.now() - started >= 10000) showTrialOffer();
  }
  trialOffer.querySelector('.local-trial-offer-close').addEventListener('click', () => trialOffer.close());
  trialOffer.addEventListener('click', event => {
    if (event.target !== trialOffer) return;
    const rect = trialOffer.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) trialOffer.close();
  });
  trialOffer.addEventListener('close', () => {
    document.documentElement.classList.remove('local-offer-open');
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  });
  trialOffer.querySelector('.local-trial-offer-link').addEventListener('click', () => trialOffer.close());
  const localOfferPreview = ['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).get('preview') === 'trial-offer';
  if (localOfferPreview) {
    shown = false;
    showTrialOffer();
  } else if (!shown) {
    offerTimer = setTimeout(showTrialOffer, 10000);
    document.addEventListener('visibilitychange', onOfferVisibility);
    document.addEventListener('mouseout', onOfferExit);
  }
}

// Local-only menu palette picker; keep the chosen color across preview reloads.
if (['localhost', '127.0.0.1'].includes(location.hostname)) {
  const palette = document.createElement('div');
  palette.className = 'local-menu-color-preview';
  palette.setAttribute('role', 'group');
  palette.setAttribute('aria-label', 'Menüfarbe vergleichen');
  const label = document.createElement('span');
  label.textContent = 'Menü';
  palette.append(label);
  const choices = [['ice', 'Eisblau', '#e3f2fc'], ['sky', 'Himmelblau', '#d5edfa'], ['water', 'Wasserblau', '#c6e5f5'], ['white', 'Wei\u00df', '#ffffff']];
  function selectMenuColor(value) {
    if (!choices.some(([key]) => key === value)) value = 'ice';
    document.documentElement.dataset.menuColor = value;
    palette.querySelectorAll('[data-menu-color]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.menuColor === value)));
  }
  choices.forEach(([value, name, color]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.menuColor = value;
    button.style.setProperty('--swatch', color);
    button.textContent = name;
    button.addEventListener('click', () => {
      selectMenuColor(value);
      try { localStorage.setItem('endo-spa-menu-color', value); } catch { /* Optional preference. */ }
    });
    palette.append(button);
  });
  let saved = 'ice';
  try { saved = localStorage.getItem('endo-spa-menu-color') || saved; } catch { /* Default ice blue. */ }
  selectMenuColor(saved);

  const shadowButton = document.createElement('button');
  shadowButton.type = 'button';
  shadowButton.className = 'local-menu-shadow-toggle';
  shadowButton.textContent = 'Mehr Schatten';
  shadowButton.style.setProperty('--swatch', '#f3f8fc');
  function selectMenuShadow(stronger) {
    document.documentElement.dataset.menuShadow = stronger ? 'strong' : 'soft';
    shadowButton.setAttribute('aria-pressed', String(stronger));
  }
  let strongerShadow = false;
  try { strongerShadow = localStorage.getItem('endo-spa-menu-shadow') === 'strong'; } catch { /* Default soft shadow. */ }
  selectMenuShadow(strongerShadow);
  shadowButton.addEventListener('click', () => {
    const stronger = shadowButton.getAttribute('aria-pressed') !== 'true';
    selectMenuShadow(stronger);
    try { localStorage.setItem('endo-spa-menu-shadow', stronger ? 'strong' : 'soft'); } catch { /* Optional preference. */ }
  });
  palette.append(shadowButton);
  document.body.append(palette);
}

// Start the treatment video directly from either preview link.
const treatmentVideo = document.getElementById('behandlung-video');
if (treatmentVideo) {
  document.querySelectorAll('[data-play-treatment-video]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (location.hash !== '#behandlung-video') history.pushState(null, '', '#behandlung-video');
      treatmentVideo.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      treatmentVideo.focus({ preventScroll: true });
      treatmentVideo.play().catch(() => { /* Native controls remain available if playback is blocked. */ });
    });
  });
}

// Enlarge the supplied certificate without leaving the studio section.
const certificateLink = document.querySelector('.local-studio-certificate');
const certificateDialog = document.getElementById('certificate-dialog');
if (certificateLink && certificateDialog) {
  certificateLink.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    certificateDialog.showModal();
    document.documentElement.classList.add('local-certificate-open');
  });
  certificateDialog.querySelector('.local-certificate-close').addEventListener('click', () => certificateDialog.close());
  certificateDialog.addEventListener('click', event => {
    if (event.target !== certificateDialog) return;
    const rect = certificateDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) certificateDialog.close();
  });
  certificateDialog.addEventListener('close', () => {
    document.documentElement.classList.remove('local-certificate-open');
    certificateLink.focus({ preventScroll: true });
  });
}

// One animated treatment clip at a time; the visitor chooses when to advance.
document.querySelectorAll('[data-gif-slides]').forEach(carousel => {
  const slides = JSON.parse(carousel.dataset.gifSlides);
  const image = carousel.querySelector('img');
  const status = carousel.querySelector('.local-application-status');
  let active = 0;
  function selectSlide(index) {
    active = (index + slides.length) % slides.length;
    image.src = slides[active].src;
    image.alt = slides[active].alt;
    status.textContent = `${active + 1} / ${slides.length}`;
  }
  carousel.querySelectorAll('[data-gif-step]').forEach(button => {
    button.addEventListener('click', () => selectSlide(active + Number(button.dataset.gifStep)));
  });
  carousel.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    selectSlide(active + (event.key === 'ArrowRight' ? 1 : -1));
  });
});
