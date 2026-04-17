import type { DgAuthorityV3PageInput } from "@/lib/dg/typesDgAuthorityV3";

/** Consequence → mechanism → action (no “get a quote” / “call now”). */
const HVAC_CTA_TOP = {
  title: "A $3k compressor bill often starts as a skipped measurement",
  body: "Warm supply with the blower running still leaves airflow, charge, and electrical load on the table—until ΔT, line temps, and amps are read under real load.",
  button: "Request documented HVAC diagnostics",
} as const;

const HVAC_CTA_MID = {
  title: "Misinterpret the failure and you escalate directly into the most expensive repair cost",
  body: "These bands are planning ranges, not quotes. Most repairs land lower—but guessing charge vs electrical vs airflow is how jobs escalate to compressor or full changeout.",
  button: "Have a tech verify before major refrigerant or electrical work",
} as const;

const HVAC_CTA_FINAL = {
  title: "This is where untrained work stops being a savings",
  body: "Refrigerant handling, live 240 VAC troubleshooting, and bypassing safeties without logged readings are the fast path to compressor damage and shock exposure.",
  button: "Book licensed HVAC for leak test and weigh-in scope",
} as const;

const PLUMB_CTA_TOP = {
  title: "Scald and gas errors scale faster than a tank swap quote",
  body: "No hot water spans electric elements, gas ignition, controls, and sediment—each needs different proof before you open valves or break seals.",
  button: "Get a plumber-led diagnosis before replacing the tank",
} as const;

const PLUMB_CTA_MID = {
  title: "Water damage and T&P mistakes follow rushed “flush and hope”",
  body: "Mid-range repairs dominate when the fault is control or element—but tank work without discharge planning floods rooms and scalds occupants.",
  button: "Have a licensed plumber verify gas train or T&P behavior",
} as const;

const PLUMB_CTA_FINAL = {
  title: "Gas pressure and energized wet cabinets are not homeowner tooling",
  body: "Manifold checks, T&P replacement, and element work need code-aware sequencing; wrong order traps gas or energizes standing water paths.",
  button: "Schedule licensed plumbing for tank and gas scope",
} as const;

const ELEC_CTA_TOP = {
  title: "Repeated resets can weld a fault into a fire-class event",
  body: "Thermal trips mean sustained overload or resistance heat; instant trips mean fault current—both need amp logs and de-energized inspection, not a larger breaker.",
  button: "Request a load log and termination inspection",
} as const;

const ELEC_CTA_MID = {
  title: "Upsizing a breaker without a load calc removes your safety margin",
  body: "Most spend stays in breaker or lug work—until someone masks a high-resistance joint with a bigger handle and overheats the homerun.",
  button: "Have an electrician document amps vs curve before changes",
} as const;

const ELEC_CTA_FINAL = {
  title: "Arcing in the panel is not a second-chance classroom",
  body: "MWBC neutrals, aluminum transitions, and main lug heat need listed connectors and de-energized torque—not repeated resets chasing “nuisance” trips.",
  button: "Book licensed electrical for panel and branch evaluation",
} as const;

const HVAC_QUICK = [
  "Supply/return ΔT at steady state: ~16–22°F when airflow is correct; persistently low ΔT with good airflow points past filter-only.",
  "Outdoor: compressor and condenser fan both running; note L1/L2 current vs nameplate under load.",
  "Liquid and suction line temps at service valves versus ambient and indoor wet-bulb load.",
  "Condenser coil face clear of debris matting; oil streaks on fins flag leaks near microchannels.",
] as const;

