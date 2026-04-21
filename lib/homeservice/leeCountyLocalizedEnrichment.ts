import type { ServiceVertical } from "@/lib/localized-city-path";
import { formatCityPathSegmentForDisplay } from "@/lib/localized-city-path";
import { enforceStoredSlug } from "@/lib/slug-utils";
import { LEE_COUNTY_CITIES } from "@/lib/vertical-hub-shared";

const LEE_CITY_SET = new Set<string>(LEE_COUNTY_CITIES.map((s) => s.toLowerCase()));

/** True when `slug` is `{vertical}/{pillar}/{city}` and `city` is a Lee County storage segment (`*-fl`). */
export function isLeeCountyCityStorageSlug(fullSlug: string): boolean {
  const parts = enforceStoredSlug(fullSlug).split("/").filter(Boolean);
  if (parts.length < 3) return false;
  return LEE_CITY_SET.has(String(parts[parts.length - 1] ?? "").toLowerCase());
}

/**
 * Per-city SEO / market bullets — **context layer only** (keep diagnostic JSON identical across cities).
 * Keys: storage tails from {@link LEE_COUNTY_CITIES}.
 */
function plumbingCityContextLines(place: string, citySeg: string): string[] {
  const k = citySeg.toLowerCase();
  const byCity: Record<string, string[]> = {
    "cape-coral-fl": [
      `In ${place}, canal-adjacent homes and long waterfront-adjacent runs increase hidden chase moisture and exterior steel exposure—corrosion shows up on hose bibs, unions, and tank jackets before the “big leak” event.`,
      "Salt-laden air from Gulf access plus irrigation-heavy lots accelerates exterior fixture pitting and pan corrosion on garage or lanai water heaters.",
      "When hot water drops or pressure swings, separate canal-area distribution quirks from true tank or element failure before buying parts.",
    ],
    "estero-fl": [
      `In ${place}, newer high-demand homes and amenity-heavy communities create sharp evening hot-water spikes—short cycling and recovery faults show up as “runs out fast” complaints.`,
      "Larger fixture counts and multi-bath draw patterns separate true low recovery from mixing or recirculation side issues.",
      "When performance drops after move-in surges, verify setpoints and demand timing before assuming the tank is undersized or failed.",
    ],
    "fort-myers-fl": [
      `In ${place}, the inland–coastal mix still drives hard-water scaling, high evening hot-water demand, and humid exterior installs that rust tank jackets and pan seams quickly.`,
      "Peak multi-bath and laundry stacks stress recovery—separate distribution and mixing faults from true element or control failure.",
      "When pressure fluctuates county-wide after storms, confirm whether the symptom is house-wide before focusing on the water heater alone.",
    ],
    "lehigh-acres-fl": [
      `In ${place}, rapid residential growth and hard well water still stress tank elements and dip tubes—recovery complaints often track scale before the tank is structurally failed.`,
      "Humid summers and afternoon storms keep exterior hose bibs and relief piping under corrosion cycles—small weeps at threads show up before slab intrusion.",
      "When pressure swings track neighborhood demand, confirm house-wide supply before assuming the water heater is the root fault.",
    ],
    "bonita-springs-fl": [
      `In ${place}, Gulf proximity and seasonal tourism spikes drive uneven water demand—short hot-water complaints often track recovery and mixing before tank failure.`,
      "Canal-adjacent lots and irrigation-heavy landscaping accelerate exterior fixture corrosion and hose-bib weeps.",
      "When pressure drops appear after peak visitor weeks, separate distribution load from true supply faults.",
    ],
    "north-fort-myers-fl": [
      `In ${place}, Caloosahatchee-adjacent humidity and mixed housing stock mean slab and wall paths hide slow leaks longer than open-garage installs.`,
      "Older galvy and CPVC transitions remain common—separate material-era joints from active tank faults before repeated element swaps.",
      "Storm-season pressure swings can track county-wide; confirm house-wide gauges before focusing on the heater alone.",
    ],
  };
  if (byCity[k]) return byCity[k]!;
  return [
    `In ${place} and across Lee County, hard water and high daily hot-water demand accelerate sediment, dip-tube, and element stress in tank heaters.`,
    "Coastal humidity and occasional storm water can speed exterior jacket rust and pan corrosion on garage or lanai installations—small weeps become slab or floor damage fast.",
    "When pressure fluctuates or hot water runs short during peak evening use, separate distribution issues from true heater faults before you buy parts.",
  ];
}

