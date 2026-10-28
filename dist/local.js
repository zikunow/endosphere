'use strict';

// Client font comparison; local storage is optional (e.g. private browsing).
const fontChoices = ['open-sans', 'manrope', 'montserrat'];
const fontButtons = [...document.querySelectorAll('[data-font-choice]')];
function applySiteFont(choice, persist = false) {
  if (!fontChoices.includes(choice)) choice = 'open-sans';
  document.documentElement.dataset.siteFont = choice;
  fontButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.fontChoice === choice)));
  if (persist) {
    try { localStorage.setItem('endo-spa-font', choice); } catch { /* The preview works without storage. */ }
  }
}
let savedFont = 'open-sans';
try { savedFont = localStorage.getItem('endo-spa-font') || savedFont; } catch { /* Use the default font. */ }
applySiteFont(savedFont);
fontButtons.forEach(button => button.addEventListener('click', () => applySiteFont(button.dataset.fontChoice, true)));

// Heading colour is independent of the font choice.
const headingChoices = ['black', 'slate', 'petrol', 'plum'];
const headingButtons = [...document.querySelectorAll('[data-heading-choice]')];
function applyHeadingColor(choice, persist = false) {
  if (choice === 'terracotta') choice = 'plum';
  if (!headingChoices.includes(choice)) choice = 'black';
  document.documentElement.dataset.headingColor = choice;
  headingButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.headingChoice === choice)));
  if (persist) {
    try { localStorage.setItem('endo-spa-heading-color', choice); } catch { /* Switching works without storage. */ }
  }
}
let savedHeadingColor = 'black';
try { savedHeadingColor = localStorage.getItem('endo-spa-heading-color') || savedHeadingColor; } catch { /* Use black. */ }
applyHeadingColor(savedHeadingColor);
headingButtons.forEach(button => button.addEventListener('click', () => applyHeadingColor(button.dataset.headingChoice, true)));

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
