import { FastifyInstance } from 'fastify';
import { buildFaqSchema, buildArticleSchema, buildBreadcrumbSchema } from '../utils/faqSchema.js';
import { getMonetizationContext } from '../utils/monetizationHelper.js';
import { getMaturity } from '../lib/getMaturity.js';
import { getAiSummaryForAuthorityGuide, getTier1AiSummary } from '../services/summaryService.js';
import { withSchemaConfig, buildSchemaConfig } from '../data/schema-config.js';
import { withAuthorityKnowledgeGraph } from '../utils/with-authority-knowledge-graph.js';
import { getEeatContext } from '../data/author-config.js';
import { rvAcNotCoolingPillarConfig } from '../data/pillar-configs/rv-ac-not-cooling.js';
import { rvAcFreezingUpPillarConfig } from '../data/pillar-configs/rv-ac-freezing-up.js';
import { loadWizard } from '../services/wizard.service.js';
import { SERVICE_AREAS } from '../config/serviceAreas.js';
import { getEmergencyPreset } from '../data/emergency-rv-presets.js';

const BASE_URL = 'https://www.decisiongrid.co';

// Seasonal CTAs for heating-cooling cluster
const checklistCtaWinter = {
    title: 'Winter RV Prep Checklist',
    description: 'Furnace inspection, propane check, skirting prep, condensation management. Use before cold-weather trips.',
    href: '/checklists',
};

const checklistCtaSummer = {
    title: 'Summer AC & Electrical Checklist',
    description: 'AC filter cleaning, voltage check, EMS/surge protection. Protect your compressor from low voltage.',
    href: '/checklists/rv-electrical',
};

// Feeder 1: RV Furnace Not Working
const furnaceFaqs = [
    { question: 'Why is my RV furnace not working?', answer: 'Check propane supply, 12V power, thermostat, and sail switch. The furnace needs both propane and 12V. Low voltage or dead battery commonly prevents startup.' },
    { question: 'Why does my furnace blower run but no heat?', answer: 'Sail switch may be stuck, or the burner isn\'t lighting due to propane, igniter, or clogged orifice.' },
    { question: 'Does low voltage affect the furnace?', answer: 'Yes. The furnace needs 12V. Weak battery or converter can prevent the blower or igniter from running. See RV electrical systems guide.' },
    { question: 'Where is the furnace fuse?', answer: 'Usually in the 12V fuse panel, labeled "furnace," "heater," or "HVAC." Consult your manual.' },
];

// Feeder 2: RV AC Running But Not Cooling (Why RV AC Not Blowing Cold) — Tier 1, 5000+ words
const acNotColdFaqs = [
    { question: 'Why is my RV AC running but blowing warm air?', answer: 'Most often capacitor failure or low voltage. Clean the filter first. Fan runs but no cold air often means capacitor; weak cold air often means voltage or refrigerant. See RV AC low voltage problems and capacitor check steps.' },
    { question: 'Can low voltage permanently damage an RV AC?', answer: 'Yes. Brownouts over time degrade compressors. Voltage below 108V forces the motor to draw more amps, overheat, and damage windings. Use an EMS to protect. See what voltage damages RV AC.' },
    { question: 'How long should RV AC take to cool?', answer: 'You should feel cold air within 2–3 minutes. If the fan runs but air stays warm after 5 minutes, suspect capacitor, low voltage, or refrigerant. Check voltage with EMS first.' },
    { question: 'Why is my RV AC not blowing cold?', answer: 'Clean the filter first. Top causes: dirty filter, low refrigerant, frozen evaporator, capacitor failure, or low voltage. Let ice melt if coils are frozen, then clean filter and retry.' },
    { question: 'Can I run my RV AC on a generator?', answer: 'Yes, if the generator has enough wattage (typically 3,500W+ for one AC). Use an EMS to protect against voltage issues. See generator sizing for RV AC guide.' },
    { question: 'How often should I clean the AC filter?', answer: 'Monthly during cooling season. More often in dusty environments. A dirty filter is the #1 cause of running but not cooling.' },
];

// Feeder 3: RV Space Heater vs Furnace
const spaceHeaterFaqs = [
    { question: 'RV space heater vs furnace—which is cheaper?', answer: 'On shore power, electric space heaters often cost less than burning propane. When boondocking, the furnace is typically the only practical option.' },
    { question: 'Are space heaters safe in RVs?', answer: 'Electric space heaters with tip-over and overheat protection are safe when used correctly. Never use unvented propane heaters indoors.' },
    { question: 'Can I use a space heater instead of my RV furnace?', answer: 'Yes, when on shore power. It saves propane. When boondocking, the furnace is usually the only option unless you have significant inverter/generator capacity.' },
];

// Feeder 6: RV Dehumidifier
const dehumidifierFaqs = [
    { question: 'Do I need a dehumidifier in my RV?', answer: 'If you see condensation, mold, or musty smell—yes. Full-timers in humid regions benefit most from moisture control.' },
    { question: 'What size dehumidifier for an RV?', answer: 'Small portable units (30–50 pint capacity) are typical for RVs. Compact models designed for small spaces work well.' },
    { question: 'Do desiccant packs work?', answer: 'Yes, for closed spaces and storage. They absorb moisture slowly. Recharge by heating in an oven when saturated.' },
];

// Feeder 4: How to Stay Warm in Winter
const stayWarmFaqs = [
    { question: 'How do I stay warm in an RV in winter?', answer: 'Run the furnace, add skirting, use thermal curtains, seal drafts. A portable electric space heater can supplement when on shore power.' },
    { question: 'Do I need skirting for winter RVing?', answer: 'Skirting significantly reduces heat loss from the underbelly and is recommended for extended cold-weather stays.' },
    { question: 'Can I use a space heater in my RV?', answer: 'Yes, when on shore power. Electric models with safety features are fine. Never use unvented propane heaters indoors.' },
    { question: 'How cold is too cold for an RV?', answer: 'Depends on insulation and heating. Well-prepared RVs can handle single digits with furnace, skirting, and draft sealing. Water lines are the weak point—keep heat on or winterize.' },
];

// RV AC Not Cooling — Tier 1 authority (5,000+ word diagnostic)
const rvAcNotCoolingFaqs = [
    { question: 'Why is my RV AC running but not cooling?', answer: 'Clean the filter first. Top causes: dirty filter, low refrigerant, frozen evaporator, low voltage, capacitor failure. Let ice melt if coils are frozen, then clean filter and retry. Check voltage with EMS or surge protector.' },
    { question: 'Can low voltage damage an RV air conditioner?', answer: 'Yes. Sustained voltage below 108V damages the compressor. The motor draws more amps, overheats, and insulation breaks down. Use an EMS to protect. See campground voltage and what voltage damages RV AC guides.' },
    { question: 'Why does my RV AC freeze up?', answer: 'Dirty filter, low refrigerant, restricted airflow, or thermostat set too low. Turn off AC, let ice melt, clean filter. If it keeps freezing, have refrigerant checked. See RV AC freezing up guide.' },
    { question: 'How much does it cost to replace an RV AC?', answer: 'New rooftop unit installed: $800–$2,000+. Capacitor: $150–$400. Compressor: $1,000–$2,500+. Refrigerant recharge: $200–$500.' },
    { question: 'Should I use a surge protector with RV AC?', answer: 'Yes. An EMS or surge protector with voltage display protects against low voltage and surges. Low voltage is a leading cause of compressor failure. See best RV surge protectors and EMS vs surge guide.' },
];

// RV AC Low Voltage Problems
const rvAcLowVoltageFaqs = [
    { question: 'What voltage does my RV AC need?', answer: '108–132 volts. Below 108V damages the compressor. Use an EMS or surge protector with voltage display to monitor.' },
    { question: 'Can low voltage cause my RV AC to not cool?', answer: 'Yes. Low voltage forces the compressor to draw more amps, overheat, and deliver weak or no cooling. Shut off AC if voltage drops below 108V.' },
    { question: 'EMS vs surge protector for RV AC?', answer: 'EMS monitors voltage and cuts power when it drops below 108V or rises above 132V. Basic surge only blocks spikes. EMS recommended for AC protection.' },
    { question: 'How do I test campground voltage?', answer: 'Use an EMS or surge protector with voltage display, or a multimeter. Check before plugging in and under load. See how to test pedestal voltage guide.' },
];

// RV AC Breaker Keeps Tripping
const rvAcBreakerFaqs = [
    { question: 'Why does my RV AC breaker keep tripping?', answer: 'Overload (AC + other loads), capacitor failure, low voltage, or startup surge. Reduce load first. See RV AC low voltage problems and capacitor check.' },
    { question: 'Can I run AC and microwave on 30 amp?', answer: 'Often no—that\'s 2,500–3,500W combined. Stagger use or add soft-start to AC. See 30 vs 50 amp guide.' },
    { question: 'Will a surge protector help with AC breaker trips?', answer: 'An EMS protects against voltage problems that can cause trips. It won\'t fix overload. See best RV surge protectors.' },
];

// RV AC Compressor Not Turning On
const rvAcCompressorFaqs = [
    { question: 'Why does my RV AC fan run but compressor doesn\'t?', answer: 'Usually capacitor failure or low voltage. Rule out capacitor first. See RV AC capacitor failure symptoms and low voltage problems.' },
    { question: 'Can low voltage prevent the compressor from starting?', answer: 'Yes. Below 108V the compressor struggles. Use EMS to monitor. See RV AC low voltage problems.' },
    { question: 'How much does compressor replacement cost?', answer: '$1,000–$2,500+. Sometimes a new rooftop unit ($800–$2,000+ installed) makes more sense.' },
];

// RV AC Capacitor Failure Symptoms
const rvAcCapacitorFaqs = [
    { question: 'What are signs of RV AC capacitor failure?', answer: 'Fan runs but no cold air, unit hums, breaker trips when AC starts, swollen capacitor casing. Replace capacitor.' },
    { question: 'Can I replace the AC capacitor myself?', answer: 'Some owners do. Turn off power, discharge capacitor, match values exactly. If unsure, hire a pro.' },
    { question: 'Does surge protection help the capacitor?', answer: 'Yes. Voltage spikes and brownouts stress capacitors. Use EMS to protect. See best RV surge protectors.' },
];

// RV AC Capacitor Replacement Guide
const rvAcCapacitorReplacementFaqs = [
    { question: 'How do I discharge an RV AC capacitor?', answer: 'Use a 20k ohm, 5-watt resistor across the terminals for 5–10 seconds. Or use a multimeter in resistance mode briefly. Never short with a screwdriver.' },
    { question: 'What capacitor values do I need for RV AC?', answer: 'Match the old capacitor exactly—µF and voltage. Common dual-run: 40+5 µF, 370V. Check your unit\'s label or manual.' },
    { question: 'Can I use a higher voltage capacitor?', answer: 'Yes. 440V can replace 370V. Never use lower voltage. Capacitance (µF) must match exactly.' },
];

// RV AC Troubleshooting Checklist
const rvAcChecklistFaqs = [
    { question: 'What order should I troubleshoot RV AC?', answer: 'Filter first, then power, voltage, thermostat, frozen coils, generator size, capacitor, refrigerant. Most issues are filter or power.' },
    { question: 'Why does my RV AC not cool?', answer: 'Clean filter first. Top causes: dirty filter, low refrigerant, frozen coils, low voltage, capacitor. See RV AC not cooling full guide.' },
    { question: 'Can I fix RV AC myself?', answer: 'Filter, thermostat, power checks—yes. Refrigerant, capacitor, compressor—hire a pro.' },
];

// RV Soft Start Install Guide
const rvSoftStartInstallFaqs = [
    { question: 'Can I install an RV soft start myself?', answer: 'Yes, if you\'re comfortable with basic wiring and rooftop work. Most kits include detailed diagrams and take 30–60 minutes to install.' },
    { question: 'Does a soft start void my RV AC warranty?', answer: 'Generally no. Most manufacturers (Micro-Air, SoftStartRV) offer warranty protection or have been approved by AC brands. Check your specific manual.' },
    { question: 'Do I need a soft start for both AC units?', answer: 'Yes, if you want to run both on 30-amp service or a smaller generator. Each unit needs its own surge reduction.' },
    { question: 'Will a soft start reduce my AC amp draw?', answer: 'It reduces startup surge (LRA) by ~65-75%, but running amps (RLA) stay the same. It helps with breaker trips and generator start.' },
    { question: 'What tools are needed for soft start install?', answer: 'Screwdriver, wire strippers, crimp tool, and heat gun (for heat-shrink connectors). Most kits provide the connectors.' },
];

// RV Generator Sizing for RV AC
const rvGeneratorSizingFaqs = [
    { question: 'What size generator for 13,500 BTU RV AC?', answer: 'Without soft start: 3,000W minimum, 3,500W recommended. With soft start: 2,200W inverter generators can often run it.' },
    { question: 'Can a 2,000W generator run an RV AC?', answer: 'Usually not without a soft start. The startup surge (2,500W+) will trip the generator\'s overload. With a soft start, a 2,200W inverter unit is often sufficient.' },
    { question: 'Does altitude affect generator power?', answer: 'Yes. Generators lose ~3-4% of power for every 1,000 feet of elevation. If camping at 5,000ft, you need ~15-20% more capacity.' },
    { question: 'Should I use an inverter or conventional generator?', answer: 'Inverter generators provide cleaner sine-wave power, which is safer for AC compressors and control boards. They are also much quieter.' },
    { question: 'Can I run two ACs on one generator?', answer: 'You typically need 5,500W+ and a 50-amp connection. With soft starts on both, a 4,500W-5,500W unit may work depending on other loads.' },
];

// RV AC Lifespan and Failure Rates
const rvAcLifespanFaqs = [
    { question: 'How long do RV rooftop AC units last?', answer: 'Typically 8–15 years with proper maintenance. Weekend use: 12–15+ years. Full-time hot climate: 8–10 years. Voltage stress and dirty filters shorten lifespan.' },
    { question: 'Does low voltage shorten AC compressor life?', answer: 'Yes. Repeated brownouts damage compressor windings. Use an EMS to cut power when voltage drops below 108V. See RV AC low voltage problems.' },
    { question: 'Will a soft start extend AC life?', answer: 'It can. Soft start reduces startup stress on the capacitor and compressor. It also lets smaller generators run AC—reducing voltage sag from undersized units.' },
    { question: 'What is the most common RV AC component to fail?', answer: 'Capacitor failure is the most common repairable issue (5–10 years). Compressor failure usually means replace the unit. Filter maintenance prevents many problems.' },
];

// Best Soft Start for RV AC (buyer-intent)
const bestSoftStartFaqs = [
    { question: 'Which soft start is best for RV AC?', answer: 'Micro-Air EasyStart and SoftStartRV lead the market. Both achieve ~65–75% surge reduction. Verify compatibility with your AC model. See our comparison table and best RV generators for pairing.' },
    { question: 'Can I run 15,000 BTU AC on 2,200W generator with soft start?', answer: '13,500 BTU: often yes. 15,000 BTU: marginal—may work in cool weather. Plan 3,000–3,500W for 15K BTU with soft start. See best generator for 15,000 BTU RV AC.' },
    { question: 'Will soft start fix breaker tripping?', answer: 'Often. If trips were from AC startup surge, yes. If from overload (too many appliances), reduce load too. See RV AC breaker keeps tripping.' },
];

// Best RV Surge Protector for AC (buyer-intent)
const bestSurgeProtectorAcFaqs = [
    { question: 'EMS vs surge protector for RV AC?', answer: 'EMS monitors voltage and cuts power when it drops below 108V or rises above 132V. Basic surge only blocks spikes. EMS recommended for AC compressor protection.' },
    { question: 'Portable or hardwired surge protector for RV?', answer: 'Portable (plug-in) is most common—easy to move and inspect. Hardwired offers permanent protection but requires professional install. See our comparison.' },
    { question: 'Why does my EMS keep tripping?', answer: 'Voltage is dropping below 108V—often at peak hours. The EMS is protecting you. Reduce load or move sites. See EMS vs surge real-world scenarios.' },
];

// AC Emergency Checklist
const acEmergencyChecklistFaqs = [
    { question: 'What order should I troubleshoot RV AC?', answer: 'Filter first, then power, voltage, thermostat, frozen coils, generator size, capacitor, refrigerant. Most issues resolve in the first five steps. See our printable checklist.' },
    { question: 'Can I print the AC emergency checklist?', answer: 'Yes. Use Print → Save as PDF. The checklist is designed for printable use. Keep a copy in your rig.' },
];

// Seasonal HVAC Checklist
const seasonalHvacChecklistFaqs = [
    { question: 'How often should I clean my RV AC filter?', answer: 'Monthly during cooling season. Every two weeks in dusty environments. See our seasonal HVAC checklist for the full schedule.' },
    { question: 'When should I inspect RV AC coils?', answer: 'At season start and season end. Evaporator (indoor) and condenser (rooftop) both need inspection.' },
];

// Best Generator for 15,000 BTU RV AC (buyer-intent)
const bestGenerator15kFaqs = [
    { question: 'What size generator for 15,000 BTU RV AC?', answer: 'Without soft start: 4,500W+ recommended. With soft start: 3,000–3,500W often sufficient. Check surge rating, not just running watts.' },
    { question: 'Will 3,000W generator run 15,000 BTU AC?', answer: 'With soft start: often yes. Without soft start: marginal—startup surge may trip or fail to start. See our generator wattage table.' },
    { question: 'Inverter vs conventional generator for RV AC?', answer: 'Inverter produces cleaner power—AC compressors run cooler and last longer. Conventional delivers more watts for less money but is louder. For AC use, many prefer inverter.' },
];

// RV AC Maintenance Schedule
const rvAcMaintenanceFaqs = [
    { question: 'How often should I clean my RV AC filter?', answer: 'Monthly during cooling season. Every two weeks in dusty environments. A dirty filter is the #1 cause of AC not cooling.' },
    { question: 'When should I inspect RV AC coils?', answer: 'At season start and season end. Evaporator (indoor) and condenser (rooftop) both need inspection. Debris reduces efficiency and can cause freeze-up.' },
    { question: 'Is there a printable RV AC maintenance checklist?', answer: 'Yes. See our seasonal HVAC maintenance checklist and AC emergency troubleshooting checklist for printable, step-by-step schedules.' },
    { question: 'What electrical maintenance does RV AC need?', answer: 'Verify EMS or surge protector before each trip. Test pedestal voltage. Confirm generator sizing if using genny. See load management checklist.' },
];

// Common Causes of RV AC Failure — Data-driven post
const commonCausesAcFailureFaqs = [
    { question: 'What is the most common cause of RV AC failure?', answer: 'Airflow restriction is the largest category (~35%)—dirty filter, closed vents, frozen coils. Electrical/voltage issues (~30%) are second. Capacitor failure (~20%) is the most common mechanical cause.' },
    { question: 'Why does my RV AC fail only at busy campgrounds?', answer: 'Peak-season voltage drop. Multiple rigs running AC overload shared circuits. Use an EMS to monitor and protect. Consider moving sites or reducing load during peak hours.' },
    { question: 'Can low voltage cause RV AC failure?', answer: 'Yes. Sustained voltage below 108V damages the compressor. The motor draws more amps, overheats, and insulation breaks down. Use an EMS to cut power when voltage drops.' },
    { question: 'What order should I troubleshoot RV AC?', answer: 'Filter first, then voltage, frozen coils, capacitor, compressor. Most issues resolve in the first three steps. See our diagnostic flow and common causes guide.' },
    { question: 'How often should I clean my RV AC filter?', answer: 'Monthly during cooling season. More often in dusty environments. A dirty filter is the #1 cause of running but not cooling.' },
];

// RV Mini Split Installation Guide
const rvMiniSplitInstallationFaqs = [
    { question: 'Can I install a mini split in my RV myself?', answer: 'Yes, with a pre-charged DIY kit (e.g., MrCool). Custom line sets require a vacuum pump, manifold gauges, and refrigerant handling—typically a pro job.' },
    { question: 'Where do you mount a mini split in an RV?', answer: 'Outdoor unit: ladder rack, hitch platform, or cargo rack. Indoor unit: wall or ceiling with clear airflow. Both must be secure for travel.' },
    { question: 'Do I need a vacuum pump for RV mini split install?', answer: 'Pre-charged kits: no. Custom lines: yes—evacuation removes moisture and air before charging.' },
    { question: 'How long does RV mini split installation take?', answer: 'DIY pre-charged: 4–8 hours for first-timers. Professional custom install: 1–2 days including electrical.' },
];