export const HVAC_AC_NOT_COOLING_TAMPA_V3: DgAuthorityV3PageInput = {
  title: "AC Not Cooling (Tampa, FL)",
  location: "Tampa, FL",
  summary_30s:
    "Warm supply with the indoor fan running usually means you have airflow at the coil but not enough heat rejection or refrigerant-side capacity under load. In Tampa’s high latent load, a small charge issue or weak condenser heat transfer shows up fast as high suction line temp and poor ΔT across the coil. First confirm thermostat mode, filter/return path, and outdoor unit actually transferring heat (line temps, condenser fan), then separate superficial control faults from capacity faults before adding refrigerant.",
  cta_top: { ...HVAC_CTA_TOP },
  quick_checks: [...HVAC_QUICK],
  quick_checks_pro: HVAC_QUICK.join("\n\n"),
  quick_checks_home:
    "If these measured bands are off—especially ΔT and compressor current relative to load—this is no longer a simple filter swap. Wrong conclusions here steer you toward charge work while airflow or control faults remain.",
  diagnostic_logic_pro:
    "If airflow and electrical control are proven and ΔT stays low with normal superheat/subcool pattern for the metering type, you are in refrigerant charge, restriction, or compressor pumping efficiency—not a filter-only fix. If the coil ices with seemingly normal charge history, map to airflow, metering, or low-load operating point before adjusting charge.",
  diagnostic_logic_home:
    "At this point, guessing can make the problem worse: adding refrigerant into a restricted or under-airflow coil can slug liquid, raise compressor stress, and convert a modest repair into compressor-level failure.",
  diagnostic_flow: {
    nodes: [
      { id: "start", label: "Occupant reports not cooling" },
      { id: "air", label: "Airflow + filter + blower delivery" },
      { id: "outdoor", label: "Outdoor unit running + line temps" },
      { id: "charge", label: "Refrigerant circuit: pressures/temps vs spec" },
      { id: "controls", label: "Thermostat, sensors, defrost/staging logic" },
      { id: "end", label: "Document readings; repair plan" },
    ],
    edges: [
      { from: "start", to: "air" },
      { from: "air", to: "outdoor" },
      { from: "outdoor", to: "charge" },
      { from: "charge", to: "controls" },
      { from: "controls", to: "end" },
    ],
  },
  system_explanation:
    "Split cooling moves heat from indoor air to outdoor air via refrigerant phase change. The evaporator absorbs heat at low pressure; the compressor raises refrigerant pressure/temperature so the condenser can reject that heat outside. Anything that reduces airflow, condenser heat rejection, or correct mass flow through the circuit collapses sensible/latent capacity even when the blower still feels “on.”",
  failure_clusters: [
    {
      title: "Airflow / coil face",
      pro: "Dirty filter, choked return, failed blower speed, or iced coil from low airflow reduces sensible heat pickup and can drive liquid floodback risk if charge is adjusted without fixing delivery first.",
      home: "Weak airflow often shows up as low vent volume, long runtimes, or ice on the indoor coil—even when the outdoor fan still runs. That pattern is not automatically a “bad compressor.”",
      risk: "If you adjust refrigerant before fixing airflow or verifying metering context, you can overcharge the system, damage the compressor, and void manufacturer expectations for documented diagnosis.",
    },
    {
      title: "Refrigerant mass flow",
      pro: "Low charge from leak, restriction, or incorrect metering shows as abnormal line temperatures, poor ΔT, and often long runtimes without meeting setpoint. Refrigerant is not consumed in normal operation—low charge equals a leak.",
      home: "Poor temperature split does not automatically mean “low on gas.” Leaks, restrictions, and metering issues can look similar until pressures/temps are read in context.",
      risk: "If you treat low ΔT as “always low charge” without leak confirmation, you miss restrictions and valve issues—and repeated top-offs hide the real failure mode.",
    },
    {
      title: "Electrical / mechanical compressor",
      pro: "Weak run capacitor, contactor pitting, or compressor not loading changes current signature and head/suction behavior; distinguish from pure charge faults with measured volts/amps and mechanical sound under load.",
      home: "A compressor that sounds like it is “trying” while gauges look odd can still be a control or electrical issue—not a guaranteed compressor replacement.",
      risk: "If electrical signatures are not read under load, you can misattribute a mechanical compressor problem to refrigerant and spend on the wrong repair path.",
    },
  ],
  repair_matrix: [
    "Capacitor + contactor service → $150–$450",
    "Refrigerant leak locate + repair + weigh-in → $300–$1,200+",
    "Compressor replacement → $2,000–$5,500+",
    "Full system replacement → $6,000–$14,000+",
  ],
  repair_matrix_pro:
    "These bands are localized planning ranges—not quotes. Final cost depends on access, refrigerant type, warranty status, and whether the failure is isolated or systemic.",
  repair_matrix_home:
    "Most issues land in the lower ranges—but guessing wrong is how people jump straight to the $5k outcome: compressor or full-system replacement after unnecessary parts stacking.",
  repair_matrix_risk:
    "Adjusting refrigerant based on symptoms alone—without confirming airflow and system conditions—can overcharge the system, damage the compressor, and void manufacturer warranties.",
  cta_mid: { ...HVAC_CTA_MID },
  field_measurements: [
    "Supply/return ΔT: 16–22°F typical band when airflow is correct (adjust for equipment spec).",
    "Suction line temperature and measured superheat/subcool per metering type (values recorded, not guessed).",
    "Line set pressure correlation (if gauges applied): suction/discharge trends vs ambient—interpret with non-condensables and coil cleanliness in mind.",
    "Voltage: 240 VAC at disconnect under compressor run; control 24 VAC at stat and contactor coil.",
  ],
  field_measurements_pro:
    "Use the list as a capture checklist only: ΔT never proves charge by itself—pair it with line temps, superheat/subcool appropriate to the metering device, and compressor L1/L2 draw under load. Pressures are meaningless without non-condensable and coil-cleanliness context; control voltage proves the stat/contactor path is actually closed when the compressor should run.",
  field_measurements_home:
    "These are not visual checks—they require tools and correct interpretation. Wrong gauge placement or ignoring non-condensables corrupts the whole decision tree.",
  repair_vs_replace_pro:
    "Replace when compressor efficiency is gone, heat exchangers are leaking, or cumulative repairs exceed sensible remaining life. Repair when the fault is localized (weak cap, small leak at flare, clogged condenser) and the rest of the system checks out.",
  repair_vs_replace_home:
    "Replacing parts without confirming failure is the most expensive path: you pay for components while the root fault (airflow, charge integrity, control) remains.",
  professional_threshold:
    "Stop at opening refrigerant circuits without EPA handling, adding charge without leak verification, or working live 240 VAC without training. Documented diagnosis with pressures/temps and safe recovery is the minimum professional bar.",
  warnings: [
    "Rotating machinery, sharp sheet metal, and electrical shock; overcharge after misdiagnosis can slug liquid.",
    "Running severely low charge can damage the compressor.",
  ],
  cta_final: { ...HVAC_CTA_FINAL },
  risk_notes: [
    {
      label: "Where people get this wrong",
      text: "Adjusting refrigerant based on symptoms alone. Without confirming airflow and system conditions, this can overcharge the system, damage the compressor, and void manufacturer warranties.",
    },
    {
      label: "Risk if misdiagnosed",
      text: "Continuing to run a low-charge or restricted system increases compressor stress and can turn a contained repair into full-system replacement.",
    },
  ],
  before_you_call: [
    "Outdoor ambient, indoor setpoint, and runtime when symptoms appear.",
    "Whether condenser fan and compressor both sound active under load.",
    "Supply and return temps in the same window if you can do so safely.",
    "Whether the outdoor breaker trips instantly or after a delay on start.",
  ],
  do_not_attempt: [
    "Do not add refrigerant without leak location and evacuation protocol.",
    "Do not bypass safeties or hot-wire contactors to “test” the compressor.",
    "Do not open high-voltage enclosures without training and lockout/tagout.",
  ],
};

