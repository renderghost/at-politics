/**
 * "Find yourself" for the reservation form: picks a Member from /meps-lite.json and fills the form.
 * Also handles /?mep={id} links from draft profiles ("Claim this profile").
 */
import { handleFor, HANDLE_DOMAIN } from '../core/slug';
import { byId } from './dom';

interface MepLite { id: string; givenName: string; familyName: string; country: string; group: string; email?: string }

const find = byId('rf-find', HTMLInputElement);
const options = document.getElementById('rf-find-options');
const found = document.getElementById('rf-found');
const first = byId('rf-first', HTMLInputElement);
const last = byId('rf-last', HTMLInputElement);
const email = byId('rf-email', HTMLInputElement);
const state = byId('rf-state', HTMLSelectElement);
const handle = document.getElementById('rf-handle');

const label = (m: MepLite) => `${m.givenName} ${m.familyName} (${m.country})`;
let roster: Promise<MepLite[]> | null = null;

function load(): Promise<MepLite[]> {
  roster ??= fetch('/meps-lite.json')
    .then((r) => (r.ok ? (r.json() as Promise<MepLite[]>) : []))
    .then((list) => {
      if (options) options.replaceChildren(...list.map((m) => Object.assign(document.createElement('option'), { value: label(m) })));
      return list;
    })
    .catch(() => []);
  return roster;
}

function fill(m: MepLite): void {
  if (first) first.value = m.givenName;
  if (last) last.value = m.familyName;
  if (state) state.value = m.country;
  if (email && m.email) email.value = m.email;
  if (find) find.value = label(m);
  if (handle) handle.textContent = `@${handleFor(m.givenName, m.familyName)}.${HANDLE_DOMAIN}`;
  if (found) {
    found.textContent = `Found you: ${m.givenName} ${m.familyName}, ${m.group}, ${m.country}. Check the details below.`;
    found.hidden = false;
  }
}

find?.addEventListener('focus', () => void load(), { once: true });
find?.addEventListener('input', async () => {
  const list = await load();
  const match = list.find((m) => label(m) === find.value);
  if (match) fill(match);
});

const requested = new URLSearchParams(location.search).get('mep');
if (requested) {
  void load().then((list) => {
    const match = list.find((m) => m.id === requested);
    if (!match) return;
    fill(match);
    document.getElementById('reserve')?.scrollIntoView();
  });
}
