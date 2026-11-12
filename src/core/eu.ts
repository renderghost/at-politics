/** Reference data about the EU. Framework-agnostic. */

export const MEMBER_STATES = [
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Denmark', 'Estonia', 'Finland',
  'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg',
  'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden',
] as const;
export type MemberState = (typeof MEMBER_STATES)[number];

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