/** National symptom page `hvac/ac-not-cooling` — canonical queue-aligned copy (no market line). */
export const HVAC_AC_NOT_COOLING_V3: DgAuthorityV3PageInput = {
  trade: "hvac",
  slug: "hvac/ac-not-cooling",
  cluster: "airflow",
  diagnostic_mermaid_cluster: "airflow",
  diagnostic_flow_template_key: "hvac_v1",
  diagnostic_flow_issue_label: "AC Not Cooling",
  pillar_page: "hvac/why-ac-isnt-cooling",
  related_pages: ["hvac/weak-airflow", "hvac/frozen-evaporator-coil"],
  safety_notice: "Working around energized HVAC systems or refrigerant circuits requires proper tools and training.",
  where_people_get_this_wrong:
    "Assuming all cooling problems are refrigerant-related leads to incorrect repairs.",

  title: "AC Not Cooling",
  summary_30s:
    "If your AC is running but not cooling, the issue is usually airflow restriction, refrigerant imbalance, outdoor unit failure, or control problems. Most failures are fixable—but guessing the cause is how small issues become expensive repairs.",

  cta_top: {
    title: "Avoid replacing the wrong part",
    body: "Many AC issues look similar but require different fixes.",
    button: "Get HVAC Diagnosis",
  },

  quick_checks: [
    "Check filter condition and airflow at vents",
    "Confirm thermostat is set to COOL",
    "Verify outdoor unit is running",
    "Measure supply vs return temperature difference",
    "Look for ice on indoor lines or coil",
  ],
  quick_checks_home:
    "If airflow is weak or temperatures don’t separate, this is already beyond a simple fix. These checks help confirm the issue, not solve it.",

  diagnostic_logic_pro:
    "Cooling failure follows airflow, refrigerant, compressor, or control paths. Each has distinct temperature and system behavior signatures.",
  diagnostic_logic_home: "Your AC isn’t just ‘not cooling’—it’s failing somewhere in the process.",

  diagnostic_flow: {
    nodes: [
      { id: "start", label: "AC not cooling" },
      { id: "air", label: "Airflow check" },
      { id: "outdoor", label: "Outdoor unit" },
      { id: "ref", label: "Refrigerant system" },
      { id: "ctl", label: "Controls" },
      { id: "end", label: "Diagnosis" },
    ],
    edges: [
      { from: "start", to: "air" },
      { from: "air", to: "outdoor" },
      { from: "outdoor", to: "ref" },
      { from: "ref", to: "ctl" },
      { from: "ctl", to: "end" },
    ],
  },

  system_explanation:
    "AC systems remove heat from indoor air and release it outdoors. If any part of that cycle breaks, cooling performance drops even if the system is running.",

  failure_clusters: [
    {
      title: "Airflow restriction",
      pro: "Reduced airflow limits heat transfer and can cause coil icing.",
      home: "If air isn’t moving, cooling can’t happen.",
      risk: "Fixing refrigerant before airflow can damage the system.",
    },
    {
      title: "Refrigerant imbalance",
      pro: "Improper charge or restriction disrupts heat transfer.",
      home: "Low cooling doesn’t always mean low refrigerant.",
      risk: "Adding refrigerant blindly leads to overcharge damage.",
    },
    {
      title: "Outdoor unit failure",
      pro: "Failure to reject heat prevents cooling cycle completion.",
      home: "If the outdoor unit fails, heat stays inside.",
      risk: "Running the system can escalate damage quickly.",
    },
  ],

  repair_matrix: [
    "Capacitor replacement → $150–$400",
    "Refrigerant repair → $300–$1,200+",
    "Compressor replacement → $2,000–$5,500+",
    "Full replacement → $6,000–$14,000+",
  ],
  repair_matrix_pro: "These are typical cost ranges based on correct diagnosis.",
  repair_matrix_home: "Most issues fall in lower ranges.",
  repair_matrix_risk: "Misdiagnosis is how people jump to the highest cost repairs.",

  cta_mid: {
    title: "This is where most DIY attempts go wrong",
    body: "Replacing parts without confirming the cause leads to expensive outcomes.",
    button: "Get HVAC Diagnosis",
  },

  field_measurements: [
    "Temperature difference (ΔT)",
    "Suction and liquid line temperatures",
    "Compressor amperage",
    "Voltage at disconnect",
  ],
  field_measurements_pro:
    "ΔT, line temperatures, compressor amps, and disconnect voltage are only actionable when measured at the right points and compared to design intent for the actual load and ambient conditions.",
  field_measurements_home: "These require tools and correct interpretation.",

  repair_vs_replace_pro:
    "Repair when faults are isolated. Replace when major components fail.",
  repair_vs_replace_home: "Most systems can be repaired if diagnosed correctly.",

  professional_threshold: "Stop at refrigerant or electrical testing without training.",

  warnings: ["Electrical shock risk", "Refrigerant handling requires certification"],

  risk_notes: [
    {
      label: "Where people get this wrong",
      text: "Assuming all cooling problems are refrigerant-related leads to incorrect repairs.",
    },
  ],

  cta_final: {
    title: "Avoid a major system failure",
    body: "Incorrect diagnosis leads to expensive outcomes.",
    button: "Find HVAC Technician",
  },

  before_you_call: [
    "Note how long the system runs without reaching setpoint",
    "Check if airflow is strong at vents",
    "Confirm outdoor unit operation",
    "Record indoor temperature vs thermostat",
  ],

  do_not_attempt: ["Do not add refrigerant without diagnosis", "Do not open electrical panels live"],
};

