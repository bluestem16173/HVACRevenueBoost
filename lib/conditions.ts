/**
 * Condition layer for Pillar → Diagnostic Graph.
 * Conditions sit between symptoms and causes.
 * 4–6 conditions per symptom targeting distinct troubleshooting contexts.
 */

import { SYMPTOMS, CAUSES, REPAIRS } from "@/data/knowledge-graph";
import { getCauseTechnicalContent } from "./symptom-technical-content";

export interface Condition {
  slug: string;
  name: string;
  description: string;
  symptomId: string;
  causeIds: string[];
}

export const CONDITIONS: Condition[] = [
  // === WEAK AIRFLOW (5 conditions) ===
  {
    slug: "weak-airflow-all-vents",
    name: "Weak Airflow from All Vents",
    description: "Airflow is reduced at every supply register in the home. Typically indicates a system-wide restriction: filter, blower, or evaporator coil.",
    symptomId: "weak-airflow-vents",
    causeIds: ["dirty-filter", "dirty-coils"],
  },
  {
    slug: "weak-airflow-some-rooms",
    name: "Weak Airflow in Some Rooms Only",
    description: "Certain rooms receive less airflow than others. Points to duct design, leaks, or branch restrictions.",
    symptomId: "weak-airflow-vents",
    causeIds: ["leaky-ducts"],
  },
  {
    slug: "weak-airflow-upstairs",
    name: "Weak Airflow Upstairs Only",
    description: "Second floor or upstairs rooms have noticeably weaker airflow. Common with single-zone systems and duct design issues.",
    symptomId: "weak-airflow-vents",
    causeIds: ["leaky-ducts", "dirty-filter"],
  },
  {
    slug: "weak-airflow-after-filter-change",
    name: "Weak Airflow After Filter Change",
    description: "Airflow did not improve after replacing the filter. Suggests blower motor, evaporator coil, or duct issues.",
    symptomId: "weak-airflow-vents",
    causeIds: ["dirty-coils", "leaky-ducts"],
  },
  {
    slug: "weak-airflow-in-extreme-heat",
    name: "Weak Airflow in Extreme Heat",
    description: "Airflow seems weaker during the hottest days. High runtime and dust accumulation can worsen restrictions.",
    symptomId: "weak-airflow-vents",
    causeIds: ["dirty-filter", "dirty-coils"],
  },
  // === AC BLOWING WARM AIR (5 conditions) ===
  {
    slug: "ac-running-but-not-cooling",
    name: "AC Running but Not Cooling",
    description: "The unit is on and the fan runs, but air from vents is not cold. Refrigerant, coil, or airflow issue.",
    symptomId: "ac-blowing-warm-air",
    causeIds: ["refrigerant-leak", "dirty-coils", "failed-capacitor", "dirty-filter"],
  },
  {
    slug: "ac-not-cooling-house-but-unit-running",
    name: "AC Not Cooling House but Unit Running",
    description: "Outdoor unit and indoor blower operate, but home does not cool. Points to refrigerant charge or heat exchange.",
    symptomId: "ac-blowing-warm-air",
    causeIds: ["refrigerant-leak", "dirty-coils", "welded-contactor"],
  },
  {
    slug: "ac-not-cooling-after-filter-change",
    name: "AC Not Cooling After Filter Change",
    description: "Cooling did not improve after replacing the filter. Suggests refrigerant, coil, or electrical fault.",
    symptomId: "ac-blowing-warm-air",
    causeIds: ["refrigerant-leak", "dirty-coils", "failed-capacitor"],
  },
  {
    slug: "ac-not-cooling-in-extreme-heat",
    name: "AC Not Cooling in Extreme Heat",
    description: "System struggles or fails to cool during peak summer temperatures. May indicate low charge or undersized system.",
    symptomId: "ac-blowing-warm-air",
    causeIds: ["refrigerant-leak", "dirty-coils", "dirty-filter"],
  },
  {
    slug: "ac-not-cooling-upstairs",
    name: "AC Not Cooling Upstairs",
    description: "Second floor stays warm while main floor cools. Duct design, airflow, or zoning issue.",
    symptomId: "ac-blowing-warm-air",
    causeIds: ["leaky-ducts", "dirty-filter", "faulty-thermostat"],
  },
  // === AC NOT TURNING ON (5 conditions) ===
  {
    slug: "ac-no-power-at-all",
    name: "AC Has No Power at All",
    description: "Unit is completely dead—no lights, no fan, no response. Electrical supply or thermostat issue.",
    symptomId: "ac-not-turning-on",
    causeIds: ["faulty-thermostat"],
  },
  {
    slug: "ac-outdoor-unit-not-starting",
    name: "Outdoor Unit Not Starting",
    description: "Indoor fan may run but outdoor condenser does not start. Capacitor, contactor, or defrost board.",
    symptomId: "ac-not-turning-on",
    causeIds: ["failed-capacitor", "welded-contactor", "bad-defrost-board"],
  },
  {
    slug: "ac-not-turning-on-after-winter",
    name: "AC Not Turning On After Winter",
    description: "System worked last season but will not start now. Defrost board, capacitor, or rodent damage.",
    symptomId: "ac-not-turning-on",
    causeIds: ["bad-defrost-board", "failed-capacitor"],
  },
  {
    slug: "ac-clicks-but-wont-start",
    name: "AC Clicks but Won't Start",
    description: "You hear a click or hum but the compressor or fan does not run. Capacitor or contactor failure.",
    symptomId: "ac-not-turning-on",
    causeIds: ["failed-capacitor", "welded-contactor"],
  },
  {
    slug: "heat-pump-not-turning-on",
    name: "Heat Pump Not Turning On",
    description: "Heat pump is unresponsive in heating or cooling mode. Defrost board, thermostat, or capacitor.",
    symptomId: "ac-not-turning-on",
    causeIds: ["bad-defrost-board", "faulty-thermostat", "failed-capacitor"],
  },
  // === FURNACE NOT HEATING (4 conditions) ===
  {
    slug: "furnace-no-heat-fan-blowing",
    name: "Furnace No Heat – Fan Blowing",
    description: "Blower runs but air is cold. Igniter, flame sensor, or gas valve issue.",
    symptomId: "furnace-not-heating",
    causeIds: ["worn-igniter", "dirty-flame-sensor", "faulty-thermostat"],
  },
  {
    slug: "furnace-not-starting-at-all",
    name: "Furnace Not Starting at All",
    description: "No blower, no ignition attempt. Thermostat, power, or control board.",
    symptomId: "furnace-not-heating",
    causeIds: ["faulty-thermostat"],
  },
  {
    slug: "furnace-clicks-no-ignition",
    name: "Furnace Clicks but No Ignition",
    description: "You hear the igniter click but the burner does not light. Igniter or gas supply.",
    symptomId: "furnace-not-heating",
    causeIds: ["worn-igniter", "dirty-flame-sensor"],
  },
  {
    slug: "furnace-lights-then-shuts-off",
    name: "Furnace Lights Then Shuts Off",
    description: "Burner ignites briefly then shuts down. Flame sensor or limit switch.",
    symptomId: "furnace-not-heating",
    causeIds: ["dirty-flame-sensor"],
  },
  // === ICE ON OUTDOOR UNIT (4 conditions) ===
  {
    slug: "ice-on-outdoor-unit-summer",
    name: "Ice on Outdoor Unit in Summer",
    description: "Frost or ice on the outdoor coil during cooling season. Refrigerant or airflow restriction.",
    symptomId: "ice-on-outdoor-unit",
    causeIds: ["refrigerant-leak", "dirty-filter", "dirty-coils"],
  },
  {
    slug: "ice-on-outdoor-unit-winter",
    name: "Ice on Outdoor Unit in Winter",
    description: "Heat pump outdoor coil iced over in heating mode. Defrost cycle or sensor failure.",
    symptomId: "ice-on-outdoor-unit",
    causeIds: ["bad-defrost-board", "dirty-coils"],
  },
  {
    slug: "ice-on-lines-and-coil",
    name: "Ice on Lines and Evaporator Coil",
    description: "Indoor coil and refrigerant lines are frozen. Severe airflow or refrigerant issue.",
    symptomId: "ice-on-outdoor-unit",
    causeIds: ["dirty-filter", "refrigerant-leak", "dirty-coils"],
  },
  {
    slug: "ice-after-long-runtime",
    name: "Ice Forms After Long Runtime",
    description: "System runs for hours then develops ice. Low charge or restricted airflow.",
    symptomId: "ice-on-outdoor-unit",
    causeIds: ["refrigerant-leak", "dirty-coils", "dirty-filter"],
  },
  // === HVAC LEAKING WATER (4 conditions) ===
  {
    slug: "water-pooling-indoor-unit",
    name: "Water Pooling at Indoor Unit",
    description: "Water collects around the air handler or furnace. Drain line or condensate pan.",
    symptomId: "hvac-leaking-water",
    causeIds: ["clogged-drain", "dirty-coils"],
  },
  {
    slug: "water-dripping-from-ceiling",
    name: "Water Dripping from Ceiling",
    description: "Water stains or dripping from ceiling near HVAC. Drain backup or pan overflow.",
    symptomId: "hvac-leaking-water",
    causeIds: ["clogged-drain", "dirty-filter"],
  },
  {
    slug: "water-leak-after-filter-change",
    name: "Water Leak After Filter Change",
    description: "Leak started or worsened after filter replacement. Drain or coil issue, not filter-related.",
    symptomId: "hvac-leaking-water",
    causeIds: ["clogged-drain", "dirty-coils"],
  },
  {
    slug: "water-leak-only-when-running",
    name: "Water Leak Only When AC Running",
    description: "Leak occurs only during cooling operation. Condensate drain or pan.",
    symptomId: "hvac-leaking-water",
    causeIds: ["clogged-drain", "dirty-coils", "dirty-filter"],
  },
  // === HVAC SHORT CYCLING (4 conditions) ===
  {
    slug: "ac-short-cycling-summer",
    name: "AC Short Cycling in Summer",
    description: "Unit turns on and off rapidly during hot weather. Refrigerant, filter, or oversized system.",
    symptomId: "hvac-unit-short-cycling",
    causeIds: ["refrigerant-leak", "dirty-filter", "faulty-thermostat"],
  },
  {
    slug: "ac-short-cycling-after-filter-change",
    name: "AC Short Cycling After Filter Change",
    description: "Short cycling began or continued after filter replacement. Points to refrigerant or electrical.",
    symptomId: "hvac-unit-short-cycling",
    causeIds: ["refrigerant-leak", "failed-capacitor", "faulty-thermostat"],
  },
  {
    slug: "furnace-short-cycling",
    name: "Furnace Short Cycling",
    description: "Furnace starts and stops quickly. Filter, limit switch, or oversized furnace.",
    symptomId: "hvac-unit-short-cycling",
    causeIds: ["dirty-filter", "faulty-thermostat"],
  },
  {
    slug: "heat-pump-short-cycling",
    name: "Heat Pump Short Cycling",
    description: "Heat pump cycles rapidly in heating or cooling. Defrost, refrigerant, or thermostat.",
    symptomId: "hvac-unit-short-cycling",
    causeIds: ["bad-defrost-board", "refrigerant-leak", "faulty-thermostat"],
  },
  // === UNEVEN COOLING/HEATING (4 conditions) ===
  {
    slug: "uneven-cooling-upstairs-hot",
    name: "Upstairs Hot, Downstairs Cool",
    description: "Second floor stays warmer than main floor. Duct design, airflow, or single-zone limitation.",
    symptomId: "uneven-cooling-heating",
    causeIds: ["leaky-ducts", "dirty-filter", "faulty-thermostat"],
  },
  {
    slug: "uneven-cooling-some-rooms",
    name: "Some Rooms Hot, Others Cool",
    description: "Temperature varies significantly room to room. Duct leaks or branch restrictions.",
    symptomId: "uneven-cooling-heating",
    causeIds: ["leaky-ducts", "dirty-filter"],
  },
  {
    slug: "uneven-heating-winter",
    name: "Uneven Heating in Winter",
    description: "Some areas cold during heating season. Duct design, filter, or furnace capacity.",
    symptomId: "uneven-cooling-heating",
    causeIds: ["dirty-filter", "leaky-ducts", "faulty-thermostat"],
  },
  {
    slug: "uneven-after-duct-work",
    name: "Uneven After Duct Work",
    description: "Imbalance started after duct modifications. Duct design or damper adjustment.",
    symptomId: "uneven-cooling-heating",
    causeIds: ["leaky-ducts", "faulty-thermostat"],
  },
  // === AC RUNNING CONSTANTLY (pattern-based) ===
  {
    slug: "ac-running-constantly-in-extreme-heat",
    name: "AC Running Constantly in Extreme Heat",
    description: "System never cycles off during peak summer temperatures. May indicate undersized unit, refrigerant, or thermostat.",
    symptomId: "ac-running-constantly",
    causeIds: ["welded-contactor", "dirty-filter", "dirty-coils", "faulty-thermostat"],
  },
  {
    slug: "ac-running-constantly-after-filter-change",
    name: "AC Running Constantly After Filter Change",
    description: "Continuous operation persists after replacing the filter. Points to thermostat, contactor, or refrigerant.",
    symptomId: "ac-running-constantly",
    causeIds: ["welded-contactor", "faulty-thermostat", "dirty-coils"],
  },
  {
    slug: "ac-running-constantly-upstairs-only",
    name: "AC Running Constantly Upstairs Only",
    description: "Second floor thermostat or zone keeps calling for cooling. Zoning or duct design issue.",
    symptomId: "ac-running-constantly",
    causeIds: ["faulty-thermostat", "leaky-ducts", "dirty-filter"],
  },
  {
    slug: "ac-running-constantly-intermittent",
    name: "AC Running Constantly Intermittent",
    description: "Sometimes runs nonstop, other times cycles normally. Thermostat or contactor intermittency.",
    symptomId: "ac-running-constantly",
    causeIds: ["welded-contactor", "faulty-thermostat"],
  },
  // === THERMOSTAT DISPLAY BLANK (pattern-based) ===
  {
    slug: "thermostat-display-blank-after-power-outage",
    name: "Thermostat Display Blank After Power Outage",
    description: "Thermostat went dead after a power surge or outage. May need reset or replacement.",
    symptomId: "thermostat-display-blank",
    causeIds: ["faulty-thermostat"],
  },
  {
    slug: "thermostat-display-blank-intermittent",
    name: "Thermostat Display Blank Intermittent",
    description: "Display sometimes works, sometimes goes blank. Loose wiring or failing thermostat.",
    symptomId: "thermostat-display-blank",
    causeIds: ["faulty-thermostat"],
  },
  // === HEAT PUMP NOT SWITCHING (pattern-based) ===
  {
    slug: "heat-pump-not-switching-after-power-outage",
    name: "Heat Pump Not Switching After Power Outage",
    description: "Mode switching failed after power loss. Defrost board or reversing valve may need reset.",
    symptomId: "heat-pump-not-switching",
    causeIds: ["bad-defrost-board", "stuck-reversing-valve", "faulty-thermostat"],
  },
  {
    slug: "heat-pump-not-switching-in-extreme-heat",
    name: "Heat Pump Not Switching in Extreme Heat",
    description: "Heat pump stuck in wrong mode during peak temperatures. Defrost or thermostat issue.",
    symptomId: "heat-pump-not-switching",
    causeIds: ["bad-defrost-board", "faulty-thermostat"],
  },
  {
    slug: "heat-pump-not-switching-intermittent",
    name: "Heat Pump Not Switching Intermittent",
    description: "Sometimes switches correctly, sometimes gets stuck. Reversing valve or defrost board intermittency.",
    symptomId: "heat-pump-not-switching",
    causeIds: ["stuck-reversing-valve", "bad-defrost-board", "faulty-thermostat"],
  },
  // === NOISY OUTDOOR CONDENSER (pattern-based) ===
  {
    slug: "noisy-outdoor-condenser-but-unit-running",
    name: "Noisy Outdoor Condenser but Unit Running",
    description: "Outdoor unit makes unusual sounds but still cools. Capacitor, contactor, or fan motor.",
    symptomId: "noisy-outdoor-condenser",
    causeIds: ["failed-capacitor", "welded-contactor", "refrigerant-leak"],
  },
  {
    slug: "noisy-outdoor-condenser-in-extreme-heat",
    name: "Noisy Outdoor Condenser in Extreme Heat",
    description: "Noise worsens during hottest days. High load on capacitor or compressor.",
    symptomId: "noisy-outdoor-condenser",
    causeIds: ["failed-capacitor", "refrigerant-leak"],
  },
  {
    slug: "noisy-outdoor-condenser-intermittent",
    name: "Noisy Outdoor Condenser Intermittent",
    description: "Noise comes and goes. Loose parts, failing capacitor, or contactor.",
    symptomId: "noisy-outdoor-condenser",
    causeIds: ["failed-capacitor", "welded-contactor"],
  },
  // === HVAC TRIPPING BREAKER (pattern-based) ===
  {
    slug: "hvac-tripping-breaker-after-power-outage",
    name: "HVAC Tripping Breaker After Power Outage",
    description: "Breaker trips started after power restoration. Surge damage to capacitor or contactor.",
    symptomId: "hvac-tripping-breaker",
    causeIds: ["failed-capacitor", "welded-contactor", "dirty-coils"],
  },
  {
    slug: "hvac-tripping-breaker-in-extreme-heat",
    name: "HVAC Tripping Breaker in Extreme Heat",
    description: "Breaker trips during peak cooling demand. Overload from capacitor or compressor.",
    symptomId: "hvac-tripping-breaker",
    causeIds: ["failed-capacitor", "welded-contactor", "dirty-coils"],
  },
  {
    slug: "hvac-tripping-breaker-intermittent",
    name: "HVAC Tripping Breaker Intermittent",
    description: "Sometimes trips, sometimes runs fine. Intermittent short or failing component.",
    symptomId: "hvac-tripping-breaker",
    causeIds: ["failed-capacitor", "welded-contactor"],
  },
  // === STRANGE NOISES HVAC (pattern-based) ===
  {
    slug: "strange-noises-hvac-but-unit-running",
    name: "Strange Noises from HVAC but Unit Running",
    description: "Unusual sounds but system still operates. Loose parts, drain, or filter.",
    symptomId: "strange-noises-hvac",
    causeIds: ["failed-capacitor", "dirty-filter", "clogged-drain", "leaky-ducts"],
  },
  {
    slug: "strange-noises-hvac-intermittent",
    name: "Strange Noises from HVAC Intermittent",
    description: "Noises come and go. Loose duct, drain gurgling, or failing capacitor.",
    symptomId: "strange-noises-hvac",
    causeIds: ["failed-capacitor", "clogged-drain", "leaky-ducts"],
  },
  // === BAD ODORS FROM VENTS (pattern-based) ===
  {
    slug: "bad-odors-from-vents-some-vents-only",
    name: "Bad Odors from Some Vents Only",
    description: "Smell comes from specific registers. Localized drain or coil issue.",
    symptomId: "bad-odors-from-vents",
    causeIds: ["clogged-drain", "dirty-coils", "dirty-filter"],
  },
  {
    slug: "bad-odors-from-vents-after-filter-change",
    name: "Bad Odors from Vents After Filter Change",
    description: "Odor started or worsened after filter replacement. Drain or coil, not filter.",
    symptomId: "bad-odors-from-vents",
    causeIds: ["clogged-drain", "dirty-coils"],
  },
  // === HUMIDITY TOO HIGH (pattern-based) ===
  {
    slug: "humidity-too-high-upstairs-only",
    name: "Humidity Too High Upstairs Only",
    description: "Second floor feels clammy. Duct design, zoning, or undersized cooling.",
    symptomId: "humidity-too-high-home",
    causeIds: ["dirty-coils", "dirty-filter", "refrigerant-leak", "clogged-drain"],
  },
  {
    slug: "humidity-too-high-in-extreme-heat",
    name: "Humidity Too High in Extreme Heat",
    description: "Home feels sticky during hottest days. System struggling to dehumidify.",
    symptomId: "humidity-too-high-home",
    causeIds: ["dirty-coils", "dirty-filter", "refrigerant-leak"],
  },
];

export function getCondition(slug: string): Condition | undefined {
  return CONDITIONS.find((c) => c.slug === slug);
}

export function getConditionsForSymptom(symptomId: string): Condition[] {
  return CONDITIONS.filter((c) => c.symptomId === symptomId);
}

export function getCauseDetailsForCondition(condition: Condition) {
  return condition.causeIds
    .map((id) => {
      const cause = CAUSES[id];
      if (!cause) return null;
      return {
        ...cause,
        repairDetails: (cause.repairs || []).map((rId: string) => REPAIRS[rId]).filter(Boolean),
      };
    })
    .filter(Boolean);
}

export function getDiagnosticTestsForCause(symptomId: string, causeSlug: string) {
  const tech = getCauseTechnicalContent(symptomId, causeSlug);
  return tech?.verificationTest || [];
}