// Best Mini Split for RV
const bestMiniSplitForRvFaqs = [
    { question: 'What size mini split for an RV?', answer: '9,000 BTU for vans and small trailers. 12,000 BTU for larger RVs and buses. Oversizing wastes power and can cause short cycling.' },
    { question: 'Can I use a MrCool DIY in my RV?', answer: 'Yes. Pre-charged lines and no vacuum pump make it DIY-friendly. Ensure mounting is secure for travel.' },
    { question: 'Which mini split is quietest for van life?', answer: 'Inverter units with low dB ratings. Senville Leto, Pioneer, and similar 9,000 BTU models are commonly used in vans.' },
    { question: 'What mini split runs on solar?', answer: '9,000 BTU inverter units drawing 900–1,200W. You need sufficient solar (800W+) and lithium storage (200Ah+). See our solar power guide.' },
];

// RV Mini Split Solar Power
const rvMiniSplitSolarPowerFaqs = [
    { question: 'Can you run a mini split on RV solar?', answer: 'Yes. With 800W+ solar, 400Ah+ lithium, and a 3,000W inverter, a 9,000 BTU inverter mini split can run during the day and part of the night.' },
    { question: 'How much solar do I need for RV mini split?', answer: '800–1,200W for daytime cooling. More if you want extended evening or overnight runtime without generator.' },
    { question: 'Will a 400Ah lithium battery run a mini split?', answer: 'For 4–6 hours at full load, yes. Overnight (8+ hours) typically needs 800Ah+ or reduced runtime.' },
    { question: 'What size inverter for RV mini split?', answer: '3,000W pure sine wave minimum for 9,000 BTU. Inverter mini splits have lower startup surge than rooftop AC.' },
];

// RV AC Fan Running But No Cold Air
const rvAcFanRunningNoColdAirFaqs = [
    { question: 'Why does my RV AC fan run but no cold air?', answer: 'Usually filter, frozen coil, low voltage, or compressor. Clean the filter first. Check voltage with an EMS. If the compressor isn\'t starting, capacitor failure is common.' },
    { question: 'Can low voltage cause RV AC fan to run but not cool?', answer: 'Yes. Below 108V the compressor may not engage. The fan runs on a separate circuit. Use an EMS or surge protector with voltage display to verify.' },
    { question: 'Is a frozen evaporator coil dangerous?', answer: 'Turn off the compressor and run the fan to thaw. Running the compressor while frozen can damage it. Let ice melt 30–60 minutes, clean filter, then restart.' },
    { question: 'When should I call a technician for RV AC not cooling?', answer: 'If filter is clean, voltage is good, and the compressor still won\'t start—capacitor, control board, or compressor failure likely. Professional diagnosis required.' },
];

// URLs-to-post batch (5 new HVAC pages)
const rvAcRunningNotCoolingEnoughFaqs = [
    { question: 'Why is my RV AC running but not cooling enough?', answer: 'Usually dirty filter, low voltage, weak capacitor, or extreme heat. Clean filter first. Check voltage with EMS. Test capacitor before assuming refrigerant loss.' },
    { question: 'Can low voltage cause weak cooling?', answer: 'Yes. Below 108V the compressor struggles. Use an EMS to verify. See RV AC low voltage problems.' },
    { question: 'Should I add a hard start capacitor for weak cooling?', answer: 'Only if the unit struggles to start. Hard start helps startup surge, not runtime cooling. Test run capacitor first.' },
    { question: 'When should I consider a mini split instead?', answer: 'If rooftop keeps failing in extreme heat or you run AC full-time, mini split may be better. See rooftop AC vs mini split.' },
    { question: 'Does refrigerant leak cause weak cooling?', answer: 'Rare in sealed rooftop units. Rule out filter, voltage, and capacitor first. Refrigerant work requires HVAC certification.' },
];
const rvAcAirflowProblemsFaqs = [
    { question: 'Why is my RV AC airflow weak?', answer: 'Usually dirty filter, frozen coil, or capacitor. Clean filter first. See RV AC freezing up if ice is present.' },
    { question: 'Do mini splits have better airflow?', answer: 'Multi-head mini splits improve airflow distribution in larger rigs. See RV mini split installation.' },
    { question: 'Can a dirty filter cause freezing?', answer: 'Yes. Restricted airflow lowers coil temperature and can cause ice. Clean filter monthly.' },
    { question: 'Should I run fan on high or low for better airflow?', answer: 'High improves airflow but may reduce dehumidification. Low can freeze coil in humid conditions. Start on high.' },
    { question: 'Does duct design affect RV AC airflow?', answer: 'Yes. Undersized ducts, kinks, or blocked vents reduce airflow. Inspect ducts if airflow is consistently weak.' },
];
const rvAcHardStartCapacitorFaqs = [
    { question: 'What is an RV AC hard start capacitor?', answer: 'Adds startup boost for rooftop units. Test run capacitor first. Mini splits use inverter compressors—hard start applies to rooftop only.' },
    { question: 'Hard start vs soft start for RV AC?', answer: 'Hard start: one-time boost. Soft start: ramps amp draw. Soft start better for generators. See best soft start for RV AC.' },
    { question: 'Will hard start fix a failing compressor?', answer: 'No. Hard start helps weak capacitors or marginal startups. A dead compressor will not start with hard start.' },
    { question: 'Do I need hard start if I have soft start?', answer: 'Usually no. Soft start already reduces startup surge. Use one or the other, not both.' },
    { question: 'Can hard start damage my RV AC?', answer: 'Properly sized hard start kits are safe. Oversized or wrong wiring can stress the compressor. Follow manufacturer specs.' },
];
const whenToReplaceRvAcFaqs = [
    { question: 'When should I replace my RV AC?', answer: 'When repair exceeds $400–600, compressor failed, or unit 10+ years old. Capacitor failure is repairable. See capacitor replacement guide.' },
    { question: 'Replace rooftop or upgrade to mini split?', answer: 'Weekend camping: rooftop replacement simpler. Full-time or extreme heat: mini split often better. See rooftop AC vs mini split.' },
    { question: 'How much does rooftop AC replacement cost?', answer: 'New 13.5k–15k BTU unit installed: $800–$1,500. DIY possible but roof work is risky.' },
    { question: 'Is compressor replacement worth it?', answer: 'Usually no. Compressor replacement often costs more than a new rooftop unit. Replace or upgrade instead.' },
    { question: 'Can I keep rooftop and add mini split?', answer: 'Yes. Some owners add mini split for main living and keep rooftop for bedroom or backup.' },
];
const rvAcCompressorFailureFaqs = [
    { question: 'What are RV AC compressor failure symptoms?', answer: 'No cold air, hum or click but no start, tripped breaker. Rule out capacitor first—symptoms overlap. Test capacitor before assuming compressor.' },
    { question: 'Can I repair a failed RV AC compressor?', answer: 'Usually not. Replacement often costs more than new rooftop. Consider mini split upgrade. See when to replace RV AC vs upgrade mini split.' },
    { question: 'How do I know if it\'s capacitor or compressor?', answer: 'Test capacitor µF with a multimeter. Low or open = capacitor. Capacitor good but still no start = likely compressor or control board.' },
    { question: 'Can low voltage kill an RV AC compressor?', answer: 'Yes. Repeated brownouts damage windings over time. Use EMS with low-voltage cutoff to protect the compressor.' },
    { question: 'Will hard start fix a failing compressor?', answer: 'No. Hard start helps weak capacitors. A dead or locked compressor will not start with hard start.' },
];

// RV Air Conditioner Upgrade
const rvAirConditionerUpgradeFaqs = [
    { question: 'When should I replace my RV AC?', answer: 'When repair cost exceeds replacement, or the compressor has failed. Capacitor and filter issues are usually repairable. Units 10+ years old with repeated failures are candidates for replacement.' },
    { question: 'Is it worth upgrading to a mini split?', answer: 'For full-time living, off-grid, or extreme heat: often yes. For weekend camping: usually not—rooftop replacement or repair is simpler.' },
    { question: 'Can I add a soft start to my existing RV AC?', answer: 'Yes. Soft start reduces startup surge by ~65%. Lets smaller generators run AC and can reduce breaker trips. See our soft start install guide.' },
    { question: 'How much does RV AC replacement cost?', answer: 'New rooftop unit installed: $800–$2,000+. Mini split: $900–$4,000+ depending on DIY vs pro. Soft start + EMS: $150–$400.' },
];

// RV Rooftop AC vs Mini Split
const rvRooftopAcVsMiniSplitFaqs = [
    { question: 'Is a mini split better than rooftop AC for RV?', answer: 'For full-time living and off-grid: often yes—quieter, more efficient, better in extreme heat. For weekend campers: rooftop is usually simpler.' },
    { question: 'Can I replace my rooftop AC with a mini split?', answer: 'Yes, but it\'s a custom install. You\'ll need exterior mounting for the condenser and interior space for the evaporator. Many owners keep rooftop as backup.' },
    { question: 'Do mini splits use less power than rooftop AC?', answer: 'Yes. A 9,000 BTU inverter mini split draws ~900–1,200W vs 1,500W+ for a 13,500 BTU rooftop unit.' },
    { question: 'Which is quieter: rooftop AC or mini split?', answer: 'Mini split. The compressor is outside; the indoor unit is a quiet fan. Rooftop AC is noticeably louder.' },
];

// RV Mini Split Air Conditioner Guide
const rvMiniSplitFaqs = [
    { question: 'Can you run a mini split on RV solar?', answer: 'Yes, with sufficient solar and lithium storage. A 9,000 BTU inverter mini split draws ~900–1,200W running. You typically need 1,000W+ solar and 200Ah+ lithium to run it during the day. Nighttime use requires more battery capacity.' },
    { question: 'Are mini splits better than rooftop AC?', answer: 'For full-time living and off-grid setups, often yes—quieter, more efficient, better cooling in extreme heat. For weekend campers and frequent travelers, rooftop AC is usually simpler and more durable for road use.' },
    { question: 'Can you install a mini split yourself?', answer: 'Pre-charged DIY kits (e.g., MrCool) allow self-install without a vacuum pump. Custom line sets and professional refrigerant work require HVAC certification. Mounting and electrical can be DIY if you\'re comfortable with the work.' },
    { question: 'Do mini splits work while driving?', answer: 'Generally no. The outdoor unit must be secured for travel; running it while moving risks vibration damage. Most owners run mini splits only when parked. For dash AC while driving, use the vehicle\'s factory system or a separate solution.' },
];