/** National symptom page `hvac/weak-airflow` — queue cluster `airflow`. */
export const HVAC_WEAK_AIRFLOW_V3: DgAuthorityV3PageInput = {
  trade: "hvac",
  slug: "hvac/weak-airflow",
  cluster: "airflow",
  diagnostic_mermaid_cluster: "airflow",
  diagnostic_flow_template_key: "hvac_v1",
  diagnostic_flow_issue_label: "Weak Airflow",
  pillar_page: "hvac/why-ac-isnt-cooling",
  related_pages: ["hvac/ac-not-cooling", "hvac/frozen-evaporator-coil"],

  title: "Weak Airflow",
  summary_30s:
    "Weak airflow limits cooling efficiency and often leads to temperature imbalance, long runtimes, and system strain.",

  cta_top: {
    title: "Poor airflow reduces system performance",
    body: "Airflow issues are one of the most common HVAC failures.",
    button: "Get HVAC Diagnosis",
  },

  quick_checks: [
    "Check filter condition",
    "Inspect vent airflow",
    "Confirm blower operation",
    "Check return vents for blockage",
  ],
  quick_checks_home:
    "If airflow is weak across multiple vents, this is not a simple filter issue.",

  diagnostic_logic_pro:
    "Treat weak airflow as a delivery problem first: filter and return path, blower speed and motor load, then duct leakage or restriction. Low measured airflow raises evaporator risk and collapses ΔT even when refrigerant is nominally correct.",
  diagnostic_logic_home:
    "When several rooms feel weak at the same time, the fault is usually shared path (filter/return/blower/duct), not a single closed damper.",

  diagnostic_flow: {
    nodes: [
      { id: "start", label: "Weak airflow reported" },
      { id: "filter", label: "Filter and return path" },
      { id: "blower", label: "Blower speed and motor" },
      { id: "duct", label: "Duct leakage or restriction" },
      { id: "end", label: "Document findings; repair plan" },
    ],
    edges: [
      { from: "start", to: "filter" },
      { from: "filter", to: "blower" },
      { from: "blower", to: "duct" },
      { from: "duct", to: "end" },
    ],
  },

  system_explanation:
    "Central cooling relies on moving enough air across the indoor coil to absorb heat and distribute conditioned air. When delivered airflow drops, sensible and latent capacity fall, runtimes stretch, and the coil can operate outside its intended operating point.",

  failure_clusters: [
    {
      title: "Filter or return blockage",
      pro: "Restricted intake reduces system airflow.",
      home: "Air can’t move if it can’t get in.",
      risk: "Ignoring this can cause coil freezing.",
    },
    {
      title: "Blower issues",
      pro: "Fan or motor faults reduce airflow delivery.",
      home: "The system may be running but not pushing air.",
      risk: "Misdiagnosing as compressor failure wastes money.",
    },
  ],

  repair_matrix: [
    "Filter replacement → $20–$80",
    "Blower repair → $300–$900",
    "Duct issues → $500–$2,000+",
  ],
  repair_matrix_pro:
    "Ranges assume correct diagnosis of the airflow fault; duct corrections vary sharply with access, leakage severity, and code-compliant repairs.",
  repair_matrix_home:
    "Most homes start with filter and blower-side fixes—duct work escalates when leakage or restriction is confirmed.",
  repair_matrix_risk:
    "Replacing major components while airflow remains low can mask the real fault and shorten equipment life.",

  cta_mid: {
    title: "Weak airflow leads to bigger failures",
    body: "Fixing airflow early prevents system damage.",
    button: "Get HVAC Diagnosis",
  },

  field_measurements: [
    "Static pressure across filter and coil (in. w.c. where applicable)",
    "Blower motor amps vs nameplate and tap/speed setting",
    "Supply and return temperature split at steady state",
    "Rough room-to-room velocity or flow balance spot checks",
  ],
  field_measurements_pro:
    "Static and amp readings separate restriction from motor weakness; ΔT must be read with airflow context—low airflow can mimic charge problems.",
  field_measurements_home: "These checks require gauges or meters and safe access—stop where training ends.",

  repair_vs_replace_pro:
    "Repair when the fault is localized (plugged filter, failed relay, worn belt, single duct collapse). Replace blower assemblies or motors when windings or bearings are compromised beyond economical repair.",
  repair_vs_replace_home:
    "If airflow improves immediately after a measured fix, you likely avoided coil icing and compressor stress.",

  professional_threshold:
    "Stop at opening sealed ductwork, altering gas or electrical controls, or working inside energized air handlers without training.",

  warnings: ["Electrical shock risk near blower cabinets", "Coil icing can precede water damage if ignored"],

  cta_final: {
    title: "Protect capacity and comfort",
    body: "Unresolved airflow problems increase energy use and wear on compressors and coils.",
    button: "Find HVAC Technician",
  },

  before_you_call: [
    "Whether weak airflow is whole-home or isolated rooms",
    "When the blower ramps and whether noise changes with speed",
    "Recent filter changes or duct access work",
  ],

  do_not_attempt: [
    "Do not bypass blower limits or tape over safety switches",
    "Do not seal ducts with non-listed materials or block combustion air paths",
  ],
};

