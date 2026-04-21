export type AdminLeadRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  trade: string | null;
  city_slug: string | null;
  page_city_slug: string | null;
  status: string | null;
  assigned_vendor: string | null;
  created_at: string | null;
  routed_to: "bryan" | "lead_pool";
};