function electricalCityContextLines(place: string, citySeg: string): string[] {
  const k = citySeg.toLowerCase();
  const byCity: Record<string, string[]> = {
    "cape-coral-fl": [
      `In ${place}, long dock, pool, and spa circuits plus canal-adjacent moisture increase GFCI nuisance trips and outdoor disconnect corrosion.`,
      "Salt air wicks into meter bases and lug pockets—heat under load turns intermittent resistance into repeat breaker trips.",
      "After heavy irrigation or pump cycles, separate motor-start sag from true branch faults before resetting large loads repeatedly.",
    ],
    "estero-fl": [
      `In ${place}, newer homes pack AFCI/GFCI density, EV circuits, and large kitchen loads—nuisance trips often track neutral sharing mistakes or parallel neutral paths.`,
      "Whole-home surge devices and smart panels are common—verify labeling and neutrals before swapping breakers on symptoms alone.",
      "High simultaneous cooling and pool loads stress service sizing—watch for heat at the main when everything runs at once.",
    ],
    "fort-myers-fl": [
      `In ${place}, older stock mixes with dense infill—knob-and-tube remnants, doubled neutrals, and overloaded subpanels show up as heat, buzz, or partial power under summer load.`,
      "Humidity keeps fault paths conductive—trips that “clear” after reset often return once the breaker and bus warm up.",
      "When cooling and kitchen peaks align, whole-home draw exposes weak lugs and undersized mains before individual devices fail outright.",
    ],
    "lehigh-acres-fl": [
      `In ${place}, inland heat and fast build-out mean panels fill with kitchen, laundry, and garage loads before service upgrades catch up—nuisance trips often read as “bad breakers” when the bus is already warm.`,
      "Well-water hardness and irrigation pump circuits add motor load and ground paths—separate pump faults from branch trips before you stack resets.",
      "Afternoon storms and long cooling runtime stack whole-home draw—watch for dimming or half-leg symptoms that point past a single device.",
    ],
    "bonita-springs-fl": [
      `In ${place}, seasonal occupancy swings and pool-heavy backyards stack motor and heat-pump loads on panels—nuisance trips often track neutral discipline, not “weak breakers.”`,
      "Gulf moisture and irrigation keep outdoor disconnects and GFCI devices under corrosion cycles—verify torque and labeling before repeated resets.",
      "When flicker tracks to one leg, separate utility sag from loose neutrals early.",
    ],
    "north-fort-myers-fl": [
      `In ${place}, mixed-era housing and river-adjacent humidity expose doubled neutrals, overloaded mains, and DIY add-ons that show up as buzz, heat, or partial power.`,
      "Storm seasons align with surge and neutral-instability calls—document which rooms lose power together.",
      "Well and irrigation pump circuits add motor sag—separate branch faults from pump starts before stacking resets.",
    ],
  };
  if (byCity[k]) return byCity[k]!;
  return [
    `In ${place} and across Lee County, heat-driven whole-home electrical load plus coastal moisture increases stress on breakers, GFCI devices, and outdoor disconnects.`,
    "Salt air accelerates corrosion on meter bases, panel lugs, and conduit bodies—thermal trips that ‘go away’ often return under the next humidity spike.",
    "After summer storms, surge and partial-power symptoms spike—verify what is branch-level versus utility-side before resetting equipment repeatedly.",
  ];
}

function hvacCityContextLines(place: string, citySeg: string): string[] {
  const k = citySeg.toLowerCase();
  const byCity: Record<string, string[]> = {
    "cape-coral-fl": [
      `In ${place}, long cooling seasons and pool-adjacent humidity keep coils wet longer—biofilm, drain pan overflow, and blower motor stress stack faster than inland averages.`,
      "Salt air etches fin stock and outdoor electrical shells; condenser coil corrosion shows up as high head pressure before obvious noise.",
      "Canal breezes can mask overheating outdoor units with gusts—verify measured temperatures, not airflow guesses alone.",
    ],
    "estero-fl": [
      `In ${place}, newer tight envelopes plus large glass area create high latent load—short cycling and humidity complaints often track airflow and control setup, not charge alone.`,
      "Zoned systems with bypass issues show up as rooms that never dehumidify—verify bypass and static before adding refrigerant.",
      "Peak evening whole-home draws stack runtime—capacitor and contactor wear shows up as intermittent no-start under load.",
    ],
    "fort-myers-fl": [
      `In ${place}, humidity and long summer runtime keep drains and blower assemblies under continuous load—clogged pans and weak airflow are primary compressor killers.`,
      "Salt air still reaches inland garages and lanai closets—outdoor electrical and line sets corrode faster than northern markets.",
      "Afternoon thunderstorms and voltage sags coincide with no-cool calls—separate supply problems from refrigerant faults before sealed-system work.",
    ],
    "lehigh-acres-fl": [
      `In ${place}, inland summer heat and long runtimes stress budget installs—dirty filters and weak condensate paths show up as “not keeping up” before charge faults surface.`,
      "Hard water and dust load coils and pans faster than coastal-only markets—capacity loss can track to airflow and coil loading before mechanical noise changes.",
      "Thunderstorm voltage sags align with no-cool calls—separate supply-side blips from refrigerant-class failures before sealed-system work.",
    ],
    "bonita-springs-fl": [
      `In ${place}, high latent load from glass-heavy plans and lanai living keeps coils wet—drain and static issues read as capacity loss before charge faults show.`,
      "Seasonal peaks and pool heat loads stack afternoon runtime—capacitor and contactor wear shows up as intermittent no-start.",
      "Gulf air still reaches inland lots—plan coil wash cadence and electrical shell checks.",
    ],
    "north-fort-myers-fl": [
      `In ${place}, mixed housing ages mean duct leakage and under-sized returns masquerade as “low charge” until static is measured.`,
      "River-adjacent humidity plus long runtimes stress condensate paths—pan switches trip during peak weeks.",
      "Voltage sag after storms aligns with no-cool calls—verify supply before sealed-system work.",
    ],
  };
  if (byCity[k]) return byCity[k]!;
  return [
    `In ${place} and across Lee County, high humidity and long cooling runtime increase failure rates for airflow paths, drains, and condensate handling.`,
    "Salt air exposure near coastal zones accelerates corrosion on electrical panels, disconnects, and outdoor HVAC equipment.",
    "Frequent start-stop cycling in hot, humid weather increases wear on capacitors, compressors, and pumps—get measured diagnosis before minor faults stack.",
  ];
}