/** National symptom page `hvac/frozen-evaporator-coil` — queue cluster `airflow`. */
export const HVAC_FROZEN_EVAPORATOR_COIL_V3: DgAuthorityV3PageInput = {
  trade: "hvac",
  slug: "hvac/frozen-evaporator-coil",
  cluster: "airflow",
  diagnostic_mermaid_cluster: "airflow",
  diagnostic_flow_template_key: "hvac_v1",
  diagnostic_flow_issue_label: "Frozen Evaporator Coil",
  pillar_page: "hvac/why-ac-isnt-cooling",
  related_pages: ["hvac/ac-not-cooling", "hvac/weak-airflow"],

  title: "Frozen Evaporator Coil",
  summary_30s:
    "A frozen coil indicates airflow or refrigerant imbalance. Ice formation blocks cooling entirely.",

  cta_top: {
    title: "Ice on your AC is a warning sign",
    body: "This is not normal and indicates a deeper issue.",
    button: "Get HVAC Diagnosis",
  },

  quick_checks: [
    "Look for visible ice on lines",
    "Check airflow strength",
    "Confirm system runtime",
    "Check filter condition",
  ],
  quick_checks_home:
    "Ice means airflow or refrigerant problems—not just a temporary issue.",

  diagnostic_logic_pro:
    "Coil icing is almost always insufficient airflow across the evaporator, incorrect metering/charge context, or both. Running the system heavily iced risks flood, water damage, and compressor slugging once ice melts or liquid reaches the compressor.",
  diagnostic_logic_home:
    "Turning the system off to thaw without fixing the cause usually brings the ice back—often with higher repair cost.",

  diagnostic_flow: {
    nodes: [
      { id: "start", label: "Ice on coil or lines" },
      { id: "air", label: "Verify airflow delivery" },
      { id: "meter", label: "Metering and charge context" },
      { id: "drain", label: "Condensate and drain path" },
      { id: "end", label: "Safe thaw + repair plan" },
    ],
    edges: [
      { from: "start", to: "air" },
      { from: "air", to: "meter" },
      { from: "meter", to: "drain" },
      { from: "drain", to: "end" },
    ],
  },

  system_explanation:
    "The indoor coil removes heat by evaporating refrigerant at low pressure. When airflow is too low or refrigerant behavior is wrong for the load, coil surface temperature can fall below freezing and water on the coil turns to ice, insulating the coil and stopping heat transfer.",

  failure_clusters: [
    {
      title: "Airflow restriction",
      pro: "Low airflow causes coil temperature to drop below freezing.",
      home: "Air isn’t moving fast enough to prevent freezing.",
      risk: "Ignoring this can damage the compressor.",
    },
    {
      title: "Refrigerant imbalance",
      pro: "Incorrect charge alters pressure-temperature relationship.",
      home: "The system is cooling too aggressively or incorrectly.",
      risk: "Adding refrigerant blindly worsens the issue.",
    },
  ],

  repair_matrix: [
    "Filter/airflow fix → $50–$300",
    "Refrigerant repair → $300–$1,200+",
    "Compressor damage → $2,000+",
  ],
  repair_matrix_pro:
    "Costs depend on whether the root cause is delivery (filter/duct/blower) versus verified leak or metering work; compressor damage is a downstream risk of running iced or liquid-flooded.",
  repair_matrix_home:
    "Many stops are filter and airflow corrections—refrigerant work should follow diagnosis, not guesswork.",
  repair_matrix_risk:
    "Chipping ice mechanically or forcing heat on the coil can damage tubing and create leaks.",

  cta_mid: {
    title: "Frozen coils lead to major failures",
    body: "Ignoring this problem risks compressor damage.",
    button: "Get HVAC Diagnosis",
  },

  field_measurements: [
    "Supply/return ΔT during steady run (before and after safe thaw)",
    "Filter delta and visual coil face (when safely accessible)",
    "Liquid and suction line feel or measured temps if trained",
    "Blower amps vs tap/speed and nameplate",
  ],
  field_measurements_pro:
    "ΔT alone cannot prove charge while airflow is suspect; pair temperature splits with verified airflow and, when qualified, superheat/subcool appropriate to the metering device.",
  field_measurements_home:
    "Line ice and water under the air handler are signals to stop running the system and call for help.",

  repair_vs_replace_pro:
    "Repair when icing is traced to a localized fault (clogged filter, stuck relay, blocked drain causing safety trip patterns, small duct fix). Replace when coils are damaged, refrigerant circuits are compromised repeatedly, or compressors show damage from liquid floodback.",
  repair_vs_replace_home:
    "Clearing the immediate ice without fixing the driver usually repeats the failure within days.",

  professional_threshold:
    "Stop at adding refrigerant, opening lines, or forcing thaw with torches or hot water on refrigerant circuits without training and proper recovery procedures.",

  warnings: [
    "Water damage and electrical hazard under flooded air handlers",
    "Compressor damage risk if liquid slugging occurs after thaw",
  ],

  cta_final: {
    title: "Stop damage before it spreads",
    body: "A controlled thaw and correct diagnosis prevents compressor failure and interior water losses.",
    button: "Find HVAC Technician",
  },

  before_you_call: [
    "How long ice has been present and whether water is pooling",
    "Whether the blower is running during cooling calls",
    "Recent filter changes or thermostat setbacks",
  ],

  do_not_attempt: [
    "Do not chip ice off the coil with tools",
    "Do not continue running the system with heavy ice buildup",
  ],
};

