-- Allow `problem_pillar` on `public.pages` (national trade/symptom pillars, HSD v2 JSON).
-- Recreate `page_type_check` with the prior allow-list plus `problem_pillar`.

ALTER TABLE public.pages DROP CONSTRAINT IF EXISTS page_type_check;

ALTER TABLE public.pages ADD CONSTRAINT page_type_check CHECK (
  page_type IN (
    'symptom',
    'diagnose',
    'diagnostic',
    'cause',
    'repair',
    'system',
    'component',
    'context',
    'city',
    'city_symptom',
    'hsd',
    'national_symptom',
    'problem_pillar',
    'guide',
    'landing',
    'location_hub',
    'condition',
    'hvac_html',
    'hvac_authority_v3',
    'dg_authority_v2',
    'dg_authority_v3',
    'comparison',
    'service',
    'faq_cluster'
  )
);
