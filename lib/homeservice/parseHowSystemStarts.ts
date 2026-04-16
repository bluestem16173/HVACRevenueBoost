export type SystemStartupStep = { title: string; detail: string };

export type SymptomMapRow = { cue: string; points_to: string };

export type HowSystemStartsBlock = {
  section_title: string;
  eyebrow?: string;
  authority_line: string;
  startup_sequence: SystemStartupStep[];
  environment_title: string;
  environment_bullets: string[];
  mapping_title: string;
  mapping_rows: SymptomMapRow[];
};

function asTrimmedStrings(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => String(x ?? "").trim()).filter(Boolean);
}

/**
 * Parses `how_system_starts` from HSD city JSON (DecisionGrid-style technical briefing).
 * Returns null if missing or too thin to render well.
 */
export function parseHowSystemStarts(data: Record<string, unknown>): HowSystemStartsBlock | null {
  const raw = data.how_system_starts;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const section_title = String(o.section_title || "").trim();
  if (!section_title) return null;

  const eyebrow = String(o.eyebrow || o.subtitle || "").trim() || undefined;
  const authority_line = String(o.authority_line || "").trim();
  const environment_title = String(o.environment_title || "").trim() || "Local operating stress";
  const mapping_title = String(o.mapping_title || "").trim() || "What this means for your issue";

  const startup_sequence: SystemStartupStep[] = [];
  const seqRaw = o.startup_sequence;
  if (Array.isArray(seqRaw)) {
    for (const item of seqRaw) {
      if (typeof item === "string") {
        const t = item.trim();
        if (!t) continue;
        const colon = t.indexOf(":");
        if (colon > 0) {
          startup_sequence.push({
            title: t.slice(0, colon).trim(),
            detail: t.slice(colon + 1).trim() || t,
          });
        } else {
          startup_sequence.push({ title: "Step", detail: t });
        }
      } else if (item && typeof item === "object") {
        const x = item as Record<string, unknown>;
        const title = String(x.title || x.step || x.name || "").trim();
        const detail = String(x.detail || x.body || x.text || "").trim();
        if (title && detail) startup_sequence.push({ title, detail });
      }
    }
  }

  const environment_bullets = asTrimmedStrings(o.environment_bullets);
  const mapping_rows: SymptomMapRow[] = [];
  const mapRaw = o.symptom_mapping ?? o.mapping_rows;
  if (Array.isArray(mapRaw)) {
    for (const item of mapRaw) {
      if (!item || typeof item !== "object") continue;
      const x = item as Record<string, unknown>;
      const cue =
        String(x.cue || x.if || x.symptom || x.situation || "").trim();
      const points_to =
        String(x.points_to || x.leads_to || x.outcome || "").trim();
      if (cue && points_to) mapping_rows.push({ cue, points_to });
    }
  }

  if (startup_sequence.length < 3) return null;
  if (environment_bullets.length < 2) return null;
  if (mapping_rows.length < 2) return null;
  if (!authority_line) return null;

  return {
    section_title,
    eyebrow,
    authority_line,
    startup_sequence,
    environment_title,
    environment_bullets,
    mapping_title,
    mapping_rows,
  };
}