/** Pillar hub `/hvac/why-ac-isnt-cooling` — same DG Authority v3 contract as symptom pages. */
export const HVAC_PILLAR_WHY_AC_ISNT_COOLING_V3: DgAuthorityV3PageInput = {
  ...HVAC_AC_NOT_COOLING_TAMPA_V3,
  title: "Why Your AC Isn't Cooling: Complete Diagnostic Guide",
  slug: "hvac/why-ac-isnt-cooling",
  summary_30s:
    "Use this hub to choose the right symptom path—airflow delivery vs outdoor heat rejection vs refrigerant mass flow vs controls—before you spend on the wrong repair. Each linked guide keeps the same measurement discipline: verify delivery and context before adjusting charge or swapping major components.",
  diagnostic_flow_issue_label: "Why AC isn't cooling (hub overview)",
  related_pages: [
    { title: "AC not cooling", href: "/hvac/ac-not-cooling" },
    { title: "Weak airflow", href: "/hvac/weak-airflow" },
    { title: "Frozen evaporator coil", href: "/hvac/frozen-evaporator-coil" },
  ],
};

const PLUMB_QUICK = [
  "Dedicated breaker (electric) or pilot/ignition + gas cock position (gas); verify nameplate voltage at the appliance terminal block.",
  "Hot tap at nearest fixture: strong flow that never warms → verify cold inlet to heater is cold and hot outlet warms at dielectric.",
  "After a large draw, confirm firing or element cycling; check hi-limit/ECO reset and thermostat setpoint.",
  "Short sample from tank drain (safe discharge only): grit or chunks correlate with bottom sediment insulating elements.",
] as const;

