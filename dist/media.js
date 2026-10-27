/* Only real, client-approved photographs belong here.
 * Paths are relative to index.html; mirror the files in dist/assets/.
 * Empty entries create no placeholders or empty space.
 * Step image: { src: 'assets/…webp', alt: 'German description' }
 * Gallery entry:
 * { title: 'German title', caption: 'Approved context, without promises',
 *   before: { src: 'assets/…webp', alt: 'German before description' },
 *   after:  { src: 'assets/…webp', alt: 'German after description' } }
 * Do not use unrelated studio photos as results.
 */
window.endoMedia = {
  steps: { consultation: null, treatment: null, aftercare: null },
  results: []
};
