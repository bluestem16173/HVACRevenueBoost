# Cluster Sitemaps for Google Search Console

Cluster-specific sitemaps let you submit each problem category separately to GSC for better indexing control.

## Sitemap Index (submit this to include all)

```
https://hvacrevenueboost.com/sitemap-index.xml
```

This index lists the main sitemap + all 16 cluster sitemaps.

## Individual Cluster Sitemaps

Submit any of these directly to GSC under **Sitemaps** → **Add a new sitemap**:

| Cluster | Sitemap URL |
|---------|-------------|
| AC Not Cooling | `https://hvacrevenueboost.com/sitemap/cluster/ac-not-cooling` |
| Weak Airflow | `https://hvacrevenueboost.com/sitemap/cluster/weak-airflow` |
| AC Freezing Up | `https://hvacrevenueboost.com/sitemap/cluster/ac-freezing-up` |
| AC Not Turning On | `https://hvacrevenueboost.com/sitemap/cluster/ac-not-turning-on` |
| Outside Unit Not Running | `https://hvacrevenueboost.com/sitemap/cluster/outside-unit-not-running` |
| AC Short Cycling | `https://hvacrevenueboost.com/sitemap/cluster/ac-short-cycling` |
| Thermostat Problems | `https://hvacrevenueboost.com/sitemap/cluster/thermostat-problems` |
| AC Making Noise | `https://hvacrevenueboost.com/sitemap/cluster/ac-making-noise` |
| AC Tripping Breaker | `https://hvacrevenueboost.com/sitemap/cluster/ac-tripping-breaker` |
| Refrigerant Problems | `https://hvacrevenueboost.com/sitemap/cluster/refrigerant-problems` |
| Capacitor Problems | `https://hvacrevenueboost.com/sitemap/cluster/capacitor-problems` |
| Blower Motor Problems | `https://hvacrevenueboost.com/sitemap/cluster/blower-motor-problems` |
| Ductwork Problems | `https://hvacrevenueboost.com/sitemap/cluster/ductwork-problems` |
| AC Running Constantly | `https://hvacrevenueboost.com/sitemap/cluster/ac-running-constantly` |
| AC Water Leaks | `https://hvacrevenueboost.com/sitemap/cluster/ac-water-leaks` |
| Furnace Not Heating | `https://hvacrevenueboost.com/sitemap/cluster/furnace-not-heating` |

## What Each Cluster Sitemap Contains

- Cluster hub page: `/cluster/[slug]`
- Symptom pages: `/diagnose/[symptom-slug]`
- Condition pages: `/conditions/[condition-slug]`

## API: List All Cluster Sitemaps

```
GET https://hvacrevenueboost.com/sitemap/cluster
```

Returns JSON with all cluster sitemap URLs for programmatic use.
