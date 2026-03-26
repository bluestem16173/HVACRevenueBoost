import { redirect } from "next/navigation";

export const revalidate = 3600;

/** /cause/xxx → /causes/xxx (canonical route) */
export default async function CauseRedirectPage({ params }: { params: { symptom: string } }) {
  redirect(`/causes/${params.symptom}`);
}
