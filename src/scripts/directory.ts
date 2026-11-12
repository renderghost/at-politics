import { slugify } from '../core/slug';
import { byId } from './dom';

const form = byId('dir-filters', HTMLFormElement);
const q = byId('dir-q', HTMLInputElement);
const country = byId('dir-country', HTMLSelectElement);
const group = byId('dir-group', HTMLSelectElement);
const atmo = byId('dir-atmo', HTMLInputElement);
const count = document.getElementById('dir-count');
const empty = document.getElementById('dir-empty');
const items = [...document.querySelectorAll<HTMLLIElement>('#dir-list .dir-item')];

function apply(): void {
  const terms = slugify(q?.value ?? '').split('-').filter(Boolean);
  let shown = 0;
  for (const li of items) {
    const d = li.dataset;
    const match =
      terms.every((t) => (d.name ?? '').includes(t)) &&
      (!country?.value || d.country === country.value) &&
      (!group?.value || d.group === group.value) &&
      (!atmo?.checked || d.atmo === '1');
    li.hidden = !match;
    if (match) shown++;
  }
  if (count) count.textContent = `Showing ${shown} of ${items.length} Members`;
  if (empty) empty.hidden = shown > 0;
}

if (form) {
  form.hidden = false; // filters need JavaScript; without it the full list stays visible
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('input', apply);
  form.addEventListener('change', apply);
  const params = new URLSearchParams(location.search);
  if (params.get('atmosphere') === '1' && atmo) atmo.checked = true;
  apply();
}
