import { NextResponse } from "next/server";
import { getCluster } from "@/lib/clusters";
import { getConditionsForSymptom } from "@/lib/conditions";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://hvacrevenueboost.com";

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(url: string, lastmod: Date, changefreq: string, priority: number) {
  return `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${lastmod.toISOString().split("T")[0]}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export async function GET(
  _request: Request,
  { params }: { params: { symptom: string } }
) {
  const cluster = getCluster(params.symptom);
  if (!cluster) {
    return new NextResponse("Cluster not found", { status: 404 });
  }

  const symptoms = cluster.symptomIds
    .map((id) => ({ id, name: id }))
    .filter(Boolean);

  const entries: string[] = [];

  // Cluster page
  entries.push(
    urlEntry(
      `${BASE_URL}/cluster/${cluster.slug}`,
      new Date(),
      "weekly",
      0.95
    )
  );

  // Symptom pages
  for (const s of symptoms) {
    entries.push(
      urlEntry(
        `${BASE_URL}/diagnose/${s.id}`,
        new Date(),
        "weekly",
        0.9
      )
    );
  }

  // Condition pages for each symptom
  for (const s of symptoms) {
    const conditions = getConditionsForSymptom(s.id);
    for (const c of conditions) {
      entries.push(
        urlEntry(
          `${BASE_URL}/conditions/${c.slug}`,
          new Date(),
          "weekly",
          0.85
        )
      );
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
