import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  try {
    const ping = await sql`SELECT 1 as ping`;
    if (!Array.isArray(ping) || !ping[0]) {
      return NextResponse.json({
        ok: false,
        error: "DATABASE_URL not set or invalid (no response from Neon)",
      });
    }
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: e?.message || "Database connection failed",
    });
  }

  const tables: { name: string; count: number }[] = [];
  const tableQueries: Record<string, () => Promise<unknown>> = {
    systems: () => sql`SELECT COUNT(*) as c FROM systems`,
    symptoms: () => sql`SELECT COUNT(*) as c FROM symptoms`,
    causes: () => sql`SELECT COUNT(*) as c FROM causes`,
    repairs: () => sql`SELECT COUNT(*) as c FROM repairs`,
    symptom_causes: () => sql`SELECT COUNT(*) as c FROM symptom_causes`,
    cause_repairs: () => sql`SELECT COUNT(*) as c FROM cause_repairs`,
    pages: () => sql`SELECT COUNT(*) as c FROM pages`,
    page_targets: () => sql`SELECT COUNT(*) as c FROM page_targets`,
    generation_queue: () => sql`SELECT COUNT(*) as c FROM generation_queue`,
    diagnostics: () => sql`SELECT COUNT(*) as c FROM diagnostics`,
    diagnostic_steps: () => sql`SELECT COUNT(*) as c FROM diagnostic_steps`,
    cities: () => sql`SELECT COUNT(*) as c FROM cities`,
    tools: () => sql`SELECT COUNT(*) as c FROM tools`,
    components: () => sql`SELECT COUNT(*) as c FROM components`,
    internal_links: () => sql`SELECT COUNT(*) as c FROM internal_links`,
    related_nodes: () => sql`SELECT COUNT(*) as c FROM related_nodes`,
  };

  try {
    for (const [name, fn] of Object.entries(tableQueries)) {
      try {
        const rows = await fn();
        const count = Array.isArray(rows) && rows[0] ? Number((rows[0] as { c: string | number }).c) : 0;
        tables.push({ name, count });
      } catch {
        tables.push({ name, count: -1 });
      }
    }
    return NextResponse.json({ ok: true, tables });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: e?.message || "Database connection failed",
    });
  }
}
