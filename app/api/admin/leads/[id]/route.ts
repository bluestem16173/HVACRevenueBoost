import { NextResponse } from "next/server";

import sql from "@/lib/db";

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseLeadId(raw: string): { kind: "uuid"; id: string } | { kind: "int"; id: number } | null {
  const s = String(raw ?? "").trim();
  if (UUID_RE.test(s)) return { kind: "uuid", id: s };
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (Number.isSafeInteger(n) && n > 0) return { kind: "int", id: n };
  }
  return null;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) return unauthorized();

  const { id: rawId } = params;
  const parsed = parseLeadId(String(rawId ?? ""));
  if (!parsed) {
    return NextResponse.json({ error: "Invalid lead id" }, { status: 400 });
  }

  let body: { action?: string };
  try {
    body = (await req.json()) as { action?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = String(body.action ?? "").trim();

  if (action === "assign_bryan") {
    try {
      if (parsed.kind === "uuid") {
        await sql`
          UPDATE leads
          SET assigned_vendor = 'bryan'
          WHERE id = ${parsed.id}::uuid
        `;
      } else {
        await sql`
          UPDATE leads
          SET assigned_vendor = 'bryan'
          WHERE id = ${parsed.id}
        `;
      }
      return NextResponse.json({ ok: true });
    } catch (e) {
      console.error("[admin/leads PATCH assign]", e);
      const msg = e instanceof Error ? e.message : "Update failed";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  if (action === "mark_contacted") {
    try {
      if (parsed.kind === "uuid") {
        await sql`
          UPDATE leads
          SET status = 'contacted',
              contacted_at = COALESCE(contacted_at, NOW())
          WHERE id = ${parsed.id}::uuid
        `;
      } else {
        await sql`
          UPDATE leads
          SET status = 'contacted',
              contacted_at = COALESCE(contacted_at, NOW())
          WHERE id = ${parsed.id}
        `;
      }
      return NextResponse.json({ ok: true });
    } catch (e) {
      console.error("[admin/leads PATCH contacted]", e);
      try {
        if (parsed.kind === "uuid") {
          await sql`
            UPDATE leads
            SET status = 'contacted'
            WHERE id = ${parsed.id}::uuid
          `;
        } else {
          await sql`
            UPDATE leads
            SET status = 'contacted'
            WHERE id = ${parsed.id}
          `;
        }
        return NextResponse.json({ ok: true });
      } catch (e2) {
        const msg = e2 instanceof Error ? e2.message : "Update failed";
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
