/** Reference data about the EU. Framework-agnostic. */

export const MEMBER_STATES = [
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Denmark', 'Estonia', 'Finland',
  'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg',
  'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden',
] as const;
export type MemberState = (typeof MEMBER_STATES)[number];

/** ISO 3166-1 alpha-2 codes as used by the EP open data API (GR, not EL, for Greece). */
const COUNTRY_BY_CODE: Record<string, MemberState> = {
  AT: 'Austria', BE: 'Belgium', BG: 'Bulgaria', HR: 'Croatia', CY: 'Cyprus', CZ: 'Czechia', DK: 'Denmark',
  EE: 'Estonia', FI: 'Finland', FR: 'France', DE: 'Germany', GR: 'Greece', HU: 'Hungary', IE: 'Ireland',
  IT: 'Italy', LV: 'Latvia', LT: 'Lithuania', LU: 'Luxembourg', MT: 'Malta', NL: 'Netherlands', PL: 'Poland',
  PT: 'Portugal', RO: 'Romania', SK: 'Slovakia', SI: 'Slovenia', ES: 'Spain', SE: 'Sweden',
};

export function countryFromCode(code: string): MemberState {
  const name = COUNTRY_BY_CODE[code.trim().toUpperCase()];
  if (!name) throw new Error(`Unknown member state code: "${code}"`);
  return name;
}

/** The 24 official EU languages, by endonym, in the order the EU lists them. */
export const OFFICIAL_LANGUAGES = [
  { code: 'bg', name: 'Български' }, { code: 'cs', name: 'Čeština' }, { code: 'da', name: 'Dansk' },
  { code: 'de', name: 'Deutsch' }, { code: 'et', name: 'Eesti' }, { code: 'el', name: 'Ελληνικά' },
  { code: 'en', name: 'English' }, { code: 'es', name: 'Español' }, { code: 'fr', name: 'Français' },
  { code: 'ga', name: 'Gaeilge' }, { code: 'hr', name: 'Hrvatski' }, { code: 'it', name: 'Italiano' },
  { code: 'lv', name: 'Latviešu' }, { code: 'lt', name: 'Lietuvių' }, { code: 'hu', name: 'Magyar' },
  { code: 'mt', name: 'Malti' }, { code: 'nl', name: 'Nederlands' }, { code: 'pl', name: 'Polski' },
  { code: 'pt', name: 'Português' }, { code: 'ro', name: 'Română' }, { code: 'sk', name: 'Slovenčina' },
  { code: 'sl', name: 'Slovenščina' }, { code: 'fi', name: 'Suomi' }, { code: 'sv', name: 'Svenska' },
] as const;