/** `cityStorageSlug` e.g. `fort-myers-fl` — bullets for {@link HsdV25Payload.cityContext} (trade-specific). */
export function buildCityContextForLeeCountyCity(
  cityStorageSlug: string,
  vertical: ServiceVertical,
  pillarSlug?: string | null
): string[] {
  const place = formatCityPathSegmentForDisplay(cityStorageSlug);
  const seg = cityStorageSlug.toLowerCase();
  const pillar = (pillarSlug ?? "").trim().toLowerCase();

  /** Pillar + Lee city: product copy for localized context (does not change diagnostic JSON branches). */
  if (vertical === "electrical" && pillar === "power-out-in-one-room" && seg === "fort-myers-fl") {
    return [
      `Power out in one room in ${place}? If part of your home suddenly lost power, don't panic—this is usually a localized circuit issue, not a full electrical failure.`,
      "In most cases, it comes down to: a tripped breaker; a failed outlet or GFCI; or a loose or damaged wire connection.",
      "If breakers keep tripping or outlets feel warm, don't ignore it—this can escalate into a fire risk, so identify the cause quickly or stop and call a licensed electrician.",
    ];
  }

  if (vertical === "plumbing") return plumbingCityContextLines(place, seg);
  if (vertical === "electrical") return electricalCityContextLines(place, seg);
  return hvacCityContextLines(place, seg);
}

/**
 * Lead-focused CTA for Lee County (must satisfy {@link assertCtaStrength}: $1,500+, stress, technician).
 * `cityStorageSlug` tail (e.g. `cape-coral-fl`) — opens with that city; avoids hardcoding a different metro name.
 */
export function buildLocalizedLeeCountyCta(vertical: ServiceVertical, cityStorageSlug: string): string {
  const place = formatCityPathSegmentForDisplay(cityStorageSlug);
  if (vertical === "electrical") {
    return `Electrical issues in ${place} often worsen under load—especially during peak cooling hours when whole-home draw is highest. Shut off the affected circuit at the breaker and get a licensed electrician serving ${place} and surrounding Lee County before damage spreads across feeders or panels. Faults left energized under summer humidity load routinely exceed $1,500 in repair scope—book a service call for measured testing before arc or heat stress escalates.`;
  }
  if (vertical === "plumbing") {
    return `In ${place}, leaks and drain backups escalate quickly in Southwest Florida’s humid climate due to continuous use and moisture in wall and slab paths. Shut off the water main or fixture stop if you can and get a licensed plumber serving ${place} before drywall, cabinet, and subfloor damage spreads. Standing water repairs commonly cross $1,500 once cabinetry and finishes are involved—schedule same-day diagnosis and containment.`;
  }
  return `In ${place}, comfort systems that underperform in Southwest Florida heat can quickly turn into compressor or coil damage when runtime stretches trying to hold setpoint. Stop extended runtime once comfort stalls and schedule a licensed HVAC technician serving ${place} and Lee County before sealed-system stress stacks repair cost. Letting it run wrong under humidity load often exceeds $1,500 in compressor-class or coil-and-charge work—book service before peak demand adds more load.`;
}

/** Mutates HSD v2.5 JSON in place when the page is a Lee County localized pillar. */
export function applyLeeCountyLocalizedEnrichmentToHsdJson(
  json: Record<string, unknown>,
  storageSlug: string,
  vertical: ServiceVertical
): void {
  if (!isLeeCountyCityStorageSlug(storageSlug)) return;
  const parts = enforceStoredSlug(storageSlug).split("/").filter(Boolean);
  const citySeg = parts[parts.length - 1] ?? "";
  if (!citySeg) return;
  const pillarSeg = parts.length >= 2 ? (parts[1] ?? "") : "";
  json.cityContext = buildCityContextForLeeCountyCity(citySeg, vertical, pillarSeg);
  json.cta = buildLocalizedLeeCountyCta(vertical, citySeg);
}
