import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HybridServicePageTemplate, { CityServiceSchema } from '@/templates/hybrid-service-page';
import { getDiagnosticPageFromDB } from '@/lib/diagnostic-engine';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = await getDiagnosticPageFromDB(params.slug, 'hybrid');
  
  if (!page || !page.content_json) {
    return { title: "HVAC Service Guide" };
  }

  const content = page.content_json as unknown as CityServiceSchema;

  return {
    title: content.seo?.metaTitle || content.hero?.headline || `${content.title} | HVAC Expert Service`,
    description: content.seo?.metaDescription || content.hero?.subheadline,
  };
}

export default async function CatchAllHybridPage({ params }: { params: { slug: string } }) {
  // Only attempt to match if the slug is actively in the DB under 'hybrid'
  const page = await getDiagnosticPageFromDB(params.slug, 'hybrid');

  if (!page || !page.content_json) {
    notFound(); 
  }

  const content = page.content_json as unknown as CityServiceSchema;

  return <HybridServicePageTemplate data={content} />;
}
