import { NextResponse } from "next/server";

import type { AdminLeadRow } from "@/lib/admin-leads-types";
import sql from "@/lib/db";
import { routedToForCitySlugs } from "@/lib/lead-routing";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAdmin(req: Request) {
  const auth = req.headers.get("authorization");
  const token = process.env.ADMIN_TOKEN;
  if (!token || !auth || auth !== `Bearer ${token}`) return false;
  return true;
}

export async function GET(req: Request) {
  if (!isAdmin(req)) return unauthorized();

  try {
    const rows = (await sql`
      SELECT
        id::text AS id,
        first_name,
        last_name,
        phone,
        system_type AS trade,
        city_slug,
        page_city_slug,
        status,
        assigned_vendor,
        created_at::text AS created_at
      FROM leads
      ORDER BY created_at DESC NULLS LAST
      LIMIT 200
    `) as Record<string, unknown>[];

    const leads: AdminLeadRow[] = rows.map((r) => ({
      id: String(r.id ?? ""),
      first_name: r.first_name != null ? String(r.first_name) : null,
      last_name: r.last_name != null ? String(r.last_name) : null,
      phone: r.phone != null ? String(r.phone) : null,
      trade: r.trade != null ? String(r.trade) : null,
      city_slug: r.city_slug != null ? String(r.city_slug) : null,
      page_city_slug: r.page_city_slug != null ? String(r.page_city_slug) : null,
      status: r.status != null ? String(r.status) : null,
      assigned_vendor: r.assigned_vendor != null ? String(r.assigned_vendor) : null,
      created_at: r.created_at != null ? String(r.created_at) : null,
      routed_to: routedToForCitySlugs({
        page_city_slug: r.page_city_slug != null ? String(r.page_city_slug) : null,
        city_slug: r.city_slug != null ? String(r.city_slug) : null,
      }),
    }));

    return NextResponse.json({ leads });
  } catch (e) {
    console.error("[admin/leads GET]", e);
    const msg = e instanceof Error ? e.message : "Query failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