export const PLUMBING_WATER_HEATER_TAMPA_V3: DgAuthorityV3PageInput = {
  title: "Water Heater Not Working (Tampa, FL)",
  location: "Tampa, FL",
  summary_30s:
    "No usable hot water usually means the burner or electric elements are not transferring heat into the tank, control is not calling for heat, or stored volume is thermally short-circuited by sediment. First confirm fuel or power at the appliance, then verify the tank is actually cold versus a distribution-only fault.",
  cta_top: { ...PLUMB_CTA_TOP },
  quick_checks: [...PLUMB_QUICK],
  quick_checks_pro: PLUMB_QUICK.join("\n\n"),
  quick_checks_home:
    "If voltage/element behavior and gas pressure/ignition proofs do not line up with what you feel at the tap, you are past “simple reset” territory—misreads here push people toward tank replacement when controls or sediment are the real issue.",
  diagnostic_logic_pro:
    "If hot water never arrives but cold supply is good and there is no backfeed crossover, the fault is energy input or its control path. When electric: if line voltage is correct at inputs but elements do not draw within expected resistance bands and the tank remains cold, prioritize element open/ground fault or stuck relay. When gas: sequence ignition, flame sense, and gas valve integrity before condemning the tank.",
  diagnostic_logic_home:
    "Guessing element vs gas valve vs sediment without measurements can leave scald risk, gas leaks, or energized wet work unaddressed—professional verification is the safe branch when readings disagree.",
  diagnostic_flow: {
    nodes: [
      { id: "start", label: "No / inadequate hot water reported" },
      { id: "power_gas", label: "Verify power (electric) or gas supply + shutoff position" },
      { id: "distribution", label: "Confirm not plumbing-only: crossover, recirc" },
      { id: "control", label: "Thermostat setpoint, hi-limit/ECO, call for heat" },
      { id: "electric_path", label: "Electric: VAC at block; element resistance" },
      { id: "gas_path", label: "Gas: manifold pressure; ignition; valve" },
      { id: "tank_sediment", label: "Sediment/dip tube: recovery, noise" },
      { id: "end_professional", label: "Document measurements; repair or replace" },
    ],
    edges: [
      { from: "start", to: "power_gas" },
      { from: "power_gas", to: "distribution" },
      { from: "distribution", to: "control" },
      { from: "control", to: "electric_path", label: "Electric heater" },
      { from: "control", to: "gas_path", label: "Gas heater" },
      { from: "electric_path", to: "tank_sediment" },
      { from: "gas_path", to: "tank_sediment" },
      { from: "tank_sediment", to: "end_professional" },
    ],
  },
  system_explanation:
    "A storage water heater stores thermal energy in the water volume by transferring heat through metal interfaces: in electric units, resistance elements dissipate power as heat into water surrounding the sheath; in gas units, combustion transfers heat to the tank bottom and flue passage. Sediment increases thermal resistance and can shorten usable hot capacity.",
  failure_clusters: [
    {
      title: "Electrical (Electric Units)",
      pro: "Open or weak element, loose terminal, failed thermostat or hi-limit, bad ECO, or loss of one leg on 240 VAC presenting as half-power recovery.",
      home: "Replacing elements repeatedly while sediment insulates the pocket wastes money and leaves the underlying thermal problem in place.",
      risk: "Energized wet work on concrete or in standing water raises shock risk; repeated element swaps without ohms and tank stratification checks mask grounded elements.",
    },
    {
      title: "Gas Supply (Gas Units)",
      pro: "Closed or throttled gas cock, regulator/manifold pressure out of spec, dirty burner or orifice, failed igniter or flame sensor, or gas valve not opening under proof-of-flame.",
      home: "Adjusting gas pressure or disassembling the gas train without a manometer and leak check is how slow leaks and ignition faults get worse.",
      risk: "Repeated ignition attempts without proving draft and leak safety can allow gas accumulation in confined spaces.",
    },
    {
      title: "Sediment / Tank Issues",
      pro: "Hard mineral or grit layer insulates the bottom, slowing heat uptake and causing popping, long recovery, or overheating at the element pocket.",
      home: "Flushing aggressively without understanding T&P and discharge paths can create scalding or flooding—interpret symptoms before acting.",
      risk: "Opening T&P or drain without controlled discharge can scald occupants or flood finished spaces when tank pressure spikes.",
    },
  ],
  repair_matrix: [
    "Heating element replacement → $150–$400",
    "Thermostat failure → $150–$350",
    "Gas valve issue → $300–$800",
    "Tank failure → $1,200–$3,500",
  ],
  repair_matrix_pro:
    "Costs vary with tank access, local code requirements for pans and venting, and whether the failure is control-only versus vessel integrity.",
  repair_matrix_home:
    "Most repairs cluster in the mid bands, but ordering the wrong primary repair (tank vs control vs gas train) stacks cost fast—especially if sediment damage already compromises the vessel.",
  repair_matrix_risk:
    "Draining or flushing without controlling discharge temperature and pressure paths—scalding and property damage are realistic outcomes when T&P behavior is ignored.",
  cta_mid: { ...PLUMB_CTA_MID },
  field_measurements: [
    "Tank setpoint / outlet: 120–140°F",
    "Element resistance: 10–30 Ω typical (power off, verified)",
    "Supply static: 40–80 PSI",
  ],
  field_measurements_pro:
    "Log outlet or strap/skin temp, element ohms with power locked out, and static supply pressure before opening the gas train or pulling elements—those three numbers decide whether you stay in controls/sediment scope versus licensed gas or vessel work.",
  field_measurements_home:
    "Tank skin temps, element ohms, and supply pressure are not “optional detail”—they separate safe repair scope from replacement and licensed gas work.",
  repair_vs_replace_pro:
    "Replace when the tank shows chronic leakage at shell welds, internal corrosion with wet insulation odor, or when sediment damage and age stack repeated failures. Repair when the fault is localized and the vessel passes checks.",
  repair_vs_replace_home:
    "Replacing a tank when the failure is control-only—or patching controls on a compromised shell—are both expensive mistakes tied to skipped measurements.",
  professional_threshold:
    "Stop at energized 240 VAC beyond safe verification, gas line pressure or valve adjustment without code-compliant leak check, confined-space or scald hazards during draining, or active T&P discharge without identifying cause.",
  warnings: [
    "Scald risk above ~120°F at fixtures serving children or elderly.",
    "Shock hazard on wet concrete near energized cabinets.",
    "Gas accumulation if ignition is repeatedly attempted without proving safe draft.",
  ],
  cta_final: { ...PLUMB_CTA_FINAL },
  risk_notes: [
    {
      label: "Where people get this wrong",
      text: "Draining or flushing without controlling discharge temperature and pressure paths—scalding and property damage are realistic outcomes when T&P behavior is ignored.",
    },
  ],
  before_you_call: [
    "Whether the issue is no hot water vs lukewarm-then-cold vs slow recovery after a draw.",
    "Fuel type (electric vs gas) and location of dedicated shutoff or breaker.",
    "Nameplate photo: element voltage, tank capacity, and serial age clues.",
    "Any T&P weeping, popping at startup, or rust streaks on jacket seams.",
  ],
  do_not_attempt: [
    "Do not work inside a live electrical junction box on wet concrete.",
    "Do not disassemble gas components without leak-check capability.",
    "Do not cap or plug T&P discharge lines.",
  ],
};

const ELEC_QUICK = [
  "Inventory loads on the branch at trip time; clamp running amps vs breaker handle rating.",
  "Torque-check accessible terminations at breaker and first outlet on the homerun when de-energized and safe.",
  "240 VAC appliance circuits: verify both legs share load as designed.",
  "Classify trip: delayed thermal vs instantaneous magnetic—little load + instant trip is fault-class.",
] as const;

