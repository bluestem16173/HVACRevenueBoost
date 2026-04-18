import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { symptom: string };
}) {
  const title = params.symptom.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  return {
    title: `${title} | HVAC Troubleshooting & Fixes`,
    description: `Diagnose and fix your ${title.toLowerCase()} HVAC issue before it becomes an expensive repair. Fast, actionable guides for homeowners.`,
  };
}

export default async function SymptomPage({
  params,
}: {
  params: { symptom: string };
}) {
  redirect(`/hvac/${params.symptom}`);
}
