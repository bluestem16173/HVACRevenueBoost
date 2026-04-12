import { Metadata } from 'next';
import type { ComponentType } from 'react';
import { notFound } from 'next/navigation';
import HybridServicePageTemplate, { CityServiceSchema } from '@/templates/hybrid-service-page';
import { getDiagnosticPageFromDB } from '@/lib/diagnostic-engine';

import DiagnoseIndex from '../diagnose/page';
import RepairHubPage from '../repair/page';
import ResidentialHub from '../hvac/page';
import OrchestratorDashboard from '../orchestrator/page';
import CommercialHub from '../commercial-hvac/page';
import TestDbPage from '../test-db/page';
import TestGeneratePage from '../test-generate/page';

/**
 * `app/[symptom]` is a single-segment catch-all for hybrid DB pages.
 * If routing ever resolves `/diagnose`, `/repair`, etc. here instead of the
 * static sibling routes, we delegate to the real page — otherwise hybrid
 * lookup fails and `notFound()` returns HTTP 404.
 */
const STATIC_TOP_LEVEL_FALLBACK: Record<string, ComponentType> = {
  diagnose: DiagnoseIndex,
  repair: RepairHubPage,
  hvac: ResidentialHub,
  orchestrator: OrchestratorDashboard,
  'commercial-hvac': CommercialHub,
  'test-db': TestDbPage,
  'test-generate': TestGeneratePage,
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { symptom: string } }): Promise<Metadata> {
  if (STATIC_TOP_LEVEL_FALLBACK[params.symptom]) {
    return {};
  }

  const page = await getDiagnosticPageFromDB(params.symptom, 'hybrid');
  
  if (!page || !page.content_json) {
    return { title: "HVAC Service Guide" };
  }

  const content = page.content_json as unknown as CityServiceSchema;

  return {
    title: content.seo?.metaTitle || content.hero?.headline || `${content.title} | HVAC Expert Service`,
    description: content.seo?.metaDescription || content.hero?.subheadline,
  };
}

export default async function CatchAllHybridPage({ params }: { params: { symptom: string } }) {
  const StaticPage = STATIC_TOP_LEVEL_FALLBACK[params.symptom];
  if (StaticPage) {
    return <StaticPage />;
  }

  // Only attempt to match if the slug is actively in the DB under 'hybrid'
  const page = await getDiagnosticPageFromDB(params.symptom, 'hybrid');

  if (page) {
    // BYPASS REACT: Residential authority and city pages are strictly rendered by Fastify using EJS.
    // We intentionally 404 here on the Next.js side so the route drops through to the Fastify server.
    notFound(); 
  }

  // Fallback
  notFound();
}
