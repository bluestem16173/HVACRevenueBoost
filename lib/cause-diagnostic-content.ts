/**
 * Extended diagnostic content for each cause.
 * Used in Interactive Diagnostic Tree: how it happens, why change, why by pros.
 */

export interface CauseDiagnosticDetail {
  /** How does this failure happen? */
  howItHappens: string;
  /** Why should it be fixed/replaced? */
  whyChange: string;
  /** Why should a professional do it? */
  whyByPros: string;
}

export const CAUSE_DIAGNOSTIC_CONTENT: Record<string, CauseDiagnosticDetail> = {
  "refrigerant-leak": {
    howItHappens:
      "Refrigerant leaks develop from corrosion, vibration fatigue, or manufacturing defects in copper lines, joints, or coils. Over time, small pinholes or cracked solder joints allow refrigerant to escape.",
    whyChange:
      "Low refrigerant prevents the system from absorbing and rejecting heat. The compressor runs harder, efficiency drops, and the evaporator can freeze—leading to compressor damage if left unchecked.",
    whyByPros:
      "EPA Section 608 requires certification to handle refrigerants. Leak detection, evacuation, and recharge require specialized equipment. Some refrigerants are restricted or phased out; improper handling is illegal and can damage the system.",
  },
  "failed-capacitor": {
    howItHappens:
      "Capacitors store electrical charge to give motors a starting boost. Heat, age, and power surges cause them to bulge, leak, or fail. Outdoor exposure accelerates degradation.",
    whyChange:
      "A failed capacitor prevents the compressor or fan motor from starting. You may hear a hum as the motor tries to turn but cannot. Running without a working capacitor can damage the motor.",
    whyByPros:
      "Capacitors hold high voltage even when power is off. Improper discharge can cause serious shock. Access requires removing the panel on live equipment; wiring mistakes can damage the compressor.",
  },
  "blower-capacitor-failed": {
    howItHappens:
      "Indoor blower motors often use a run capacitor. Age, heat, and electrical surges cause it to fail. The capacitor may bulge or show signs of leakage.",
    whyChange:
      "Without the capacitor, the blower motor cannot start or may hum without spinning. Airflow stops, which can cause the evaporator to freeze and damage the system.",
    whyByPros:
      "The air handler carries high voltage. Capacitors must be safely discharged before handling. Incorrect wiring can damage the motor or create a fire hazard.",
  },
  "dirty-coils": {
    howItHappens:
      "Dust, pet dander, and debris accumulate on the evaporator coil over time. Restricted airflow and poor filter maintenance accelerate buildup. The coil acts like a filter when the filter is dirty.",
    whyChange:
      "Dirty coils block heat exchange. The system cools poorly, runs longer, and may ice over. Efficiency drops and energy costs rise. Severe buildup can cause water leaks and mold.",
    whyByPros:
      "The evaporator is inside the air handler near electrical components. Access requires careful disassembly. Coils are delicate; improper cleaning can bend fins or damage refrigerant lines.",
  },
  "faulty-thermostat": {
    howItHappens:
      "Thermostats can drift out of calibration, lose power from dead batteries, or fail due to age or power surges. Wiring issues or loose connections can also cause false readings.",
    whyChange:
      "A faulty thermostat may not signal the HVAC to run, or it may signal incorrectly—causing short cycling, constant running, or no response. Comfort and efficiency suffer.",
    whyByPros:
      "Thermostat replacement involves low-voltage wiring (usually 24V). Wiring mistakes can damage the control board or prevent the system from working. Some systems require professional programming.",
  },
  "clogged-drain": {
    howItHappens:
      "Algae, mold, and debris block the condensate drain pipe. Humid conditions and lack of maintenance allow buildup. The drain can also be clogged by insects or debris from outside.",
    whyChange:
      "A clogged drain causes water to back up into the drain pan or overflow. Safety switches may shut off the system. Water can damage the air handler, ceiling, or flooring.",
    whyByPros:
      "Drain clearing is often DIY-friendly. However, if the pan is cracked or the drain is inaccessible, or if water has already damaged components, a pro can assess and repair properly.",
  },
  "dirty-filter": {
    howItHappens:
      "Filters trap dust, pollen, and debris. Over time they clog—faster with pets, construction, or poor outdoor air quality. High-efficiency filters clog more quickly.",
    whyChange:
      "A dirty filter restricts airflow. The blower works harder, efficiency drops, and the evaporator can freeze. In extreme cases, reduced airflow can damage the heat exchanger in furnaces.",
    whyByPros:
      "Filter replacement is typically DIY. However, if you have medical sensitivities, complex filtration systems, or hard-to-reach filters, a pro can advise on the right product and installation.",
  },
  "failed-blower-motor": {
    howItHappens:
      "Blower motors fail from bearing wear, dust buildup, electrical overload, or age. Lack of lubrication, dirty filters, or restricted airflow can accelerate failure.",
    whyChange:
      "A failed blower means no airflow. The system cannot heat or cool. The evaporator may freeze; in heating, the heat exchanger can overheat and crack—a serious safety hazard.",
    whyByPros:
      "Blower replacement requires disassembling the air handler, working near high voltage, and often removing the blower wheel. Incorrect installation can damage the motor or create electrical hazards.",
  },
  "welded-contactor": {
    howItHappens:
      "Electrical arcing across the contactor contacts can weld them together. Power surges, dirty contacts, or age cause this. The contacts fail to open when the thermostat stops calling.",
    whyChange:
      "A welded contactor keeps the outdoor unit running constantly—even when the thermostat is off. This wastes energy, shortens compressor life, and can cause overheating.",
    whyByPros:
      "The contactor carries high voltage (240V) to the compressor and fan. Replacing it requires working inside the live outdoor unit. Mistakes can cause shock or compressor damage.",
  },
  "leaky-ducts": {
    howItHappens:
      "Ducts develop leaks from age, poor installation, or damage. Gaps at joints, crushed sections, or holes in unconditioned spaces allow conditioned air to escape.",
    whyChange:
      "Leaky ducts waste 20–30% of conditioned air. Some rooms get too little airflow; efficiency drops; the system runs longer. Ducts in attics or crawl spaces lose the most.",
    whyByPros:
      "Duct sealing in accessible areas can be DIY. However, sealing inside walls, balancing the system, or addressing design issues requires professional assessment and equipment.",
  },
  "stuck-reversing-valve": {
    howItHappens:
      "The reversing valve switches refrigerant flow for heating vs. cooling. Debris, wear, or loss of the pilot solenoid pressure can cause it to stick. It may get stuck in one position or fail to shift.",
    whyChange:
      "A stuck valve traps the heat pump in one mode—e.g., cooling when you need heat. The system may blow lukewarm air, run constantly, or fail to meet the thermostat. Efficiency plummets.",
    whyByPros:
      "Replacing the reversing valve requires recovering refrigerant, opening the refrigerant circuit, brazing in a new valve, and recharging. EPA certification and specialized tools are required. DIY is not legal or safe.",
  },
  "bad-defrost-board": {
    howItHappens:
      "The defrost board controls the ice-melting cycle on heat pumps. Power surges, moisture, or age can damage it. A failed board may not initiate defrost or may defrost at the wrong times.",
    whyChange:
      "Without proper defrost, ice builds on the outdoor coil and blocks heat absorption. The heat pump loses heating capacity, may shut down on safety, or run inefficiently.",
    whyByPros:
      "The defrost board is inside the outdoor unit with high-voltage components. Wiring is complex; incorrect connections can damage the compressor or create a fire hazard.",
  },
  "worn-igniter": {
    howItHappens:
      "Hot-surface igniters are ceramic elements that glow to light the gas. They become brittle with age and thermal cycling. Cracks or breaks prevent the burner from lighting.",
    whyChange:
      "A failed igniter means the furnace cannot light. You may hear the blower or gas valve click, but no heat. The system will lock out after several failed ignition attempts.",
    whyByPros:
      "The igniter is inside the burner compartment near gas lines. Access requires removing panels and working near combustion. Handling the igniter roughly can crack it; gas work requires care.",
  },
  "dirty-flame-sensor": {
    howItHappens:
      "The flame sensor confirms the burner has lit. Soot and oxidation coat the rod over time, reducing its ability to detect the flame. The control board then shuts off the gas as a safety measure.",
    whyChange:
      "A dirty sensor causes the furnace to light briefly then shut down—often after a few seconds. The system may try several times then lock out. No heat until the sensor is cleaned or replaced.",
    whyByPros:
      "The flame sensor is in the burner compartment. Access requires removing panels. Working near gas and ignition requires care; improper handling can affect safety shutdown operation.",
  },
};

export function getCauseDiagnosticDetail(causeId: string): CauseDiagnosticDetail | null {
  return CAUSE_DIAGNOSTIC_CONTENT[causeId] ?? null;
}
