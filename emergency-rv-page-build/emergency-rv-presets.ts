/**
 * Emergency “money printer” blocks for high-intent RV symptom pages.
 * Used by authority-guide + tier1 pillar layouts when `emergencyPage` is set.
 */

export type EmergencyPagePreset = {
    /** Main banner title, e.g. “RV AC not cooling?” */
    bannerHeadline: string;
    /** One line on heat/safety/urgency */
    dangerLine: string;
    /** Exactly three immediate checks */
    immediateChecks: [string, string, string];
    fix60Title: string;
    fix60Steps: string[];
    mostLikelyTitle: string;
    mostLikelyFix: string;
    costBand: string;
    difficulty: string;
    timeEstimate: string;
    /** Mid-page urgency CTA strip */
    monetizationHeadline: string;
    monetizationBullets: [string, string, string];
    /**
     * hvac = rooftop AC / furnace / stat / fan (HVAC Revenue Boost + RV service CTA)
     * service = electrical, fridge, gen, outlets, converter (local pros block)
     * plumber = water heater
     */
    leadStyle: 'hvac' | 'service' | 'plumber';
};

function preset(p: EmergencyPagePreset): EmergencyPagePreset {
    return p;
}

/** Canonical pathname → preset */
export const EMERGENCY_PRESETS: Record<string, EmergencyPagePreset> = {
    '/rv/hvac/rv-ac-not-cooling': preset({
        bannerHeadline: 'RV AC not cooling?',
        dangerLine:
            'In extreme heat, loss of cooling can become a safety issue. Start with airflow and power before you dig into parts.',
        immediateChecks: [
            'Return air filter clean and snapped in place',
            'Thermostat in Cool with setpoint below room temperature',
            'AC branch breaker ON—reset once if tripped, then diagnose if it trips again',
        ],
        fix60Title: 'Fix in 60 seconds',
        fix60Steps: [
            'Turn the thermostat to Cool and drop the setpoint 5°F below room temp.',
            'Shut off cooling and run Fan only 5 minutes if you suspect ice—then recheck airflow.',
            'If on 30A shore power, turn off other high-draw loads (microwave, electric water heater) and retry.',
        ],
        mostLikelyTitle: 'Most common fix',
        mostLikelyFix:
            'Dirty return filter or frozen evaporator—both choke airflow and stop sensible cooling. Clean/replace the filter; if you see freeze symptoms, thaw before running Cool again.',
        costBand: '$0–$40 (filter) · $30–$120 (DIY capacitor if needed)',
        difficulty: 'Easy for filter · Moderate for capacitor',
        timeEstimate: '5–45 minutes',
        monetizationHeadline: 'Need RV AC repair fast?',
        monetizationBullets: [
            'Local RV HVAC techs for rooftop packs',
            'Same-day in many markets—request your area',
            'When the compressor or charge is suspect, pro diagnosis protects the system',
        ],
        leadStyle: 'hvac',
    }),

    '/rv/hvac/rv-ac-freezing-up': preset({
        bannerHeadline: 'RV AC freezing up?',
        dangerLine:
            'Ice on the coil can block airflow and dump water inside. Do not keep running the compressor on a frozen coil.',
        immediateChecks: [
            'Return filter clean—#1 cause of freeze',
            'Supply vents open—don’t choke the duct',
            'Fan runs strong—weak fan mimics freeze',
        ],
        fix60Title: 'Fix in 60 seconds',
        fix60Steps: [
            'Switch to Fan only and let ice melt 30–60 minutes.',
            'Replace or clean the return filter before you go back to Cool.',
            'Open any closed vents in the main duct path.',
        ],
        mostLikelyTitle: 'Most common fix',
        mostLikelyFix:
            'Restricted airflow (filter, closed vents, collapsed duct) drives evaporator temperature below freezing. Restore airflow first; recurring freeze after that points to low refrigerant or weak fan.',
        costBand: '$0–$40',
        difficulty: 'Easy',
        timeEstimate: '30–90 minutes including thaw',
        monetizationHeadline: 'Still icing after airflow checks?',
        monetizationBullets: [
            'Technicians verify charge, expansion device, and coil health',
            'Protect the compressor from long run times on ice',
            'Get help before secondary water damage',
        ],
        leadStyle: 'hvac',
    }),

    '/rv/hvac/rv-ac-blowing-warm-air': preset({
        bannerHeadline: 'RV AC blowing warm air?',
        dangerLine: 'Fan without cooling often means capacitor, freeze, or voltage—rule out airflow before parts.',
        immediateChecks: [
            'Filter clean',
            'No ice or water streaks indicating a frozen coil',
            'Pedestal or generator voltage stable under load (EMS if you have one)',
        ],
        fix60Title: 'Fix in 60 seconds',
        fix60Steps: [
            'Cool mode, setpoint below room temp.',
            'New or cleaned filter.',
            'If humid/icy smell from vents, Fan only to thaw before Cool.',
        ],
        mostLikelyTitle: 'Most common fix',
        mostLikelyFix:
            'Failed or weak start capacitor (fan runs, compressor does not start) or a frozen coil from restricted airflow.',
        costBand: '$30–$150 DIY capacitor · $150–$400 pro',
        difficulty: 'Moderate (electrical)',
        timeEstimate: '30–60 minutes',
        monetizationHeadline: 'Need RV AC repair near you?',
        monetizationBullets: [
            'Capacitor and compressor checks without guesswork',
            'Roof work handled safely',
            'Book through our partner network',
        ],
        leadStyle: 'hvac',
    }),

    '/rv/hvac/rv-ac-not-turning-on': preset({
        bannerHeadline: 'RV AC will not turn on?',
        dangerLine: 'Treat “dead” as a power path problem first—shore, breaker, thermostat, then the roof unit.',
        immediateChecks: [
            'Other 120V loads work (prove the panel has power)',
            'Thermostat lit and in Cool—not Heat or Fan-only lockout',
            'Dedicated AC breaker ON',
        ],
        fix60Title: 'Fix in 60 seconds',
        fix60Steps: [
            'Reset any tripped GFCI that feeds the coach kitchen/bath chain.',
            'Replace thermostat batteries if the screen is blank.',
            'Wait 2–5 minutes after a rapid power cycle—controls sometimes delay.',
        ],
        mostLikelyTitle: 'Most common fix',
        mostLikelyFix:
            'Tripped pedestal breaker, main coach breaker, or thermostat batteries/mode preventing the cool call.',
        costBand: '$0–$25 batteries · $200+ control parts',
        difficulty: 'Easy to moderate',
        timeEstimate: '15–45 minutes',
        monetizationHeadline: 'Breaker trips instantly?',
        monetizationBullets: [
            'Short or compressor faults need pro diagnosis',
            'Don’t force a breaker that trips immediately',
            'Request RV AC service in your area',
        ],
        leadStyle: 'hvac',
    }),

    '/rv/hvac/rv-furnace-not-working': preset({
        bannerHeadline: 'RV furnace not working?',
        dangerLine:
            'If you smell gas, shut the valve, leave the area, and do not spark-test. Otherwise work the ignition sequence methodically.',
        immediateChecks: [
            'Propane on and other appliances light',
            '12V house power healthy (furnace needs DC)',
            'Return air path clear—sail switch needs airflow',
        ],
        fix60Title: 'Fix in 60 seconds',
        fix60Steps: [
            'Confirm thermostat calls Heat and fan Auto.',
            'Listen for combustion blower before ignition.',
            'Reset any furnace lockout per manual (power cycle once).',
        ],
        mostLikelyTitle: 'Most common fix',
        mostLikelyFix:
            'Sail switch not proving airflow, dirty flame sensor, or low propane/locked regulator.',
        costBand: '$0–$300 parts typical',
        difficulty: 'Moderate',
        timeEstimate: '30–90 minutes',
        monetizationHeadline: 'Gas smell or repeated lockout?',
        monetizationBullets: [
            'Qualified RV furnace techs',
            'Gas valve and heat exchanger work is regulated for a reason',
            'Get help before carbon monoxide risk',
        ],
        leadStyle: 'hvac',
    }),

    '/rv/refrigerator-not-cooling': preset({
        bannerHeadline: 'RV refrigerator not cooling?',
        dangerLine:
            'Absorption fridges need level and ventilation—check those before you assume a failed cooling unit.',
        immediateChecks: [
            'Coach level within manufacturer spec',
            'Roof/side vents clear (wasps, leaves)',
            'Correct mode for your situation (Auto/LP/AC)',
        ],
        fix60Title: 'Fix in 60 seconds',
        fix60Steps: [
            'Relevel the coach if parked on a twist.',
            'Confirm the fridge breaker and any exterior 120V switch.',
            'Give an absorption unit several hours to pull down after heat load.',
        ],
        mostLikelyTitle: 'Most common fix',
        mostLikelyFix:
            'Off-level parking, blocked ventilation, or tripped GFCI/breaker on electric element mode.',
        costBand: '$0–$250 (element/thermistor) · $1k+ cooling unit',
        difficulty: 'Easy to moderate',
        timeEstimate: '1–8 hours observation',
        monetizationHeadline: 'Ammonia smell or yellow residue?',
        monetizationBullets: [
            'Cooling unit replacement is a shop job',
            'Don’t attempt sealed-system repair in the campsite',
            'Find qualified RV appliance help',
        ],
        leadStyle: 'service',
    }),

    '/rv/electrical/converter-not-charging-battery': preset({
        bannerHeadline: 'Battery not charging on shore power?',
        dangerLine:
            'Without working 12V charging, lights and controls fail even when 120V appliances work.',
        immediateChecks: [
            'Converter/charger breaker in the panel ON',
            '12V loads behave (prove battery path)',
            'Battery type matches charger profile (lithium vs flooded)',
        ],
        fix60Title: 'Fix in 60 seconds',
        fix60Steps: [
            'Reset the converter breaker once.',
            'Check the DC fuse or breaker on converter output.',
            'Tighten main battery terminals (with proper safety).',
        ],
        mostLikelyTitle: 'Most common fix',
        mostLikelyFix:
            'Tripped converter breaker, blown DC fuse, or failed converter section—still have 120V but no regulated charge.',
        costBand: '$0–$1.2k (converter replacement)',
        difficulty: 'Moderate to hard',
        timeEstimate: '30–120 minutes',
        monetizationHeadline: 'Sparking, smoke, or hot converter?',
        monetizationBullets: [
            'RV electricians trace AC and DC sides safely',
            'Lithium profiles must match the charger',
            'Book local electrical help',
        ],
        leadStyle: 'service',
    }),

    '/rv/hvac/rv-ac-thermostat-problems': preset({
        bannerHeadline: 'RV thermostat not behaving?',
        dangerLine:
            'Wrong mode or dead batteries mimics a dead AC—confirm the stat before you blame the roof.',
        immediateChecks: [
            'Fresh batteries if battery-powered',
            'Cool vs Heat vs Fan-only position',
            '12V fuse for HVAC control',
        ],
        fix60Title: 'Fix in 60 seconds',
        fix60Steps: [
            'Set Cool, fan Auto, setpoint below room.',
            'Pull stat face and re-seat the plug.',
            'Power-cycle coach 12V once if locked up.',
        ],
        mostLikelyTitle: 'Most common fix',
        mostLikelyFix:
            'Dead batteries, wrong mode, or corroded wall harness—not a roof failure.',
        costBand: '$0–$300',
        difficulty: 'Easy',
        timeEstimate: '10–30 minutes',
        monetizationHeadline: 'Outputs test OK but roof silent?',
        monetizationBullets: [
            'Could be control board or relay at the unit',
            'Pro diagnosis avoids swapping wrong parts',
            'Request RV AC service',
        ],
        leadStyle: 'hvac',
    }),

    '/rv/hvac/rv-ac-breaker-keeps-tripping': preset({
        bannerHeadline: 'AC breaker keeps tripping?',
        dangerLine:
            'Repeated resets overheat wiring and the compressor. Reset once after shedding load—then diagnose.',
        immediateChecks: [
            'Other big loads off (microwave, second AC, water heater)',
            'Cord and adapter not hot',
            'Pedestal voltage not sagging badly at start',
        ],
        fix60Title: 'Fix in 60 seconds',
        fix60Steps: [
            'Turn off other 120V heavy loads on 30A.',
            'Reset breaker once.',
            'If instant trip, stop—do not keep resetting.',
        ],
        mostLikelyTitle: 'Most common fix',
        mostLikelyFix:
            'Overload on marginal 30A, weak start capacitor, or dirty condenser raising run amps.',
        costBand: '$0–$500+ depending on fix',
        difficulty: 'Moderate',
        timeEstimate: '30–90 minutes',
        monetizationHeadline: 'Instant trips or burning smell?',
        monetizationBullets: [
            'Shorted windings or damaged harness need a pro',
            'Protect the roof pack from fire and shock risk',
            'Get RV AC help',
        ],
        leadStyle: 'hvac',
    }),

    '/rv/rv-water-heater-not-working': preset({
        bannerHeadline: 'RV water heater not working?',
        dangerLine:
            'Never energize the electric element on an empty tank—dry fire destroys the element in seconds.',
        immediateChecks: [
            'Tank full and pressure relief not weeping constantly',
            'Propane on / electric breaker + exterior switch on',
            'Bypass valves in “normal” after winterizing',
        ],
        fix60Title: 'Fix in 60 seconds',
        fix60Steps: [
            'Flip the outside electric switch ON (many Suburban models).',
            'Reset ECO if tripped after cool-down.',
            'Light a stove burner to prove propane flow.',
        ],
        mostLikelyTitle: 'Most common fix',
        mostLikelyFix:
            'Wrong bypass after winterizing, tripped ECO, or open electric element.',
        costBand: '$40–$300 typical',
        difficulty: 'Moderate',
        timeEstimate: '30–90 minutes',
        monetizationHeadline: 'Gas smell or sustained ignition failure?',
        monetizationBullets: [
            'RV plumbers and gas-certified techs',
            'Don’t guess on gas valves',
            'Find local help',
        ],
        leadStyle: 'plumber',
    }),

    '/rv/electrical/rv-generator-wont-start': preset({
        bannerHeadline: 'RV generator won’t start?',
        dangerLine:
            'No cranking usually means start battery or fuse—crank with no fire is fuel or spark.',
        immediateChecks: [
            'Oil level (low-oil lockout)',
            'Start battery voltage under crank',
            'Fuel valve / fresh gasoline or diesel per model',
        ],
        fix60Title: 'Fix in 60 seconds',
        fix60Steps: [
            'Check oil on level ground.',
            'Try prime or choke per manual.',
            'Reset any generator breaker on the set.',
        ],
        mostLikelyTitle: 'Most common fix',
        mostLikelyFix:
            'Weak start battery, stale fuel, or low-oil shutdown.',
        costBand: '$0–$500+',
        difficulty: 'Easy to hard',
        timeEstimate: '20–120 minutes',
        monetizationHeadline: 'Fuel leaks or backfire?',
        monetizationBullets: [
            'Generator service techs',
            'Carb and ignition work in tight bays',
            'Book qualified help',
        ],
        leadStyle: 'service',
    }),

    '/rv/hvac/rv-ac-making-loud-noise': preset({
        bannerHeadline: 'RV AC making loud noise?',
        dangerLine:
            'Grinding or burning smell—shut down until you find metal-on-metal or electrical fault.',
        immediateChecks: [
            'Debris in fan (twigs, zip ties)',
            'Shroud screws tight',
            'Blade spins freely with power off',
        ],
        fix60Title: 'Fix in 60 seconds',
        fix60Steps: [
            'Power off at thermostat and breaker.',
            'Visually clear the fan path.',
            'Tighten shroud screws evenly.',
        ],
        mostLikelyTitle: 'Most common fix',
        mostLikelyFix:
            'Loose shroud, bent blade, or failing fan motor bearings; rapid clicking often capacitor/relay.',
        costBand: '$0–$450',
        difficulty: 'Moderate',
        timeEstimate: '30–90 minutes',
        monetizationHeadline: 'Compressor knock or refrigerant symptoms?',
        monetizationBullets: [
            'Licensed HVAC for sealed systems',
            'Compare repair vs replace vs mini split upgrade',
            'Request service',
        ],
        leadStyle: 'hvac',
    }),

    '/rv/electrical/outlets-not-working': preset({
        bannerHeadline: 'RV outlets dead?',
        dangerLine:
            'One tripped GFCI can kill half the coach—reset every GFCI you can find before replacing outlets.',
        immediateChecks: [
            'Reset bath/kitchen/exterior GFCI buttons',
            'Main branch breakers',
            'Inverter pass-through or transfer if equipped',
        ],
        fix60Title: 'Fix in 60 seconds',
        fix60Steps: [
            'Reset ALL GFCIs (including outdoor/wet bay).',
            'Reset the main panel breaker once.',
            'Unplug high-draw devices that may have tripped AFCI/GFCI.',
        ],
        mostLikelyTitle: 'Most common fix',
        mostLikelyFix:
            'Downstream GFCI trip or branch breaker—outlets themselves are rarely “all bad.”',
        costBand: '$0–$80',
        difficulty: 'Easy',
        timeEstimate: '5–20 minutes',
        monetizationHeadline: 'Warm breaker, buzzing panel, or tingling?',
        monetizationBullets: [
            'Stop—open neutral and arc faults need an electrician',
            'RV electrical specialists',
            'Find local pros',
        ],
        leadStyle: 'service',
    }),

    '/rv/hvac/rv-ac-fan-not-spinning': preset({
        bannerHeadline: 'RV AC fan not spinning?',
        dangerLine:
            'A seized fan can still hum—power down before touching the wheel. Ice can also lock the blade.',
        immediateChecks: [
            'Thermostat calls fan or cooling',
            'Breaker ON',
            'Blade free with power locked out',
        ],
        fix60Title: 'Fix in 60 seconds',
        fix60Steps: [
            'Cool + fan Auto, setpoint below room.',
            'If ice suspected, thaw before forcing the wheel.',
            'Check dual capacitor fan leg if equipped.',
        ],
        mostLikelyTitle: 'Most common fix',
        mostLikelyFix:
            'Weak fan capacitor or failed fan motor; less often, no 120V call from the board.',
        costBand: '$25–$450',
        difficulty: 'Moderate',
        timeEstimate: '30–90 minutes',
        monetizationHeadline: 'Motor hot or breaker trips?',
        monetizationBullets: [
            'Roof access and electrical hazard',
            'Technicians match OEM motors safely',
            'Request RV AC service',
        ],
        leadStyle: 'hvac',
    }),
};

export function getEmergencyPreset(pathOrUrl: string): EmergencyPagePreset | undefined {
    const path = pathOrUrl.startsWith('http')
        ? new URL(pathOrUrl).pathname
        : pathOrUrl.split('?')[0];
    return EMERGENCY_PRESETS[path];
}
