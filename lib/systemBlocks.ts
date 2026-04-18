/**
 * Curated HTML snippets for HVAC “system knowledge” — reused across city/issue pages.
 * Keep copy tight; sanitize is unnecessary when only trusted strings live here.
 */

export const SYSTEM_BLOCK_KEYS = [
  "ac_start_sequence",
  "cooling_cycle",
  "cooling_stop_damage_risk",
  "thermostat_cooling_check",
  "airflow_dynamics",
  "refrigerant_levels_test",
  "refrigerant_cycle",
  "cooling_repair_cost_bands",
  "cooling_tampa_technician_cta",
  "electrical_control",
] as const;

export type SystemBlockKey = (typeof SYSTEM_BLOCK_KEYS)[number];

export type SystemBlock = { title: string; content: string };

export const SYSTEM_BLOCKS: Record<SystemBlockKey, SystemBlock> = {
  ac_start_sequence: {
    title: "How Your AC System Starts (And Why It Fails)",
    content: `
<p>AC systems don't fail randomly. They fail in predictable ways based on electrical load, component wear, and environmental stress.</p>
<ol>
  <li><strong>Thermostat sends signal:</strong> When indoor temperature rises above setpoint, the thermostat sends a low-voltage signal to start cooling.</li>
  <li><strong>Control + contactor engage:</strong> The indoor control path closes so high voltage can reach the outdoor unit.</li>
  <li><strong>Capacitor jump-starts components:</strong> Provides the surge needed to start the compressor and outdoor fan.</li>
  <li><strong>Compressor + fan run:</strong> Refrigerant circulates; heat is removed from the house and rejected outside.</li>
</ol>
<p><strong>In Tampa's heat:</strong> Capacitors degrade faster, voltage sag during peak demand is common, and long run times increase wear.</p>
<p><strong>What this means:</strong></p>
<ul>
  <li>No response → thermostat or power path (transformer, breaker, disconnect)</li>
  <li>Clicking but no start → capacitor or contactor</li>
  <li>Outdoor unit silent → disconnect, breaker, or contactor not pulling in</li>
</ul>
`,
  },

  cooling_cycle: {
    title: "The Cooling Cycle (What “Not Cooling” Really Means)",
    content: `
<p>A split AC moves heat from indoors to outdoors using refrigerant phase change — not by “making cold.”</p>
<ul>
  <li><strong>Indoors:</strong> Low-pressure liquid flashes at the evaporator and absorbs sensible + latent heat from return air.</li>
  <li><strong>Compressor:</strong> Raises pressure so heat can be rejected at the condenser.</li>
  <li><strong>Outdoors:</strong> The condenser coil and fan dump that heat to ambient air.</li>
</ul>
<p><strong>When capacity feels “gone”:</strong> Either less heat is being picked up indoors (airflow, coil wetting, metering), less heat is being rejected outdoors (condenser airflow, head pressure), or the compressor isn't maintaining mass flow.</p>
<p><strong>Tampa humidity:</strong> High latent load hides behind “warm supply” — verify wet-bulb and coil behavior, not delta-T alone.</p>
`,
  },

  cooling_stop_damage_risk: {
    title: "🟥 Stop — risk of damage",
    content: `
<ul>
  <li>System runs continuously without cooling</li>
  <li>Ice forms on coils or lines</li>
  <li>Burning smell or loud electrical buzzing</li>
</ul>
<p>At this point, continued operation risks compressor failure.</p>
`,
  },

  thermostat_cooling_check: {
    title: "Check thermostat settings",
    content: `
<p><strong>Homeowner:</strong> Ensure <strong>Cool</strong> and setpoint <strong>below room temperature</strong>.</p>
<p><strong>What it means:</strong> If wrong, the system won&rsquo;t call for cooling.</p>
<p><strong>Next step:</strong> If correct and still no cooling → the issue is deeper.</p>
<p><strong>If ignored:</strong> System keeps running incorrectly → unnecessary wear → <strong>$200–$500</strong> fixes escalate.</p>
`,
  },

  airflow_dynamics: {
    title: "Why Airflow Is Critical to AC Performance",
    content: `
<p>Most homeowners catch this at the <strong>thermostat</strong> or <strong>filter</strong> stage. Once it reaches <strong>refrigerant</strong> or <strong>compressor</strong> issues, costs increase quickly.</p>
<p><strong>Most &ldquo;not cooling&rdquo; issues in Tampa are not minor.</strong> High heat forces longer run cycles. When cooling drops, it&rsquo;s usually: airflow restriction → low refrigerant (leak) → compressor under load.</p>
<p>This means the system is running outside its design limits.</p>
<p><strong>If ignored:</strong> airflow restriction → coil freeze → compressor strain → <strong>$1,500–$3,500</strong> failure.</p>
<p>Your system depends on design airflow to exchange BTUs at the evaporator and condenser.</p>
<ul>
  <li>Return air passes over the coil to absorb heat; restricted airflow drops suction pressure and coil temperature.</li>
  <li>Severe restriction can drive ice — then airflow falls further and supply air climbs toward plenum temperature.</li>
  <li>Outdoor coil fouling raises head pressure and cuts effective capacity even when the compressor is “running.”</li>
</ul>
<p><strong>In humid climates like Tampa:</strong> Airflow problems quickly show as excess humidity, weak sensible cooling, and long run times.</p>
<p><strong>Common signs:</strong></p>
<ul>
  <li>Weak airflow from vents</li>
  <li>Uneven room temperatures</li>
  <li>Ice on lines or indoor coil</li>
</ul>
`,
  },

  refrigerant_levels_test: {
    title: "Test system refrigerant levels",
    content: `
<p><strong>Homeowner:</strong> Note reduced cooling.</p>
<p><strong>Pro:</strong> Use gauges to measure charge and superheat.</p>
<p><strong>Risk:</strong> Low refrigerant reduces heat exchange at the evaporator coil, forcing longer cycles and increasing compressor load → <strong>$1,500+</strong> failure.</p>
`,
  },

  refrigerant_cycle: {
    title: "How Refrigerant Actually Cools Your Home",
    content: `
<p>Refrigerant is the working fluid that carries heat — it doesn't “run out” like fuel unless there is a leak or the circuit was opened.</p>
<ul>
  <li>Evaporator: refrigerant absorbs heat as it boils at low pressure.</li>
  <li>Compressor: moves vapor and maintains the high/low pressure split.</li>
  <li>Condenser: rejects heat as vapor condenses to liquid.</li>
</ul>
<p><strong>Low charge = system imbalance:</strong></p>
<ul>
  <li>Reduced cooling capacity and unstable superheat/subcooling</li>
  <li>Coil behavior that can mimic airflow faults (ice, warm supply)</li>
  <li>Compressor stress if run for long periods out of spec</li>
</ul>
<p><strong>Rule:</strong> Never add charge without verifying airflow and following manufacturer charging method.</p>
`,
  },

  cooling_repair_cost_bands: {
    title: "Typical repair cost ranges (ballpark)",
    content: `
<ul>
  <li><strong>Basic fix — $20–$100:</strong> Filter or settings</li>
  <li><strong>Moderate repair — $300–$800:</strong> Thermostat, airflow, minor components</li>
  <li><strong>Major repair — $500–$1,500:</strong> Refrigerant leak + recharge</li>
  <li><strong>Failure — $1,500–$3,500+:</strong> Compressor damage or replacement</li>
</ul>
`,
  },

  cooling_tampa_technician_cta: {
    title: "When to call a technician (Tampa heat + cost)",
    content: `
<div class="hsd-cta-tampa-cost">
<p>If your AC isn&rsquo;t cooling after basic checks, don&rsquo;t keep running it.</p>
<p>In Tampa heat, extended runtime under fault conditions is what turns small issues into compressor failure.</p>
<p><span aria-hidden="true">👉</span> <strong>Get a technician out today before this becomes a $3,000 problem.</strong></p>
</div>
`,
  },

  electrical_control: {
    title: "Electrical &amp; Control Path (Why the Unit Won’t Start)",
    content: `
<p>Cooling needs both a valid <strong>low-voltage call</strong> and a clean <strong>high-voltage path</strong> to the outdoor section.</p>
<ul>
  <li><strong>24VAC:</strong> R/C power, thermostat switch, safeties (float, pressure), zone boards — any break kills Y.</li>
  <li><strong>Contactor:</strong> Coil must pull in; pitted contacts or weak 24V under load causes chatter or no start.</li>
  <li><strong>Capacitors:</strong> Start/run assist for fan and compressor; weak µF reads as hum, click, or slow fan.</li>
  <li><strong>High voltage:</strong> Breaker, disconnect, whip, compressor terminals — measure before condemning a compressor.</li>
</ul>
<p><strong>Tampa note:</strong> Heat inside the outdoor electrical compartment accelerates cap and contactor aging; ants across contacts are common.</p>
`,
  },
};

