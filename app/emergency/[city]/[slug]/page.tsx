import EmergencyPageTemplate, { EmergencySchema } from "@/templates/emergency-page";
import { getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { FLORIDA_CITIES } from "@/lib/locations";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { city: string, slug: string } }): Promise<Metadata> {
  const page = await getDiagnosticPageFromDB(params.slug, 'emergency', params.city);
  
  if (!page || !page.content_json) {
    return { title: `Emergency HVAC Service in ${params.city} | HVAC Revenue Boost` };
  }

  const data = page.content_json as EmergencySchema;
  
  return {
    title: `24/7 HVAC Emergency in ${data.city || params.city} | Fix It Today`,
    description: data.urgency?.message || `Same-day emergency HVAC repair in ${data.city || params.city}. We diagnose and fix it fast.`,
    robots: page.quality_status === 'noindex' ? { index: false, follow: true } : { index: true, follow: true }
  };
}

export async function generateStaticParams() {
  const combinations = [];
  const topCities = FLORIDA_CITIES.slice(0, 5); // Limit SSG footprint
  const topEmergencies = ['ac-not-working', 'heater-blowing-cold', 'water-leaking-from-ac'];

  for (const city of topCities) {
    for (const emergency of topEmergencies) {
      combinations.push({
        city: city.slug,
        slug: emergency,
      });
    }
  }
  return combinations;
}

export default async function EmergencyRoute({ params }: { params: { city: string, slug: string } }) {
  const cityObj = FLORIDA_CITIES.find(c => c.slug === params.city);
  if (!cityObj) notFound();

  // Primary Fetch
  const aiPage = await getDiagnosticPageFromDB(params.slug, 'emergency', params.city);

  if (aiPage?.quality_status === "needs_regen") {
    notFound();
  }

  // Graceful deterministic fallback layer if DB is not hydrated yet for this specific city + slug
  const data: EmergencySchema = (aiPage?.content_json as unknown as EmergencySchema) || {
    pageType: "emergency",
    city: cityObj.name,
    service: params.slug.replace(/-/g, ' '),
    hero: {
      headline: `${params.slug.replace(/-/g, ' ')}? We Fix It Today`,
      subheadline: `Same-day HVAC emergency service in {{city}}`
    },
    urgency: {
      message: "Don’t wait—this can get worse fast."
    },
    problem: "A broken HVAC system is an active emergency. Extreme temperatures damage property and threaten safety.",
    trust: {
      badges: ["24/7 Service", "Licensed & Insured"],
      guarantee: "Available Right Now"
    },
    localProof: {
      city: cityObj.name,
      reviews: []
    },
    cta: {
      primary: "Call Now",
      secondary: "Book Service"
    }
  };

  return <EmergencyPageTemplate data={data} />;
}