// HVAC Cluster Nav — Crawl accelerator (per DECISIONGRID-5-CLUSTER-OUTPUT)
const HVAC_CLUSTER_NAV: { name: string; href: string }[] = [
    { name: 'RV AC Troubleshooting Flowchart', href: '/rv/hvac/rv-ac-troubleshooting' },
    { name: 'RV Air Conditioner Upgrade', href: '/rv/hvac/rv-air-conditioner-upgrade' },
    { name: 'RV Mini Split Air Conditioner', href: '/rv/hvac/rv-mini-split-air-conditioner' },
    { name: 'RV Mini Split Installation', href: '/rv/hvac/rv-mini-split-installation' },
    { name: 'Best Mini Split for RV', href: '/rv/hvac/best-mini-split-for-rv' },
    { name: 'RV Mini Split Solar Power', href: '/rv/hvac/rv-mini-split-solar-power' },
    { name: 'Rooftop AC vs Mini Split', href: '/rv/hvac/rv-rooftop-ac-vs-mini-split' },
    { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
    { name: 'RV AC Running But Not Cooling Enough', href: '/rv/hvac/rv-ac-running-but-not-cooling-enough' },
    { name: 'RV AC Airflow Problems', href: '/rv/hvac/rv-ac-airflow-problems' },
    { name: 'RV AC Hard Start Capacitor Guide', href: '/rv/hvac/rv-ac-hard-start-capacitor-guide' },
    { name: 'When to Replace RV AC vs Mini Split', href: '/rv/hvac/when-to-replace-rv-ac-vs-upgrade-mini-split' },
    { name: 'RV AC Compressor Failure Symptoms', href: '/rv/hvac/rv-ac-compressor-failure-symptoms' },
    { name: 'RV AC Freezing Up', href: '/rv/hvac/rv-ac-freezing-up' },
    { name: 'RV AC Short Cycling', href: '/rv/hvac/rv-ac-short-cycling' },
    { name: 'RV AC Leaking Water', href: '/rv/hvac/rv-ac-leaking-water' },
    { name: 'RV AC Fan Running But No Cold Air', href: '/rv/hvac/rv-ac-fan-running-but-no-cold-air' },
    { name: 'RV AC Compressor Not Starting', href: '/rv/hvac/rv-ac-compressor-not-turning-on' },
    { name: 'RV AC Capacitor Failure', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
    { name: 'RV AC Capacitor Replacement', href: '/rv/hvac/rv-ac-capacitor-replacement-guide' },
    { name: 'How To Test RV AC Capacitor', href: '/rv/hvac/how-to-test-rv-ac-capacitor' },
    { name: 'How To Test RV AC Voltage at Unit', href: '/rv/hvac/how-to-test-rv-ac-voltage-at-unit' },
    { name: 'How To Clean RV AC Evaporator Coils', href: '/rv/hvac/how-to-clean-rv-ac-evaporator-coils' },
];

/** Deep-Dive block (matches water hub tier1 related-guides partial). */
const HVAC_RELATED_GUIDES = {
    headline: 'Deep-Dive HVAC Guides',
    subhead: 'Diagnostic · Seasonal · Maintenance',
    essentialLabel: 'Diagnostics:',
    essential: [
        { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
        { name: 'RV AC Freezing Up', href: '/rv/hvac/rv-ac-freezing-up' },
        { name: 'RV AC Low Voltage', href: '/rv/hvac/rv-ac-low-voltage-problems' },
        { name: 'RV AC Breaker Keeps Tripping', href: '/rv/hvac/rv-ac-breaker-keeps-tripping' },
        { name: 'RV Furnace Not Working', href: '/rv/hvac/rv-furnace-not-working' },
    ],
    mechanicalLabel: 'Other systems affected:',
    mechanical: [
        { name: 'RV Electrical Systems', href: '/rv/electrical-systems' },
        { name: 'RV Water Systems', href: '/rv/water-systems' },
    ],
    productLabel: 'Maintenance & Gear:',
    products: [
        { name: 'RV Winterizing Checklist', href: '/rv/rv-winterizing-checklist' },
        { name: 'RV AC Maintenance Schedule', href: '/rv/hvac/rv-ac-maintenance-schedule' },
        { name: 'Seasonal HVAC Checklist', href: '/rv/hvac/seasonal-hvac-checklist' },
        { name: 'Best Soft Start for RV AC', href: '/rv/hvac/best-soft-start-for-rv-ac' },
    ],
};

// RV HVAC Hub — Tier 1 authority (3,000–4,000 words)
const hvacHubFaqs = [
    { question: 'Why is my RV AC running but not cooling?', answer: 'Clean the filter first. Top causes: dirty filter, frozen coils, low voltage, capacitor failure. Check voltage with an EMS or surge protector. See AC not cooling and AC freezing up guides for full diagnosis.' },
    { question: 'Can low voltage damage my RV AC?', answer: 'Yes. Sustained voltage below 108V damages the compressor. The motor draws more amps, overheats, and insulation breaks down. Use an EMS to protect. See campground voltage guide.' },
    { question: 'Why does my AC freeze up at night?', answer: 'Lower ambient temperatures plus restricted airflow cause coil temperature to drop below freezing. Avoid running AC when outdoor temp is below ~65°F. Clean filter and ensure vents are open.' },
    { question: 'How many amps does an RV AC use?', answer: 'Running: 12–15A (1,500–1,800W). Startup surge: 15–20A briefly. On 30A service (3,600W total), stagger microwave and other high-draw appliances. See 30 vs 50 amp guide.' },
    { question: 'Can I run my AC on a generator?', answer: 'Yes, if the generator has enough wattage—typically 3,500W+ for one AC. Size for startup surge, not just running watts. A soft-start kit lets smaller generators run AC. See generator sizing guide.' },
];

// How Many Amps Does RV AC Use — Feeder (supports voltage, breaker, generator)
const howManyAmpsFaqs = [
    { question: 'How many amps does a 13,500 BTU RV AC use?', answer: 'Running: 12–14A (1,500–1,800W). Startup surge: 18–20+ amps briefly (2,500–3,500W). On 30 amp service, stagger AC with microwave and other high-draw appliances.' },
    { question: 'Can I run my RV AC on 30 amps?', answer: 'Yes, but 30 amp = 3,600W total. AC + microwave exceeds that. Stagger use or add a soft-start kit. See 30 vs 50 amp guide.' },
    { question: 'Will low voltage damage my AC?', answer: 'Yes. Below 108V, the compressor draws more amps, overheats, and windings fail. Use an EMS to cut power when voltage drops. See RV AC low voltage problems.' },
    { question: 'Why does my breaker trip when AC starts?', answer: 'Startup surge draws 2–3× running amps briefly. On 30 amp or with other loads, that can trip the breaker. Add a soft-start kit or stagger appliances. See AC breaker keeps tripping.' },
    { question: 'What size generator do I need for RV AC?', answer: '13,500 BTU: minimum 3,000W, recommended 3,500–4,000W. 15,000 BTU: minimum 3,500W, recommended 4,000–4,500W. Size for startup surge, not running watts. A soft-start kit lets smaller generators run AC.' },
];

// Flywheel: RV AC Fan Not Spinning
const rvAcFanNotSpinningFaqs = [
    { question: 'Why won\'t my RV AC fan spin?', answer: 'Usually a failed capacitor. The capacitor provides startup torque. Replace the capacitor first—it\'s the #1 cause. See capacitor symptoms and replacement guide.' },
    { question: 'Can I fix RV AC fan not spinning myself?', answer: 'Yes, if it\'s the capacitor. Turn off power, discharge capacitor, match values, replace. If the motor is burnt, replacement is more involved.' },
];

// Flywheel: RV AC Thermostat Problems
const rvAcThermostatProblemsFaqs = [
    { question: 'Why is my RV thermostat blank?', answer: 'Dead batteries (if battery-powered) or no 12V power. Check converter, fuse, and thermostat batteries.' },
    { question: 'RV thermostat works but AC won\'t run?', answer: 'Wrong mode (Heat/Off instead of Cool) or loose wiring. Set to Cool and temp below room temp. Check wire connections.' },
];

// Flywheel: RV AC Clicking Noise
const rvAcClickingNoiseFaqs = [
    { question: 'Why does my RV AC make a clicking noise?', answer: 'Usually the relay (contactor) or failed capacitor. Rapid clicking with no cooling = capacitor. Replace capacitor first.' },
    { question: 'Is RV AC clicking dangerous?', answer: 'Stop running it. Each start attempt stresses the compressor. Diagnose and fix before restarting.' },
];

// Flywheel: RV AC Short Cycling
const rvAcShortCyclingFaqs = [
    { question: 'Why does my RV AC short cycle?', answer: 'Usually frozen evaporator coil (dirty filter), bad capacitor, low voltage, or faulty thermostat. Clean the filter first. Test voltage with EMS. See capacitor failure symptoms and thermostat problems.' },
    { question: 'Is short cycling bad for my RV AC?', answer: 'Yes. Rapid on/off cycles strain the compressor and increase wear. Fix the cause—usually airflow or voltage—before it causes permanent damage.' },
    { question: 'Can low voltage cause short cycling?', answer: 'Yes. Voltage below 108V can prevent the compressor from starting reliably. It may try, trip thermal overload, and retry. Use an EMS to monitor.' },
];

// Flywheel: RV AC Not Cooling In High Heat
const rvAcNotCoolingInHighHeatFaqs = [
    { question: 'Why does my RV AC not cool when it\'s hot outside?', answer: 'Dirty condenser coils, low voltage at peak demand, or thermal overload. Clean the condenser first. Use an EMS to check voltage. See RV AC low voltage problems.' },
    { question: 'Can high heat damage my RV AC?', answer: 'Running in extreme heat with dirty coils or low voltage can trip thermal overload repeatedly. Clean coils and protect voltage to extend compressor life.' },
    { question: 'Should I run my RV AC in 100 degree weather?', answer: 'Yes, but ensure condenser is clean and voltage is 108–132V. Park in shade when possible. An EMS protects against voltage sag.' },
];

// Flywheel: RV AC Not Cooling On Generator
const rvAcNotCoolingOnGeneratorFaqs = [
    { question: 'Why does my RV AC not cool on generator?', answer: 'Usually generator undersized for startup surge. AC needs 3,000W+ for 13.5K BTU, 3,500W+ for 15K BTU without soft start. Add a soft start to run on smaller generators. See generator sizing for RV AC.' },
    { question: 'Can a 2,200W generator run RV AC?', answer: 'With a soft start, often yes for 13,500 BTU. Without soft start, usually no—startup surge trips overload. See best soft start for RV AC.' },
    { question: 'Does altitude affect generator running AC?', answer: 'Yes. Generators lose ~3–4% power per 1,000 ft. At 5,000 ft you need ~15–20% more capacity. Size up or add soft start.' },
];

// Flywheel: RV AC Not Cooling While Driving
const rvAcNotCoolingWhileDrivingFaqs = [
    { question: 'Why does my RV AC not cool while driving?', answer: 'Usually generator undersized for AC + driving loads, or voltage sag. Check generator sizing and voltage under load. See RV AC not cooling on generator.' },
];

// Flywheel: RV AC Not Cooling In Humid Weather
const rvAcNotCoolingInHumidWeatherFaqs = [
    { question: 'Why does my RV AC not cool in humidity?', answer: 'High humidity increases freeze-up risk. Dirty filter restricts airflow; evaporator runs colder and ices. Clean filter, let ice melt, restart. See RV AC freezing up.' },
];

// Flywheel: RV AC Blowing Warm Air
const rvAcBlowingWarmAirFaqs = [
    { question: 'Why is my RV AC blowing warm air?', answer: 'Usually failed capacitor, frozen evaporator, or low voltage. Replace capacitor first. Clean filter, let ice melt if frozen. See capacitor failure and low voltage guides.' },
];

// Flywheel: RV AC Making Loud Noise
const rvAcMakingLoudNoiseFaqs = [
    { question: 'Why is my RV AC so loud?', answer: 'Weak capacitor, fan motor bearing failure, or compressor wear. Test capacitor first. Grinding = fan motor. Metallic = compressor.' },
];

const rvAcLeakingWaterFaqs = [
    { question: 'Why is my RV AC leaking water inside?', answer: 'Usually a clogged condensate drain or disconnected drain hose. Clear the drain, reconnect the hose, and ensure the unit is level. See <a href="/rv/hvac/rv-ac-freezing-up">RV AC freezing up</a>—ice melt can also cause sudden dripping.' },
    { question: 'Is RV AC water leak dangerous?', answer: 'Water near electrical components is a shock risk. Turn off the AC before inspecting. Standing water can cause mold. Fix the drain promptly.' },
];

// Flywheel: RV AC Clicking But Not Starting
const rvAcClickingButNotStartingFaqs = [
    { question: 'RV AC clicking but not starting?', answer: 'Usually failed capacitor. Replace capacitor first—it\'s the #1 cause. See capacitor failure and relay failure guides.' },
];

// Flywheel: How To Test RV AC Thermostat
const howToTestRvAcThermostatFaqs = [
    { question: 'How do I test my RV thermostat?', answer: 'Check mode is Cool, temp below room. Verify 12V power. Test continuity when calling for cool. Replace batteries if battery-powered.' },
];

// Flywheel: How To Reset RV AC Control Board
const howToResetRvAcControlBoardFaqs = [
    { question: 'How do I reset my RV AC control board?', answer: 'Turn off breaker 5–10 minutes. Remove thermostat batteries. Restore power. Some units have reset button—check manual.' },
];

// Flywheel: RV AC Thermistor Failure
const rvAcThermistorFailureFaqs = [
    { question: 'What does RV AC thermistor do?', answer: 'Senses evaporator temperature. Tells control board how cold coil is. Failed thermistor causes constant run, no cooling, or erratic cycling.' },
];

// Flywheel: RV AC Relay Failure
const rvAcRelayFailureFaqs = [
    { question: 'What is the RV AC relay?', answer: 'Contactor that switches 120V to compressor. Receives low-voltage signal from thermostat. Failed = clicking but no compressor start.' },
];

// Flywheel: RV AC Control Board Failure
const rvAcControlBoardFailureFaqs = [
    { question: 'What does RV AC control board do?', answer: 'Receives thermostat signals, controls compressor and fan. Failed = no response, erratic behavior. Try power reset first.' },
];

// Flywheel: Best RV AC Capacitor Replacement
const bestRvAcCapacitorReplacementFaqs = [
    { question: 'What capacitor do I need for RV AC?', answer: 'Match old capacitor exactly—µF and voltage. Common: 40+5 µF, 370V dual-run. Check unit label.' },
];

// Flywheel: How To Test RV AC Capacitor
const howToTestRvAcCapacitorFaqs = [
    { question: 'How do I test an RV AC capacitor?', answer: 'Power off, discharge with resistor, use multimeter in µF mode. Compare to label (e.g., 40+5 µF). Replace if swollen, leaking, or readings ±10% off spec.' },
    { question: 'Can I test capacitor without removing it?', answer: 'Yes, but discharge first. Touch multimeter leads to common + run, then common + start. Disconnect one lead if in-circuit for accurate reading.' },
];

// Flywheel: How To Test RV AC Voltage at Unit
const howToTestRvAcVoltageAtUnitFaqs = [
    { question: 'How do I test voltage at my RV AC unit?', answer: 'With AC running, set multimeter to AC 200V. Test line terminals at the contactor on the roof unit. Expect 108–132V. No voltage = breaker, thermostat, or wiring.' },
    { question: 'What voltage should my RV AC receive?', answer: '108–132V. Below 108V damages the compressor—shut off AC and check pedestal. See how to test pedestal voltage and RV AC low voltage problems.' },
    { question: 'Voltage at unit is OK but AC won\'t cool?', answer: 'Suspect capacitor, compressor, or refrigerant. Test capacitor first. See capacitor failure symptoms and RV AC not cooling.' },
];

// Flywheel: How To Clean RV AC Evaporator Coils
const howToCleanRvAcEvaporatorCoilsFaqs = [
    { question: 'How often should I clean RV AC evaporator coils?', answer: 'Annually at season start. In dusty environments, every 2–3 months. Clean after freeze-up once ice has melted.' },
    { question: 'Can dirty evaporator coils cause freeze-up?', answer: 'Yes. Restricted airflow reduces heat exchange; the coil gets too cold and ice forms. Cleaning coils and filter prevents most freeze-ups.' },
    { question: 'What cleaner should I use on RV AC coils?', answer: 'Spray coil cleaner or mild soap and water. Avoid bleach or harsh chemicals. Rinse gently. See best RV AC cleaning kits.' },
];

// Flywheel: RV AC Not Cooling On Shore Power
const rvAcNotCoolingOnShorePowerFaqs = [
    { question: 'Why does my RV AC not cool on shore power?', answer: 'Usually low voltage at the pedestal, failed capacitor, or thermostat issue. Check voltage with EMS first. See RV AC low voltage problems and capacitor failure symptoms.' },
    { question: 'RV AC works on generator but not shore power?', answer: 'Campground voltage is likely too low. Use an EMS to verify. Below 108V prevents compressor from starting. Report faulty pedestal to park staff.' },
    { question: 'Can bad shore power damage my AC?', answer: 'Yes. Low voltage (brownout) forces the compressor to draw more amps and overheat. Use an EMS to cut power when voltage drops below 108V.' },
];

// Flywheel: RV AC Shuts Off After 5 Minutes
const rvAcShutsOffFaqs = [
    { question: 'Why does my RV AC shut off after a few minutes?', answer: 'Thermal overload from dirty condenser coils or low refrigerant. Clean coils first. Let unit cool before restarting.' },
    { question: 'Can I bypass the thermal overload?', answer: 'No. It protects the compressor. Fix the cause—usually dirty coils—instead.' },
];

// Flywheel: RV AC Not Turning On
const rvAcNotTurningOnFaqs = [
    { question: 'RV AC won\'t turn on at all—what to check?', answer: 'Power first: breaker, shore cord, 12V for thermostat. Then thermostat mode and batteries. See thermostat problems guide.' },
    { question: 'Thermostat blank, AC dead?', answer: '12V issue. Check converter, fuse, thermostat batteries. No 12V = no thermostat = no AC signal.' },
];

// Flywheel: Best Capacitor Testers (Tools)
const bestCapacitorTestersFaqs = [
    { question: 'Do I need a capacitor tester for RV AC?', answer: 'A multimeter with capacitance mode works. Dedicated testers offer faster µF readout. Test before replacing to confirm diagnosis.' },
    { question: 'How do I test an RV AC capacitor?', answer: 'Discharge first. Use multimeter in capacitance mode. Match µF to label. ±10% acceptable. Bulging or leaking = replace.' },
];

// Flywheel: Best RV AC Cleaning Kits (Tools)
const bestRvAcCleaningKitsFaqs = [
    { question: 'What cleaner is safe for RV AC coils?', answer: 'Coil-safe formulas only. No harsh acids or alkalis. Aluminum fins are delicate. Never use pressure washer.' },
    { question: 'How often should I clean RV AC coils?', answer: 'Condenser and evaporator: start and end of cooling season. Filter: monthly during heavy use.' },
];

// Flywheel: RV AC Fan Motor Replacement
const rvAcFanMotorReplacementFaqs = [
    { question: 'When should I replace RV AC fan motor?', answer: 'When motor hums but won\'t spin (after capacitor check), bearing squeals, or motor smells burnt. Try capacitor first.' },
    { question: 'Condenser vs evaporator fan—same motor?', answer: 'No. Different motors, locations, and often voltage. Match OEM part number or specs when replacing.' },
];

// Flywheel: RV AC Thermostat Replacement
const rvAcThermostatReplacementFaqs = [
    { question: 'When should I replace my RV thermostat?', answer: 'Display dead (after battery/12V check), wrong readings, or AC won\'t cycle. Try batteries and wiring first.' },
    { question: 'Are RV thermostats interchangeable?', answer: 'Must match sub-base and wire configuration. Dometic, Coleman, Atwood use different patterns. Check compatibility.' },
];

// Feeder 5: RV AC Freezing Up — Tier 1, 5000+ words
const acFreezingFaqs = [
    { question: 'Why does my RV AC freeze at night?', answer: 'Lower ambient temperatures plus restricted airflow can cause coil temperature to drop below freezing. Avoid running AC when outdoor temp is below ~65°F. Use heat mode in cool weather.' },
    { question: 'Can I pour hot water on frozen coils?', answer: 'No. Let it thaw naturally using fan mode. Hot water can damage fins or create electrical hazards. Switch to fan, wait 30–60 min.' },
    { question: 'Does low voltage cause AC freezing?', answer: 'Yes. Low voltage reduces compressor efficiency and airflow balance. Use an EMS or surge protector to monitor. See RV AC low voltage problems.' },
    { question: 'Why does my RV AC keep freezing up?', answer: 'Usually a dirty filter or low refrigerant. Clean the filter first. If it keeps freezing, have refrigerant checked by a professional.' },
    { question: 'Can I run the AC when it\'s frozen?', answer: 'No. Turn it off and let the ice melt. Running it frozen can damage the compressor.' },
];

export default async function rvHeatingCoolingGuidesRoutes(app: FastifyInstance) {
    // Service areas for dynamic ZIP-based HVAC lead routing
    app.get('/api/service-areas.json', async (_, reply) => {
        return reply.type('application/json').send(SERVICE_AREAS);
    });

    // Legacy: redirect to canonical HVAC hub (many internal links still point here)
    app.get('/rv/heating-cooling-systems', async (_, reply) => {
        return reply.redirect('/rv/hvac', 301);
    });
    app.get('/guides/complete-guide-to-rv-heating-cooling-systems', async (_, reply) => {
        return reply.redirect('/rv/hvac', 301);
    });

    // RV HVAC Authority Hub — Canonical: /rv/hvac (3,000–4,000 words, Tier 1)
    app.get('/rv/hvac', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            'hubs/hvac-hub-content.html',
            `${BASE_URL}/rv/hvac`,
            'RV HVAC Systems: Complete Troubleshooting & Electrical Guide',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            ...getEeatContext({ exploreCluster: 'hvac' }),
            aiSummary,
            title: 'RV HVAC Systems: Complete Troubleshooting & Electrical Guide',
            subtitle: 'Air conditioning, heating, voltage issues, and component diagnostics — structured for fast decisions.',
            metaDescription:
                'RV HVAC authority hub: AC not cooling, freezing up, low voltage, breaker tripping, compressor, capacitor. Single parent for all RV HVAC troubleshooting and electrical causes. 3,000+ words.',
            canonical: `${BASE_URL}/rv/hvac`,
            contentPartial: '../hubs/hvac-hub-content.html',
            faqs: hvacHubFaqs,
            faqSchemaJson: buildFaqSchema(hvacHubFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
            ]),
            breadcrumb: { backHref: '/rv-parts', backLabel: 'RV Parts' },
            showSafetyDisclaimer: true,
            related: [],
            relatedGuides: HVAC_RELATED_GUIDES,
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        }));
    });
    app.get('/rv/hvac/', async (_, reply) => {
        return reply.redirect('/rv/hvac', 301);
    });

    // RV AC Troubleshooting Flowchart — Master HVAC hub (step-by-step flowchart, high-traffic)
    const rvAcTroubleshootingFaqs = [
        { question: 'Why is my RV AC not cooling?', answer: 'Top causes: dirty filter, low voltage, frozen evaporator, capacitor failure, or refrigerant loss. Check filter first, then verify voltage (108–132V). See our <a href="/rv/hvac/rv-ac-not-cooling">RV AC not cooling</a> for step-by-step diagnosis.' },
        { question: 'What causes RV AC to blow warm air?', answer: 'Usually capacitor failure, dirty filter, or low voltage. Fan runs but no cold air often means capacitor. See <a href="/rv/hvac/rv-ac-capacitor-failure-symptoms">capacitor symptoms</a> and <a href="/rv/hvac/rv-ac-low-voltage-problems">low voltage</a> guides.' },
        { question: 'When should I call a technician?', answer: 'If your compressor, capacitor, or control board has failed after DIY checks, professional diagnosis may be required. Enter your ZIP above to check for RV HVAC technicians in your area.' },
        { question: 'Can I upgrade from rooftop AC to mini split?', answer: 'Yes. Mini splits offer better efficiency and quieter operation. They require professional installation. See our <a href="/rv/hvac/rv-mini-split-air-conditioner">RV mini split air conditioner guide</a>.' },
    ];
    app.get('/rv/hvac/rv-ac-troubleshooting', async (_, reply) => {
        const schemaConfig = buildSchemaConfig({
            canonicalUrl: `${BASE_URL}/rv/hvac/rv-ac-troubleshooting`,
            pageTitle: 'RV Air Conditioner Troubleshooting Guide (Step-by-Step Flowchart) | DecisionGrid',
            pageDescription: 'RV AC troubleshooting flowchart. Step-by-step diagnosis for AC not cooling, blowing warm air, not turning on, freezing up, short cycling. Find the fix fast.',
            pageType: 'authority',
            lastUpdated: 'March 2026',
        });
        return reply.view('rv-ac-troubleshooting-flowchart', {
            title: 'RV Air Conditioner Troubleshooting Guide (Step-by-Step Flowchart)',
            schemaConfig,
            faqSchemaJson: buildFaqSchema(rvAcTroubleshootingFaqs),
            faqs: rvAcTroubleshootingFaqs,
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        });
    });

    // Data-driven: Common Causes of RV AC Failure
    app.get('/rv/hvac/common-causes-of-rv-ac-failure', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/soon-to-be-published/common-causes-of-rv-ac-failure-content.html',
            `${BASE_URL}/rv/hvac/common-causes-of-rv-ac-failure`,
            'Common Causes of RV AC Failure: Data-Based Breakdown',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'Common Causes of RV AC Failure: Data-Based Breakdown',
            subtitle: 'Airflow (~35%), electrical (~30%), capacitor (~20%), compressor (~15%). Prioritize diagnosis.',
            metaDescription: 'Common causes of RV AC failure: airflow restriction, electrical/voltage, capacitor, compressor. Data-based breakdown. Filter first, then voltage. Prevention checklist.',
            canonical: `${BASE_URL}/rv/hvac/common-causes-of-rv-ac-failure`,
            contentPartial: '../guides/unpublished/soon-to-be-published/common-causes-of-rv-ac-failure-content.html',
            faqs: commonCausesAcFailureFaqs,
            faqSchemaJson: buildFaqSchema(commonCausesAcFailureFaqs),
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Maintenance Schedule', href: '/rv/hvac/rv-ac-maintenance-schedule' },
                { name: 'RV AC Breaker Keeps Tripping', href: '/rv/hvac/rv-ac-breaker-keeps-tripping' },
                { name: 'Best Soft Start for RV AC', href: '/rv/hvac/best-soft-start-for-rv-ac' },
                { name: 'Best RV Surge Protector for AC', href: '/rv/hvac/best-rv-surge-protector-for-ac' },
            ],
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        }));
    });

    // Data-driven: RV AC Maintenance Schedule
    app.get('/rv/hvac/rv-ac-maintenance-schedule', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/soon-to-be-published/rv-ac-maintenance-schedule-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-maintenance-schedule`,
            'RV AC Maintenance Schedule: Quarterly Checklist',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Maintenance Schedule: Quarterly Checklist',
            subtitle: 'Filter monthly, coils at season start/end. Printable schedule. Prevent most AC failures.',
            metaDescription: 'RV AC maintenance schedule: filter monthly during cooling season, coil inspection at season start and end. Quarterly rhythm. Printable checklist. Prevent AC not cooling.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-maintenance-schedule`,
            contentPartial: '../guides/unpublished/soon-to-be-published/rv-ac-maintenance-schedule-content.html',
            faqs: rvAcMaintenanceFaqs,
            faqSchemaJson: buildFaqSchema(rvAcMaintenanceFaqs),
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            related: [
                { name: 'Common Causes of RV AC Failure', href: '/rv/hvac/common-causes-of-rv-ac-failure' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'Seasonal HVAC Checklist', href: '/rv/hvac/seasonal-hvac-checklist' },
                { name: 'AC Emergency Checklist', href: '/rv/hvac/ac-emergency-checklist' },
            ],
        }));
    });

    // Buyer-intent: Best Soft Start for RV AC
    app.get('/rv/hvac/best-soft-start-for-rv-ac', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/soon-to-be-published/best-soft-start-for-rv-ac-content.html',
            `${BASE_URL}/rv/hvac/best-soft-start-for-rv-ac`,
            'Best Soft Start for RV AC: Micro-Air vs SoftStartRV',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'Best Soft Start for RV AC: Micro-Air vs SoftStartRV Comparison',
            subtitle: 'Reduce startup surge ~65–75%. Run AC on 2,200W generator or 30 amp. Compatibility, install.',
            metaDescription: 'Best soft start for RV AC: Micro-Air EasyStart vs SoftStartRV. Surge reduction, compatibility, installation. Run AC on smaller generator, reduce breaker trips.',
            canonical: `${BASE_URL}/rv/hvac/best-soft-start-for-rv-ac`,
            contentPartial: '../guides/unpublished/soon-to-be-published/best-soft-start-for-rv-ac-content.html',
            checklistCta: checklistCtaSummer,
            faqs: bestSoftStartFaqs,
            faqSchemaJson: buildFaqSchema(bestSoftStartFaqs),
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            related: [
                { name: 'RV Soft Start Install Guide', href: '/rv/hvac/rv-soft-start-install-guide' },
                { name: 'RV AC Not Cooling On Generator', href: '/rv/hvac/rv-ac-not-cooling-on-generator' },
                { name: 'RV Electrical Soft Start', href: '/rv/electrical/soft-start' },
                { name: 'Generator Sizing', href: '/rv/electrical/generator-sizing' },
                { name: 'Best RV Generators', href: '/rv-parts/best-rv-generators' },
            ],
        }));
    });

    // Buyer-intent: Best RV Surge Protector for AC (high conversion)
    app.get('/rv/hvac/best-rv-surge-protector-for-ac', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/best-rv-surge-protector-for-ac-content.html',
            `${BASE_URL}/rv/hvac/best-rv-surge-protector-for-ac`,
            'Best RV Surge Protector for AC: EMS vs Basic',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'Best RV Surge Protector for AC: EMS vs Basic Comparison',
            subtitle: 'Protect your compressor from brownouts. EMS vs surge. Portable vs hardwired.',
            metaDescription: 'Best RV surge protector for AC: EMS vs basic surge. Low voltage cutoff protects compressor. Portable vs hardwired. Compare models with voltage display.',
            canonical: `${BASE_URL}/rv/hvac/best-rv-surge-protector-for-ac`,
            contentPartial: '../guides/best-rv-surge-protector-for-ac-content.html',
            checklistCta: checklistCtaSummer,
            faqs: bestSurgeProtectorAcFaqs,
            faqSchemaJson: buildFaqSchema(bestSurgeProtectorAcFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'Best Surge Protector for AC', url: `${BASE_URL}/rv/hvac/best-rv-surge-protector-for-ac` },
            ]),
            related: [
                { name: 'RV AC Low Voltage Problems', href: '/rv/hvac/rv-ac-low-voltage-problems' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'EMS vs Surge Protector', href: '/rv/electrical/ems-vs-surge-protectors' },
                { name: 'Best RV Surge Protectors', href: '/rv-parts/best-rv-surge-protectors' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems' },
                { name: '30 Amp vs 50 Amp', href: '/rv/electrical/30-amp-vs-50-amp' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            quickRepairToolsIntro: 'AC protection and voltage monitoring require these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Verify voltage at pedestal' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems', why: 'Full voltage monitoring and cutoff' },
                { name: 'Best RV Surge Protectors', href: '/rv-parts/best-rv-surge-protectors', why: 'Basic surge with voltage display' },
            ],
        }));
    });

    // Buyer-intent: Best Generator for 15,000 BTU RV AC
    app.get('/rv/hvac/best-generator-for-15000-btu-rv-ac', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/soon-to-be-published/best-generator-for-15000-btu-rv-ac-content.html',
            `${BASE_URL}/rv/hvac/best-generator-for-15000-btu-rv-ac`,
            'Best Generator for 15,000 BTU RV AC',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'Best Generator for 15,000 BTU RV AC: Sizing & Model Comparison',
            subtitle: '15K BTU AC needs 4,500W+ without soft start. With soft start: 3,000–3,500W. Inverter vs conventional.',
            metaDescription: 'Best generator for 15,000 BTU RV AC: wattage needs, soft start impact, inverter vs conventional. Size for startup surge. Compare models.',
            canonical: `${BASE_URL}/rv/hvac/best-generator-for-15000-btu-rv-ac`,
            contentPartial: '../guides/unpublished/soon-to-be-published/best-generator-for-15000-btu-rv-ac-content.html',
            checklistCta: checklistCtaSummer,
            faqs: bestGenerator15kFaqs,
            faqSchemaJson: buildFaqSchema(bestGenerator15kFaqs),
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            related: [
                { name: 'RV AC Not Cooling On Generator', href: '/rv/hvac/rv-ac-not-cooling-on-generator' },
                { name: 'Best Soft Start for RV AC', href: '/rv/hvac/best-soft-start-for-rv-ac' },
                { name: 'Generator Sizing', href: '/rv/electrical/generator-sizing' },
                { name: 'RV Generator Sizing for AC', href: '/rv/hvac/rv-generator-sizing-for-rv-ac' },
                { name: 'Best RV Generators', href: '/rv-parts/best-rv-generators' },
            ],
        }));
    });

    // Checklist: AC Emergency Troubleshooting
    app.get('/rv/hvac/ac-emergency-checklist', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/soon-to-be-published/ac-emergency-checklist-content.html',
            `${BASE_URL}/rv/hvac/ac-emergency-checklist`,
            'RV AC Emergency Troubleshooting Checklist',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Emergency Troubleshooting Checklist',
            subtitle: 'Printable step-by-step when AC fails. Filter, power, voltage, capacitor. Most issues resolve in first five steps.',
            metaDescription: 'RV AC emergency troubleshooting checklist. Printable. Filter first, then power, voltage, capacitor. Step-by-step when AC stops cooling or trips breaker.',
            canonical: `${BASE_URL}/rv/hvac/ac-emergency-checklist`,
            contentPartial: '../guides/unpublished/soon-to-be-published/ac-emergency-checklist-content.html',
            faqs: acEmergencyChecklistFaqs,
            faqSchemaJson: buildFaqSchema(acEmergencyChecklistFaqs),
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'Common Causes of RV AC Failure', href: '/rv/hvac/common-causes-of-rv-ac-failure' },
                { name: 'RV AC Maintenance Schedule', href: '/rv/hvac/rv-ac-maintenance-schedule' },
                { name: 'RV AC Troubleshooting Checklist', href: '/rv/hvac/rv-ac-troubleshooting-checklist' },
            ],
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        }));
    });

    // Checklist: Seasonal HVAC Maintenance
    app.get('/rv/hvac/seasonal-hvac-checklist', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/seasonal-hvac-checklist-content.html',
            `${BASE_URL}/rv/hvac/seasonal-hvac-checklist`,
            'RV Seasonal HVAC Maintenance Checklist',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Seasonal HVAC Maintenance Checklist',
            subtitle: 'Printable quarterly schedule. Spring prep, summer upkeep, fall wind-down. Filter monthly during cooling season.',
            metaDescription: 'RV seasonal HVAC maintenance checklist. Printable. Quarterly rhythm: filter monthly, coil inspection at season start and end. Prevent AC not cooling.',
            canonical: `${BASE_URL}/rv/hvac/seasonal-hvac-checklist`,
            contentPartial: '../guides/unpublished/seasonal-hvac-checklist-content.html',
            faqs: seasonalHvacChecklistFaqs,
            faqSchemaJson: buildFaqSchema(seasonalHvacChecklistFaqs),
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            related: [
                { name: 'RV AC Maintenance Schedule', href: '/rv/hvac/rv-ac-maintenance-schedule' },
                { name: 'AC Emergency Checklist', href: '/rv/hvac/ac-emergency-checklist' },
                { name: 'Common Causes of RV AC Failure', href: '/rv/hvac/common-causes-of-rv-ac-failure' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
            ],
        }));
    });

    // Feeder 1: RV Furnace Not Working
    app.get('/rv/hvac/rv-furnace-not-working', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-furnace-not-working-authority-master.html',
            `${BASE_URL}/rv/hvac/rv-furnace-not-working`,
            'RV Furnace Not Working: Propane, 12V, Thermostat & Sail Switch',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Furnace Not Working: Propane, 12V, Thermostat & Sail Switch',
            subtitle: 'Furnace won\'t fire? Check propane, 12V power, thermostat, sail switch. Step-by-step troubleshooting.',
            metaDescription: 'RV furnace not working? Check propane, 12V power, thermostat, sail switch. Step-by-step troubleshooting for furnace that won\'t fire.',
            canonical: `${BASE_URL}/rv/hvac/rv-furnace-not-working`,
            contentPartial: '../guides/rv-furnace-not-working-authority-master.html',
            checklistCta: checklistCtaWinter,
            faqs: furnaceFaqs,
            faqSchemaJson: buildFaqSchema(furnaceFaqs),
            articleSchemaJson: buildArticleSchema({ title: 'RV Furnace Not Working', description: 'Propane, 12V, thermostat, sail switch troubleshooting.', url: `${BASE_URL}/rv/hvac/rv-furnace-not-working` }),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'RV Furnace Not Working', url: `${BASE_URL}/rv/hvac/rv-furnace-not-working` },
            ]),
            authorityLink: { href: '/rv/heating-cooling-systems', label: 'RV Heating & Cooling', systemLabel: 'heating' },
            related: [
                { name: 'How to Stay Warm in Winter', href: '/rv/hvac/how-to-stay-warm-in-winter' },
                { name: 'Space Heater vs Furnace', href: '/rv/hvac/space-heater-vs-furnace' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV Winterizing Checklist', href: '/rv/rv-winterizing-checklist' },
            ],
            relatedTools: [
                { name: 'Best RV Portable Heaters', href: '/rv-parts/best-rv-portable-heaters' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV HVAC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
            emergencyPage: getEmergencyPreset(`${BASE_URL}/rv/hvac/rv-furnace-not-working`),
        }, 'March 2026'));
    });

    // rv-ac-not-blowing-cold → canonical rv-ac-not-cooling (301)
    app.get('/rv/hvac/rv-ac-not-blowing-cold', async (_, reply) => {
        return reply.redirect('/rv/hvac/rv-ac-not-cooling', 301);
    });

    // RV AC Fan Running But No Cold Air — Tier 1 emergency (high-intent)
    app.get('/rv/hvac/rv-ac-fan-running-but-no-cold-air', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ac-fan-running-but-no-cold-air-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-fan-running-but-no-cold-air`,
            'RV AC Fan Running But No Cold Air: Causes, Fixes, and When to Call for Repair',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Fan Running But No Cold Air: Causes, Fixes, and When to Call for Repair',
            subtitle: 'Fan runs but no cold air? Filter, frozen coil, voltage, or compressor. Step-by-step diagnosis.',
            metaDescription: 'RV AC fan running but no cold air? Causes: dirty filter, frozen evaporator, low voltage, capacitor failure. Fixes and when to call for repair.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-fan-running-but-no-cold-air`,
            contentPartial: '../guides/unpublished/future-publications/rv-ac-fan-running-but-no-cold-air-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcFanRunningNoColdAirFaqs,
            faqSchemaJson: buildFaqSchema(rvAcFanRunningNoColdAirFaqs),
            articleSchemaJson: buildArticleSchema({ title: 'RV AC Fan Running But No Cold Air', description: 'Causes, fixes, and when to call for repair. Filter, frozen coil, voltage, compressor.', url: `${BASE_URL}/rv/hvac/rv-ac-fan-running-but-no-cold-air` }),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'RV AC Fan Running But No Cold Air', url: `${BASE_URL}/rv/hvac/rv-ac-fan-running-but-no-cold-air` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Blowing Warm Air', href: '/rv/hvac/rv-ac-blowing-warm-air' },
                { name: 'RV AC Freezing Up', href: '/rv/hvac/rv-ac-freezing-up' },
                { name: 'RV AC Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'RV AC Low Voltage Problems', href: '/rv/hvac/rv-ac-low-voltage-problems' },
                { name: 'RV AC Troubleshooting Flowchart', href: '/rv/hvac/rv-ac-troubleshooting' },
            ],
            relatedTools: [
                { name: 'Best RV Surge Protector for AC', href: '/rv/hvac/best-rv-surge-protector-for-ac' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        }, 'March 2026'));
    });

    // URLs-to-post (5): RV AC Running But Not Cooling Enough
    app.get('/rv/hvac/rv-ac-running-but-not-cooling-enough', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ac-running-but-not-cooling-enough-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-running-but-not-cooling-enough`,
            'RV AC Running But Not Cooling Enough',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Running But Not Cooling Enough: Causes and Fixes',
            subtitle: 'Weak cooling? Filter, voltage, capacitor, or extreme heat. Step-by-step diagnosis.',
            metaDescription: 'RV AC running but not cooling enough? Causes: dirty filter, low voltage, weak capacitor, extreme heat. Fixes and when to upgrade to mini split.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-running-but-not-cooling-enough`,
            contentPartial: '../guides/unpublished/future-publications/rv-ac-running-but-not-cooling-enough-content.html',
            faqs: rvAcRunningNotCoolingEnoughFaqs,
            faqSchemaJson: buildFaqSchema(rvAcRunningNotCoolingEnoughFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'RV AC Running But Not Cooling Enough', url: `${BASE_URL}/rv/hvac/rv-ac-running-but-not-cooling-enough` },
            ]),
            authorityLink: { href: '/rv/hvac', label: 'RV HVAC Systems', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'RV AC Low Voltage Problems', href: '/rv/hvac/rv-ac-low-voltage-problems' },
                { name: 'RV Mini Split Air Conditioner', href: '/rv/hvac/rv-mini-split-air-conditioner' },
                { name: 'Rooftop AC vs Mini Split', href: '/rv/hvac/rv-rooftop-ac-vs-mini-split' },
            ],
            relatedTools: [
                { name: 'Best RV Surge Protector for AC', href: '/rv/hvac/best-rv-surge-protector-for-ac' },
                { name: 'Best RV AC Cleaning Kits', href: '/rv/hvac/best-rv-ac-cleaning-kits' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        }));
    });

    // RV AC Airflow Problems
    app.get('/rv/hvac/rv-ac-airflow-problems', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ac-airflow-problems-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-airflow-problems`,
            'RV AC Airflow Problems',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Airflow Problems: Weak Airflow, Fixes',
            subtitle: 'Weak airflow? Filter, frozen coil, or duct blockage. Diagnosis and fixes.',
            metaDescription: 'RV AC airflow problems? Weak airflow from dirty filter, frozen coil, or capacitor. Fixes and when to consider mini split.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-airflow-problems`,
            contentPartial: '../guides/unpublished/future-publications/rv-ac-airflow-problems-content.html',
            faqs: rvAcAirflowProblemsFaqs,
            faqSchemaJson: buildFaqSchema(rvAcAirflowProblemsFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'RV AC Airflow Problems', url: `${BASE_URL}/rv/hvac/rv-ac-airflow-problems` },
            ]),
            authorityLink: { href: '/rv/hvac', label: 'RV HVAC Systems', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Freezing Up', href: '/rv/hvac/rv-ac-freezing-up' },
                { name: 'RV AC Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'RV AC Maintenance Schedule', href: '/rv/hvac/rv-ac-maintenance-schedule' },
                { name: 'RV Mini Split Air Conditioner', href: '/rv/hvac/rv-mini-split-air-conditioner' },
            ],
            relatedTools: [{ name: 'Best RV AC Cleaning Kits', href: '/rv/hvac/best-rv-ac-cleaning-kits' }],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        }));
    });

    // RV AC Hard Start Capacitor Guide
    app.get('/rv/hvac/rv-ac-hard-start-capacitor-guide', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ac-hard-start-capacitor-guide-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-hard-start-capacitor-guide`,
            'RV AC Hard Start Capacitor Guide',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Hard Start Capacitor Guide: When to Use',
            subtitle: 'Hard start vs soft start. When rooftop AC needs startup boost.',
            metaDescription: 'RV AC hard start capacitor guide. When to use, when to replace run capacitor first. Hard start vs soft start for generators.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-hard-start-capacitor-guide`,
            contentPartial: '../guides/unpublished/future-publications/rv-ac-hard-start-capacitor-guide-content.html',
            faqs: rvAcHardStartCapacitorFaqs,
            faqSchemaJson: buildFaqSchema(rvAcHardStartCapacitorFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'RV AC Hard Start Capacitor Guide', url: `${BASE_URL}/rv/hvac/rv-ac-hard-start-capacitor-guide` },
            ]),
            authorityLink: { href: '/rv/hvac', label: 'RV HVAC Systems', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Breaker Keeps Tripping', href: '/rv/hvac/rv-ac-breaker-keeps-tripping' },
                { name: 'RV AC Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'RV AC Capacitor Replacement Guide', href: '/rv/hvac/rv-ac-capacitor-replacement-guide' },
                { name: 'How To Test RV AC Capacitor', href: '/rv/hvac/how-to-test-rv-ac-capacitor' },
                { name: 'Best Soft Start for RV AC', href: '/rv/hvac/best-soft-start-for-rv-ac' },
                { name: 'RV Mini Split Air Conditioner', href: '/rv/hvac/rv-mini-split-air-conditioner' },
            ],
            relatedTools: [
                { name: 'Best Soft Start for RV AC', href: '/rv/hvac/best-soft-start-for-rv-ac' },
                { name: 'Best RV AC Capacitor Replacement', href: '/rv/hvac/best-rv-ac-capacitor-replacement' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        }));
    });

    // When to Replace RV AC vs Upgrade Mini Split
    app.get('/rv/hvac/when-to-replace-rv-ac-vs-upgrade-mini-split', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/when-to-replace-rv-ac-vs-upgrade-mini-split-content.html',
            `${BASE_URL}/rv/hvac/when-to-replace-rv-ac-vs-upgrade-mini-split`,
            'When to Replace RV AC vs Upgrade Mini Split',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'When to Replace RV AC vs Upgrade Mini Split',
            subtitle: 'Repair vs replace vs upgrade. Cost comparison and decision guide.',
            metaDescription: 'When to replace RV AC vs upgrade to mini split. Cost comparison, repair thresholds, and when mini split makes sense.',
            canonical: `${BASE_URL}/rv/hvac/when-to-replace-rv-ac-vs-upgrade-mini-split`,
            contentPartial: '../guides/unpublished/future-publications/when-to-replace-rv-ac-vs-upgrade-mini-split-content.html',
            faqs: whenToReplaceRvAcFaqs,
            faqSchemaJson: buildFaqSchema(whenToReplaceRvAcFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'When to Replace RV AC vs Upgrade Mini Split', url: `${BASE_URL}/rv/hvac/when-to-replace-rv-ac-vs-upgrade-mini-split` },
            ]),
            authorityLink: { href: '/rv/hvac', label: 'RV HVAC Systems', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV Mini Split Air Conditioner', href: '/rv/hvac/rv-mini-split-air-conditioner' },
                { name: 'Rooftop AC vs Mini Split', href: '/rv/hvac/rv-rooftop-ac-vs-mini-split' },
                { name: 'RV AC Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'RV AC Capacitor Replacement Guide', href: '/rv/hvac/rv-ac-capacitor-replacement-guide' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV Air Conditioner Upgrade', href: '/rv/hvac/rv-air-conditioner-upgrade' },
            ],
            relatedTools: [
                { name: 'Best Mini Split for RV', href: '/rv/hvac/best-mini-split-for-rv' },
                { name: 'Best RV AC Capacitor Replacement', href: '/rv/hvac/best-rv-ac-capacitor-replacement' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        }));
    });

    // RV AC Compressor Failure Symptoms
    app.get('/rv/hvac/rv-ac-compressor-failure-symptoms', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ac-compressor-failure-symptoms-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-compressor-failure-symptoms`,
            'RV AC Compressor Failure Symptoms',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Compressor Failure Symptoms: Signs and Diagnosis',
            subtitle: 'Hums but no cold? Rule out capacitor first. Compressor failure symptoms.',
            metaDescription: 'RV AC compressor failure symptoms: no cold air, hum or click, tripped breaker. Rule out capacitor first. When to replace vs upgrade.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-compressor-failure-symptoms`,
            contentPartial: '../guides/unpublished/future-publications/rv-ac-compressor-failure-symptoms-content.html',
            faqs: rvAcCompressorFailureFaqs,
            faqSchemaJson: buildFaqSchema(rvAcCompressorFailureFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'RV AC Compressor Failure Symptoms', url: `${BASE_URL}/rv/hvac/rv-ac-compressor-failure-symptoms` },
            ]),
            authorityLink: { href: '/rv/hvac', label: 'RV HVAC Systems', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Compressor Not Turning On', href: '/rv/hvac/rv-ac-compressor-not-turning-on' },
                { name: 'RV AC Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'RV AC Capacitor Replacement Guide', href: '/rv/hvac/rv-ac-capacitor-replacement-guide' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV Mini Split Air Conditioner', href: '/rv/hvac/rv-mini-split-air-conditioner' },
                { name: 'Rooftop AC vs Mini Split', href: '/rv/hvac/rv-rooftop-ac-vs-mini-split' },
            ],
            relatedTools: [
                { name: 'Best RV Surge Protector for AC', href: '/rv/hvac/best-rv-surge-protector-for-ac' },
                { name: 'Best Mini Split for RV', href: '/rv/hvac/best-mini-split-for-rv' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        }));
    });

    // rv-mini-split-install-guide → canonical rv-mini-split-installation (301)
    app.get('/rv/hvac/rv-mini-split-install-guide', async (_, reply) => {
        return reply.redirect('/rv/hvac/rv-mini-split-installation', 301);
    });

    // RV AC Not Cooling — Tier 1 authority (canonical /rv/hvac/rv-ac-not-cooling)
    app.get('/rv/hvac/rv-ac-not-cooling', async (request, reply) => {
        const slug = '/rv/hvac/rv-ac-not-cooling';
        const monetization = getMonetizationContext(slug);
        const maturity = await getMaturity(slug);
        request.log.info({ slug, maturity }, 'content maturity (DB)');
        const forceRefresh =
            (request.query as { refreshSummary?: string }).refreshSummary === '1' &&
            (request.query as { token?: string }).token === process.env.ADMIN_TOKEN;
        const aiSummary = await getTier1AiSummary(
            'pillars/rv-ac-not-cooling-sections.html',
            `${BASE_URL}/rv/hvac/rv-ac-not-cooling`,
            rvAcNotCoolingPillarConfig.meta.title,
            monetization.contentMaturityLevel,
            !!forceRefresh
        );
        const config = withSchemaConfig({
            ...rvAcNotCoolingPillarConfig,
            contentPartial: '../pillars/rv-ac-not-cooling-sections.html',
            faqSchemaJson: buildFaqSchema(rvAcNotCoolingPillarConfig.faqs),
        });
        const wizard = await loadWizard('rv-ac-not-cooling');
        return reply.view('layouts/tier1-authority-pillar.html', {
            ...config,
            aiSummary,
            wizard,
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
            emergencyPage: getEmergencyPreset(`${BASE_URL}/rv/hvac/rv-ac-not-cooling`),
        });
    });
    app.get('/guides/rv-ac-not-cooling', async (_, reply) => {
        return reply.redirect('/rv/hvac/rv-ac-not-cooling', 301);
    });

    // RV AC Low Voltage Problems — Canonical: /rv/hvac/rv-ac-low-voltage-problems
    app.get('/rv/hvac/rv-ac-low-voltage-problems', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-ac-low-voltage-problems-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-low-voltage-problems`,
            'RV AC Low Voltage Problems: Protect Your Compressor',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            ...getMonetizationContext('/rv/hvac/rv-ac-low-voltage-problems'),
            title: 'RV AC Low Voltage Problems: Stop Brownout Damage',
            subtitle: 'Voltage below 108V kills compressors. Protect your HVAC today.',
            metaDescription: 'Does your RV AC struggle at campgrounds? Low voltage (under 108V) causes high amp draw and motor failure. Learn how to protect your AC with an EMS or surge protector.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-low-voltage-problems`,
            contentPartial: '../guides/rv-ac-low-voltage-problems-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcLowVoltageFaqs,
            faqSchemaJson: buildFaqSchema(rvAcLowVoltageFaqs),
            articleSchemaJson: buildArticleSchema({ title: 'RV AC Low Voltage Problems', description: 'What voltage your RV AC needs. Brownout damage. EMS vs surge. How to test.', url: `${BASE_URL}/rv/hvac/rv-ac-low-voltage-problems` }),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'RV AC Low Voltage', url: `${BASE_URL}/rv/hvac/rv-ac-low-voltage-problems` },
            ]),
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Freezing Up', href: '/rv/hvac/rv-ac-freezing-up' },
                { name: 'RV AC Troubleshooting Checklist', href: '/rv/hvac/rv-ac-troubleshooting-checklist' },
                { name: 'Campground Voltage', href: '/rv/electrical/campground-voltage' },
                { name: 'What Voltage Damages RV AC', href: '/rv/electrical/what-voltage-damages-rv-ac' },
                { name: 'Best RV Surge Protectors', href: '/rv-parts/best-rv-surge-protectors' },
                { name: '30 Amp vs 50 Amp', href: '/rv/electrical/30-amp-vs-50-amp' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            quickRepairToolsIntro: 'Voltage and capacitor diagnosis usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test voltage at pedestal and under load' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems', why: 'Monitor voltage, protect compressor from brownouts' },
                { name: 'Best RV Surge Protector for AC', href: '/rv/hvac/best-rv-surge-protector-for-ac', why: 'Voltage display and low-voltage cutoff' },
            ],
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        }));
    });
    app.get('/guides/rv-ac-low-voltage-problems', async (_, reply) => {
        return reply.redirect('/rv/hvac/rv-ac-low-voltage-problems', 301);
    });

    // RV AC Breaker Keeps Tripping — Canonical: /rv/hvac/rv-ac-breaker-keeps-tripping (Phase 1 publish)
    app.get('/rv/hvac/rv-ac-breaker-keeps-tripping', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-ac-breaker-keeps-tripping-authority-master.html',
            `${BASE_URL}/rv/hvac/rv-ac-breaker-keeps-tripping`,
            'RV AC Breaker Keeps Tripping: Causes & Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Breaker Keeps Tripping? (Load Math & Fixes)',
            subtitle: 'Overload, startup surge, or capacitor failure? Find the cause fast.',
            metaDescription: 'Why does your RV air conditioner trip the breaker? Learn how to calculate 30 amp vs 50 amp loads, diagnose capacitor shorts, and reduce startup surge with a soft start.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-breaker-keeps-tripping`,
            contentPartial: '../guides/rv-ac-breaker-keeps-tripping-authority-master.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcBreakerFaqs,
            faqSchemaJson: buildFaqSchema(rvAcBreakerFaqs),
            articleSchemaJson: buildArticleSchema({ title: 'RV AC Breaker Keeps Tripping: Causes & Fixes', description: 'RV AC breaker tripping? Overload, capacitor, low voltage, startup surge. Step-by-step diagnosis.', url: `${BASE_URL}/rv/hvac/rv-ac-breaker-keeps-tripping` }),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'RV AC Breaker Tripping', url: `${BASE_URL}/rv/hvac/rv-ac-breaker-keeps-tripping` },
            ]),
            related: [],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            quickRepairToolsIntro: 'Diagnosing AC breaker trips often requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test voltage and continuity' },
                { name: 'Best Capacitor Tester', href: '/rv-parts/best-capacitor-testers', why: 'Check capacitor for short or weak values' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems', why: 'Detect voltage problems that cause trips' },
            ],
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
            emergencyPage: getEmergencyPreset(`${BASE_URL}/rv/hvac/rv-ac-breaker-keeps-tripping`),
        }));
    });
    app.get('/guides/rv-ac-breaker-keeps-tripping', async (_, reply) => {
        return reply.redirect('/rv/hvac/rv-ac-breaker-keeps-tripping', 301);
    });

    // How Many Amps Does RV AC Use — Feeder (supports voltage, breaker, generator)
    app.get('/rv/hvac/how-many-amps-does-rv-ac-use', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/how-many-amps-does-rv-ac-use-content.html',
            `${BASE_URL}/rv/hvac/how-many-amps-does-rv-ac-use`,
            'How Many Amps Does an RV Air Conditioner Use? (30A vs 50A Explained)',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'How Many Amps Does an RV Air Conditioner Use? (30A vs 50A Explained)',
            subtitle: '13,500 BTU: 12–14A running, 18–20A startup. 30A vs 50A load math. Generator sizing.',
            metaDescription: 'How many amps does RV AC use? 13,500 BTU: 12–14A running, 18–20A startup surge. 30 amp vs 50 amp explained. Generator sizing table. Links to low voltage, breaker tripping.',
            canonical: `${BASE_URL}/rv/hvac/how-many-amps-does-rv-ac-use`,
            contentPartial: '../guides/how-many-amps-does-rv-ac-use-content.html',
            checklistCta: checklistCtaSummer,
            faqs: howManyAmpsFaqs,
            faqSchemaJson: buildFaqSchema(howManyAmpsFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'How Many Amps Does RV AC Use', url: `${BASE_URL}/rv/hvac/how-many-amps-does-rv-ac-use` },
            ]),
            related: [
                { name: 'RV AC Low Voltage Problems', href: '/rv/hvac/rv-ac-low-voltage-problems' },
                { name: 'RV AC Breaker Keeps Tripping', href: '/rv/hvac/rv-ac-breaker-keeps-tripping' },
                { name: 'Generator Sizing for RV AC', href: '/rv/electrical/generator-sizing' },
                { name: '30 Amp vs 50 Amp', href: '/rv/electrical/30-amp-vs-50-amp' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            quickRepairToolsIntro: 'Load and amp diagnosis usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Measure voltage and amp draw' },
                { name: 'Best Clamp Meters', href: '/rv-parts/best-clamp-meters', why: 'Measure actual amp draw per circuit' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems', why: 'Monitor voltage under load' },
            ],
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        }));
    });

    // RV AC Compressor Not Turning On
    app.get('/rv/hvac/rv-ac-compressor-not-turning-on', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/rv-ac-compressor-not-turning-on-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-compressor-not-turning-on`,
            'RV AC Compressor Not Turning On: Capacitor, Voltage & Diagnosis',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Compressor Not Turning On: Capacitor, Voltage & Diagnosis',
            subtitle: 'Fan runs but no cold air? Capacitor first, then voltage. Quick diagnosis.',
            metaDescription: 'RV AC compressor not starting? Fan runs but no cold air. Check capacitor, voltage, control board. Step-by-step diagnosis and repair options.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-compressor-not-turning-on`,
            contentPartial: '../guides/unpublished/rv-ac-compressor-not-turning-on-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcCompressorFaqs,
            faqSchemaJson: buildFaqSchema(rvAcCompressorFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Compressor Not Turning On', url: `${BASE_URL}/rv/hvac/rv-ac-compressor-not-turning-on` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            quickRepairToolsIntro: 'Compressor diagnosis requires voltage and capacitor checks.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test voltage and capacitor µF' },
                { name: 'Best RV Surge Protector for AC', href: '/rv/hvac/best-rv-surge-protector-for-ac', why: 'Monitor voltage, protect compressor' },
            ],
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'Capacitor Replacement', href: '/rv/hvac/rv-ac-capacitor-replacement-guide' },
                { name: 'RV AC Low Voltage Problems', href: '/rv/hvac/rv-ac-low-voltage-problems' },
                { name: 'RV AC Freezing Up', href: '/rv/hvac/rv-ac-freezing-up' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        }));
    });

    // RV AC Capacitor Failure Symptoms
    app.get('/rv/hvac/rv-ac-capacitor-failure-symptoms', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/rv-ac-capacitor-failure-symptoms-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-capacitor-failure-symptoms`,
            'RV AC Capacitor Failure Symptoms: Signs & Diagnosis',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Capacitor Failure Symptoms: Signs & Diagnosis',
            subtitle: 'Fan runs but no cold air? Hums but won\'t start? Capacitor is often the cause.',
            metaDescription: 'RV AC capacitor failure symptoms: fan runs but no cold air, humming, breaker trips. How to diagnose and when to replace.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-capacitor-failure-symptoms`,
            contentPartial: '../guides/unpublished/rv-ac-capacitor-failure-symptoms-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcCapacitorFaqs,
            faqSchemaJson: buildFaqSchema(rvAcCapacitorFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Capacitor Failure Symptoms', url: `${BASE_URL}/rv/hvac/rv-ac-capacitor-failure-symptoms` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            quickRepairToolsIntro: 'Capacitor diagnosis and replacement require these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test capacitor µF' },
                { name: 'Best RV Surge Protector for AC', href: '/rv/hvac/best-rv-surge-protector-for-ac', why: 'Protect against voltage stress' },
            ],
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'Compressor Not Turning On', href: '/rv/hvac/rv-ac-compressor-not-turning-on' },
                { name: 'Capacitor Replacement', href: '/rv/hvac/rv-ac-capacitor-replacement-guide' },
                { name: 'RV AC Low Voltage Problems', href: '/rv/hvac/rv-ac-low-voltage-problems' },
                { name: 'RV AC Freezing Up', href: '/rv/hvac/rv-ac-freezing-up' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        }));
    });

    // RV AC Short Cycling
    app.get('/rv/hvac/rv-ac-short-cycling', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ac-short-cycling-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-short-cycling`,
            'RV AC Short Cycling: Causes & Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Short Cycling: Causes & Fixes',
            subtitle: 'AC turns on and off repeatedly? Frozen coil, capacitor, or thermostat. Quick diagnosis.',
            metaDescription: 'RV AC short cycling? Unit runs briefly then stops. Causes: frozen coil, bad capacitor, low voltage, thermostat. Step-by-step fix.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-short-cycling`,
            contentPartial: '../guides/unpublished/future-publications/rv-ac-short-cycling-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcShortCyclingFaqs,
            faqSchemaJson: buildFaqSchema(rvAcShortCyclingFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Short Cycling', url: `${BASE_URL}/rv/hvac/rv-ac-short-cycling` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            quickRepairToolsIntro: 'Short cycling diagnosis usually needs voltage and capacitor checks.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test voltage and capacitor' },
                { name: 'Best RV Surge Protector for AC', href: '/rv/hvac/best-rv-surge-protector-for-ac', why: 'Monitor voltage under load' },
            ],
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Freezing Up', href: '/rv/hvac/rv-ac-freezing-up' },
                { name: 'Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'RV AC Thermostat Problems', href: '/rv/hvac/rv-ac-thermostat-problems' },
                { name: 'RV AC Low Voltage Problems', href: '/rv/hvac/rv-ac-low-voltage-problems' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }));
    });

    // RV AC Not Cooling In High Heat
    app.get('/rv/hvac/rv-ac-not-cooling-in-high-heat', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ac-not-cooling-in-high-heat-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-not-cooling-in-high-heat`,
            'RV AC Not Cooling In High Heat: Causes & Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Not Cooling In High Heat: Causes & Fixes',
            subtitle: 'AC struggles when it\'s 90°F+? Dirty condenser, low voltage, thermal overload. Quick diagnosis.',
            metaDescription: 'RV AC not cooling in high heat? Dirty condenser coils, low voltage at peak demand, thermal overload. Step-by-step fix and prevention.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-not-cooling-in-high-heat`,
            contentPartial: '../guides/unpublished/future-publications/rv-ac-not-cooling-in-high-heat-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcNotCoolingInHighHeatFaqs,
            faqSchemaJson: buildFaqSchema(rvAcNotCoolingInHighHeatFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Not Cooling In High Heat', url: `${BASE_URL}/rv/hvac/rv-ac-not-cooling-in-high-heat` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            quickRepairToolsIntro: 'High-heat diagnosis needs voltage and coil checks.',
            quickRepairTools: [
                { name: 'Best RV Surge Protector for AC', href: '/rv/hvac/best-rv-surge-protector-for-ac', why: 'Monitor voltage under load' },
                { name: 'Best RV AC Cleaning Kit', href: '/rv-parts/best-rv-ac-cleaning-kits', why: 'Clean condenser coils' },
            ],
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Freezing Up', href: '/rv/hvac/rv-ac-freezing-up' },
                { name: 'RV AC Low Voltage Problems', href: '/rv/hvac/rv-ac-low-voltage-problems' },
                { name: 'RV AC Short Cycling', href: '/rv/hvac/rv-ac-short-cycling' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }));
    });

    // RV AC Not Cooling On Shore Power
    app.get('/rv/hvac/rv-ac-not-cooling-on-shore-power', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ac-not-cooling-on-shore-power-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-not-cooling-on-shore-power`,
            'RV AC Not Cooling On Shore Power: Causes & Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Not Cooling On Shore Power: Causes & Fixes',
            subtitle: 'AC works elsewhere but not at the campground? Voltage, capacitor, thermostat. Quick diagnosis.',
            metaDescription: 'RV AC not cooling on shore power? Low voltage at pedestal, failed capacitor, thermostat. Step-by-step fix and voltage check.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-not-cooling-on-shore-power`,
            contentPartial: '../guides/unpublished/future-publications/rv-ac-not-cooling-on-shore-power-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcNotCoolingOnShorePowerFaqs,
            faqSchemaJson: buildFaqSchema(rvAcNotCoolingOnShorePowerFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Not Cooling On Shore Power', url: `${BASE_URL}/rv/hvac/rv-ac-not-cooling-on-shore-power` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            quickRepairToolsIntro: 'Shore power diagnosis needs voltage and capacitor checks.',
            quickRepairTools: [
                { name: 'Best RV Surge Protector for AC', href: '/rv/hvac/best-rv-surge-protector-for-ac', why: 'Monitor voltage, block unsafe power' },
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test voltage and capacitor' },
            ],
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'RV AC Thermostat Problems', href: '/rv/hvac/rv-ac-thermostat-problems' },
                { name: 'RV AC Low Voltage Problems', href: '/rv/hvac/rv-ac-low-voltage-problems' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }));
    });

    // RV AC Not Cooling On Generator
    app.get('/rv/hvac/rv-ac-not-cooling-on-generator', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ac-not-cooling-on-generator-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-not-cooling-on-generator`,
            'RV AC Not Cooling On Generator: Causes & Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Not Cooling On Generator: Causes & Fixes',
            subtitle: 'AC won\'t run on generator? Undersized genny, soft start, voltage. Quick diagnosis.',
            metaDescription: 'RV AC not cooling on generator? Generator undersized for startup surge, voltage sag. Soft start fix. Step-by-step diagnosis.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-not-cooling-on-generator`,
            contentPartial: '../guides/unpublished/future-publications/rv-ac-not-cooling-on-generator-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcNotCoolingOnGeneratorFaqs,
            faqSchemaJson: buildFaqSchema(rvAcNotCoolingOnGeneratorFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Not Cooling On Generator', url: `${BASE_URL}/rv/hvac/rv-ac-not-cooling-on-generator` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'Generator Sizing for RV AC', href: '/rv/hvac/rv-generator-sizing-for-rv-ac' },
                { name: 'RV AC Low Voltage Problems', href: '/rv/hvac/rv-ac-low-voltage-problems' },
                { name: 'Best Soft Start for RV AC', href: '/rv/hvac/best-soft-start-for-rv-ac' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }));
    });

    // RV AC Not Cooling While Driving
    app.get('/rv/hvac/rv-ac-not-cooling-while-driving', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ac-not-cooling-while-driving-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-not-cooling-while-driving`,
            'RV AC Not Cooling While Driving: Causes & Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Not Cooling While Driving: Causes & Fixes',
            subtitle: 'AC cools when parked but not while driving? Generator, voltage. Quick diagnosis.',
            metaDescription: 'RV AC not cooling while driving? Generator undersized, voltage sag. Step-by-step fix.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-not-cooling-while-driving`,
            contentPartial: '../guides/unpublished/future-publications/rv-ac-not-cooling-while-driving-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcNotCoolingWhileDrivingFaqs,
            faqSchemaJson: buildFaqSchema(rvAcNotCoolingWhileDrivingFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Not Cooling While Driving', url: `${BASE_URL}/rv/hvac/rv-ac-not-cooling-while-driving` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Not Cooling On Generator', href: '/rv/hvac/rv-ac-not-cooling-on-generator' },
                { name: 'Generator Sizing for RV AC', href: '/rv/hvac/rv-generator-sizing-for-rv-ac' },
                { name: 'RV AC Low Voltage Problems', href: '/rv/hvac/rv-ac-low-voltage-problems' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }));
    });

    // RV AC Not Cooling In Humid Weather
    app.get('/rv/hvac/rv-ac-not-cooling-in-humid-weather', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ac-not-cooling-in-humid-weather-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-not-cooling-in-humid-weather`,
            'RV AC Not Cooling In Humid Weather: Causes & Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Not Cooling In Humid Weather: Causes & Fixes',
            subtitle: 'AC struggles in humidity? Freeze-up, filter, capacitor. Quick diagnosis.',
            metaDescription: 'RV AC not cooling in humid weather? Frozen evaporator, dirty filter. Step-by-step fix.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-not-cooling-in-humid-weather`,
            contentPartial: '../guides/unpublished/future-publications/rv-ac-not-cooling-in-humid-weather-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcNotCoolingInHumidWeatherFaqs,
            faqSchemaJson: buildFaqSchema(rvAcNotCoolingInHumidWeatherFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Not Cooling In Humid Weather', url: `${BASE_URL}/rv/hvac/rv-ac-not-cooling-in-humid-weather` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Freezing Up', href: '/rv/hvac/rv-ac-freezing-up' },
                { name: 'RV AC Capacitor Failure', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'RV AC Not Cooling In High Heat', href: '/rv/hvac/rv-ac-not-cooling-in-high-heat' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }));
    });

    // How To Test RV AC Capacitor
    app.get('/rv/hvac/how-to-test-rv-ac-capacitor', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/how-to-test-rv-ac-capacitor-content.html',
            `${BASE_URL}/rv/hvac/how-to-test-rv-ac-capacitor`,
            'How To Test RV AC Capacitor: Step-by-Step',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'How To Test RV AC Capacitor: Step-by-Step',
            subtitle: 'Discharge, measure µF, compare to spec. Confirm capacitor failure before replacing.',
            metaDescription: 'How to test RV AC capacitor: discharge, multimeter capacitance mode, interpret readings. Step-by-step diagnostic guide.',
            canonical: `${BASE_URL}/rv/hvac/how-to-test-rv-ac-capacitor`,
            contentPartial: '../guides/unpublished/future-publications/how-to-test-rv-ac-capacitor-content.html',
            checklistCta: checklistCtaSummer,
            faqs: howToTestRvAcCapacitorFaqs,
            faqSchemaJson: buildFaqSchema(howToTestRvAcCapacitorFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'How To Test RV AC Capacitor', url: `${BASE_URL}/rv/hvac/how-to-test-rv-ac-capacitor` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'RV AC Capacitor Replacement Guide', href: '/rv/hvac/rv-ac-capacitor-replacement-guide' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Compressor Not Turning On', href: '/rv/hvac/rv-ac-compressor-not-turning-on' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }));
    });

    // How To Test RV AC Voltage at Unit
    app.get('/rv/hvac/how-to-test-rv-ac-voltage-at-unit', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/how-to-test-rv-ac-voltage-at-unit-content.html',
            `${BASE_URL}/rv/hvac/how-to-test-rv-ac-voltage-at-unit`,
            'How To Test RV AC Voltage at the Unit',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'How To Test RV AC Voltage at the Unit',
            subtitle: 'Verify 120V at the contactor. Diagnose power vs component failure.',
            metaDescription: 'How to test RV AC voltage at the unit: multimeter at contactor, interpret readings. Step-by-step diagnostic guide.',
            canonical: `${BASE_URL}/rv/hvac/how-to-test-rv-ac-voltage-at-unit`,
            contentPartial: '../guides/unpublished/future-publications/how-to-test-rv-ac-voltage-at-unit-content.html',
            checklistCta: checklistCtaSummer,
            faqs: howToTestRvAcVoltageAtUnitFaqs,
            faqSchemaJson: buildFaqSchema(howToTestRvAcVoltageAtUnitFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'How To Test RV AC Voltage at Unit', url: `${BASE_URL}/rv/hvac/how-to-test-rv-ac-voltage-at-unit` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Low Voltage Problems', href: '/rv/hvac/rv-ac-low-voltage-problems' },
                { name: 'How to Test Pedestal Voltage', href: '/rv/electrical/how-to-test-pedestal-voltage' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        }));
    });

    // How To Clean RV AC Evaporator Coils
    app.get('/rv/hvac/how-to-clean-rv-ac-evaporator-coils', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/how-to-clean-rv-ac-evaporator-coils-content.html',
            `${BASE_URL}/rv/hvac/how-to-clean-rv-ac-evaporator-coils`,
            'How To Clean RV AC Evaporator Coils',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'How To Clean RV AC Evaporator Coils',
            subtitle: 'Restore airflow, prevent freeze-up. Step-by-step coil cleaning.',
            metaDescription: 'How to clean RV AC evaporator coils: spray cleaner, rinse, dry. Prevent freeze-up and weak cooling.',
            canonical: `${BASE_URL}/rv/hvac/how-to-clean-rv-ac-evaporator-coils`,
            contentPartial: '../guides/unpublished/future-publications/how-to-clean-rv-ac-evaporator-coils-content.html',
            checklistCta: checklistCtaSummer,
            faqs: howToCleanRvAcEvaporatorCoilsFaqs,
            faqSchemaJson: buildFaqSchema(howToCleanRvAcEvaporatorCoilsFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'How To Clean RV AC Evaporator Coils', url: `${BASE_URL}/rv/hvac/how-to-clean-rv-ac-evaporator-coils` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Freezing Up', href: '/rv/hvac/rv-ac-freezing-up' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Airflow Problems', href: '/rv/hvac/rv-ac-airflow-problems' },
                { name: 'RV AC Maintenance Schedule', href: '/rv/hvac/rv-ac-maintenance-schedule' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        }));
    });

    // Flywheel: RV AC Blowing Warm Air
    app.get('/rv/hvac/rv-ac-blowing-warm-air', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-ac-blowing-warm-air-authority-master.html',
            `${BASE_URL}/rv/hvac/rv-ac-blowing-warm-air`,
            'RV AC Blowing Warm Air: Causes & Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Blowing Warm Air: Causes & Fixes',
            subtitle: 'Fan runs but no cold air? Capacitor, freeze-up, voltage. Quick diagnosis.',
            metaDescription: 'RV AC blowing warm air? Failed capacitor, frozen evaporator, low voltage. Step-by-step fix.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-blowing-warm-air`,
            contentPartial: '../guides/rv-ac-blowing-warm-air-authority-master.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcBlowingWarmAirFaqs,
            faqSchemaJson: buildFaqSchema(rvAcBlowingWarmAirFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Blowing Warm Air', url: `${BASE_URL}/rv/hvac/rv-ac-blowing-warm-air` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'RV AC Freezing Up', href: '/rv/hvac/rv-ac-freezing-up' },
                { name: 'RV AC Compressor Not Turning On', href: '/rv/hvac/rv-ac-compressor-not-turning-on' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
            emergencyPage: getEmergencyPreset(`${BASE_URL}/rv/hvac/rv-ac-blowing-warm-air`),
        }));
    });

    // Flywheel: RV AC Making Loud Noise
    app.get('/rv/hvac/rv-ac-making-loud-noise', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-ac-making-loud-noise-authority-master.html',
            `${BASE_URL}/rv/hvac/rv-ac-making-loud-noise`,
            'RV AC Making Loud Noise: Causes & Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Making Loud Noise: Causes & Fixes',
            subtitle: 'Grinding, buzzing, rattling? Capacitor, fan motor, compressor. Quick diagnosis.',
            metaDescription: 'RV AC making loud noise? Capacitor, fan motor bearing, compressor. Step-by-step fix.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-making-loud-noise`,
            contentPartial: '../guides/rv-ac-making-loud-noise-authority-master.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcMakingLoudNoiseFaqs,
            faqSchemaJson: buildFaqSchema(rvAcMakingLoudNoiseFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Making Loud Noise', url: `${BASE_URL}/rv/hvac/rv-ac-making-loud-noise` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'RV AC Fan Not Spinning', href: '/rv/hvac/rv-ac-fan-not-spinning' },
                { name: 'RV AC Compressor Not Turning On', href: '/rv/hvac/rv-ac-compressor-not-turning-on' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
            emergencyPage: getEmergencyPreset(`${BASE_URL}/rv/hvac/rv-ac-making-loud-noise`),
        }));
    });

    // Flywheel: RV AC Leaking Water
    app.get('/rv/hvac/rv-ac-leaking-water', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ac-leaking-water-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-leaking-water`,
            'RV AC Leaking Water: Condensate Drain & Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Leaking Water: Condensate Drain & Fixes',
            subtitle: 'Water dripping inside? Clogged drain, disconnected hose, or ice melt. Step-by-step fix.',
            metaDescription: 'RV AC leaking water? Clogged condensate drain, disconnected hose, or frozen evaporator melt. Clear drain, check pan, fix the leak.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-leaking-water`,
            contentPartial: '../guides/unpublished/future-publications/rv-ac-leaking-water-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcLeakingWaterFaqs,
            faqSchemaJson: buildFaqSchema(rvAcLeakingWaterFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Leaking Water', url: `${BASE_URL}/rv/hvac/rv-ac-leaking-water` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Freezing Up', href: '/rv/hvac/rv-ac-freezing-up' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Maintenance Schedule', href: '/rv/hvac/rv-ac-maintenance-schedule' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        }));
    });

    // Flywheel: RV AC Clicking But Not Starting
    app.get('/rv/hvac/rv-ac-clicking-but-not-starting', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ac-clicking-but-not-starting-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-clicking-but-not-starting`,
            'RV AC Clicking But Not Starting: Causes & Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Clicking But Not Starting: Causes & Fixes',
            subtitle: 'Rapid clicking, no compressor start? Capacitor. Quick diagnosis.',
            metaDescription: 'RV AC clicking but not starting? Failed capacitor, relay. Step-by-step fix.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-clicking-but-not-starting`,
            contentPartial: '../guides/unpublished/future-publications/rv-ac-clicking-but-not-starting-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcClickingButNotStartingFaqs,
            faqSchemaJson: buildFaqSchema(rvAcClickingButNotStartingFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Clicking But Not Starting', url: `${BASE_URL}/rv/hvac/rv-ac-clicking-but-not-starting` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            related: [
                { name: 'Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'RV AC Relay Failure', href: '/rv/hvac/rv-ac-relay-failure' },
                { name: 'RV AC Clicking Noise', href: '/rv/hvac/rv-ac-clicking-noise' },
                { name: 'RV AC Compressor Not Turning On', href: '/rv/hvac/rv-ac-compressor-not-turning-on' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }));
    });

    // Flywheel: How To Test RV AC Thermostat
    app.get('/rv/hvac/how-to-test-rv-ac-thermostat', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/how-to-test-rv-ac-thermostat-content.html',
            `${BASE_URL}/rv/hvac/how-to-test-rv-ac-thermostat`,
            'How To Test RV AC Thermostat: Step-by-Step',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'How To Test RV AC Thermostat: Step-by-Step',
            subtitle: 'Verify mode, 12V, continuity. Confirm thermostat sends cool signal.',
            metaDescription: 'How to test RV AC thermostat: mode, 12V power, continuity. Step-by-step diagnostic.',
            canonical: `${BASE_URL}/rv/hvac/how-to-test-rv-ac-thermostat`,
            contentPartial: '../guides/unpublished/future-publications/how-to-test-rv-ac-thermostat-content.html',
            checklistCta: checklistCtaSummer,
            faqs: howToTestRvAcThermostatFaqs,
            faqSchemaJson: buildFaqSchema(howToTestRvAcThermostatFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'How To Test RV AC Thermostat', url: `${BASE_URL}/rv/hvac/how-to-test-rv-ac-thermostat` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Thermostat Problems', href: '/rv/hvac/rv-ac-thermostat-problems' },
                { name: 'RV AC Thermostat Replacement', href: '/rv/hvac/rv-ac-thermostat-replacement' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }));
    });

    // Flywheel: How To Reset RV AC Control Board
    app.get('/rv/hvac/how-to-reset-rv-ac-control-board', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/how-to-reset-rv-ac-control-board-content.html',
            `${BASE_URL}/rv/hvac/how-to-reset-rv-ac-control-board`,
            'How To Reset RV AC Control Board: Step-by-Step',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'How To Reset RV AC Control Board: Step-by-Step',
            subtitle: 'Power cycle, thermostat reset. Clear fault codes.',
            metaDescription: 'How to reset RV AC control board: power off, thermostat, restore. Step-by-step.',
            canonical: `${BASE_URL}/rv/hvac/how-to-reset-rv-ac-control-board`,
            contentPartial: '../guides/unpublished/future-publications/how-to-reset-rv-ac-control-board-content.html',
            checklistCta: checklistCtaSummer,
            faqs: howToResetRvAcControlBoardFaqs,
            faqSchemaJson: buildFaqSchema(howToResetRvAcControlBoardFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'How To Reset RV AC Control Board', url: `${BASE_URL}/rv/hvac/how-to-reset-rv-ac-control-board` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Control Board Failure', href: '/rv/hvac/rv-ac-control-board-failure' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Thermostat Problems', href: '/rv/hvac/rv-ac-thermostat-problems' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }));
    });

    // Flywheel: RV AC Thermistor Failure
    app.get('/rv/hvac/rv-ac-thermistor-failure', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ac-thermistor-failure-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-thermistor-failure`,
            'RV AC Thermistor Failure: Causes & Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Thermistor Failure: Causes & Fixes',
            subtitle: 'Temperature sensor failed. Constant run, no cooling, erratic cycling.',
            metaDescription: 'RV AC thermistor failure: wrong temp reading, constant run. Step-by-step fix.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-thermistor-failure`,
            contentPartial: '../guides/unpublished/future-publications/rv-ac-thermistor-failure-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcThermistorFailureFaqs,
            faqSchemaJson: buildFaqSchema(rvAcThermistorFailureFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Thermistor Failure', url: `${BASE_URL}/rv/hvac/rv-ac-thermistor-failure` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Freezing Up', href: '/rv/hvac/rv-ac-freezing-up' },
                { name: 'RV AC Short Cycling', href: '/rv/hvac/rv-ac-short-cycling' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }));
    });

    // Flywheel: RV AC Relay Failure
    app.get('/rv/hvac/rv-ac-relay-failure', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ac-relay-failure-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-relay-failure`,
            'RV AC Relay Failure: Causes & Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Relay Failure: Causes & Fixes',
            subtitle: 'Contactor stuck or pitted. Clicking but no compressor start.',
            metaDescription: 'RV AC relay failure: contactor, clicking. Step-by-step fix.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-relay-failure`,
            contentPartial: '../guides/unpublished/future-publications/rv-ac-relay-failure-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcRelayFailureFaqs,
            faqSchemaJson: buildFaqSchema(rvAcRelayFailureFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Relay Failure', url: `${BASE_URL}/rv/hvac/rv-ac-relay-failure` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Clicking Noise', href: '/rv/hvac/rv-ac-clicking-noise' },
                { name: 'RV AC Clicking But Not Starting', href: '/rv/hvac/rv-ac-clicking-but-not-starting' },
                { name: 'RV AC Compressor Not Turning On', href: '/rv/hvac/rv-ac-compressor-not-turning-on' },
                { name: 'Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }));
    });

    // Flywheel: RV AC Control Board Failure
    app.get('/rv/hvac/rv-ac-control-board-failure', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ac-control-board-failure-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-control-board-failure`,
            'RV AC Control Board Failure: Causes & Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Control Board Failure: Causes & Fixes',
            subtitle: 'No response, erratic behavior. Try reset first.',
            metaDescription: 'RV AC control board failure: no response, reset. Step-by-step fix.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-control-board-failure`,
            contentPartial: '../guides/unpublished/future-publications/rv-ac-control-board-failure-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcControlBoardFailureFaqs,
            faqSchemaJson: buildFaqSchema(rvAcControlBoardFailureFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Control Board Failure', url: `${BASE_URL}/rv/hvac/rv-ac-control-board-failure` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            related: [
                { name: 'How To Reset RV AC Control Board', href: '/rv/hvac/how-to-reset-rv-ac-control-board' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Thermostat Problems', href: '/rv/hvac/rv-ac-thermostat-problems' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }));
    });

    // Flywheel: Best RV AC Capacitor Replacement
    app.get('/rv/hvac/best-rv-ac-capacitor-replacement', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/best-rv-ac-capacitor-replacement-content.html',
            `${BASE_URL}/rv/hvac/best-rv-ac-capacitor-replacement`,
            'Best RV AC Capacitor Replacement: Compatibility Guide',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'Best RV AC Capacitor Replacement: Compatibility Guide',
            subtitle: 'Match µF and voltage. 40+5 µF, 370V common for Dometic, Coleman.',
            metaDescription: 'Best RV AC capacitor replacement: match values, compatibility. Dometic, Coleman.',
            canonical: `${BASE_URL}/rv/hvac/best-rv-ac-capacitor-replacement`,
            contentPartial: '../guides/unpublished/future-publications/best-rv-ac-capacitor-replacement-content.html',
            checklistCta: checklistCtaSummer,
            faqs: bestRvAcCapacitorReplacementFaqs,
            faqSchemaJson: buildFaqSchema(bestRvAcCapacitorReplacementFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'Best RV AC Capacitor Replacement', url: `${BASE_URL}/rv/hvac/best-rv-ac-capacitor-replacement` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Capacitor Replacement Guide', href: '/rv/hvac/rv-ac-capacitor-replacement-guide' },
                { name: 'Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }));
    });

    // Flywheel: Best RV AC Cleaning Kits
    app.get('/rv/hvac/best-rv-ac-cleaning-kits', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/best-rv-ac-cleaning-kits-content.html',
            `${BASE_URL}/rv/hvac/best-rv-ac-cleaning-kits`,
            'Best RV AC Cleaning Kits: Coil-Safe Options',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'Best RV AC Cleaning Kits: Coil-Safe Options',
            subtitle: 'Clean condenser and evaporator. Coil-safe cleaner, fin comb.',
            metaDescription: 'Best RV AC cleaning kits: coil-safe cleaner, fin comb. Prevent freeze-up and overheating.',
            canonical: `${BASE_URL}/rv/hvac/best-rv-ac-cleaning-kits`,
            contentPartial: '../guides/unpublished/future-publications/best-rv-ac-cleaning-kits-content.html',
            checklistCta: checklistCtaSummer,
            faqs: bestRvAcCleaningKitsFaqs,
            faqSchemaJson: buildFaqSchema(bestRvAcCleaningKitsFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'Best RV AC Cleaning Kits', url: `${BASE_URL}/rv/hvac/best-rv-ac-cleaning-kits` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Freezing Up', href: '/rv/hvac/rv-ac-freezing-up' },
                { name: 'RV AC Not Cooling In High Heat', href: '/rv/hvac/rv-ac-not-cooling-in-high-heat' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }));
    });

    // RV Mini Split Air Conditioner Guide — Authority (install, cost, pros & cons)
    app.get('/rv/hvac/rv-mini-split-air-conditioner', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-mini-split-air-conditioner-content.html',
            `${BASE_URL}/rv/hvac/rv-mini-split-air-conditioner`,
            'RV Mini Split Air Conditioner: Complete Guide (Install, Cost, Pros & Cons)',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Mini Split Air Conditioner: Complete Guide (Install, Cost, Pros & Cons)',
            subtitle: 'Quieter, more efficient than rooftop AC. When it makes sense, how to install, power needs.',
            metaDescription: 'RV mini split air conditioner guide. Install, cost, power requirements, best models. Quieter than rooftop AC, better for off-grid. Pioneer, MrCool, Senville.',
            canonical: `${BASE_URL}/rv/hvac/rv-mini-split-air-conditioner`,
            contentPartial: '../guides/unpublished/future-publications/rv-mini-split-air-conditioner-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvMiniSplitFaqs,
            faqSchemaJson: buildFaqSchema(rvMiniSplitFaqs),
            articleSchemaJson: buildArticleSchema({ title: 'RV Mini Split Air Conditioner Guide', description: 'Complete guide to RV mini split air conditioners. Install, cost, power, best models. Quieter and more efficient than rooftop AC.', url: `${BASE_URL}/rv/hvac/rv-mini-split-air-conditioner` }),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'RV Mini Split Air Conditioner', url: `${BASE_URL}/rv/hvac/rv-mini-split-air-conditioner` },
            ]),
            authorityLink: { href: '/rv/hvac', label: 'RV HVAC', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV Mini Split Installation', href: '/rv/hvac/rv-mini-split-installation' },
                { name: 'Best Mini Split for RV', href: '/rv/hvac/best-mini-split-for-rv' },
                { name: 'RV Mini Split Solar Power', href: '/rv/hvac/rv-mini-split-solar-power' },
                { name: 'Rooftop AC vs Mini Split', href: '/rv/hvac/rv-rooftop-ac-vs-mini-split' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Freezing Up', href: '/rv/hvac/rv-ac-freezing-up' },
                { name: 'RV AC Troubleshooting Flowchart', href: '/rv/hvac/rv-ac-troubleshooting' },
            ],
            relatedTools: [
                { name: 'Best RV Surge Protectors', href: '/rv-parts/best-rv-surge-protectors' },
                { name: 'Best Soft Start for RV AC', href: '/rv/hvac/best-soft-start-for-rv-ac' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }, 'March 2026'));
    });

    // RV Air Conditioner Upgrade
    app.get('/rv/hvac/rv-air-conditioner-upgrade', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-air-conditioner-upgrade-content.html',
            `${BASE_URL}/rv/hvac/rv-air-conditioner-upgrade`,
            'RV Air Conditioner Upgrade: Fix, Replace, or Mini Split?',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Air Conditioner Upgrade: Fix, Replace, or Mini Split?',
            subtitle: 'When to fix, replace rooftop, or upgrade to mini split. Cost comparison and decision guide.',
            metaDescription: 'RV air conditioner upgrade options: fix with soft start and EMS, replace rooftop, or upgrade to mini split. Cost comparison and when each makes sense.',
            canonical: `${BASE_URL}/rv/hvac/rv-air-conditioner-upgrade`,
            contentPartial: '../guides/unpublished/future-publications/rv-air-conditioner-upgrade-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAirConditionerUpgradeFaqs,
            faqSchemaJson: buildFaqSchema(rvAirConditionerUpgradeFaqs),
            articleSchemaJson: buildArticleSchema({ title: 'RV Air Conditioner Upgrade', description: 'Fix, replace, or upgrade to mini split. Cost comparison and decision guide.', url: `${BASE_URL}/rv/hvac/rv-air-conditioner-upgrade` }),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'RV Air Conditioner Upgrade', url: `${BASE_URL}/rv/hvac/rv-air-conditioner-upgrade` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV Mini Split Air Conditioner', href: '/rv/hvac/rv-mini-split-air-conditioner' },
                { name: 'Rooftop AC vs Mini Split', href: '/rv/hvac/rv-rooftop-ac-vs-mini-split' },
                { name: 'Best Soft Start for RV AC', href: '/rv/hvac/best-soft-start-for-rv-ac' },
                { name: 'Best Mini Split for RV', href: '/rv/hvac/best-mini-split-for-rv' },
            ],
            relatedTools: [
                { name: 'Best RV Surge Protector for AC', href: '/rv/hvac/best-rv-surge-protector-for-ac' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }, 'March 2026'));
    });

    // RV Mini Split Installation Guide
    app.get('/rv/hvac/rv-mini-split-installation', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-mini-split-installation-content.html',
            `${BASE_URL}/rv/hvac/rv-mini-split-installation`,
            'How to Install a Mini Split in an RV (Complete Guide)',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'How to Install a Mini Split in an RV (Complete Guide)',
            subtitle: 'Step-by-step: mount outdoor unit, run lines, wire electrical. DIY pre-charged or pro install.',
            metaDescription: 'How to install a mini split in an RV. Mount outdoor condenser, indoor air handler, refrigerant lines, electrical. DIY pre-charged kits vs pro. Tools needed.',
            canonical: `${BASE_URL}/rv/hvac/rv-mini-split-installation`,
            contentPartial: '../guides/unpublished/future-publications/rv-mini-split-installation-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvMiniSplitInstallationFaqs,
            faqSchemaJson: buildFaqSchema(rvMiniSplitInstallationFaqs),
            articleSchemaJson: buildArticleSchema({ title: 'How to Install a Mini Split in an RV', description: 'Complete RV mini split installation guide. Mount outdoor unit, run lines, wire electrical. DIY or pro.', url: `${BASE_URL}/rv/hvac/rv-mini-split-installation` }),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'RV Mini Split Installation', url: `${BASE_URL}/rv/hvac/rv-mini-split-installation` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-mini-split-air-conditioner', label: 'RV Mini Split Air Conditioner', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV Mini Split Air Conditioner', href: '/rv/hvac/rv-mini-split-air-conditioner' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Freezing Up', href: '/rv/hvac/rv-ac-freezing-up' },
                { name: 'RV Mini Split Solar Power', href: '/rv/hvac/rv-mini-split-solar-power' },
                { name: 'Best Mini Split for RV', href: '/rv/hvac/best-mini-split-for-rv' },
            ],
            relatedTools: [
                { name: 'Best RV Surge Protectors', href: '/rv-parts/best-rv-surge-protectors' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }, 'March 2026'));
    });

    // Best Mini Split for RV
    app.get('/rv/hvac/best-mini-split-for-rv', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/best-mini-split-for-rv-content.html',
            `${BASE_URL}/rv/hvac/best-mini-split-for-rv`,
            'Best Mini Split Air Conditioner for RVs (2026 Guide)',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'Best Mini Split Air Conditioner for RVs (2026 Guide)',
            subtitle: '9,000 BTU units for van life, bus conversions, solar. Pioneer, MrCool, Senville compared.',
            metaDescription: 'Best mini split for RV: 9,000 BTU units, quietest options, solar-compatible. Pioneer, MrCool, Senville. Van life, bus conversions, off-grid.',
            canonical: `${BASE_URL}/rv/hvac/best-mini-split-for-rv`,
            contentPartial: '../guides/unpublished/future-publications/best-mini-split-for-rv-content.html',
            checklistCta: checklistCtaSummer,
            faqs: bestMiniSplitForRvFaqs,
            faqSchemaJson: buildFaqSchema(bestMiniSplitForRvFaqs),
            articleSchemaJson: buildArticleSchema({ title: 'Best Mini Split for RV', description: 'Best mini split air conditioners for RVs. 9K BTU, quietest, solar. Pioneer, MrCool, Senville.', url: `${BASE_URL}/rv/hvac/best-mini-split-for-rv` }),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'Best Mini Split for RV', url: `${BASE_URL}/rv/hvac/best-mini-split-for-rv` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-mini-split-air-conditioner', label: 'RV Mini Split Air Conditioner', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV Mini Split Air Conditioner', href: '/rv/hvac/rv-mini-split-air-conditioner' },
                { name: 'RV Mini Split Solar Power', href: '/rv/hvac/rv-mini-split-solar-power' },
                { name: 'RV Rooftop AC vs Mini Split', href: '/rv/hvac/rv-rooftop-ac-vs-mini-split' },
                { name: 'RV Mini Split Installation', href: '/rv/hvac/rv-mini-split-installation' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
            ],
            relatedTools: [],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }, 'March 2026'));
    });

    // RV Mini Split Solar Power
    app.get('/rv/hvac/rv-mini-split-solar-power', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-mini-split-solar-power-content.html',
            `${BASE_URL}/rv/hvac/rv-mini-split-solar-power`,
            'Can You Run a Mini Split on RV Solar Power?',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'Can You Run a Mini Split on RV Solar Power?',
            subtitle: 'Power consumption, solar setup, battery sizing. 900–1,200W running. Example: 800W solar, 400Ah lithium.',
            metaDescription: 'Can you run a mini split on RV solar? Yes. Power draw, solar setup, battery sizing. 9K BTU inverter: 900–1,200W. 800W solar, 400Ah lithium example.',
            canonical: `${BASE_URL}/rv/hvac/rv-mini-split-solar-power`,
            contentPartial: '../guides/unpublished/future-publications/rv-mini-split-solar-power-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvMiniSplitSolarPowerFaqs,
            faqSchemaJson: buildFaqSchema(rvMiniSplitSolarPowerFaqs),
            articleSchemaJson: buildArticleSchema({ title: 'Can You Run a Mini Split on RV Solar Power?', description: 'RV mini split solar power: consumption, setup, battery sizing. Off-grid AC.', url: `${BASE_URL}/rv/hvac/rv-mini-split-solar-power` }),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'RV Mini Split Solar Power', url: `${BASE_URL}/rv/hvac/rv-mini-split-solar-power` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-mini-split-air-conditioner', label: 'RV Mini Split Air Conditioner', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV Mini Split Air Conditioner', href: '/rv/hvac/rv-mini-split-air-conditioner' },
                { name: 'Best Mini Split for RV', href: '/rv/hvac/best-mini-split-for-rv' },
                { name: 'RV Mini Split Installation', href: '/rv/hvac/rv-mini-split-installation' },
                { name: 'How Many Amps RV AC Uses', href: '/rv/hvac/how-many-amps-does-rv-ac-use' },
                { name: 'RV AC Low Voltage Problems', href: '/rv/hvac/rv-ac-low-voltage-problems' },
            ],
            relatedTools: [],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }, 'March 2026'));
    });

    // RV Rooftop AC vs Mini Split
    app.get('/rv/hvac/rv-rooftop-ac-vs-mini-split', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-rooftop-ac-vs-mini-split-content.html',
            `${BASE_URL}/rv/hvac/rv-rooftop-ac-vs-mini-split`,
            'RV Rooftop AC vs Mini Split: Which Is Better?',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Rooftop AC vs Mini Split: Which Is Better?',
            subtitle: 'Noise, efficiency, cost, install. When to stick with rooftop, when to upgrade.',
            metaDescription: 'RV rooftop AC vs mini split comparison. Noise, efficiency, power draw, cost. When rooftop wins, when mini split wins. Full-time vs weekend camping.',
            canonical: `${BASE_URL}/rv/hvac/rv-rooftop-ac-vs-mini-split`,
            contentPartial: '../guides/unpublished/future-publications/rv-rooftop-ac-vs-mini-split-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvRooftopAcVsMiniSplitFaqs,
            faqSchemaJson: buildFaqSchema(rvRooftopAcVsMiniSplitFaqs),
            articleSchemaJson: buildArticleSchema({ title: 'RV Rooftop AC vs Mini Split', description: 'Rooftop AC vs mini split for RV. Noise, efficiency, cost. Which is better?', url: `${BASE_URL}/rv/hvac/rv-rooftop-ac-vs-mini-split` }),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'Rooftop AC vs Mini Split', url: `${BASE_URL}/rv/hvac/rv-rooftop-ac-vs-mini-split` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-mini-split-air-conditioner', label: 'RV Mini Split Air Conditioner', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV Mini Split Air Conditioner', href: '/rv/hvac/rv-mini-split-air-conditioner' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'Best Mini Split for RV', href: '/rv/hvac/best-mini-split-for-rv' },
                { name: 'RV Mini Split Installation', href: '/rv/hvac/rv-mini-split-installation' },
                { name: 'RV Mini Split Solar Power', href: '/rv/hvac/rv-mini-split-solar-power' },
            ],
            relatedTools: [
                { name: 'Best Soft Start for RV AC', href: '/rv/hvac/best-soft-start-for-rv-ac' },
                { name: 'Best RV Surge Protector for AC', href: '/rv/hvac/best-rv-surge-protector-for-ac' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }, 'March 2026'));
    });

    // RV AC Capacitor Replacement Guide — Canonical: /rv/hvac/rv-ac-capacitor-replacement-guide
    app.get('/rv/hvac/rv-ac-capacitor-replacement-guide', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-ac-capacitor-replacement-guide-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-capacitor-replacement-guide`,
            'RV AC Capacitor Replacement Guide: Step-by-Step DIY',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Capacitor Replacement Guide: Step-by-Step DIY',
            subtitle: 'Turn off power, discharge, match values, install. DIY in under an hour.',
            metaDescription: 'RV AC capacitor replacement: step-by-step guide. Discharge capacitor, match µF and voltage, install. DIY or hire a pro. Links to capacitor failure symptoms, low voltage protection. 3,200+ words.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-capacitor-replacement-guide`,
            contentPartial: '../guides/rv-ac-capacitor-replacement-guide-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcCapacitorReplacementFaqs,
            faqSchemaJson: buildFaqSchema(rvAcCapacitorReplacementFaqs),
            articleSchemaJson: buildArticleSchema({ title: 'RV AC Capacitor Replacement Guide', description: 'Step-by-step RV AC capacitor replacement. Discharge, match values, install. DIY in under an hour.', url: `${BASE_URL}/rv/hvac/rv-ac-capacitor-replacement-guide` }),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'RV AC Capacitor Replacement', url: `${BASE_URL}/rv/hvac/rv-ac-capacitor-replacement-guide` },
            ]),
            related: [
                { name: 'Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'Compressor Not Turning On', href: '/rv/hvac/rv-ac-compressor-not-turning-on' },
                { name: 'RV AC Low Voltage Problems', href: '/rv/hvac/rv-ac-low-voltage-problems' },
                { name: 'RV Soft Start Install', href: '/rv/hvac/rv-soft-start-install-guide' },
                { name: 'Generator Sizing', href: '/rv/hvac/rv-generator-sizing-for-rv-ac' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            quickRepairToolsIntro: 'Capacitor replacement requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Discharge and verify capacitor values' },
                { name: 'Best Capacitor Tester', href: '/rv-parts/best-capacitor-testers', why: 'Test µF before replacing' },
                { name: 'Best RV AC Cleaning Kit', href: '/rv-parts/best-rv-ac-cleaning-kits', why: 'Clean coils while you have the shroud off' },
            ],
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        }));
    });

    // RV Soft Start Install Guide (NEW - Support Page)
    app.get('/rv/hvac/rv-soft-start-install-guide', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-soft-start-install-guide-content.html',
            `${BASE_URL}/rv/hvac/rv-soft-start-install-guide`,
            'RV Soft Start Install Guide: Step-by-Step Authority Instructions',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Soft Start Install Guide: Step-by-Step Authority Instructions',
            subtitle: 'Run your AC on 30A or a small generator. Complete DIY wiring walk-through.',
            metaDescription: 'Step-by-step RV soft start installation guide. Reduce startup surge, run AC on 2,200W generator or 30 amp service. Wiring diagrams, tool list, and Field Insights. 3,200+ words.',
            canonical: `${BASE_URL}/rv/hvac/rv-soft-start-install-guide`,
            contentPartial: '../guides/rv-soft-start-install-guide-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvSoftStartInstallFaqs,
            faqSchemaJson: buildFaqSchema(rvSoftStartInstallFaqs),
            articleSchemaJson: buildArticleSchema({ title: 'RV Soft Start Install Guide', description: 'Step-by-step RV soft start installation. Wiring, tools, and setup.', url: `${BASE_URL}/rv/hvac/rv-soft-start-install-guide` }),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'RV Soft Start Install', url: `${BASE_URL}/rv/hvac/rv-soft-start-install-guide` },
            ]),
            related: [
                { name: 'Best Soft Start for RV AC', href: '/rv/hvac/best-soft-start-for-rv-ac' },
                { name: 'Generator Sizing for RV AC', href: '/rv/hvac/rv-generator-sizing-for-rv-ac' },
                { name: 'RV AC Breaker Tripping', href: '/rv/hvac/rv-ac-breaker-keeps-tripping' },
                { name: 'How Many Amps RV AC Uses', href: '/rv/hvac/how-many-amps-does-rv-ac-use' },
                { name: 'RV AC Low Voltage Problems', href: '/rv/hvac/rv-ac-low-voltage-problems' },
                { name: 'Best RV Generators', href: '/rv-parts/best-rv-generators' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            quickRepairToolsIntro: 'Soft start install requires basic electrical tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Verify connections and voltage' },
                { name: 'Best RV Surge Protector for AC', href: '/rv/hvac/best-rv-surge-protector-for-ac', why: 'Protect AC after install' },
            ],
        }));
    });

    // RV Generator Sizing for RV AC (NEW - Support Page)
    app.get('/rv/hvac/rv-generator-sizing-for-rv-ac', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-generator-sizing-for-rv-ac-content.html',
            `${BASE_URL}/rv/hvac/rv-generator-sizing-for-rv-ac`,
            'RV Generator Sizing for AC: Calculating Load & Startup Watts',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Generator Sizing for AC: Calculating Load & Startup Watts',
            subtitle: 'Don\'t overload your generator. BTU-to-Wattage table + altitude adjustments.',
            metaDescription: 'Complete guide to RV generator sizing for air conditioners. Calculate startup surge vs running watts. 13.5k vs 15k BTU requirements. Soft start impact and altitude math. 3,200+ words.',
            canonical: `${BASE_URL}/rv/hvac/rv-generator-sizing-for-rv-ac`,
            contentPartial: '../guides/rv-generator-sizing-for-rv-ac-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvGeneratorSizingFaqs,
            faqSchemaJson: buildFaqSchema(rvGeneratorSizingFaqs),
            articleSchemaJson: buildArticleSchema({ title: 'RV Generator Sizing for RV AC', description: 'Complete wattage math for RV AC and generators. Sizing table and altitude guide.', url: `${BASE_URL}/rv/hvac/rv-generator-sizing-for-rv-ac` }),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'RV Generator Sizing', url: `${BASE_URL}/rv/hvac/rv-generator-sizing-for-rv-ac` },
            ]),
            related: [
                { name: 'Best Generator for 15K BTU AC', href: '/rv/hvac/best-generator-for-15000-btu-rv-ac' },
                { name: 'How Many Amps RV AC Uses', href: '/rv/hvac/how-many-amps-does-rv-ac-use' },
                { name: 'RV Soft Start Install', href: '/rv/hvac/rv-soft-start-install-guide' },
                { name: 'Best RV Generators', href: '/rv-parts/best-rv-generators' },
                { name: 'RV AC Low Voltage Problems', href: '/rv/hvac/rv-ac-low-voltage-problems' },
                { name: 'Generator Sizing Helper', href: '/rv/electrical/generator-sizing' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            quickRepairToolsIntro: 'Generator sizing and load verification usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Verify voltage under load' },
                { name: 'Best RV Generators', href: '/rv-parts/best-rv-generators', why: 'Compare models for your AC size' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems', why: 'Monitor voltage when running on generator' },
            ],
        }));
    });
    app.get('/guides/rv-ac-capacitor-replacement-guide', async (_, reply) => {
        return reply.redirect('/rv/hvac/rv-ac-capacitor-replacement-guide', 301);
    });

    // RV AC Troubleshooting Checklist
    app.get('/rv/hvac/rv-ac-troubleshooting-checklist', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/soon-to-be-published/rv-ac-troubleshooting-checklist-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-troubleshooting-checklist`,
            'RV AC Troubleshooting Checklist',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Troubleshooting Checklist',
            subtitle: 'Printable step-by-step diagnosis. Filter first, then power, voltage, capacitor. Most issues found in first few steps.',
            metaDescription: 'RV AC troubleshooting checklist. Printable. Follow in order: filter, power, voltage, thermostat, frozen coils, capacitor. Most AC problems resolve in first five steps.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-troubleshooting-checklist`,
            contentPartial: '../guides/unpublished/soon-to-be-published/rv-ac-troubleshooting-checklist-content.html',
            faqs: rvAcChecklistFaqs,
            faqSchemaJson: buildFaqSchema(rvAcChecklistFaqs),
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            related: [
                { name: 'AC Emergency Checklist', href: '/rv/hvac/ac-emergency-checklist' },
                { name: 'RV AC Maintenance Schedule', href: '/rv/hvac/rv-ac-maintenance-schedule' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'Common Causes of RV AC Failure', href: '/rv/hvac/common-causes-of-rv-ac-failure' },
            ],
        }));
    });

    // RV AC Lifespan and Failure Rates
    app.get('/rv/hvac/rv-ac-lifespan-and-failure-rates', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/soon-to-be-published/rv-ac-lifespan-and-failure-rates-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-lifespan-and-failure-rates`,
            'RV AC Lifespan and Failure Rates',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Lifespan and Failure Rates',
            subtitle: '8–15 years typical. Voltage stress, dirty filters shorten life. Capacitor most common failure.',
            metaDescription: 'RV AC lifespan: 8–15 years typical. What reduces lifespan: voltage stress, dirty filters, startup surge. Most common failure: capacitor. Soft start and EMS extend life.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-lifespan-and-failure-rates`,
            contentPartial: '../guides/unpublished/soon-to-be-published/rv-ac-lifespan-and-failure-rates-content.html',
            faqs: rvAcLifespanFaqs,
            faqSchemaJson: buildFaqSchema(rvAcLifespanFaqs),
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            related: [
                { name: 'Common Causes of RV AC Failure', href: '/rv/hvac/common-causes-of-rv-ac-failure' },
                { name: 'RV AC Low Voltage Problems', href: '/rv/hvac/rv-ac-low-voltage-problems' },
                { name: 'Best Soft Start for RV AC', href: '/rv/hvac/best-soft-start-for-rv-ac' },
                { name: 'RV AC Maintenance Schedule', href: '/rv/hvac/rv-ac-maintenance-schedule' },
            ],
        }));
    });

    // Feeder 3: RV Space Heater vs Furnace
    app.get('/rv/hvac/space-heater-vs-furnace', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/rv-space-heater-vs-furnace-content.html',
            `${BASE_URL}/rv/hvac/space-heater-vs-furnace`,
            'RV Space Heater vs Furnace: Cost, Safety & When to Use Each',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Space Heater vs Furnace: Cost, Safety & When to Use Each',
            subtitle: 'Furnace vs electric space heater. Cost comparison, electrical load, boondocking. Choose the right heat source.',
            metaDescription: 'RV space heater vs furnace: cost, safety, electrical load compared. When to use each on shore power vs boondocking.',
            canonical: `${BASE_URL}/rv/hvac/space-heater-vs-furnace`,
            contentPartial: '../guides/unpublished/rv-space-heater-vs-furnace-content.html',
            checklistCta: checklistCtaWinter,
            faqs: spaceHeaterFaqs,
            faqSchemaJson: buildFaqSchema(spaceHeaterFaqs),
            articleSchemaJson: buildArticleSchema({ title: 'RV Space Heater vs Furnace', description: 'Cost, safety, when to use each.', url: `${BASE_URL}/rv/hvac/space-heater-vs-furnace` }),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'Space Heater vs Furnace', url: `${BASE_URL}/rv/hvac/space-heater-vs-furnace` },
            ]),
            authorityLink: { href: '/rv/heating-cooling-systems', label: 'RV Heating & Cooling', systemLabel: 'heating' },
            related: [
                { name: 'How to Stay Warm in Winter', href: '/rv/hvac/how-to-stay-warm-in-winter' },
                { name: 'RV Furnace Not Working', href: '/rv/hvac/rv-furnace-not-working' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'Best RV Portable Heaters', href: '/rv-parts/best-rv-portable-heaters' },
            ],
            relatedTools: [
                { name: 'Best RV Portable Heaters', href: '/rv-parts/best-rv-portable-heaters' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV HVAC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        }, 'March 2026'));
    });

    // Feeder 4: How to Stay Warm in Winter
    app.get('/rv/hvac/how-to-stay-warm-in-winter', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/how-to-stay-warm-in-rv-winter-content.html',
            `${BASE_URL}/rv/hvac/how-to-stay-warm-in-winter`,
            'How to Stay Warm in an RV in Winter: Furnace, Skirting, Space Heater',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'How to Stay Warm in an RV in Winter: Furnace, Skirting, Space Heater',
            subtitle: 'Furnace, skirting, thermal curtains, draft sealing. Space heater when on shore power.',
            metaDescription: 'How to stay warm in an RV in winter. Furnace use, skirting, thermal curtains, draft sealing. Space heater on shore power.',
            canonical: `${BASE_URL}/rv/hvac/how-to-stay-warm-in-winter`,
            contentPartial: '../guides/unpublished/how-to-stay-warm-in-rv-winter-content.html',
            checklistCta: checklistCtaWinter,
            faqs: stayWarmFaqs,
            faqSchemaJson: buildFaqSchema(stayWarmFaqs),
            articleSchemaJson: buildArticleSchema({ title: 'How to Stay Warm in RV Winter', description: 'Furnace, skirting, curtains, space heater.', url: `${BASE_URL}/rv/hvac/how-to-stay-warm-in-winter` }),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'How to Stay Warm in Winter', url: `${BASE_URL}/rv/hvac/how-to-stay-warm-in-winter` },
            ]),
            authorityLink: { href: '/rv/heating-cooling-systems', label: 'RV Heating & Cooling', systemLabel: 'heating' },
            related: [
                { name: 'RV Furnace Not Working', href: '/rv/hvac/rv-furnace-not-working' },
                { name: 'Space Heater vs Furnace', href: '/rv/hvac/space-heater-vs-furnace' },
                { name: 'RV Winterizing Checklist', href: '/rv/rv-winterizing-checklist' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
            ],
            relatedTools: [
                { name: 'Best RV Portable Heaters', href: '/rv-parts/best-rv-portable-heaters' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV HVAC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        }, 'March 2026'));
    });

    // RV AC Freezing Up — Tier 1 authority (canonical /rv/hvac/rv-ac-freezing-up)
    app.get('/rv/hvac/rv-ac-freezing-up', async (request, reply) => {
        const slug = '/rv/hvac/rv-ac-freezing-up';
        const monetization = getMonetizationContext(slug);
        const forceRefresh =
            (request.query as { refreshSummary?: string }).refreshSummary === '1' &&
            (request.query as { token?: string }).token === process.env.ADMIN_TOKEN;
        const aiSummary = await getTier1AiSummary(
            'pillars/rv-ac-freezing-up-sections.html',
            `${BASE_URL}/rv/hvac/rv-ac-freezing-up`,
            rvAcFreezingUpPillarConfig.meta.title,
            monetization.contentMaturityLevel,
            !!forceRefresh
        );
        const config = withSchemaConfig({
            ...rvAcFreezingUpPillarConfig,
            contentPartial: '../pillars/rv-ac-freezing-up-sections.html',
            faqSchemaJson: buildFaqSchema(rvAcFreezingUpPillarConfig.faqs),
        });
        return reply.view('layouts/tier1-authority-pillar.html', {
            ...config,
            aiSummary,
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
            emergencyPage: getEmergencyPreset(`${BASE_URL}/rv/hvac/rv-ac-freezing-up`),
        });
    });
    app.get('/guides/rv-ac-freezing-up-causes', async (_, reply) => {
        return reply.redirect('/rv/hvac/rv-ac-freezing-up', 301);
    });

    // ——— Flywheel: Supporting & Tier-1 Emergency Guides ———
    // RV AC Fan Not Spinning
    app.get('/rv/hvac/rv-ac-fan-not-spinning', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-ac-fan-not-spinning-authority-master.html',
            `${BASE_URL}/rv/hvac/rv-ac-fan-not-spinning`,
            'RV AC Fan Not Spinning: Capacitor, Motor & Diagnosis',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Fan Not Spinning: Capacitor, Motor & Diagnosis',
            subtitle: 'Fan hums but won\'t spin? Capacitor first, then motor. Quick diagnosis table.',
            metaDescription: 'RV AC fan not spinning? Check capacitor first—#1 cause. Then fan motor, debris, power. Quick diagnosis and repair options.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-fan-not-spinning`,
            contentPartial: '../guides/rv-ac-fan-not-spinning-authority-master.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcFanNotSpinningFaqs,
            faqSchemaJson: buildFaqSchema(rvAcFanNotSpinningFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Fan Not Spinning', url: `${BASE_URL}/rv/hvac/rv-ac-fan-not-spinning` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            quickRepairToolsIntro: 'Most RV AC fan and capacitor issues can be diagnosed with these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test voltage and capacitor µF' },
                { name: 'Best RV Surge Protector for AC', href: '/rv/hvac/best-rv-surge-protector-for-ac', why: 'Protect compressor from voltage issues' },
            ],
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Breaker Keeps Tripping', href: '/rv/hvac/rv-ac-breaker-keeps-tripping' },
                { name: 'RV Shore Power Not Working', href: '/rv/electrical/shore-power-troubleshooting' },
                { name: 'RV Converter Not Charging Battery', href: '/rv/electrical/converter-not-charging-battery' },
                { name: 'RV Water Pump Not Working', href: '/rv/rv-water-pump-not-working' },
                { name: 'Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'Capacitor Replacement', href: '/rv/hvac/rv-ac-capacitor-replacement-guide' },
            ],
            relatedTools: [
                { name: 'Best Multimeters for RV', href: '/rv-parts/best-multimeters-for-rv' },
                { name: 'Best RV Surge Protectors', href: '/rv-parts/best-rv-surge-protectors' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
            emergencyPage: getEmergencyPreset(`${BASE_URL}/rv/hvac/rv-ac-fan-not-spinning`),
        }));
    });

    // RV AC Thermostat Problems
    app.get('/rv/hvac/rv-ac-thermostat-problems', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-ac-thermostat-problems-authority-master.html',
            `${BASE_URL}/rv/hvac/rv-ac-thermostat-problems`,
            'RV AC Thermostat Problems: Mode, Batteries & Wiring',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Thermostat Problems: Mode, Batteries & Wiring',
            subtitle: 'Display blank? Wrong mode? Wiring loose? Quick diagnosis.',
            metaDescription: 'RV AC thermostat not working? Check batteries, mode (Cool vs Heat), and wiring. Common fixes.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-thermostat-problems`,
            contentPartial: '../guides/rv-ac-thermostat-problems-authority-master.html',
            faqs: rvAcThermostatProblemsFaqs,
            faqSchemaJson: buildFaqSchema(rvAcThermostatProblemsFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Thermostat Problems', url: `${BASE_URL}/rv/hvac/rv-ac-thermostat-problems` },
            ]),
            authorityLink: { href: '/rv/hvac', label: 'RV HVAC Systems', systemLabel: 'air conditioners' },
            quickRepairToolsIntro: 'Thermostat diagnosis rarely needs tools, but these help with related electrical checks.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test 12V at thermostat' },
                { name: 'Best RV Surge Protectors', href: '/rv-parts/best-rv-surge-protectors', why: 'If power issues affect thermostat' },
            ],
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Fan Not Spinning', href: '/rv/hvac/rv-ac-fan-not-spinning' },
                { name: 'RV AC Breaker Keeps Tripping', href: '/rv/hvac/rv-ac-breaker-keeps-tripping' },
                { name: 'RV Shore Power Not Working', href: '/rv/electrical/shore-power-troubleshooting' },
                { name: 'RV Converter Not Charging Battery', href: '/rv/electrical/converter-not-charging-battery' },
                { name: 'RV Water Pump Not Working', href: '/rv/rv-water-pump-not-working' },
            ],
            relatedTools: [
                { name: 'Best Multimeters for RV', href: '/rv-parts/best-multimeters-for-rv' },
                { name: 'Best RV Surge Protectors', href: '/rv-parts/best-rv-surge-protectors' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
            emergencyPage: getEmergencyPreset(`${BASE_URL}/rv/hvac/rv-ac-thermostat-problems`),
        }));
    });

    // RV AC Clicking Noise
    app.get('/rv/hvac/rv-ac-clicking-noise', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/to-be-published-later/rv-ac-clicking-noise-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-clicking-noise`,
            'RV AC Clicking Noise: Capacitor & Relay Diagnosis',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Clicking Noise: Capacitor & Relay Diagnosis',
            subtitle: 'Rapid clicking or single click? Usually capacitor or contactor. Stop running, diagnose.',
            metaDescription: 'RV AC clicking noise? Usually capacitor failure or relay. Rapid clicking = capacitor. Diagnosis and fix.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-clicking-noise`,
            contentPartial: '../guides/unpublished/to-be-published-later/rv-ac-clicking-noise-content.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcClickingNoiseFaqs,
            faqSchemaJson: buildFaqSchema(rvAcClickingNoiseFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Clicking Noise', url: `${BASE_URL}/rv/hvac/rv-ac-clicking-noise` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            quickRepairToolsIntro: 'Clicking diagnosis usually needs capacitor and voltage checks.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test capacitor µF' },
                { name: 'Best RV Surge Protector for AC', href: '/rv/hvac/best-rv-surge-protector-for-ac', why: 'Check voltage under load' },
            ],
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'Capacitor Replacement', href: '/rv/hvac/rv-ac-capacitor-replacement-guide' },
                { name: 'Low Voltage Problems', href: '/rv/hvac/rv-ac-low-voltage-problems' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }));
    });

    /*
    // ——— To Be Published Later (content in to-be-published-later/) ———
    // RV AC Clicking Noise (duplicate - now active above)
    app.get('/rv/hvac/rv-ac-clicking-noise', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ac-clicking-noise-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-clicking-noise`,
            'RV AC Clicking Noise: Capacitor & Relay Diagnosis',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Clicking Noise: Capacitor & Relay Diagnosis',
            subtitle: 'Rapid clicking or single click? Usually capacitor or contactor. Stop running, diagnose.',
            metaDescription: 'RV AC clicking noise? Usually capacitor failure or relay. Rapid clicking = capacitor. Diagnosis and fix.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-clicking-noise`,
            contentPartial: '../guides/unpublished/future-publications/rv-ac-clicking-noise-content.html',
            faqs: rvAcClickingNoiseFaqs,
            faqSchemaJson: buildFaqSchema(rvAcClickingNoiseFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Clicking Noise', url: `${BASE_URL}/rv/hvac/rv-ac-clicking-noise` },
            ]),
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'Capacitor Replacement', href: '/rv/hvac/rv-ac-capacitor-replacement-guide' },
                { name: 'Low Voltage Problems', href: '/rv/hvac/rv-ac-low-voltage-problems' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }));
    });

    // RV AC Shuts Off After 5 Minutes
    app.get('/rv/hvac/rv-ac-shuts-off-after-5-minutes', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ac-shuts-off-after-5-minutes-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-shuts-off-after-5-minutes`,
            'RV AC Shuts Off After 5 Minutes: Thermal Overload & Coils',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Shuts Off After 5 Minutes: Thermal Overload & Coils',
            subtitle: 'Dirty condenser coils cause overheating. Clean coils, check refrigerant.',
            metaDescription: 'RV AC shuts off after a few minutes? Usually thermal overload from dirty coils. Clean condenser, let cool, retry.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-shuts-off-after-5-minutes`,
            contentPartial: '../guides/unpublished/future-publications/rv-ac-shuts-off-after-5-minutes-content.html',
            faqs: rvAcShutsOffFaqs,
            faqSchemaJson: buildFaqSchema(rvAcShutsOffFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Shuts Off', url: `${BASE_URL}/rv/hvac/rv-ac-shuts-off-after-5-minutes` },
            ]),
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Freezing Up', href: '/rv/hvac/rv-ac-freezing-up' },
                { name: 'AC Maintenance Schedule', href: '/rv/hvac/rv-ac-maintenance-schedule' },
                { name: 'Best RV AC Cleaning Kits', href: '/rv-parts/best-rv-ac-cleaning-kits' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            quickRepairToolsIntro: 'Thermal overload and coil cleaning usually require these tools.',
            quickRepairTools: [
                { name: 'Best RV AC Cleaning Kit', href: '/rv-parts/best-rv-ac-cleaning-kits', why: 'Clean condenser coils on roof' },
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test voltage under load' },
            ],
        }));
    });

    // RV AC Not Turning On
    app.get('/rv/hvac/rv-ac-not-turning-on', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-ac-not-turning-on-authority-master.html',
            `${BASE_URL}/rv/hvac/rv-ac-not-turning-on`,
            'RV AC Not Turning On: Power, Thermostat & Diagnosis',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Not Turning On: Power, Thermostat & Diagnosis',
            subtitle: 'No display? No power? Check 12V, 120V, thermostat mode.',
            metaDescription: 'RV AC not turning on at all? Check power (breaker, shore cord), thermostat (mode, batteries), and 12V supply.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-not-turning-on`,
            contentPartial: '../guides/rv-ac-not-turning-on-authority-master.html',
            checklistCta: checklistCtaSummer,
            faqs: rvAcNotTurningOnFaqs,
            faqSchemaJson: buildFaqSchema(rvAcNotTurningOnFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Not Turning On', url: `${BASE_URL}/rv/hvac/rv-ac-not-turning-on` },
            ]),
            authorityLink: { href: '/rv/hvac/rv-ac-not-cooling', label: 'RV AC Not Cooling', systemLabel: 'air conditioners' },
            related: [
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'Thermostat Problems', href: '/rv/hvac/rv-ac-thermostat-problems' },
                { name: 'Capacitor Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'Compressor Not Turning On', href: '/rv/hvac/rv-ac-compressor-not-turning-on' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
            quickRepairToolsIntro: 'Power and thermostat diagnosis usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test 12V at thermostat, 120V at AC' },
                { name: 'Best RV Surge Protector for AC', href: '/rv/hvac/best-rv-surge-protector-for-ac', why: 'Verify shore power' },
            ],
            emergencyPage: getEmergencyPreset(`${BASE_URL}/rv/hvac/rv-ac-not-turning-on`),
        }));
    });

    // RV AC Fan Motor Replacement
    app.get('/rv/hvac/rv-ac-fan-motor-replacement', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ac-fan-motor-replacement-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-fan-motor-replacement`,
            'RV AC Fan Motor Replacement: Condenser & Evaporator',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Fan Motor Replacement: Condenser & Evaporator',
            subtitle: 'Match OEM part number or specs. Condenser vs evaporator fan—different motors.',
            metaDescription: 'RV AC fan motor replacement: match OEM or specs. Condenser vs evaporator. Step-by-step replacement.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-fan-motor-replacement`,
            contentPartial: '../guides/unpublished/future-publications/rv-ac-fan-motor-replacement-content.html',
            faqs: rvAcFanMotorReplacementFaqs,
            faqSchemaJson: buildFaqSchema(rvAcFanMotorReplacementFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Fan Motor Replacement', url: `${BASE_URL}/rv/hvac/rv-ac-fan-motor-replacement` },
            ]),
            related: [
                { name: 'RV AC Fan Not Spinning', href: '/rv/hvac/rv-ac-fan-not-spinning' },
                { name: 'Capacitor Replacement', href: '/rv/hvac/rv-ac-capacitor-replacement-guide' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            quickRepairToolsIntro: 'Fan motor diagnosis and replacement usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test motor continuity and capacitor' },
                { name: 'Best Capacitor Tester', href: '/rv-parts/best-capacitor-testers', why: 'Rule out capacitor before replacing motor' },
                { name: 'Best RV AC Cleaning Kit', href: '/rv-parts/best-rv-ac-cleaning-kits', why: 'Clean coils while replacing motor' },
            ],
        }));
    });

    // RV AC Thermostat Replacement
    app.get('/rv/hvac/rv-ac-thermostat-replacement', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ac-thermostat-replacement-content.html',
            `${BASE_URL}/rv/hvac/rv-ac-thermostat-replacement`,
            'RV AC Thermostat Replacement: Compatibility & Wiring',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV AC Thermostat Replacement: Compatibility & Wiring',
            subtitle: 'Match sub-base and wire colors. Dometic, Coleman, Atwood compatibility.',
            metaDescription: 'RV AC thermostat replacement: match sub-base, wire colors. Step-by-step upgrade guide.',
            canonical: `${BASE_URL}/rv/hvac/rv-ac-thermostat-replacement`,
            contentPartial: '../guides/unpublished/future-publications/rv-ac-thermostat-replacement-content.html',
            faqs: rvAcThermostatReplacementFaqs,
            faqSchemaJson: buildFaqSchema(rvAcThermostatReplacementFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'AC Thermostat Replacement', url: `${BASE_URL}/rv/hvac/rv-ac-thermostat-replacement` },
            ]),
            related: [
                { name: 'Thermostat Problems', href: '/rv/hvac/rv-ac-thermostat-problems' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
            quickRepairToolsIntro: 'Thermostat replacement often requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Verify wiring and continuity' },
            ],
        }));
    });

    // ——— Flywheel: Tool Pages (rv-parts) ———
    // Best Capacitor Testers
    app.get('/rv-parts/best-capacitor-testers', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/best-capacitor-testers-content.html',
            `${BASE_URL}/rv-parts/best-capacitor-testers`,
            'Best Capacitor Testers for RV AC Diagnosis',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'Best Capacitor Testers for RV AC Diagnosis',
            subtitle: 'Multimeter vs dedicated tester. Test µF before replacing.',
            metaDescription: 'Best capacitor testers for RV AC: multimeter capacitance mode or dedicated tester. Confirm diagnosis before replacement.',
            canonical: `${BASE_URL}/rv-parts/best-capacitor-testers`,
            contentPartial: '../guides/unpublished/future-publications/best-capacitor-testers-content.html',
            faqs: bestCapacitorTestersFaqs,
            faqSchemaJson: buildFaqSchema(bestCapacitorTestersFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'Best Capacitor Testers', url: `${BASE_URL}/rv-parts/best-capacitor-testers` },
            ]),
            related: [
                { name: 'Capacitor Failure Symptoms', href: '/rv/hvac/rv-ac-capacitor-failure-symptoms' },
                { name: 'Capacitor Replacement', href: '/rv/hvac/rv-ac-capacitor-replacement-guide' },
                { name: 'Fan Not Spinning', href: '/rv/hvac/rv-ac-fan-not-spinning' },
                { name: 'Best Multimeters for RV', href: '/rv-parts/best-multimeters-for-rv' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }));
    });

    // Best RV AC Cleaning Kits
    app.get('/rv-parts/best-rv-ac-cleaning-kits', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/best-rv-ac-cleaning-kits-content.html',
            `${BASE_URL}/rv-parts/best-rv-ac-cleaning-kits`,
            'Best RV AC Cleaning Kits: Coil-Safe Formulas',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'Best RV AC Cleaning Kits: Coil-Safe Formulas',
            subtitle: 'Condenser and evaporator. Annual cleaning prevents thermal overload.',
            metaDescription: 'Best RV AC cleaning kits: coil-safe formulas for condenser and evaporator. Prevent overheating and shutdown.',
            canonical: `${BASE_URL}/rv-parts/best-rv-ac-cleaning-kits`,
            contentPartial: '../guides/unpublished/future-publications/best-rv-ac-cleaning-kits-content.html',
            faqs: bestRvAcCleaningKitsFaqs,
            faqSchemaJson: buildFaqSchema(bestRvAcCleaningKitsFaqs),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV Parts', url: `${BASE_URL}/rv-parts` },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'Best AC Cleaning Kits', url: `${BASE_URL}/rv-parts/best-rv-ac-cleaning-kits` },
            ]),
            related: [
                { name: 'AC Maintenance Schedule', href: '/rv/hvac/rv-ac-maintenance-schedule' },
                { name: 'AC Shuts Off After 5 Minutes', href: '/rv/hvac/rv-ac-shuts-off-after-5-minutes' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV AC Troubleshooting Guides',
        }));
    });
    */

    // Feeder 6: RV Dehumidifier
    app.get('/rv/hvac/rv-dehumidifier-guide', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/rv-dehumidifier-guide-content.html',
            `${BASE_URL}/rv/hvac/rv-dehumidifier-guide`,
            'RV Dehumidifier Guide: Reduce Condensation & Mold',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Dehumidifier Guide: Reduce Condensation & Mold',
            subtitle: 'Condensation, mold, musty smell? Electric dehumidifiers vs desiccant packs. Placement and sizing.',
            metaDescription: 'RV dehumidifier guide: reduce condensation, mold, musty smell. Electric vs desiccant. Best for humid climates.',
            canonical: `${BASE_URL}/rv/hvac/rv-dehumidifier-guide`,
            contentPartial: '../guides/unpublished/rv-dehumidifier-guide-content.html',
            faqs: dehumidifierFaqs,
            faqSchemaJson: buildFaqSchema(dehumidifierFaqs),
            articleSchemaJson: buildArticleSchema({ title: 'RV Dehumidifier Guide', description: 'Reduce condensation and mold.', url: `${BASE_URL}/rv/hvac/rv-dehumidifier-guide` }),
            breadcrumbSchemaJson: buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'RV HVAC', url: `${BASE_URL}/rv/hvac` },
                { name: 'RV Dehumidifier Guide', url: `${BASE_URL}/rv/hvac/rv-dehumidifier-guide` },
            ]),
            authorityLink: { href: '/rv/heating-cooling-systems', label: 'RV Heating & Cooling', systemLabel: 'climate' },
            related: [
                { name: 'RV AC Freezing Up', href: '/rv/hvac/rv-ac-freezing-up' },
                { name: 'RV AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'Best RV Dehumidifiers', href: '/rv-parts/best-rv-dehumidifiers' },
                { name: 'Best RV Portable Air Conditioners', href: '/rv-parts/best-rv-portable-air-conditioners' },
            ],
            relatedTools: [
                { name: 'Best RV Dehumidifiers', href: '/rv-parts/best-rv-dehumidifiers' },
            ],
            breadcrumb: { backHref: '/rv/hvac', backLabel: 'RV HVAC' },
            clusterNavLinks: HVAC_CLUSTER_NAV,
            clusterNavHeadline: 'RV HVAC Troubleshooting Guides',
            showRvServiceCta: true,
            serviceAreaMode: 'dynamic',
        }, 'March 2026'));
    });
}