/**
 * Maps `data-lead-trade` (and legacy aliases) to a vertical for lead UX + prefill tags.
 * Electrical surfaces as **electrician** in copy and `[ELECTRICIAN]` in the service line.
 */
export type LeadTradeVertical = "hvac" | "plumbing" | "electrical";

const ALIASES: Record<string, LeadTradeVertical> = {
  hvac: "hvac",
  plumbing: "plumbing",
  plumber: "plumbing",
  electrical: "electrical",
  electrician: "electrical",
  electric: "electrical",
};

export function normalizeLeadTradeFromAttr(raw: string | null | undefined): LeadTradeVertical {
  const k = (raw ?? "").trim().toLowerCase();
  if (!k) return "hvac";
  return ALIASES[k] ?? "hvac";
}

export type LeadTradeCopy = {
  modalTitle: string;
  modalSubtitle: string;
  trustBullets: string[];
  successTitle: string;
  successBody: string;
  submitLabel: string;
  footerNote: string;
  /** Uppercase bracket tag for the service textarea prefill, e.g. HVAC → [HVAC] */
  serviceBracketTag: string;
};

const COPY: Record<LeadTradeVertical, LeadTradeCopy> = {
  hvac: {
    modalTitle: "Get HVAC Help Today",
    modalSubtitle: "Licensed technicians. Fast response times.",
    trustBullets: [
      "Licensed & insured HVAC technicians",
      "Same-day service available in most areas",
      "Upfront pricing — no surprises",
    ],
    successTitle: "Request Received!",
    successBody: "A licensed HVAC technician will contact you shortly to discuss your system.",
    submitLabel: "Request HVAC Service",
    footerNote: "We respect your privacy. Your information is never sold.",
    serviceBracketTag: "HVAC",
  },
  plumbing: {
    modalTitle: "Get Plumbing Help Today",
    modalSubtitle: "Licensed plumbers. Fast response times.",
    trustBullets: [
      "Licensed & insured plumbing professionals",
      "Same-day service available in most areas",
      "Upfront pricing — no surprises",
    ],
    successTitle: "Request Received!",
    successBody: "A licensed plumber will contact you shortly to discuss your issue.",
    submitLabel: "Request Plumbing Service",
    footerNote: "We respect your privacy. Your information is never sold.",
    serviceBracketTag: "PLUMBING",
  },
  electrical: {
    modalTitle: "Get an Electrician Today",
    modalSubtitle: "Licensed electricians. Fast response times.",
    trustBullets: [
      "Licensed & insured electricians",
      "Same-day service available in most areas",
      "Upfront pricing — no surprises",
    ],
    successTitle: "Request Received!",
    successBody: "A licensed electrician will contact you shortly to discuss your job.",
    submitLabel: "Request Electrician",
    footerNote: "We respect your privacy. Your information is never sold.",
    serviceBracketTag: "ELECTRICIAN",
  },
};

export function getLeadTradeCopy(trade: LeadTradeVertical): LeadTradeCopy {
  return COPY[trade];
}
