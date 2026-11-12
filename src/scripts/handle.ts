import { handleFor, HANDLE_DOMAIN } from '../core/slug';
import { byId, prefersReducedMotion } from './dom';

const PLACEHOLDER = 'firstname-lastname';

// Hero handle builder: live preview, then hand the name to the full reservation form.
const hbForm = byId('hb', HTMLFormElement);
const hbFirst = byId('hb-first', HTMLInputElement);
const hbLast = byId('hb-last', HTMLInputElement);
const hbSlug = byId('hb-slug', HTMLSpanElement);

// Reservation form: live handle preview.
const rfFirst = byId('rf-first', HTMLInputElement);
const rfLast = byId('rf-last', HTMLInputElement);
const rfHandle = byId('rf-handle', HTMLSpanElement);

export function updateHeroPreview(): void {
  if (hbFirst && hbLast && hbSlug) hbSlug.textContent = handleFor(hbFirst.value, hbLast.value) || PLACEHOLDER;
}

export function updateFormPreview(): void {
  if (rfFirst && rfLast && rfHandle) {
    rfHandle.textContent = `@${handleFor(rfFirst.value, rfLast.value) || PLACEHOLDER}.${HANDLE_DOMAIN}`;
  }
}

hbFirst?.addEventListener('input', updateHeroPreview);
hbLast?.addEventListener('input', updateHeroPreview);
rfFirst?.addEventListener('input', updateFormPreview);
rfLast?.addEventListener('input', updateFormPreview);
updateHeroPreview();

hbForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  if (rfFirst && hbFirst) rfFirst.value = hbFirst.value;
  if (rfLast && hbLast) rfLast.value = hbLast.value;
  updateFormPreview();
  document.getElementById('reserve')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  window.setTimeout(() => byId('rf-email', HTMLInputElement)?.focus({ preventScroll: true }), 450);
});
