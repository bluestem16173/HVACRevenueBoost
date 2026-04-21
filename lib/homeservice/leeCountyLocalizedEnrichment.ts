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
    "fort-myers-beach-fl": [
      `In ${place}, relentless salt air and wind-driven spray corrode outdoor connections, relief piping, and cabinet hardware fast—surface rust is often a leading indicator, not cosmetic.`,
      "Rapid jacket and union oxidation on coastal installs shortens element and anode life; small exterior weeps can flood finished levels when tides and storms stack water paths.",
      "Prioritize stop-the-water triage on active tank or line weeps—humidity and salt keep corrosion moving even when the leak looks minor.",
    ],
    "estero-fl": [
      `In ${place}, newer high-demand homes and amenity-heavy communities create sharp evening hot-water spikes—short cycling and recovery faults show up as “runs out fast” complaints.`,
      "Larger fixture counts and multi-bath draw patterns separate true low recovery from mixing or recirculation side issues.",
      "When performance drops after move-in surges, verify setpoints and demand timing before assuming the tank is undersized or failed.",
    ],
    "sanibel-fl": [
      `In ${place}, barrier-island salt exposure and post-storm rebuild cycles accelerate exterior tank and piping corrosion—inspect exposed runs after any wind-driven salt event.`,
      "Bridge access and island logistics can delay heavy equipment—early containment on active leaks limits finished-floor damage.",
      "Hot-only discoloration after surge or replumb periods should trigger integrity planning, not repeated element swaps alone.",
    ],
    "north-captiva-fl": [
      `In ${place}, Gulf-barrier exposure and limited road service patterns mean exterior tank, hose bib, and relief piping corrode aggressively—small weeps can soak elevated or pile-built shells before they read as “major” indoors.`,
      "Boat and barge logistics for heavy equipment slow full swaps—plan containment and photo documentation early on active leaks.",
      "Non-municipal water sources and generator-backed homes are common—separate pressure and quality symptoms from pure heater faults before parts stacking.",
    ],
    "fort-myers-fl": [
      `In ${place}, the inland–coastal mix still drives hard-water scaling, high evening hot-water demand, and humid exterior installs that rust tank jackets and pan seams quickly.`,
      "Peak multi-bath and laundry stacks stress recovery—separate distribution and mixing faults from true element or control failure.",
      "When pressure fluctuates county-wide after storms, confirm whether the symptom is house-wide before focusing on the water heater alone.",
    ],
    "gateway-fl": [
      `In ${place}, newer master-planned density plus hard water drives fast scale on elements and dip-tube wear—short “runs out hot” complaints often track recovery, not just thermostat setpoint.`,
      "Garage and lanai tank installs see heavy humidity cycling—jacket rust and pan weeps show up before homeowners notice floor damage.",
      "Even inland of the barrier islands, summer electrical storms correlate with nuisance trips and dry-fired elements—separate power path from pure tank failure before parts stacking.",
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
    "fort-myers-beach-fl": [
      `In ${place}, salt fog corrodes outdoor panels, meter housings, and conduit bodies quickly—surface rust near lugs is a field priority, not a paint issue.`,
      "Wind-driven moisture follows nicks in SE cable jackets; coastal trips often return after the next humidity spike if connections are not cleaned and torqued.",
      "After named storms, surge damage and neutral instability symptoms spike—separate branch damage from utility-side loss with measured checks.",
    ],
    "estero-fl": [
      `In ${place}, newer homes pack AFCI/GFCI density, EV circuits, and large kitchen loads—nuisance trips often track neutral sharing mistakes or parallel neutral paths.`,
      "Whole-home surge devices and smart panels are common—verify labeling and neutrals before swapping breakers on symptoms alone.",
      "High simultaneous cooling and pool loads stress service sizing—watch for heat at the main when everything runs at once.",
    ],
    "sanibel-fl": [
      `In ${place}, salt exposure and storm recovery rewires stress outdoor feeders and generator transfer gear—corrosion hides under heat-shrink that still looks intact.`,
      "Island logistics can delay parts—document trip patterns and burning smells early to avoid extended energized faults.",
      "After flooding, separate replaced branch circuits from old aluminum or damaged homeruns still in the walls.",
    ],
    "north-captiva-fl": [
      `In ${place}, salt fog and wind-driven spray attack meter bases, mastheads, and dock feeders first—surface oxidation near lugs is a stop-and-verify signal, not a cosmetic pass.`,
      "Generator and transfer-switch installs are dense—neutral errors and GEC issues masquerade as “random” trips until load stacks.",
      "Limited truck access can stretch return visits—photo-label suspect breakers and heat signatures on first pass.",
    ],
    "fort-myers-fl": [
      `In ${place}, older stock mixes with dense infill—knob-and-tube remnants, doubled neutrals, and overloaded subpanels show up as heat, buzz, or partial power under summer load.`,
      "Humidity keeps fault paths conductive—trips that “clear” after reset often return once the breaker and bus warm up.",
      "When cooling and kitchen peaks align, whole-home draw exposes weak lugs and undersized mains before individual devices fail outright.",
    ],
    "gateway-fl": [
      `In ${place}, rapid infill means AFCI/GFCI density, EV chargers, and pool heat pumps stack on panels sized for older baselines—nuisance trips often track neutral routing, not “bad breakers.”`,
      "New construction moisture in attics and garages wicks into outdoor disconnects and SE jackets—surface corrosion near lugs shows up in the first few humid seasons.",
      "Whole-home surge gear is common—verify neutral bus discipline before swapping breakers on repeat trip patterns.",
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
    "fort-myers-beach-fl": [
      `In ${place}, salt spray and onshore flow pit condenser coils and electrical shells within seasons—capacity loss often precedes any loud mechanical failure.`,
      "High dew points keep drain lines working constantly—clogged traps and pan switches trip cooling during the hottest weeks.",
      "Storm debris and sand accelerate outdoor fan imbalance—vibration tracks to bearing wear if ignored.",
    ],
    "estero-fl": [
      `In ${place}, newer tight envelopes plus large glass area create high latent load—short cycling and humidity complaints often track airflow and control setup, not charge alone.`,
      "Zoned systems with bypass issues show up as rooms that never dehumidify—verify bypass and static before adding refrigerant.",
      "Peak evening whole-home draws stack runtime—capacitor and contactor wear shows up as intermittent no-start under load.",
    ],
    "sanibel-fl": [
      `In ${place}, coastal coils need aggressive wash cadence—salt-fouled microchannels drive head pressure and compressor amps without obvious ice.`,
      "Generator and storm-hardening add-ons change return air paths—recheck static after any major electrical or envelope work.",
      "Bridge traffic and salt fog mean outdoor units live in harsher Class than inland Lee—plan corrosion controls, not only part swaps.",
    ],
    "north-captiva-fl": [
      `In ${place}, relentless onshore salt and limited wash access between storms foul condenser microchannels fast—capacity loss tracks to head pressure before homeowners hear a mechanical change.`,
      "Elevated and pile-built envelopes change return paths after rebuilds—static and bypass mistakes read as “weak cooling” under peak latent load.",
      "Generator-backed runtime during outages stacks heat on contactors and caps—check start components after any long island brownout period.",
    ],
    "fort-myers-fl": [
      `In ${place}, humidity and long summer runtime keep drains and blower assemblies under continuous load—clogged pans and weak airflow are primary compressor killers.`,
      "Salt air still reaches inland garages and lanai closets—outdoor electrical and line sets corrode faster than northern markets.",
      "Afternoon thunderstorms and voltage sags coincide with no-cool calls—separate supply problems from refrigerant faults before sealed-system work.",
    ],
    "gateway-fl": [
      `In ${place}, tight newer envelopes plus high latent load keep coils wet and drains working constantly—weak airflow reads as “not cold enough” before charge symptoms show.`,
      "Dense rooflines and afternoon storms stack voltage sag with long runtimes—capacitor and contactor wear shows up as intermittent no-start under peak load.",
      "Garage and lanai condensers still see seasonal salt drift—fin corrosion tracks to high head pressure before homeowners hear a mechanical change.",
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
export function buildCityContextForLeeCountyCity(cityStorageSlug: string, vertical: ServiceVertical): string[] {
  const place = formatCityPathSegmentForDisplay(cityStorageSlug);
  const seg = cityStorageSlug.toLowerCase();
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
  json.cityContext = buildCityContextForLeeCountyCity(citySeg, vertical);
  json.cta = buildLocalizedLeeCountyCta(vertical, citySeg);
}
