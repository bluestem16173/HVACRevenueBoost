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

function pickRandom(arr: string[], count: number): string[] {
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, count);
}

export async function getAllPages(): Promise<PageNode[]> {
  try {
    const rows = await sql`SELECT slug FROM pages WHERE status = 'published'`;
    return rows.map(r => {
      let type: 'diagnose' | 'cause' | 'repair' = 'diagnose';
      if (r.slug.startsWith('causes/')) type = 'cause';
      if (r.slug.startsWith('repair/')) type = 'repair';
      return { slug: r.slug, page_type: type };
    });
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
    diagnose: pickRandom(diagnose, 4),
    relatedCauses: pickRandom(causes, 4),
    repairs: pickRandom(repairs, 3)
  };
}
