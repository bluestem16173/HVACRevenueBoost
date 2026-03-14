import { SYMPTOMS, CITIES } from "@/data/knowledge-graph";
import { getPrioritySymptomsForCityPages } from "@/lib/clusters";
import { getDiagnosticSteps, getCauseDetails, getSymptomWithCausesFromDB, getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { getInternalLinksForPage } from "@/lib/seo-linking";
import { getContractorsByCity } from "@/lib/db";
import ServicePageTemplate from "@/templates/service-page";
import { notFound } from "next/navigation";

// Enable ISR
export const revalidate = 3600;
export const dynamicParams = true; // allow pages not in generateStaticParams to render via SSR

export async function generateStaticParams() {
  const combinations = [];
  const topCities = CITIES.slice(0, 50);
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
  const city = CITIES.find(c => c.slug === params.city);
  
  let symptomData = await getSymptomWithCausesFromDB(params.slug);
  let isFromDB = !!symptomData;

  // Fetch the AI generated page from Neon
  // The generator script saves slugs exactly like: repair/las-vegas/ac-blowing-warm-air
  const dbSlug = `repair/${params.city}/${params.slug}`;
  const aiPage = await getDiagnosticPageFromDB(dbSlug);
  const htmlContent = aiPage?.content_json?.html_content || null;

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
    />
  );
}
