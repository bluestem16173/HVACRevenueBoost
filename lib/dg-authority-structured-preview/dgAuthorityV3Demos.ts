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
  button: "Get Plumbing Diagnosis",
} as const;

const PLUMB_CTA_MID = {
  title: "Water damage and T&P mistakes follow rushed “flush and hope”",
  body: "Mid-range repairs dominate when the fault is control or element—but tank work without discharge planning floods rooms and scalds occupants.",
  button: "Verify Tank + T&P Safely",
} as const;

const PLUMB_CTA_FINAL = {
  title: "Gas pressure and energized wet cabinets are not homeowner tooling",
  body: "Manifold checks, T&P replacement, and element work need code-aware sequencing; wrong order traps gas or energizes standing water paths.",
  button: "Schedule Licensed Plumbing",
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
  trade: "hvac",
  diagnostic_flow_template_key: "hvac_v1",
  diagnostic_flow_issue_label: "AC not cooling",
  summary_30s:
    "Warm supply with the indoor fan running usually means you have airflow at the coil but not enough heat rejection or refrigerant-side capacity under load. In Tampa’s high latent load, a small charge issue or weak condenser heat transfer shows up fast as high suction line temp and poor ΔT across the coil. First confirm thermostat mode, filter/return path, and outdoor unit actually transferring heat (line temps, condenser fan), then separate superficial control faults from capacity faults before adding refrigerant.",
  cta_top: { ...HVAC_CTA_TOP },
  quick_checks: [...HVAC_QUICK],
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
  trade: "plumbing",
  pillar_page: "plumbing/why-you-have-no-hot-water",
  related_pages: [
    "plumbing/water-heater-not-working",
    "plumbing/no-hot-water",
    "plumbing/water-heater-leaking",
  ],
  diagnostic_flow_template_key: "plumbing_v1",
  diagnostic_flow_issue_label: "Water heater not working",
  summary_30s:
    "A water heater that is not working at all usually indicates loss of heat input (electric or gas), failed control logic, or severe sediment interference. The key distinction is whether the tank is truly cold or the problem is in distribution.",
  cta_top: { ...PLUMB_CTA_TOP },
  quick_checks: [...PLUMB_QUICK],
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
      title: "Energy input failure",
      pro: "Loss of electrical supply, failed heating elements, or gas ignition failure prevents heat generation entirely.",
      home: "If the tank never heats at all, the system isn’t producing heat—not storing or delivering it.",
      risk: "Replacing the tank without confirming power or gas input wastes the highest-cost component.",
    },
    {
      title: "Control system failure",
      pro: "Thermostats, ECO limits, or relay faults prevent the system from calling for heat.",
      home: "The system may have power, but it’s not being told to heat.",
      risk: "Misdiagnosing controls as tank failure leads to unnecessary replacement.",
    },
    {
      title: "Sediment interference",
      pro: "Heavy sediment insulates heating surfaces and disrupts heat transfer.",
      home: "The heater may be working, but heat isn’t reaching the water effectively.",
      risk: "Replacing components without addressing sediment leads to repeat failures.",
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
    "Most repairs stay in the mid range—but misdiagnosis is what pushes costs into full replacement.",
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

/**
 * National-style “no hot water” intent: **complete loss at the tap** — separate control vs energy input vs distribution masking before replacing hardware.
 */
export const PLUMBING_NO_HOT_WATER_V3: DgAuthorityV3PageInput = {
  ...PLUMBING_WATER_HEATER_TAMPA_V3,
  title: "No Hot Water",
  location: undefined,
  diagnostic_flow_issue_label: "No hot water (complete loss)",
  cta_top: {
    title: "Complete loss at the tap is not automatically a dead tank",
    body: "Crossover, stuck limits, and one-leg electric faults can read as ‘no hot water everywhere’—tank replacement before branch proof wastes money and leaves gas and scald risks unmapped.",
    button: "Get Plumbing Diagnosis",
  },
  summary_30s:
    "No hot water at all indicates a complete loss of heat production or delivery. The system is either not generating heat or the hot water is not reaching fixtures.",
  quick_checks: [
    "At the tank hot outlet (or within ~12\" downstream): strap/skin vs cold inlet after several minutes of demand—dead parallel temps with no firing/element draw points away from “empty tank” alone.",
    "Open a cold-only fixture: if hot migrates to the cold line, treat **crossover/recirc check valve** before condemning the water heater.",
    "Electric: 240 VAC L–L at the appliance block with load locked out; loss of one leg can present as **no heat** while controls look “alive.”",
    "Gas: verify **call for heat** vs **proof-of-flame** sequence; manifold pressure only with training and leak-check discipline.",
    "Control string: thermostat satisfied vs calling, **hi-limit/ECO** not latched open, and relays actually pulling in under demand.",
  ],
  quick_checks_home:
    "If the tank never gets a real call for heat—or hot water is back-feeding the cold side—you can replace elements twice and still have **no hot water** at the tap. These checks separate **permission to heat** from **ability to heat** from **delivery path**.",
  diagnostic_logic_pro:
    "Sequence: (1) Confirm **distribution integrity** (crossover, failed recirc check, piped backwards) because it can mimic total loss with a nominally healthy tank. (2) If outlet path stays cold while controls call, map **permission**: thermostat, limits, and safeties must close the heating path. (3) If permission is proven and input is dead, isolate **electric element/leg integrity** vs **gas ignition/valve** with measured proofs—not continuity guesses alone.",
  diagnostic_logic_home:
    "“No hot water” feels like one problem, but it splits into **three different jobs**: plumbing path, control/safety, or burner/element work. Skipping the split is how people buy tanks when a **$30 check valve** or **stuck limit** was the fault.",
  diagnostic_flow: {
    nodes: [
      { id: "start", label: "Hot taps: complete loss (not slow recovery)" },
      { id: "dist", label: "Rule out crossover / recirc / piping path" },
      { id: "call", label: "Prove call-for-heat + limits not latched" },
      { id: "elec", label: "Electric: legs, relay, element draw signature" },
      { id: "gas", label: "Gas: ignition proof + valve open under flame" },
      { id: "end", label: "Document branch; repair vs replace decision" },
    ],
    edges: [
      { from: "start", to: "dist" },
      { from: "dist", to: "call" },
      { from: "call", to: "elec", label: "Electric water heater" },
      { from: "call", to: "gas", label: "Gas water heater" },
      { from: "elec", to: "end" },
      { from: "gas", to: "end" },
    ],
  },
  system_explanation:
    "A storage heater only helps if **heated water can reach the tap** and the appliance is **allowed** to add BTU or kW into the tank. **Complete loss** means either the **delivery path is wrong**, the **control stack is not permitting heat**, or the **conversion hardware** (elements/burner/valve) is not transferring energy into water despite a call.",
  failure_clusters: [
    {
      title: "No heat generation",
      pro: "Electrical or gas systems are not producing heat due to supply or ignition failure.",
      home: "The tank never gets hot in the first place.",
      risk: "Assuming tank failure instead of checking power or gas supply leads to unnecessary replacement.",
    },
    {
      title: "Distribution failure",
      pro: "Hot water may exist in the tank but is not reaching fixtures due to crossover or plumbing faults.",
      home: "The heater may be working, but water isn’t getting to you.",
      risk: "Replacing the heater when the issue is plumbing wastes time and cost.",
    },
    {
      title: "Control lockout",
      pro: "Safety limits or thermostat faults prevent heating cycles from starting.",
      home: "The system is shutting itself down for safety.",
      risk: "Bypassing safety controls can create scalding or equipment damage.",
    },
  ],
  repair_matrix: [
    "Crossover / check valve / recirc fix → $100–$450",
    "Thermostat / hi-limit / control repair → $150–$400",
    "Element or ignition service → $150–$500",
    "Tank replacement (when vessel/input rules demand) → $1,200–$3,500",
  ],
  repair_matrix_pro:
    "Pricing depends on whether the job stays in **controls/plumbing path** versus **gas train** or **tank replacement**—those are different permits, materials, and liability profiles.",
  repair_matrix_home:
    "Most “no hot water” stops are **not** the tank itself—ordering the most expensive branch first is how invoices balloon.",
  repair_matrix_risk:
    "Replacing a tank while a crossover or limit fault remains guarantees **no improvement** at the tap and wastes the full replacement band.",
  cta_mid: {
    title: "The expensive mistake is ordering changeout before branch proof",
    body: "When the vessel is sound, spend should stay in controls, crossover/recirc path, or element/gas-train scope—tank quotes belong to proven metal or chronic sediment damage.",
    button: "Verify Tank + T&P Safely",
  },
  field_measurements: [
    "Outlet vs inlet temperature trend under demand (safe strap points)",
    "Electric: L–L and leg presence at block (lockout verified)",
    "Gas: manifold pressure per spec when qualified + leak-check discipline",
    "Static supply pressure (context for T&P/thermal expansion later)",
  ],
  field_measurements_pro:
    "Treat **distribution proof** and **call-for-heat proof** as gates: without them, element ohms and gas pressure readings are easy to misinterpret.",
  field_measurements_home:
    "If you cannot verify **hot leaves the tank** and **controls are calling**, stop and get a plumber-led diagnosis before hardware swaps.",
  repair_vs_replace_pro:
    "Repair when the vessel is sound and the fault is control, element, gas valve train, or plumbing-path. Replace when repeated tank faults, chronic leakage, or sediment/vessel damage make repair uneconomical.",
  repair_vs_replace_home:
    "Complete loss is not automatically “new tank”—it is often **path or permission** work with a lower price band.",
  professional_threshold:
    "Stop at gas valve disassembly, live 240 VAC troubleshooting beyond safe verification, or opening relief paths without controlled discharge planning.",
  risk_notes: [
    {
      label: "Where people get this wrong",
      text: "Assuming “no hot water” equals “dead tank” without ruling crossover and control permission—then paying for a replacement that never addressed the tap symptom.",
    },
  ],
  before_you_call: [
    "Whether **every** hot tap is dead vs only one branch or one bathroom.",
    "Any recent single-handle fixture work, recirc pump service, or irrigation/backfeed oddities on plumbing.",
    "Electric vs gas, and whether the breaker/pilot behavior changed suddenly vs gradually.",
    "Photos of the control access and any error/lockout indicators visible on the appliance.",
  ],
  do_not_attempt: [
    "Do not defeat hi-limit/ECO or T&P devices to “get hot water tonight.”",
    "Do not disassemble gas components without leak-check capability.",
    "Do not work energized on wet concrete without training.",
  ],
};

/**
 * **Leakage** intent: classify **tank integrity** vs **T&P / relief path** vs **connection weeps** and whether **pressure / thermal expansion** is cycling relief.
 */
export const PLUMBING_WATER_HEATER_LEAKING_V3: DgAuthorityV3PageInput = {
  ...PLUMBING_WATER_HEATER_TAMPA_V3,
  title: "Water Heater Leaking",
  location: undefined,
  diagnostic_flow_issue_label: "Water heater leak",
  cta_top: {
    title: "A T&P drip is not always a bad valve—and a shell weep is not a fitting job",
    body: "Expansion control, discharge routing, and vessel integrity sit in different repair bands; tightening the wrong joint masks drivers while water keeps finding the floor.",
    button: "Get Plumbing Diagnosis",
  },
  cta_mid: {
    title: "Misclassified leaks stack cost: expansion ignored, shell patched",
    body: "Mid-range spend covers relief and expansion paths; vessel integrity jumps bands—know which class you are in before opening discharge or ordering demolition access.",
    button: "Verify Tank + T&P Safely",
  },
  summary_30s:
    "A leaking water heater indicates either pressure relief activation, connection failure, or tank integrity breakdown. The key is identifying whether the leak is external or structural.",
  quick_checks: [
    "Identify **exact source**: T&P threads vs shell seam vs nipple union vs drain valve—photo and dry-towel trace before wiping threads blindly.",
    "T&P: **intermittent drip** after hot use on a closed system often tracks to **thermal expansion**; constant high-volume flow suggests overpressure/overtemp or failed seat.",
    "Closed hot system: verify **expansion tank** presence/charge/isolation where applicable—bladder failure can present as chronic T&P weep.",
    "Supply static pressure note; compare to **thermal expansion** pressure rise during heating (qualified measurement only).",
    "Jacket: **rust streaks originating at lower seam** with wet insulation odor is a different class than a weeping dielectric gasket.",
  ],
  quick_checks_home:
    "If water is coming from the **relief path**, tightening fittings randomly can mask whether the valve is **doing its job** for pressure/temperature—or failing open. If it is **shell-side wetting**, “small seep” can still mean **replace vessel** soon.",
  diagnostic_logic_pro:
    "Differentiate **normal thermal expansion discharge** (cyclic, tied to heat-up, resolves with expansion control) from **relief valve failure** (continuous dribble at idle) from **shell leak** (progressive seam wetting, insulation saturation). Connection leaks localize to threads, unions, and dielectrics; they rarely self-resolve and need torque/rebuild scope with discharge control.",
  diagnostic_logic_home:
    "A puddle under the heater is not one diagnosis—**T&P behavior**, **bad threads**, and **tank metal failure** are different price bands and different safety timelines.",
  diagnostic_flow: {
    nodes: [
      { id: "start", label: "Visible water at heater or nearby" },
      { id: "class", label: "Classify: T&P vs fitting vs shell vs drain" },
      { id: "tp", label: "T&P: cycling vs constant; expansion path" },
      { id: "fit", label: "Fittings/dielectric: torque/rebuild scope" },
      { id: "shell", label: "Shell/insulation wetting → vessel integrity" },
      { id: "end", label: "Document source; stop-loss plan" },
    ],
    edges: [
      { from: "start", to: "class" },
      { from: "class", to: "tp", label: "Relief path wet" },
      { from: "class", to: "fit", label: "Threaded joint wet" },
      { from: "class", to: "shell", label: "Seam/jacket wet" },
      { from: "tp", to: "end" },
      { from: "fit", to: "end" },
      { from: "shell", to: "end" },
    ],
  },
  system_explanation:
    "Storage tanks operate as a **pressure boundary**. **T&P valves** protect against excessive temperature and pressure; on **closed systems**, heated water raises pressure unless an **expansion control** path exists. **Metal fatigue and corrosion** migrate to seam leaks. **Threaded connections** leak from vibration, galvanic corrosion, or improper sealing—distinct from vessel failure.",
  failure_clusters: [
    {
      title: "Connection or fitting leak",
      pro: "Loose or degraded fittings at inlet, outlet, or valves allow water escape under pressure.",
      home: "Water is leaking from connections, not the tank itself.",
      risk: "Ignoring small leaks leads to pressure-related failure and water damage.",
    },
    {
      title: "T&P relief activation",
      pro: "Temperature and pressure relief valves discharge when limits are exceeded.",
      home: "The system is releasing water to prevent dangerous pressure or overheating.",
      risk: "Blocking or ignoring T&P discharge can lead to catastrophic failure.",
    },
    {
      title: "Tank failure",
      pro: "Corrosion or structural breakdown of the tank shell allows water to escape permanently.",
      home: "The tank itself is failing and cannot be repaired.",
      risk: "Delaying replacement can lead to flooding and property damage.",
    },
  ],
  repair_matrix: [
    "Expansion tank service / install → $150–$550",
    "T&P replacement + discharge correction → $150–$450",
    "Nipple/dielectric/drain valve repair → $100–$400",
    "Tank replacement (vessel integrity) → $1,200–$3,500",
  ],
  repair_matrix_pro:
    "Access, pan/drain compliance, and whether work stays on **relief/expansion** versus **vessel** drives the band more than brand.",
  repair_matrix_home:
    "Most chronic **T&P weeps** are mid-band until they become **floor damage**—address the driver, not only the symptom drip.",
  repair_matrix_risk:
    "Ignoring shell-side wetting until rupture risk is how **slow seep** becomes **large-loss water damage**.",
  field_measurements: [
    "Relief discharge: intermittent vs continuous (observe across heat cycle)",
    "Supply static pressure (context)",
    "Expansion tank bladder/charge check when in scope",
    "Tank setpoint vs measured outlet band (relief driver context)",
  ],
  field_measurements_pro:
    "Pair **relief behavior classification** with **expansion path verification** before swapping T&P—otherwise the new valve weeps the same week.",
  field_measurements_home:
    "If you see **rust streak shell patterns** or **saturated insulation odor**, treat it as vessel-class and stop DIY escalation.",
  repair_vs_replace_pro:
    "Repair for relief/expansion misapplication and connection-class leaks with sound shell. Replace when vessel integrity fails or repeated seam weep returns after proper fitting work.",
  repair_vs_replace_home:
    "A leaking heater is not always a **new tank**—unless the **metal** is telling you it is.",
  professional_threshold:
    "Stop at altering relief setpoints, capping discharge, opening gas lines for leak search without tools, or lifting a heavy tank without drain/scald control.",
  risk_notes: [
    {
      label: "Where people get this wrong",
      text: "Swapping T&P on repeat while closed-system expansion is unchecked—or calling a tank replacement for a weeping dielectric—both waste money and miss the real driver.",
    },
  ],
  before_you_call: [
    "Photos of **where** water originates (T&P tail, union, lower seam).",
    "Whether drip is **constant** or **after hot use**; any recent PRV/T&P work.",
    "Closed system context: expansion tank present and age if known.",
    "Any rust streaks, insulation smell, or sudden volume increase.",
  ],
  do_not_attempt: [
    "Do not cap or plug T&P or its discharge piping.",
    "Do not drain a hot tank into living space without scald/flood control.",
    "Do not use shell patch products as a long-term fix on pressurized storage.",
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
  trade: "electrical",
  pillar_page: "electrical",
  related_pages: ["electrical/breaker-trips-instantly", "electrical/outlet-not-working"],
  diagnostic_flow_template_key: "electrical_v1",
  diagnostic_flow_issue_label: "Circuit overload",
  summary_30s:
    "A breaker that trips on what feels like “normal use” is usually sustained current above the device’s thermal curve—often from too many continuous loads on one branch, a loose termination raising resistance and heat, or a fault that is not a dead short.",
  cta_top: { ...ELEC_CTA_TOP },
  quick_checks: [...ELEC_QUICK],
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

/** **Instant / magnetic** trip intent — fault-current class, not sustained overload. */
export const ELECTRICAL_BREAKER_TRIPS_INSTANTLY_V3: DgAuthorityV3PageInput = {
  ...ELECTRICAL_CIRCUIT_OVERLOAD_TAMPA_V3,
  title: "Breaker Trips Instantly",
  location: undefined,
  related_pages: ["electrical/circuit-overload", "electrical/outlet-not-working"],
  diagnostic_flow_issue_label: "Breaker trips instantly",
  summary_30s:
    "A breaker that trips **the moment** you reset or energize is behaving like a **magnetic trip**: high fault current, dead short behavior, or a **misapplied protective device** on motor/transformer inrush. This is a different branch than “**too many things plugged in**.” The priority is to **stop repeated resets**, classify **line vs neutral vs ground-fault** signatures with safe isolation—not to upsize the handle.",
  quick_checks: [
    "Confirm **instant vs a few seconds**: magnetic vs thermal changes the entire fault tree.",
    "With everything on that branch unplugged, does the breaker **still** refuse to hold? If yes, suspect **wiring fault** or **miswired device** before “bad breaker.”",
    "AFCI/GFCI: note whether **test button** behaves normally; chronic trip on energize may be **parallel arc / neutral fault** versus nuisance.",
    "De-energized: visual for **damaged cord ends**, **nail/screw penetration**, or **blackened neutrals** in first accessible box on the homerun.",
    "MWBC / shared neutral work history: instant trips after DIY changes often trace to **neutral mishandling**.",
  ],
  quick_checks_home:
    "If the trip is **immediate**, repeated resets are not a workaround—they can **weld fault energy** into the next event. This is when you stop at the panel edge and call for **documented branch isolation**.",
  diagnostic_logic_pro:
    "Instantaneous trip implies current above the magnetic pickup threshold or AFCI detection of hazardous arcing. If load is disconnected and the breaker still trips on close, the fault is on the **branch wiring** or **panel-side connection**, not an end-load appliance. If it only trips under a specific appliance plug-in, isolate **L–N vs ground fault** in that appliance cord or internal fault.",
  diagnostic_logic_home:
    "People often confuse **instant** trips with overload trips—**overload fixes** (unplugging half the room) may do nothing when the real issue is a **short or ground fault path**.",
  diagnostic_flow: {
    nodes: [
      { id: "start", label: "Breaker trips instantly on reset/energize" },
      { id: "class", label: "Confirm magnetic/instant signature" },
      { id: "isolate", label: "Isolate loads: unplug / disconnect corded loads" },
      { id: "branch", label: "If still trips: branch wiring / first box" },
      { id: "device", label: "If only with one device: device cord / internal fault" },
      { id: "end", label: "Document; de-energized repair scope" },
    ],
    edges: [
      { from: "start", to: "class" },
      { from: "class", to: "isolate" },
      { from: "isolate", to: "branch", label: "Trips with loads removed" },
      { from: "isolate", to: "device", label: "Trips only with one item" },
      { from: "branch", to: "end" },
      { from: "device", to: "end" },
    ],
  },
  system_explanation:
    "Thermal trip curves integrate **sustained overload**. Magnetic elements respond to **high peak current** in milliseconds. AFCI/GFCI devices add **ground-fault** and **arc signature** discrimination. **Instant trips** mean you are closer to a **fault impedance** problem than a **diversity-of-load** problem.",
  failure_clusters: [
    {
      title: "Line-to-neutral / shorted branch",
      pro: "Damaged Romex, pinched conductors, or reversed hot/neutral in devices can present dead short on energize.",
      home: "This is not solved by a bigger breaker—it is solved by finding **where the copper is touching wrong**.",
      risk: "Repeated closing-in energizes the fault until arcing damages the panel bus or starts a fire path.",
    },
    {
      title: "Ground fault and protective devices",
      pro: "GFCI/AFCI trips can be legitimate ground fault or parallel arc; they can also be misapplied device type on wrong load class.",
      home: "Swapping AFCI for standard breaker to “stop nuisance” can remove the protection that was catching a real fault.",
      risk: "Defeating protection masks **leakage current** that does not trip a standard breaker until someone is the path.",
    },
    {
      title: "Misapplied breaker / severe inrush mismatch",
      pro: "Wrong curve, wrong AIC context for available fault current, or incorrect pairing with motor loads can trip instantly without a classic short.",
      home: "This looks like “bad breaker” but is often **application engineering**—not a homeowner parts swap.",
      risk: "Installing the wrong device class can leave conductors unprotected for the actual fault mode.",
    },
  ],
  repair_matrix: [
    "Fault locate + repair damaged homerun → $250–$1,200",
    "GFCI/AFCI correct application + replace → $200–$650",
    "Breaker correct type/rating (when verified) → $150–$400",
    "Panel/bus remediation when arcing damaged stabs → $1,500–$4,500+",
  ],
  repair_matrix_pro:
    "Instant-trip jobs often need **time to isolate**, not a cart of parts—pricing follows access, finish repair, and whether damage migrated to the panel.",
  repair_matrix_home:
    "The lower band is common when the fault is **one bad box** or **one bad cord**—the upper band shows up when resets were repeated until the **panel** took damage.",
  repair_matrix_risk:
    "Upsizing or removing AFCI/GFCI to silence an instant trip can trade a **nuisance** for a **life-safety** failure mode.",
  cta_mid: {
    title: "Instant trips need isolation—not a larger breaker shopping list",
    body: "Mid-band work is often branch locate and correct device class; panel escalation happens when resets weld arcing into stab damage.",
    button: "Have an electrician prove fault class before swapping breakers",
  },
  field_measurements: [
    "Trip timing classification (instant vs delayed)",
    "De-energized: continuity / insulation checks where qualified",
    "Inrush context: identify motor/transformer loads on the branch",
    "Panel-side: visual heat marks on breaker stab (qualified)",
  ],
  field_measurements_pro:
    "Separate **load-removed still trips** from **load-specific trips** before spending on breakers—those two branches have different labor profiles.",
  field_measurements_home:
    "If you are not trained to **isolate dead fronts** and interpret **insulation tests**, this is electrician scope—not a reset exercise.",
  repair_vs_replace_pro:
    "Repair branch wiring and devices when damage is localized and bus is sound. Replace breakers when type/curve is wrong after engineering verification. Replace or rebuild panel when stabs/bus show arcing damage.",
  repair_vs_replace_home:
    "Instant trips are not the same budget conversation as **too many hair dryers**—don’t use overload math here.",
  professional_threshold:
    "Stop at repeated reclosing on instant trip, main lug heat, unfamiliar MWBC routing, or any burning odor from the panel.",
  risk_notes: [
    {
      label: "Where people get this wrong",
      text: "Treating instant trips like overload: unplugging random devices while ignoring **dead short on the homerun** or **neutral faults**—then swapping breakers until something melts.",
    },
  ],
  before_you_call: [
    "Whether the trip happens **with nothing plugged in** on that circuit.",
    "Any **one appliance** that always triggers it vs random.",
    "AFCI/GFCI presence and whether **TEST** behaves normally.",
    "Any recent staple/nail, rodent, renovation, or outlet replacement on that circuit.",
  ],
  do_not_attempt: [
    "Do not reset an instant trip repeatedly to “see if it holds.”",
    "Do not swap breaker types without verifying listing, curve, and conductor protection.",
    "Do not defeat AFCI/GFCI protection devices.",
  ],
};

/** **Dead outlet** intent — upstream device, switch leg, or branch integrity vs overload trips. */
export const ELECTRICAL_OUTLET_NOT_WORKING_V3: DgAuthorityV3PageInput = {
  ...ELECTRICAL_CIRCUIT_OVERLOAD_TAMPA_V3,
  title: "Outlet Not Working",
  location: undefined,
  related_pages: ["electrical/circuit-overload", "electrical/breaker-trips-instantly"],
  diagnostic_flow_issue_label: "Outlet not working",
  cta_top: {
    title: "Dead outlets are often upstream of the plate you are staring at",
    body: "GFCI chains, switch legs, and lost neutrals mimic ‘bad receptacles’—three outlet swaps later, the real fault can still be in another room.",
    button: "Request branch mapping before rewiring on assumptions",
  },
  summary_30s:
    "A dead outlet is usually **not** “the outlet died” first—it is **upstream protection opened**, a **switch controlling half the duplex**, a **loose stab** on the homerun chain, or **lost neutral** on a multi-wire branch. The job is to map **which side of the device has voltage**, whether **LINE/LOAD** is correct on GFCI-protected chains, and whether the **breaker is actually holding**—before changing receptacles for cosmetic reasons.",
  quick_checks: [
    "Check **upstream GFCI** (bathroom/garage/exterior) and **reset**; many “dead kitchen” calls are **LINE/LOAD miswired** downstream.",
    "Identify **switched half-hot**: one side tied to a wall switch—test with switch positions before condemning the receptacle.",
    "At the dead outlet (qualified): **hot-to-neutral vs hot-to-ground** voltage pattern helps separate **open neutral** from **open hot**.",
    "If **whole circuit** is dead: verify **breaker position** and stab heat at the panel edge—do not work inside live.",
    "If only **one outlet** in a chain fails mid-run: suspect **stab/backwire** failure or broken conductor in the box.",
  ],
  quick_checks_home:
    "If half the kitchen pops when you press **TEST** somewhere else, you do not have two separate problems—you have **one protection device** doing its job upstream.",
  diagnostic_logic_pro:
    "Work from **panel → first outlet → downstream** logically: a dead tail outlet with hot present at LINE but no downstream voltage implicates **device internal** or **LOAD terminal continuity**. If neutral is lost mid-chain, symptoms can jump devices and confuse homeowners with “random dead plugs.”",
  diagnostic_logic_home:
    "Replacing the visible outlet rarely fixes **upstream GFCI trips** or **lost neutral**—those feel like “bad outlets” but are **branch topology** problems.",
  cta_mid: {
    title: "Three receptacle swaps will not fix a neutral fault upstream",
    body: "Most mid-band spend is first-box termination or GFCI LINE/LOAD discipline—panel stab damage is the escalation when heat and discoloration were ignored.",
    button: "Have an electrician map the branch before more devices",
  },
  diagnostic_flow: {
    nodes: [
      { id: "start", label: "Outlet dead / partial dead" },
      { id: "up", label: "Upstream GFCI / breaker status" },
      { id: "switch", label: "Half-hot / switch leg behavior" },
      { id: "pattern", label: "Voltage pattern: hot, neutral, ground" },
      { id: "chain", label: "First box vs mid-chain stab/continuity" },
      { id: "end", label: "Repair scope; device vs branch" },
    ],
    edges: [
      { from: "start", to: "up" },
      { from: "up", to: "switch" },
      { from: "switch", to: "pattern" },
      { from: "pattern", to: "chain" },
      { from: "chain", to: "end" },
    ],
  },
  system_explanation:
    "120 VAC receptacles sit on a **branch circuit**: overcurrent device at the panel, conductors in series through boxes, and bonding paths. **GFCI** devices protect downstream loads by comparing current imbalance. **Switched receptacles** split function across brass tabs. Failures are often **continuity** and **termination** problems—not “bad plastic” alone.",
  failure_clusters: [
    {
      title: "Upstream GFCI / protection opened",
      pro: "Downstream devices lose power when GFCI trips or when breaker opens; miswired LOAD terminals can make downstream behave like random outages after unrelated work.",
      home: "The dead outlet in the kitchen might be controlled from the **garage**—chasing the wrong box wastes time.",
      risk: "Moving wires between LINE and LOAD without understanding downstream protection removes safety function while leaving symptoms “intermittent.”",
    },
    {
      title: "Neutral integrity / MWBC issues",
      pro: "Open neutral mid-chain can present as low voltage, dead half-circuit, or equipment damage on 240/120 mixed appliances.",
      home: "Lights brightening elsewhere when you plug something in is a classic **neutral fault** clue—not a new lamp problem.",
      risk: "Shared neutrals opened under load can arc; DIY neutral “fixes” without re-identifying conductors are shock and fire drivers.",
    },
    {
      title: "Device / stab failure",
      pro: "Worn stab connections, burned backwire slots, or cracked duplex bodies can fail under modest loads while the panel breaker stays closed.",
      home: "Sometimes it really is the outlet—but only **after** upstream mapping proves the branch is healthy.",
      risk: "Replacing devices without torque discipline repeats the same failure mode in months.",
    },
  ],
  repair_matrix: [
    "GFCI correct wiring + reset path fix → $150–$450",
    "Receptacle replacement + pigtail repair → $125–$350",
    "Branch neutral/homerun repair → $300–$1,200",
    "Panel stab remediation when heat damage found → $1,500–$4,000+",
  ],
  repair_matrix_pro:
    "Most dead outlets resolve in the **lower bands** when the issue is **device or first-box termination**; costs climb when **fish rewires** or **panel stabs** are involved.",
  repair_matrix_home:
    "If the fix is “find the upstream GFCI,” the invoice should not look like a **rewire the house** quote.",
  repair_matrix_risk:
    "Ignoring **warm devices** or **discoloration** while swapping outlets can leave a **high-resistance joint** in the wall.",
  field_measurements: [
    "Line-to-neutral and line-to-ground voltage at dead outlet (qualified)",
    "Upstream GFCI line presence vs downstream load terminals",
    "Breaker holds: verify at panel listing only—no live interior work untrained",
    "Continuity checks on neutrals when de-energized and safe",
  ],
  field_measurements_pro:
    "Pattern voltage plus **first-box inspection** separates **protection** issues from **device** issues faster than random receptacle swaps.",
  field_measurements_home:
    "If you do not know how to interpret **LINE/LOAD** or **open neutral patterns**, stop before you create a cross-connected safety hazard.",
  repair_vs_replace_pro:
    "Replace receptacles when physical damage, heat discoloration, or failed internal contacts are verified. Repair conductors when insulation damage or neutral continuity fails. Escalate panel when stabs show arcing or overheating.",
  repair_vs_replace_home:
    "A dead outlet is often **cheap when mapped**, expensive when guessed.",
  professional_threshold:
    "Stop at opening the panel interior, MWBC re-identification, aluminum remediation, or any burning odor/heat at devices.",
  risk_notes: [
    {
      label: "Where people get this wrong",
      text: "Replacing the dead outlet three times while the real fault is **an upstream GFCI** or **open neutral** in another box.",
    },
  ],
  before_you_call: [
    "Which outlets are dead vs **half-dead**; any wall switch positions that change behavior.",
    "Whether **TEST** on any GFCI restores power when pressed/reset.",
    "Any recent **painting**, outlet replacement, or appliance install on that circuit.",
    "Photos of discoloration, sparks, or warm cover plates.",
  ],
  do_not_attempt: [
    "Do not swap LINE/LOAD on GFCI without verifying downstream labeling.",
    "Do not use cheater adapters to defeat grounding.",
    "Do not work inside energized panels without training.",
  ],
};
