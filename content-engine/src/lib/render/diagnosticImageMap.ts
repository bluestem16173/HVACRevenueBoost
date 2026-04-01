export function getDiagnosticImageMap(slug: string) {
  const base = `/public/images/diagnostics/${slug}/${slug}`;
  return {
    hero: `${base}-hero-ice.jpg`,
    filter: `${base}-cause-dirty-filter.jpg`,
    airflow: `${base}-airflow-blocked-vs-proper.jpg`,
    fix: `${base}-fix-coil-cleaning.jpg`,
    technician: `${base}-technician-repair.jpg`,
  };
}
