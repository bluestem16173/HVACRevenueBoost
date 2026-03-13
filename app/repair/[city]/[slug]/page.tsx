import { SYMPTOMS, CITIES } from "@/data/knowledge-graph";
import { getDiagnosticSteps, getCauseDetails, getSymptomWithCausesFromDB, getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { getInternalLinksForPage } from "@/lib/seo-linking";
import { getContractorsByCity } from "@/lib/db";
import ServicePageTemplate from "@/templates/service-page";
import { notFound } from "next/navigation";

// Enable ISR
export const revalidate = 3600;

export async function generateStaticParams() {
  const combinations = [];
  const topCities = CITIES.slice(0, 50);
  const topSymptoms = SYMPTOMS.slice(0, 10);

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
  const dbSlug = `repair/${params.city}/${params.slug}`;
  const aiPage = await getDiagnosticPageFromDB(dbSlug);
  const htmlContent = aiPage?.content_json?.html_content || null;

  if (!symptomData) {
    symptomData = SYMPTOMS.find(s => s.id === params.slug) as any;
  }
  
  const symptom = symptomData as any;

  if (!city || !symptomData) {
    notFound();
  }

  const causeIds = isFromDB 
    ? (symptom.causes?.map((c: any) => c.id) || [])
    : (symptom.causes || []);
    
  const diagnosticSteps = getDiagnosticSteps(causeIds);
  const internalLinks = await getInternalLinksForPage(`${params.slug}-repair-${params.city}`);
  const localContractors = await getContractorsByCity(params.city);

  return (
    <ServicePageTemplate 
      city={city}
      symptom={symptom}
      causeIds={causeIds}
      diagnosticSteps={diagnosticSteps}
      internalLinks={internalLinks}
      localContractors={localContractors}
      getCauseDetails={getCauseDetails}
      htmlContent={htmlContent}
    />
  );
}
