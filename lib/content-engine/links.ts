import sql from '../db';

export type PageNode = {
  slug: string;
  page_type: 'diagnose' | 'cause' | 'repair';
};

export type LinkGroups = {
  diagnose: string[];
  relatedCauses: string[];
  repairs: string[];
};

const CLUSTERS: Record<string, string[]> = {
  cooling: ['refrigerant', 'evaporator', 'condenser', 'cooling', 'compressor', 'ac', 'freon', 'coil', 'txv'],
  airflow: ['airflow', 'duct', 'blower', 'filter', 'static-pressure', 'vent', 'wheel'],
  electrical: ['capacitor', 'relay', 'voltage', 'breaker', 'contactor', 'board', 'sensor', 'switch', 'fuse', 'thermostat', 'short'],
  heating: ['furnace', 'gas', 'ignition', 'flame', 'heat-exchanger', 'limit-switch', 'pilot', 'heating', 'heat-pump', 'defrost'],
  moisture: ['drain', 'humidity', 'condensate', 'water', 'leak', 'drip', 'pan']
};

function detectCluster(slug: string): string {
  for (const [cluster, keywords] of Object.entries(CLUSTERS)) {
    if (keywords.some(k => slug.toLowerCase().includes(k))) {
      return cluster;
    }
  }
  return 'general';
}

function pickDeterministic(arr: string[], count: number, seedStr: string): string[] {
  if (arr.length <= count) return arr;
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed += seedStr.charCodeAt(i);
  }
  return [...arr].sort((a, b) => {
    const aVal = (a.charCodeAt(0) + seed) % 3;
    const bVal = (b.charCodeAt(0) + seed) % 3;
    if (aVal === bVal) return a.length - b.length;
    return aVal - bVal;
  }).slice(0, count);
}

export async function getAllPages(): Promise<PageNode[]> {
  try {
    const rows = await sql`SELECT slug, page_type FROM pages WHERE status = 'published'`;
    return rows.map(r => ({ slug: r.slug, page_type: r.page_type as any }));
  } catch (err) {
    console.error("Error fetching pages for internal links:", err);
    return [];
  }
}

export function generateInternalLinks(
  currentSlug: string,
  pages: PageNode[]
): LinkGroups {
  const cluster = detectCluster(currentSlug);

  const sameCluster = pages.filter(p =>
    p.slug !== currentSlug &&
    (cluster === 'general' || CLUSTERS[cluster]?.some(k => p.slug.toLowerCase().includes(k)))
  );

  const sourcePool = sameCluster.length >= 6 ? sameCluster : pages.filter(p => p.slug !== currentSlug);

  const diagnose = sourcePool.filter(p => p.page_type === 'diagnose').map(p => p.slug);
  const causes = sourcePool.filter(p => p.page_type === 'cause').map(p => p.slug);
  const repairs = sourcePool.filter(p => p.page_type === 'repair').map(p => p.slug);

  return {
    diagnose: pickDeterministic(diagnose, 4, currentSlug),
    relatedCauses: pickDeterministic(causes, 4, currentSlug),
    repairs: pickDeterministic(repairs, 3, currentSlug)
  };
}
