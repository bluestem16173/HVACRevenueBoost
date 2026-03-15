import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    const cause = await sql`
      SELECT c.slug, c.name, c.description,
        (SELECT r.name FROM repairs r
         JOIN cause_repairs cr ON cr.repair_id = r.id
         WHERE cr.cause_id = c.id LIMIT 1) as repair_name,
        (SELECT r.estimated_cost FROM repairs r
         JOIN cause_repairs cr ON cr.repair_id = r.id
         WHERE cr.cause_id = c.id LIMIT 1) as estimated_cost
      FROM causes c
      WHERE c.slug = ${slug}
      LIMIT 1
    `;

    if (!(cause as any[]).length) {
      return NextResponse.json({ slug, name: slug.replace(/-/g, " ") });
    }

    return NextResponse.json((cause as any[])[0]);
  } catch (e) {
    console.error("[cause-by-slug]", e);
    return NextResponse.json({ slug, name: slug.replace(/-/g, " ") });
  }
}
