import { currentOrg, parseCurrentMeps, type CurrentMep, type EpDetail, type OrgLabels } from '../../src/core/ep';
import { fetchJson, mapLimit } from './http';

const API = 'https://data.europarl.europa.eu/api/v2';
const LD = 'format=application%2Fld%2Bjson';

export async function fetchCurrentMeps(): Promise<CurrentMep[]> {
  return parseCurrentMeps(await fetchJson(`${API}/meps/show-current?${LD}&offset=0&limit=1000`));
}

export async function fetchDetails(ids: string[], concurrency = 4): Promise<Map<string, EpDetail>> {
  const details = await mapLimit(ids, concurrency, async (id) => {
    const body = await fetchJson<{ data: EpDetail[] }>(`${API}/meps/${id}?${LD}`);
    const d = body.data?.[0];
    if (!d || d.identifier !== id) throw new Error(`Open data returned no record for MEP ${id}`);
    return d;
  });
  return new Map(details.map((d) => [d.identifier, d]));
}

interface OrgRecord { label?: string; prefLabel?: Record<string, string>; altLabel?: Record<string, string> }
const firstValue = (r?: Record<string, string>) => (r ? Object.values(r)[0] : undefined);

/**
 * Labels for the committees and national parties our MEPs currently belong to.
 * Committees: code "AFET", name altLabel.en "Foreign Affairs". Parties: code "KOK", name prefLabel "Kansallinen Kokoomus".
 */
export async function fetchOrgLabels(details: Iterable<EpDetail>, concurrency = 4): Promise<OrgLabels> {
  const all = [...details];
  const committees = new Set(all.flatMap((d) => currentOrg(d, 'COMMITTEE_PARLIAMENTARY_STANDING')));
  const parties = new Set(all.flatMap((d) => currentOrg(d, 'NATIONAL_POLITICAL_GROUP')));
  const rows = await mapLimit([...committees, ...parties], concurrency, async (org) => {
    const body = await fetchJson<{ data: OrgRecord[] }>(`${API}/corporate-bodies/${org.replace(/^org\//, '')}?${LD}`);
    const d = body.data?.[0];
    const code = d?.label?.trim();
    const name = (committees.has(org)
      ? d?.altLabel?.en ?? d?.prefLabel?.en
      : d?.prefLabel?.en ?? firstValue(d?.prefLabel) ?? d?.altLabel?.en)?.trim() || code;
    if (!code || !name) throw new Error(`No label for organisation ${org}`);
    return [org, { code, name }] as const;
  });
  return new Map(rows);
}
