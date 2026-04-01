import sql from "@/lib/db";

/** Seed one draft job — extend with priority, campaign id, etc. */
export async function enqueueDraftJob(input: {
  proposed_slug: string;
  proposed_title?: string;
  page_type?: string;
  city?: string;
}) {
  await sql`
    INSERT INTO generation_queue (proposed_slug, proposed_title, page_type, status, city)
    VALUES (
      ${input.proposed_slug},
      ${input.proposed_title ?? input.proposed_slug},
      ${input.page_type ?? "symptom"},
      'draft',
      ${input.city ?? null}
    )
  `;
}
