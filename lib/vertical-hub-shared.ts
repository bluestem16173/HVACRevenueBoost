/** Florida metros used on HVAC / plumbing / electrical hub “light location” rows. */
export const FL_EXAMPLE_CITIES: { label: string; slug: string }[] = [
  { label: "Tampa", slug: "tampa-fl" },
  { label: "Orlando", slug: "orlando-fl" },
  { label: "Fort Myers", slug: "fort-myers-fl" },
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: "1",
    title: "Identify the issue",
    body: "Pick the symptom cluster that matches what you are seeing at home.",
  },
  {
    step: "2",
    title: "Diagnose the cause",
    body: "Follow structured checks so you are not guessing at expensive parts.",
  },
  {
    step: "3",
    title: "Fix it or get help",
    body: "Decide what is safe to DIY, then connect with a pro when you are ready.",
  },
] as const;
