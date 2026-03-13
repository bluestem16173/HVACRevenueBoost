import { SYMPTOMS } from "@/data/knowledge-graph";
import { getDiagnosticSteps, getCauseDetails, getSymptomWithCausesFromDB } from "@/lib/diagnostic-engine";
import { getRelatedContent, getInternalLinksForPage } from "@/lib/seo-linking";
import SymptomPageTemplate from "@/templates/symptom-page";
import { notFound } from "next/navigation";

// Enable ISR
export const revalidate = 3600;

export async function generateStaticParams() {
  return SYMPTOMS.map((s) => ({
    slug: s.id,
  }));
}

export default async function SymptomPage({ params }: { params: { slug: string } }) {
  let symptomData = await getSymptomWithCausesFromDB(params.slug);
  let isFromDB = !!symptomData;

  if (!symptomData) {
    symptomData = SYMPTOMS.find((s) => s.id === params.slug) as any;
  }

  const symptom = symptomData as any;

  if (!symptom) {
    notFound();
  }

  const causeIds = isFromDB 
    ? (symptom.causes?.map((c: any) => c.id) || [])
    : (symptom.causes || []);
    
  const diagnosticSteps = getDiagnosticSteps(causeIds);
  const relatedContent = getRelatedContent(symptomData);
  const internalLinks = await getInternalLinksForPage(params.slug);

  return (
    <SymptomPageTemplate 
      symptom={symptom}
      causeIds={causeIds}
      diagnosticSteps={diagnosticSteps}
      relatedContent={relatedContent}
      internalLinks={internalLinks}
      getCauseDetails={getCauseDetails}
    />
  );
}
