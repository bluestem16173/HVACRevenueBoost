import { SYMPTOMS } from "@/data/knowledge-graph";
import { FLORIDA_CITIES } from "@/lib/locations";
import { getPrioritySymptomsForCityPages } from "@/lib/clusters";
import { getDiagnosticSteps, getCauseDetails, getSymptomWithCausesFromDB, getDiagnosticPageFromDB } from "@/lib/diagnostic-engine";
import { getInternalLinksForPage } from "@/lib/seo-linking";
import { getContractorsByCity } from "@/lib/db";
import ServicePageTemplate from "@/templates/service-page";
import { notFound, permanentRedirect } from "next/navigation";
import { Metadata } from "next";
import { strictRobotsForDbPage } from "@/lib/seo/strict-indexing";

// Enable ISR
export const revalidate = 3600;
export const dynamicParams = true; // allow pages not in generateStaticParams to render via SSR

// HELPER: Validate slug against known entities to avoid junk URLs indexing
const isValidSymptom = (slug: string) => {
  return SYMPTOMS.some(s => s.id === slug);
};

export async function generateMetadata({ params }: { params: { city: string, symptom: string } }): Promise<Metadata> {
  // STATE 3: Invalid -> Will redirect, so metadata doesn't matter
  if (!isValidSymptom(params.symptom) || !FLORIDA_CITIES.find(c => c.slug === params.city)) {
    return {};
  }

  const aiPage = await getDiagnosticPageFromDB(params.symptom, 'repair', params.city);
  const isThin = !aiPage || !aiPage.content_json || aiPage.quality_status === "needs_regen" || aiPage.quality_status === 'noindex';

  const generatedSeo = aiPage?.content_json?.seo;

  // STATE 1 & 2: Canonical Strategy
  // If Thin (STATE 2): Roll up authority to parent symptom hub.
  // If Full (STATE 1): Self-canonical.
  const baseRobots = { index: !isThin, follow: true as const };
  const strict = strictRobotsForDbPage(!isThin, aiPage?.updated_at);

  return {
    title: generatedSeo?.title,
    description: generatedSeo?.meta_description,
    alternates: {
      canonical: isThin
        ? `https://www.hvacrevenueboost.com/repair/${params.symptom}`
        : `https://www.hvacrevenueboost.com/repair/${params.city}/${params.symptom}`
    },
    robots: strict?.robots ?? baseRobots,
  };
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
  params: { city: string, symptom: string } 
}) {
  const city = FLORIDA_CITIES.find(c => c.slug === params.city);
  
  let symptomData = await getSymptomWithCausesFromDB(params.symptom);
  let isFromDB = !!symptomData;

  const aiPage = await getDiagnosticPageFromDB(params.symptom, 'repair', params.city);
  
  if (aiPage?.quality_status === "needs_regen") {
    notFound();
  }

  const htmlContent = aiPage?.content_json?.html_content || null;
  const qualityScore = aiPage?.quality_score ?? 100;

  if (!symptomData) {
    symptomData = SYMPTOMS.find(s => s.id === params.symptom) as any;
  }
  
  const symptom = symptomData as any;

  // STATE 3: Truly Invalid URL (Garbage slug) -> Consolidate via 301
  if (!city || !isValidSymptom(params.symptom)) {
    permanentRedirect('/repair');
  }

  const causeDetails = isFromDB
    ? (symptom.causes || [])
    : (symptom.causes || []).map((cId: string) => getCauseDetails(cId)).filter(Boolean);
  const causeIds = causeDetails.map((c: any) => c.slug || c.id);
  const diagnosticSteps = getDiagnosticSteps(causeIds);
  const internalLinks = await getInternalLinksForPage(`${params.symptom}-repair-${params.city}`);
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
    <>
      <ServicePageTemplate
        city={city}
        symptom={symptom}
        causeDetails={causeDetails}
        diagnosticSteps={diagnosticSteps}
        internalLinks={internalLinks}
        localContractors={localContractors}
        htmlContent={htmlContent}
        symptomSlug={params.symptom}
        qualityScore={qualityScore}
        scalingData={scalingData}
        rawContent={rawContent}
      />
      
      {raw?.cta && (
         <div className="container mx-auto px-4 max-w-5xl mt-8">
           <div className="bg-blue-600 text-white rounded-xl p-8 text-center shadow-lg border border-blue-500">
             <h3 className="text-xl md:text-2xl font-bold mb-6 font-display">{raw.cta}</h3>
             <a href="tel:1-800-HVAC" className="inline-block bg-white text-blue-700 font-bold px-8 py-4 rounded-full hover:scale-105 transition-transform shadow-md">Get Local HVAC Quotes</a>
           </div>
         </div>
      )}

      {raw?.internal_links && raw.internal_links.length > 0 && (
         <div className="container mx-auto px-4 max-w-5xl mt-8 pb-16">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Related Diagnostic Guides</h3>
            <div className="flex flex-wrap gap-2">
              {raw.internal_links.map((link: string) => (
                <a key={link} href={`/repair/${link}`} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium px-4 py-2 rounded-lg text-sm transition-colors border border-slate-200 dark:border-slate-700 capitalize">
                  {link.replace(/-/g, ' ')}
                </a>
              ))}
            </div>
         </div>
      )}
    </>
  );
}
