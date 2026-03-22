import { SYMPTOMS } from "@/data/knowledge-graph";
import { FLORIDA_CITIES } from "@/lib/locations";
import { getPrioritySymptomsForCityPages } from "@/lib/clusters";
import { getDiagnosticSteps, getCauseDetails, getSymptomWithCausesFromDB, getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { getInternalLinksForPage } from "@/lib/seo-linking";
import { getContractorsByCity } from "@/lib/db";
import ServicePageTemplate from "@/templates/service-page";
import { notFound } from "next/navigation";
import { Metadata } from "next";

// Enable ISR
export const revalidate = 3600;
export const dynamicParams = true; // allow pages not in generateStaticParams to render via SSR

export async function generateMetadata({ params }: { params: { city: string, slug: string } }): Promise<Metadata> {
  const fullSlug = `repairs/${params.city}/${params.slug}`;
  const aiPage = await getDiagnosticPageFromDB(fullSlug);
  if (aiPage?.quality_status === 'noindex') {
    return { robots: { index: false, follow: true } };
  }
  return {};
}

export async function generateStaticParams() {
  const combinations = [];
  const topCities = FLORIDA_CITIES;
  // Prioritize symptoms from ac-not-cooling, ac-not-turning-on, outside-unit-not-running (highest service call clusters)
  const priorityIds = getPrioritySymptomsForCityPages();
  const prioritySymptoms = priorityIds
    .map((id) => SYMPTOMS.find((s) => s.id === id))
    .filter((s): s is (typeof SYMPTOMS)[number] => !!s);
  const restSymptoms = SYMPTOMS.filter((s) => !priorityIds.includes(s.id)).slice(0, 10 - prioritySymptoms.length);
  const topSymptoms = [...prioritySymptoms, ...restSymptoms].slice(0, 10);

  for (const city of topCities) {
    for (const symptom of topSymptoms) {
      combinations.push({
        city: city.slug,
        slug: symptom.id,
      });
    }
  }
  return combinations;
}

export default async function CitySymptomPage({ 
  params 
}: { 
  params: { city: string, slug: string } 
}) {
  const city = FLORIDA_CITIES.find(c => c.slug === params.city);
  
  let symptomData = await getSymptomWithCausesFromDB(params.slug);
  let isFromDB = !!symptomData;

  // Fetch the AI generated page from Neon (Unified slug: diagnose/symptom)
  const fullSlug = `diagnose/${params.slug}`;
  const aiPage = await getDiagnosticPageFromDB(fullSlug);
  
  if (aiPage?.quality_status === "needs_regen") {
    notFound();
  }

  const htmlContent = aiPage?.content_json?.html_content || null;
  const qualityScore = aiPage?.quality_score ?? 100;

  if (!symptomData) {
    symptomData = SYMPTOMS.find(s => s.id === params.slug) as any;
  }
  
  const symptom = symptomData as any;

  if (!city || !symptomData) {
    // We shouldn't 404 here during build time since generateStaticParams provides the base arrays,
    // but we should fail gracefully if something is fundamentally missing.
    notFound();
  }

  const causeDetails = isFromDB
    ? (symptom.causes || [])
    : (symptom.causes || []).map((cId: string) => getCauseDetails(cId)).filter(Boolean);
  const causeIds = causeDetails.map((c: any) => c.slug || c.id);
  const diagnosticSteps = getDiagnosticSteps(causeIds);
  const internalLinks = await getInternalLinksForPage(`${params.slug}-repair-${params.city}`);
  const localContractors = await getContractorsByCity(params.city);

  const rawContent = aiPage?.content_json ?? null;
  const raw = rawContent as any;

  const scalingData = {
    primaryCTA: raw?.cta ? {
      headline: raw.cta.primaryText || raw.cta.headline || "Need Professional Help?",
      subtext: raw.cta.secondaryText || raw.cta.subtext || "Our certified technicians can diagnose and fix this guaranteed.",
      buttonText: "Local Techs Coming Soon",
      url: "#"
    } : (raw?.primaryCTA ?? null),
    subtitle: raw?.subtitle ?? raw?.hero?.subheadline ?? null,
    diagnosticFlow: raw?.diagnosticFlow ?? raw?.diagnostic_flow ?? null,
  };

  return (
    <ServicePageTemplate
      city={city}
      symptom={symptom}
      causeDetails={causeDetails}
      diagnosticSteps={diagnosticSteps}
      internalLinks={internalLinks}
      localContractors={localContractors}
      htmlContent={htmlContent}
      symptomSlug={params.slug}
      qualityScore={qualityScore}
      scalingData={scalingData}
      rawContent={rawContent}
    />
  );
}
