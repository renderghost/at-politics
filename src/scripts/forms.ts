import { byId } from './dom';

type Field = HTMLInputElement | HTMLSelectElement;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EP_EMAIL = /@europarl\.europa\.eu$/i;

function setError(input: Field, message: string): boolean {
  const el = document.getElementById(`${input.id}-err`);
  if (message) {
    input.setAttribute('aria-invalid', 'true');
    if (el) { el.textContent = message; el.hidden = false; }
  } else {
    input.removeAttribute('aria-invalid');
    if (el) { el.hidden = true; el.textContent = ''; }
  }
  return !message;
}

/** Run each [field, message] check; focus the first failure. Returns true when all pass. */
function validate(checks: Array<[Field | null, string]>): boolean {
  let first: Field | null = null;
  let ok = true;
  for (const [field, message] of checks) {
    if (!field) continue;
    const passed = setError(field, message);
    if (!passed && !first) first = field;
    ok = ok && passed;
  }
  first?.focus();
  return ok;
}

function showSuccess(fieldsId: string, successId: string): void {
  const fields = document.getElementById(fieldsId);
  const success = document.getElementById(successId);
  if (fields) fields.hidden = true;
  if (success) { success.hidden = false; success.focus(); }
}

export function reserveEmailError(value: string): string {
  if (!value) return 'Enter your Parliament email address.';
  if (!EMAIL.test(value)) return 'Enter an email address like name@europarl.europa.eu.';
  if (!EP_EMAIL.test(value)) return "Use your official address ending in @europarl.europa.eu, so we can confirm it's you.";
  return '';
}

byId('reserve-form', HTMLFormElement)?.addEventListener('submit', (e) => {
  e.preventDefault();
  const first = byId('rf-first', HTMLInputElement);
  const last = byId('rf-last', HTMLInputElement);
  const email = byId('rf-email', HTMLInputElement);
  const state = byId('rf-state', HTMLSelectElement);
  const consent = byId('rf-consent', HTMLInputElement);
  const emailValue = email?.value.trim() ?? '';
  const ok = validate([
    [first, first?.value.trim() ? '' : 'Enter your first name.'],
    [last, last?.value.trim() ? '' : 'Enter your last name.'],
    [email, reserveEmailError(emailValue)],
    [state, state?.value ? '' : 'Select your member state.'],
    [consent, consent?.checked ? '' : 'Tick this box so we can hold your handle.'],
  ]);
  if (!ok) return;
  const handleText = document.getElementById('rf-handle')?.textContent ?? '';
  const successHandle = document.getElementById('rf-success-handle');
  const successEmail = document.getElementById('rf-success-email');
  if (successHandle) successHandle.textContent = handleText;
  if (successEmail) successEmail.textContent = emailValue;
  showSuccess('rf-fields', 'rf-success');
});

byId('briefing', HTMLFormElement)?.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = byId('bf-name', HTMLInputElement);
  const role = byId('bf-role', HTMLSelectElement);
  const email = byId('bf-email', HTMLInputElement);
  const emailValue = email?.value.trim() ?? '';
  const ok = validate([
    [name, name?.value.trim() ? '' : 'Enter your name.'],
    [role, role?.value ? '' : 'Select your role.'],
    [email, !emailValue ? 'Enter your office email address.' : !EMAIL.test(emailValue) ? 'Enter a valid email address, like name@example.eu.' : ''],
  ]);
  if (ok) showSuccess('bf-fields', 'bf-success');
});