export const ELECTRICAL_CIRCUIT_OVERLOAD_TAMPA_V3: DgAuthorityV3PageInput = {
  title: "Circuit Overload (Tampa, FL)",
  location: "Tampa, FL",
  summary_30s:
    "A breaker that trips on what feels like “normal use” is usually sustained current above the device’s thermal curve—often from too many continuous loads on one branch, a loose termination raising resistance and heat, or a fault that is not a dead short.",
  cta_top: { ...ELEC_CTA_TOP },
  quick_checks: [...ELEC_QUICK],
  quick_checks_pro: ELEC_QUICK.join("\n\n"),
  quick_checks_home:
    "If these numbers are off, this is no longer a simple fix—continued resets without mapping load vs curve can mask a high-resistance fault progressing toward fire risk.",
  diagnostic_logic_pro:
    "If measured continuous load exceeds 80% of the breaker rating under normal operation, the installation is misapplied or the breaker is correctly protecting the conductor. If measured amps are below 80% continuous yet tripping persists, evaluate connection resistance and breaker wear.",
  diagnostic_logic_home:
    "At this point, guessing can make the problem worse: upsizing a breaker without a load calculation and conductor verification violates code intent and can destroy the safety margin.",
  diagnostic_flow: {
    nodes: [
      { id: "start", label: "Breaker trips under use or reset" },
      { id: "classify", label: "Classify: thermal delay vs instantaneous" },
      { id: "inventory", label: "Inventory loads; measure running amps" },
      { id: "compare", label: "Compare to rating + 80% continuous rule" },
      { id: "balance", label: "Check multi-wire / shared neutral balance" },
      { id: "terminals", label: "Inspect terminations; resistance/heat" },
      { id: "breaker", label: "Breaker test/replace if load is compliant" },
      { id: "end", label: "Document amps, photos, corrective action" },
    ],
    edges: [
      { from: "start", to: "classify" },
      { from: "classify", to: "inventory", label: "Thermal pattern" },
      { from: "classify", to: "end", label: "Instantaneous → fault investigation" },
      { from: "inventory", to: "compare" },
      { from: "compare", to: "balance", label: "If amps borderline or MWBC" },
      { from: "compare", to: "terminals", label: "If amps acceptable" },
      { from: "balance", to: "terminals" },
      { from: "terminals", to: "breaker" },
      { from: "breaker", to: "end" },
    ],
  },
  system_explanation:
    "Branch overcurrent protection limits conductor temperature rise by opening when current-time exceeds the breaker’s trip curve. Thermal elements integrate sustained overload; magnetic elements respond to high fault currents. The 80% continuous planning rule keeps thermal operation away from nuisance edge.",
  failure_clusters: [
    {
      title: "Load Imbalance",
      pro: "Too many continuous loads on one 120 VAC leg or one multi-wire branch without balanced phasing can push one conductor toward thermal limit.",
      home: "Adding loads without diversity checks pushes one leg into chronic thermal trip behavior that looks like a “bad breaker.”",
      risk: "Moving breakers around without re-checking neutral routing on MWBCs can open a shared neutral under load—arc and shock hazard.",
    },
    {
      title: "Wiring Faults",
      pro: "Loose stab or lug, damaged insulation, or high-resistance neutral shared paths can generate localized heat and intermittent trips.",
      home: "Tightening only the breaker lug while neutral issues remain can leave the customer with recurring trips and hidden heat.",
      risk: "High-resistance faults can progress to arcing; do not reset an instantaneous trip repeatedly without de-energized inspection.",
    },
    {
      title: "Breaker Failure",
      pro: "Internal mechanism wear or nuisance sensitivity can trip below measured branch load after integrity is proven.",
      home: "Replacing AFCI/GFCI devices without proving branch integrity often repeats the same signature—wasting parts and time.",
      risk: "Swapping protective devices while ignoring parallel neutral faults or damaged insulation leaves the same fire driver in place.",
    },
  ],
  repair_matrix: [
    "Breaker replacement → $150–$400",
    "Wiring repair → $300–$1,200",
    "Panel upgrade → $1,500–$4,000",
  ],
  repair_matrix_pro:
    "Pricing depends on finished-wall access, aluminum remediation requirements, and whether the issue is localized versus systemic panel bus damage.",
  repair_matrix_home:
    "Most issues land in the lower ranges—but guessing wrong is how people jump straight to the $5k outcome: unnecessary panel replacement after misreading a connection fault.",
  repair_matrix_risk:
    "Assuming “breaker bad” without amp logs—many trips are thermal reality from load, not device failure.",
  cta_mid: { ...ELEC_CTA_MID },
  field_measurements: [
    "Continuous load ≤ 80% of breaker rating (e.g., ≤16 A on 20 A).",
    "120 VAC L-N and 240 VAC L-L under realistic simultaneous load.",
    "Clamp each ungrounded conductor under the same load window.",
    "De-energized: insulation resistance / neutral continuity when instant trip suspected.",
  ],
  field_measurements_pro:
    "Treat the list as one snapshot in time: continuous amps against the breaker curve, L-N/L-L under the same simultaneous load, per-leg clamps, then de-energized insulation and neutral continuity when trips are instantaneous—those readings separate overload from fault class before you swap breakers.",
  field_measurements_home:
    "These are not visual checks—clamped amps, line-to-line voltage under load, and de-energized continuity require correct tools and procedure.",
  repair_vs_replace_pro:
    "Replace individual breakers when load and connections are verified compliant yet the same pole trips reproducibly. Upgrade the panel when bus/stab damage is evident or continuous load cannot be brought under planning limits.",
  repair_vs_replace_home:
    "Replacing parts without confirming failure is the most expensive path—especially when the real issue is a loose neutral or aluminum transition.",
  professional_threshold:
    "Stop at burning odor, water in the panel, main lug arcing, unfamiliar multi-wire neutrals, or aluminum remediation without listed connectors. Do not reset an instantaneous trip repeatedly.",
  warnings: [
    "Arc flash and shock hazard are present on energized work.",
    "Repeated resetting can weld contacts or escalate a high-resistance fault.",
    "Shared neutrals on MWBCs must not be opened under load.",
  ],
  cta_final: { ...ELEC_CTA_FINAL },
  risk_notes: [
    {
      label: "Where people get this wrong",
      text: "Assuming “breaker bad” without amp logs—many trips are thermal reality from load, not device failure.",
    },
  ],
  before_you_call: [
    "List everything that was running when the trip occurred.",
    "Breaker handle size and any visible wire gauge on panel legend.",
    "Whether trips are delayed after minutes vs immediate on energize.",
    "Any burning smell, discoloration at outlets, or recent renovation on that circuit.",
  ],
  do_not_attempt: [
    "Do not upsize breakers to stop tripping without a load calculation.",
    "Do not work inside the panel energized without training.",
    "Do not defeat AFCI/GFCI protection devices.",
  ],
};
