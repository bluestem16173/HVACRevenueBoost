/**
 * Universal generation kill switch.
 * Set GENERATION_ENABLED=false in env to block all LLM / queue generation paths.
 */
import sql from "@/lib/db";
import { NextResponse } from "next/server";

/** True = stop: log once and abort caller. */
export function generationGloballyDisabled(): boolean {
  if (process.env.GENERATION_ENABLED !== "true") {
    console.log("🚫 Generation globally disabled");
    return true;
  }
  return false;
}

/** Use at the top of API route handlers when generationGloballyDisabled(). */
export function generationDisabledResponse() {
  return NextResponse.json(
    { error: "Generation disabled", code: "GENERATION_DISABLED" },
    { status: 403 }
  );
}

export async function assertAutoModeEnabled(options: {
  bypassAutoMode?: boolean;
} = {}): Promise<void> {
  if (options.bypassAutoMode) return;
  if (process.env.GENERATION_BYPASS_AUTO_MODE === "true") return;

  const rows = (await sql`
    SELECT value FROM system_state WHERE key = 'auto_mode' LIMIT 1
  `) as { value: string }[];

  if (rows[0]?.value === "OFF") {
    throw new Error("Auto mode disabled — blocking generation");
  }
}
