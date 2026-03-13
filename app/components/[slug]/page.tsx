import { getComponentData } from "@/lib/diagnostic-engine";
import { getInternalLinksForPage } from "@/lib/seo-linking";
import { getContractorsByCity } from "@/lib/db";
import ComponentPageTemplate from "@/templates/component-page";
import { notFound } from "next/navigation";

// Enable ISR
export const revalidate = 3600;

export async function generateStaticParams() {
  const components = [
    "compressor", "evaporator coil", "condenser", "thermostat", 
    "control board", "blower motor", "refrigerant line", "capacitor", 
    "contactor", "drain line", "filter", "heat exchanger", 
    "inducer motor", "flame sensor", "igniter", "humidifier", 
    "air handler", "ductwork", "reversing valve", "defrost board"
  ];
  return components.map(c => ({ slug: c.replace(/\s+/g, '-') }));
}

export default async function ComponentPage({ params }: { params: { slug: string } }) {
  const componentName = params.slug.replace(/-/g, ' ');
  const componentData = await getComponentData(componentName);

  if (!componentData) {
    notFound();
  }

  const internalLinks = await getInternalLinksForPage(`component-${params.slug}`);
  // Global contractors for component guides if city not provided
  const localContractors = await getContractorsByCity('Phoenix'); 

  return (
    <ComponentPageTemplate 
      component={componentName}
      symptoms={componentData.symptoms}
      repairs={componentData.repairs}
      internalLinks={internalLinks}
      localContractors={localContractors}
    />
  );
}
