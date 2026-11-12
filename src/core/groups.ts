/** European Parliament political groups (10th term). Framework-agnostic. */

/** `code` is the EP open data API's `api:political-group` value; `short` is the English abbreviation we show. */
export const GROUPS = [
  { code: 'PPE', short: 'EPP', label: "Group of the European People's Party (Christian Democrats)" },
  { code: 'S&D', short: 'S&D', label: 'Group of the Progressive Alliance of Socialists and Democrats in the European Parliament' },
  { code: 'PfE', short: 'PfE', label: 'Patriots for Europe Group' },
  { code: 'ECR', short: 'ECR', label: 'European Conservatives and Reformists Group' },
  { code: 'Renew', short: 'Renew', label: 'Renew Europe Group' },
  { code: 'Verts/ALE', short: 'Greens/EFA', label: 'Group of the Greens/European Free Alliance' },
  { code: 'The Left', short: 'The Left', label: 'The Left group in the European Parliament - GUE/NGL' },
  { code: 'ESN', short: 'ESN', label: 'Europe of Sovereign Nations Group' },
  { code: 'NI', short: 'NI', label: 'Non-attached Members' },
] as const;

export type GroupShort = (typeof GROUPS)[number]['short'];
export const GROUP_SHORTS = GROUPS.map((g) => g.short) as unknown as readonly [GroupShort, ...GroupShort[]];

const BY_CODE = new Map<string, GroupShort>(GROUPS.map((g) => [g.code, g.short]));
const LABEL = new Map<GroupShort, string>(GROUPS.map((g) => [g.short, g.label]));

/** Map the API's group code to our short name. Throws on an unknown code so a new group is noticed. */
export function groupFromCode(code: string): GroupShort {
  const short = BY_CODE.get(code.trim());
  if (!short) throw new Error(`Unknown political group code: "${code}"`);
  return short;
}

export const groupLabel = (short: GroupShort): string => LABEL.get(short)!;
