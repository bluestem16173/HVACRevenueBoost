import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AuthorityPageTemplate, AuthoritySchema } from '@/templates/authority-page';
import { getDiagnosticPageFromDB } from '@/lib/diagnostic-engine';
import { strictRobotsForDbPage } from '@/lib/seo/strict-indexing';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { symptom: string } }): Promise<Metadata> {
  const page = await getDiagnosticPageFromDB(params.symptom, 'authority');
  
  if (!page || !page.content_json) {
    return { title: "HVAC Authority Guide" };
  }

  const content = page.content_json as unknown as AuthoritySchema;
  const strict = strictRobotsForDbPage(true, page.updated_at);

  return {
    title: content.seo?.metaTitle || content.hero?.headline || `${content.title} | HVAC Guide`,
    description: content.seo?.metaDescription || content.hero?.subheadline,
    ...(strict ?? {}),
  };
}

export default async function AuthorityPage({ params }: { params: { symptom: string } }) {
  const page = await getDiagnosticPageFromDB(params.symptom, 'authority');

  if (!page || !page.content_json) {
    return <div className="p-20 text-4xl font-mono text-red-500">DATABASE RETURNED NULL FOR: {params.symptom}</div>;
  }

  const content = page.content_json as unknown as AuthoritySchema;

  return <AuthorityPageTemplate content={content} />;
}
