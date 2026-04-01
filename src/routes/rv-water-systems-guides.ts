import { FastifyInstance } from 'fastify';
import { buildFaqSchema, buildArticleSchema, buildBreadcrumbSchema } from '../utils/faqSchema.js';
import { getAiSummaryForAuthorityGuide, getTier1AiSummary } from '../services/summaryService.js';
import { getMonetizationContext } from '../utils/monetizationHelper.js';
import { withSchemaConfig } from '../data/schema-config.js';
import { getExploreCluster } from '../data/author-config.js';
import { withAuthorityKnowledgeGraph } from '../utils/with-authority-knowledge-graph.js';
import { getEmergencyPreset } from '../data/emergency-rv-presets.js';

const BASE_URL = 'https://www.decisiongrid.co';

// Water Cluster Nav — Crawl accelerator (per DECISIONGRID-INTERNAL-LINKING-TEMPLATE)
const WATER_CLUSTER_NAV: { name: string; href: string }[] = [
    { name: 'RV Water Pump Not Working', href: '/rv/water-pump-not-working' },
    { name: 'RV Water Pump Runs But No Water', href: '/rv/water-pump-runs-but-no-water' },
    { name: 'RV Water Pump Cycling', href: '/rv/water-pump-cycling' },
    { name: 'Low Water Pressure', href: '/rv/low-water-pressure' },
    { name: 'RV Water Pressure Regulator Problems', href: '/rv/water-pressure-regulator-problems' },
    { name: 'RV Water Heater Not Working', href: '/rv/rv-water-heater-not-working' },
    { name: 'RV Water Heater Keeps Shutting Off', href: '/rv/rv-water-heater-keeps-shutting-off' },
    { name: 'Black Tank Not Draining', href: '/rv/black-tank-not-draining' },
    { name: 'RV Toilet Won\'t Flush', href: '/rv/rv-toilet-wont-flush' },
    { name: 'RV Toilet Smells', href: '/rv/rv-toilet-smells' },
    { name: 'RV Sink Not Draining', href: '/rv/rv-sink-not-draining' },
    { name: 'Best RV Pressure Regulator', href: '/rv/best-rv-pressure-regulator' },
    { name: 'Best RV Water Pump', href: '/rv/best-rv-water-pump' },
];

// Shared CTAs
const checklistCtaWater = {
    title: 'RV Water Setup Checklist',
    description: 'Printable pre-trip water connection and tank checks.',
    href: '/rv/rv-water-setup-checklist',
};

const checklistCtaWinter = {
    title: 'RV Winterization Checklist',
    description: 'Step-by-step freeze protection. Printable for glovebox use.',
    href: '/rv/rv-winterizing-checklist',
};

const waterPumpNotWorkingFaqs = [
    {
        question: 'Why won\'t my RV water pump turn on?',
        answer: 'Usually a blown fuse, low battery voltage, or a bad switch or ground. Check the pump fuse in the 12V panel, then measure 12V at the pump positive and ground while the switch is on. See <a href="/rv/water-pump-not-working">this guide</a>.',
    },
    {
        question: 'Why does my RV water pump run constantly?',
        answer: 'It never reaches shut-off pressure—often a small leak, a running toilet, a bad check valve, or suction issues. See <a href="/rv/water-pump-cycling">RV water pump cycling</a> for short-cycling and <a href="/rv/water-pump-runs-but-no-water">pump runs but no water</a> for priming and suction.',
    },
    {
        question: 'My RV water pump hums but no water—what\'s wrong?',
        answer: 'Often an empty tank, air in the suction line, or a clogged strainer. Verify tank level, clean the inlet strainer, and confirm winterizing valves are on the fresh tank path.',
    },
];

const waterPumpRunsNoWaterFaqs = [
    {
        question: 'Why does my RV water pump run but no water comes out?',
        answer: 'Usually air in the suction line, low tank, winterizing valve in the wrong position, or a clogged strainer. Open a cold faucet near the pump and look for water in the strainer bowl while the pump runs.',
    },
    {
        question: 'How do I prime my RV water pump after winterizing?',
        answer: 'Fill the fresh tank, return valves to normal use, open cold faucets one at a time, and run the pump in short bursts. Reseat the strainer O-ring if the lid pulls air.',
    },
    {
        question: 'Pump runs but only spits air—is that a suction leak?',
        answer: 'Often yes—also a dry pick-up or collapsed hose. Tighten barb fittings, inspect suction hose, and verify the pick-up is submerged.',
    },
];

const waterPumpCyclingFaqs = [
    {
        question: 'Why does my RV water pump keep turning on and off?',
        answer: 'The pressure switch sees a drop below cut-in after it reaches cutoff—usually a micro leak, toilet weep, bad pump check valve, or filter head seal. Work through the branch isolation steps in <a href="/rv/water-pump-cycling">this cycling guide</a>.',
    },
    {
        question: 'Is it bad for the pump to cycle rapidly?',
        answer: 'Yes. Short cycling heats the motor and wears the pressure switch. Turn the pump off at night until you find the leak or fix the check valve.',
    },
    {
        question: 'My pump only cycles on the fresh tank, not on city water—why?',
        answer: 'City pressure masks an internal pump check problem or a path that only sees pump pressure in tank mode. Verify you switch the pump OFF when on shore water, then service the pump check or replace the head if hold fails on tank only.',
    },
];

export default async function rvWaterSystemsGuidesRoutes(app: FastifyInstance) {
    // RV Water Systems Authority Hub — Canonical: /rv/water-systems (Tier 1 — 5,500 words)
    app.get('/rv/water-systems', async (request, reply) => {
        const aiSummary = await getTier1AiSummary(
            'hubs/water-hub-content.html',
            `${BASE_URL}/rv/water-systems`,
            'RV Water Systems: Pump, Heater & Tank Troubleshooting Guide',
            3, // Content Maturity Level
            false // forceRefresh
        );

        // Tier 1 Pillar Configuration aligned with partials
        const pillarData = {
            meta: {
                title: 'RV Water Systems: Pump, Heater & Tank Troubleshooting Guide',
                description: 'RV water systems authority hub: pump troubleshoot, heater fixes, low pressure causes, winterizing. Single parent for all RV fresh water maintenance. 5,500+ words.',
                canonical: `${BASE_URL}/rv/water-systems`,
                lastUpdated: 'March 2026',
            },
            hero: {
                title: 'RV Water Systems: The Ultimate Troubleshooting Guide',
                tagline: 'Fresh Water · Filtration · Heating · Seasonal Protection',
                subhead: 'Master your RV\'s plumbing, from 12V pump diagnostics to propane water heater repairs. Structured for fast decisions and long-term authority.',
                authorityLine: 'Verified by RVIA standards & field technician experience.',
                primaryCta: 'Start Diagnostic Flow',
                primaryCtaHref: '#architecture',
            },
            breadcrumb: {
                backHref: '/rv-parts',
                backLabel: 'RV Parts',
                currentHref: '/rv/water-systems',
                currentLabel: 'Water Hub'
            },
            tocItems: [
                { label: 'System Architecture', href: '#how-it-works' },
                { label: 'Common Failures', href: '#common-failures' },
                { label: 'Upgrade Path', href: '#upgrades' },
                { label: 'Related Guides', href: '#related-guides' },
            ],
            systemArchitecture: {
                heading: 'System Architecture & Flow',
                intro: 'The RV fresh water system is a localized, pressurized plumbing loop. It operates using two primary input sources to deliver water to your fixtures:',
                components: [
                    { name: 'Fresh Water Tank', description: 'Internal storage for boondocking; requires sanitation.' },
                    { name: '12V Water Pump', description: 'On-demand pump that pressurizes the lines from the tank.' },
                    { name: 'City Water Inlet', description: 'External connection for pressurized campground water.' },
                    { name: 'Check Valves', description: 'Prevent backflow between the city inlet and the internal pump.' },
                ],
                closing: 'Understanding the path from inlet to fixture is critical for isolating leaks and pressure drops.',
                thresholds: {
                    heading: 'Operating Thresholds',
                    rows: [
                        { parameter: 'System Pressure', safeRange: '40–50 PSI', riskThreshold: '60+ PSI (Fitting Failure)' },
                        { parameter: 'Pump Voltage', safeRange: '11.5–14.4V', riskThreshold: '< 10.5V (Motor Damage)' },
                        { parameter: 'Heater Temperature', safeRange: '120°F–140°F', riskThreshold: '160°F+ (Scald Risk/T&P Trip)' },
                    ],
                    note: 'Always use a pressure regulator at the campground spigot, not at the RV inlet.',
                    detailHref: '/rv/best-rv-pressure-regulator',
                    detailLabel: 'Regulator Guide',
                },
                imageGroup: `
<div class="mermaid">
flowchart LR
    FreshTank[Fresh Water Tank] --> Pump[12V Water Pump]
    CityWater[City Water Inlet] --> CheckValve1[Check Valve]
    Pump --> CheckValve2[Check Valve]
    CheckValve1 --> ColdLines[Cold Water Lines]
    CheckValve2 --> ColdLines
    ColdLines --> Fixtures[Faucets/Shower/Toilet]
    ColdLines --> WaterHeater[Water Heater]
    WaterHeater --> HotLines[Hot Water Lines]
    HotLines --> Fixtures
</div>`
            },
            commonFailures: {
                heading: 'Data-Driven: Top RV Water Failures',
                rows: [
                    { problem: 'Pump Cycling', cause: 'Suction leaks or check valve failure.', guideHref: '/rv/water-pump-cycling', guideLabel: 'Cycling Guide' },
                    { problem: 'Heater Won\'t Light', cause: 'Propane lockout or element burnout.', guideHref: '/rv/rv-water-heater-not-working', guideLabel: 'Heater Guide' },
                    { problem: 'Low Pressure', cause: 'Clogged screens or failing regulator.', guideHref: '/rv/low-water-pressure', guideLabel: 'Pressure Guide' },
                    { problem: 'Black Tank Not Draining', cause: 'Solids buildup, stuck valve, hose blockage.', guideHref: '/rv/black-tank-not-draining', guideLabel: 'Black Tank Guide' },
                    { problem: 'Frozen Lines', cause: 'Inadequate freeze protection.', guideHref: '/rv/rv-winterizing-checklist', guideLabel: 'Winterizing' },
                ]
            },
            upgradePath: {
                heading: 'Water System Upgrade Path',
                beginner: ['Adjustable Pressure Regulator', 'High-Flow Water Hose'],
                intermediate: ['Accumulator Tank', 'Silencing Kit for Pump'],
                advanced: ['Tankless Water Heater', 'Whole-House Nano Filtration'],
                checklistHref: '/rv/rv-water-setup-checklist'
            },
            relatedGuides: {
                headline: 'Deep-Dive Water Guides',
                subhead: 'Diagnostic · Seasonal · Maintenance',
                essentialLabel: 'Diagnostics:',
                essential: [
                    { name: 'Pump Not Working', href: '/rv/water-pump-not-working' },
                    { name: 'Pump Cycling', href: '/rv/water-pump-cycling' },
                    { name: 'Low Pressure', href: '/rv/low-water-pressure' },
                    { name: 'Heater Not Working', href: '/rv/rv-water-heater-not-working' },
                    { name: 'Black Tank Not Draining', href: '/rv/black-tank-not-draining' },
                ],
                productLabel: 'Maintenance & Gear:',
                products: [
                    { name: 'Winterizing Checklist', href: '/rv/rv-winterizing-checklist' },
                    { name: 'Heater Element DIY', href: '/rv/rv-water-heater-element-replacement' },
                    { name: 'Best Water Pumps', href: '/rv/best-rv-water-pump' },
                    { name: 'Sewer & Leveling Setup', href: '/rv/camping/sewer-leveling' },
                ]
            },
            faqBlock: {
                heading: 'Water Systems FAQ'
            },
            faqs: [
                { question: 'What is the safe PSI for RV plumbing?', answer: '40–50 PSI is the target. Most RV lines are PEX rated for higher, but plastic fittings and older hoses risk failure above 60 PSI.' },
                { question: 'Why does my pump run when no water is on?', answer: 'This is called "cycling"—the pump re-starts when pressure bleeds down. Common causes: a slow fixture/toilet leak, failed pump check, filter head weep, or outdoor shower drip. See the <a href="/rv/water-pump-cycling">RV water pump cycling guide</a>.' },
                { question: 'How often should I sanitize my water tank?', answer: 'Twice a year—once when de-winterizing in the spring and once after long storage.' },
                { question: 'Can I use regular bleach to sanitize?', answer: 'Yes. Use unscented, standard household bleach at a ratio of 1/4 cup per 15 gallons.' },
            ],
            references: [
                { name: 'RVIA Plumbing Standards', url: 'https://www.rvia.org' },
                { name: 'PEX Design Guide', url: 'https://plasticpipe.org' }
            ],
            exploreCluster: getExploreCluster('water') || getExploreCluster('electrical')
        };

        return reply.view('layouts/tier1-authority-pillar.html', withSchemaConfig({
            aiSummary,
            ...pillarData,
            faqSchemaJson: buildFaqSchema(pillarData.faqs),
            contentPartial: '../hubs/water-hub-content.html',
            serviceCtaType: 'plumber',
        }));
    });

    // 1️⃣ RV Water Pump Not Working (authority master partial — docs/DECISIONGRID-MASTER-AUTHORITY-HTML-PROMPT.md)
    app.get('/rv/water-pump-not-working', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-water-pump-not-working-authority-master.html',
            `${BASE_URL}/rv/water-pump-not-working`,
            'RV Water Pump Not Working: Diagnostic Flow & Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Water Pump Not Working: Diagnostic Flow & Fixes',
            subtitle: 'Pump won\'t run, runs weak, or won\'t stop? Step-by-step electrical and suction diagnosis.',
            metaDescription: 'Step-by-step guide to fixing an RV water pump: no power, humming, air leaks, or pressure switch issues. Diagnostic flow and motor testing. 2,200+ words.',
            canonical: `${BASE_URL}/rv/water-pump-not-working`,
            contentPartial: '../guides/rv-water-pump-not-working-authority-master.html',
            faqs: waterPumpNotWorkingFaqs,
            faqSchemaJson: buildFaqSchema(waterPumpNotWorkingFaqs),
            checklistCta: checklistCtaWater,
            breadcrumb: { backHref: '/rv/water-systems', backLabel: 'Water Hub' },
            quickRepairToolsIntro: 'Water pump diagnosis usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test 12V at pump' },
                { name: 'Best RV Water Pumps', href: '/rv/best-rv-water-pump', why: 'Replacement if motor has failed' },
            ],
            related: [
                { name: 'Water Hub', href: '/rv/water-systems' },
                { name: 'Low Water Pressure', href: '/rv/low-water-pressure' },
                { name: 'Best RV Water Pumps', href: '/rv/best-rv-water-pump' },
            ],
            clusterNavLinks: WATER_CLUSTER_NAV,
            clusterNavHeadline: 'RV Water Systems Troubleshooting Guides',
            serviceCtaType: 'plumber',
        }));
    });

    // 1b. RV Water Pump Runs But No Water (authority master partial)
    app.get('/rv/water-pump-runs-but-no-water', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-water-pump-runs-but-no-water-authority-master.html',
            `${BASE_URL}/rv/water-pump-runs-but-no-water`,
            'RV Water Pump Runs But No Water: Priming & Suction Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Water Pump Runs But No Water: Priming & Suction Fixes',
            subtitle: 'Motor humming but no flow? Diagnose air leaks, winterizing valves, and pump prime issues.',
            metaDescription: 'Fix your RV water pump if it runs but won\'t pump water. Learn about suction-side air leaks, winterizing valve positions, and sediment strainer issues. Step-by-step priming guide.',
            canonical: `${BASE_URL}/rv/water-pump-runs-but-no-water`,
            contentPartial: '../guides/rv-water-pump-runs-but-no-water-authority-master.html',
            faqs: waterPumpRunsNoWaterFaqs,
            faqSchemaJson: buildFaqSchema(waterPumpRunsNoWaterFaqs),
            checklistCta: checklistCtaWater,
            breadcrumb: { backHref: '/rv/water-pump-not-working', backLabel: 'Pump Troubleshooting' },
            quickRepairToolsIntro: 'Pump priming and suction issues usually require these basic tools.',
            quickRepairTools: [
                { name: 'Best RV Water Pumps', href: '/rv/best-rv-water-pump', why: 'Replacement if valves have failed' },
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test 12V at pump (if motor is weak)' },
            ],
            related: [
                { name: 'Water Pump Troubleshooting', href: '/rv/water-pump-not-working' },
                { name: 'Water Hub', href: '/rv/water-systems' },
                { name: 'Low Water Pressure', href: '/rv/low-water-pressure' },
            ],
            clusterNavLinks: WATER_CLUSTER_NAV,
            clusterNavHeadline: 'RV Water Systems Troubleshooting Guides',
            serviceCtaType: 'plumber',
        }));
    });

    // 1c. RV Water Pump Cycling (authority master — pressure decay / short cycling)
    app.get('/rv/water-pump-cycling', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-water-pump-cycling-authority-master.html',
            `${BASE_URL}/rv/water-pump-cycling`,
            'RV Water Pump Cycling: Short Cycling & Pressure Leak Diagnosis',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Water Pump Cycling: Short Cycling & Pressure Leak Diagnosis',
            subtitle: 'Pump kicks on and off with everything closed? Find the hidden leak, check valve, or switch issue.',
            metaDescription: 'Diagnose RV water pump short cycling: pressure leaks, toilet weeps, filter heads, check valves, and pressure switch behavior. Step-by-step isolation and fixes.',
            canonical: `${BASE_URL}/rv/water-pump-cycling`,
            contentPartial: '../guides/rv-water-pump-cycling-authority-master.html',
            faqs: waterPumpCyclingFaqs,
            faqSchemaJson: buildFaqSchema(waterPumpCyclingFaqs),
            checklistCta: checklistCtaWater,
            breadcrumb: { backHref: '/rv/water-pump-not-working', backLabel: 'Pump Troubleshooting' },
            quickRepairToolsIntro: 'Cycling diagnosis usually requires voltage check and leak isolation.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Confirm 12V under load' },
                { name: 'Best RV Water Pumps', href: '/rv/best-rv-water-pump', why: 'Replace if check or head is shot' },
            ],
            related: [
                { name: 'Water Pump Not Working', href: '/rv/water-pump-not-working' },
                { name: 'Pump Runs But No Water', href: '/rv/water-pump-runs-but-no-water' },
                { name: 'Water Hub', href: '/rv/water-systems' },
            ],
            clusterNavLinks: WATER_CLUSTER_NAV,
            clusterNavHeadline: 'RV Water Systems Troubleshooting Guides',
            serviceCtaType: 'plumber',
        }));
    });

    // 2️⃣ RV Low Water Pressure
    const lowWaterPressureFaqs = [
        { question: 'Why is my RV water pressure low on city water?', answer: 'Usually the regulator or inlet screen. Fixed-PSI regulators restrict flow to 2–3 GPM. Clean the inlet screen—sediment can cut flow by 50%. See <a href="/rv/best-rv-pressure-regulator">adjustable regulators</a>.' },
        { question: 'Why is pressure fine on city but weak on tank?', answer: 'Pump strainer clogged, low voltage at pump, or air in suction line. Clean the sediment bowl, test 12V at the pump. See <a href="/rv/water-pump-not-working">water pump troubleshooting</a>.' },
        { question: 'Can I remove the flow restrictor from my RV shower?', answer: 'Yes, but it increases water use. Better option: upgrade to a high-flow showerhead like Oxygenics that improves perceived pressure without wasting water.' },
    ];
    app.get('/rv/low-water-pressure', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-low-water-pressure-authority-master.html',
            `${BASE_URL}/rv/low-water-pressure`,
            'Low Water Pressure in RV: City vs Tank Troubleshooting',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'Low Water Pressure in RV: City vs Tank Troubleshooting',
            subtitle: 'Weak flow at fixtures? Clogged screens, failing regulators, or pump issues.',
            metaDescription: 'Diagnose low water pressure in your RV. City water vs tank pressure, sediment screens, regulator settings, and pump performance. 1,800+ words.',
            canonical: `${BASE_URL}/rv/low-water-pressure`,
            contentPartial: '../guides/rv-low-water-pressure-authority-master.html',
            faqs: lowWaterPressureFaqs,
            faqSchemaJson: buildFaqSchema(lowWaterPressureFaqs),
            breadcrumb: { backHref: '/rv/water-systems', backLabel: 'Water Hub' },
            related: [
                { name: 'Water Hub', href: '/rv/water-systems' },
                { name: 'Water Pump Troubleshooting', href: '/rv/water-pump-not-working' },
                { name: 'Best Pressure Regulators', href: '/rv/best-rv-pressure-regulator' },
            ],
            quickRepairToolsIntro: 'Low pressure diagnosis usually requires these tools.',
            quickRepairTools: [
                { name: 'Best RV Pressure Regulator', href: '/rv/best-rv-pressure-regulator', why: 'Adjustable PSI for high campground pressure' },
                { name: 'Best RV Water Pumps', href: '/rv/best-rv-water-pump', why: 'If tank pressure is weak' },
            ],
            clusterNavLinks: WATER_CLUSTER_NAV,
            clusterNavHeadline: 'RV Water Systems Troubleshooting Guides',
            serviceCtaType: 'plumber',
        }));
    });

    // 2b. RV Water Pressure Regulator Problems (Tier-1 troubleshooting)
    const waterPressureRegulatorProblemsFaqs = [
        { question: 'Why is my RV water pressure too high with a regulator?', answer: 'The regulator may have failed open or drifted. Test output with a gauge—expect 40–50 PSI. Above 60 PSI means replace. Install at the spigot, not at the RV inlet.' },
        { question: 'Where should the pressure regulator be installed?', answer: 'At the campground spigot—between the hose bib and your drinking water hose. Never at the RV inlet; full line pressure would reach the hose and can damage it.' },
        { question: 'How often should I replace my RV pressure regulator?', answer: 'Every 3–5 years, or if pressure drifts, leaks appear, or flow weakens. Sediment and wear cause drift. See <a href="/rv/best-rv-pressure-regulator">best RV pressure regulators</a>.' },
    ];
    app.get('/rv/water-pressure-regulator-problems', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-water-pressure-regulator-problems-content.html',
            `${BASE_URL}/rv/water-pressure-regulator-problems`,
            'RV Water Pressure Regulator Problems: Troubleshooting & Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Water Pressure Regulator Problems: Troubleshooting & Fixes',
            subtitle: 'Pressure too high, too low, or fluctuating? Step-by-step diagnosis and replacement.',
            metaDescription: 'RV water pressure regulator problems: pressure too high, too low, erratic. Install location, testing, when to replace. Step-by-step troubleshooting.',
            canonical: `${BASE_URL}/rv/water-pressure-regulator-problems`,
            contentPartial: '../guides/unpublished/future-publications/rv-water-pressure-regulator-problems-content.html',
            faqs: waterPressureRegulatorProblemsFaqs,
            faqSchemaJson: buildFaqSchema(waterPressureRegulatorProblemsFaqs),
            breadcrumb: { backHref: '/rv/water-systems', backLabel: 'Water Hub' },
            related: [
                { name: 'Water Hub', href: '/rv/water-systems' },
                { name: 'RV Water Pressure Regulator Explained', href: '/rv/rv-water-pressure-regulator' },
                { name: 'Low Water Pressure Causes', href: '/rv/low-water-pressure' },
                { name: 'Water Pump Not Working', href: '/rv/water-pump-not-working' },
                { name: 'Best RV Pressure Regulators', href: '/rv/best-rv-pressure-regulator' },
            ],
            quickRepairToolsIntro: 'Regulator diagnosis usually requires these tools.',
            quickRepairTools: [
                { name: 'Best RV Pressure Regulator', href: '/rv/best-rv-pressure-regulator', why: 'Replacement—fixed or adjustable' },
                { name: 'Low Water Pressure Guide', href: '/rv/low-water-pressure', why: 'If pressure is too low' },
            ],
            clusterNavLinks: WATER_CLUSTER_NAV,
            clusterNavHeadline: 'RV Water Systems Troubleshooting Guides',
            serviceCtaType: 'plumber',
        }));
    });

    // 3️⃣ RV Water Heater Not Working
    const waterHeaterNotWorkingFaqs = [
        { question: 'Why does my water heater work on propane but not electric?', answer: 'Usually a burnt heating element or tripped breaker. Check the outside switch (many Suburban units have one). Test element resistance—OL means burnt. See <a href="/rv/rv-water-heater-element-replacement">element replacement guide</a>.' },
        { question: 'Why does my propane heater light then shut off?', answer: 'The flame sensor isn\'t detecting the flame. Clean the igniter probe tip with steel wool to remove carbon buildup. If it persists, the control board may need replacement.' },
        { question: 'Can I run the electric element without water?', answer: 'No. Dry-firing destroys the element in under 30 seconds. Always ensure the tank is full before turning on electric.' },
    ];
    app.get('/rv/rv-water-heater-not-working', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-water-heater-not-working-authority-master.html',
            `${BASE_URL}/rv/rv-water-heater-not-working`,
            'RV Water Heater Not Working: Electric & Propane Troubleshooting',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Water Heater Not Working: Electric & Propane Troubleshooting',
            subtitle: 'Cold showers? Diagnose element failure, propane ignition, or thermostat issues.',
            metaDescription: 'RV water heater troubleshooting guide: electric element replacement, propane ignition relay, reset buttons. Fix hot water issues fast. 2,200+ words.',
            canonical: `${BASE_URL}/rv/rv-water-heater-not-working`,
            contentPartial: '../guides/rv-water-heater-not-working-authority-master.html',
            faqs: waterHeaterNotWorkingFaqs,
            faqSchemaJson: buildFaqSchema(waterHeaterNotWorkingFaqs),
            breadcrumb: { backHref: '/rv/water-systems', backLabel: 'Water Hub' },
            related: [
                { name: 'Water Hub', href: '/rv/water-systems' },
                { name: 'Element Replacement Guide', href: '/rv/rv-water-heater-element-replacement' },
                { name: 'Winterizing Checklist', href: '/rv/rv-winterizing-checklist' },
            ],
            clusterNavLinks: WATER_CLUSTER_NAV,
            clusterNavHeadline: 'RV Water Systems Troubleshooting Guides',
            serviceCtaType: 'plumber',
            quickRepairToolsIntro: 'Water heater diagnosis usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test element resistance, 12V at igniter' },
                { name: 'Water Heater Element Replacement', href: '/rv/rv-water-heater-element-replacement', why: 'Replace burnt electric element' },
            ],
            emergencyPage: getEmergencyPreset(`${BASE_URL}/rv/rv-water-heater-not-working`),
        }));
    });

    // 4️⃣ RV Winterizing Checklist
    app.get('/rv/rv-winterizing-checklist', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-winterizing-checklist-content.html',
            `${BASE_URL}/rv/rv-winterizing-checklist`,
            'RV Winterizing Checklist: Step-by-Step Step Freeze Protection',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Winterizing Checklist: Step-by-Step Step Freeze Protection',
            subtitle: 'Protect your plumbing from burst pipes. Printable-style checklist for winter prep.',
            metaDescription: 'Complete RV winterizing checklist. Blow-out vs antifreeze methods. Drain tanks, bypass heater, protect traps. Full safety guide. 2,000+ words.',
            canonical: `${BASE_URL}/rv/rv-winterizing-checklist`,
            contentPartial: '../guides/rv-winterizing-checklist-content.html',
            breadcrumb: { backHref: '/rv/water-systems', backLabel: 'Water Hub' },
            related: [
                { name: 'Dewinterizing Guide', href: '/rv/rv-dewinterizing-guide' },
                { name: 'Antifreeze Types Compared', href: '/guides/rv-antifreeze-types-compared' },
            ],
            quickRepairToolsIntro: 'Winterizing usually requires these supplies.',
            quickRepairTools: [
                { name: 'RV Antifreeze', href: '/guides/rv-antifreeze-types-compared', why: 'Protect traps and lines' },
                { name: 'Best RV Water Pumps', href: '/rv/best-rv-water-pump', why: 'Blow-out method alternative' },
            ],
            clusterNavLinks: WATER_CLUSTER_NAV,
            clusterNavHeadline: 'RV Water Systems Troubleshooting Guides',
            serviceCtaType: 'plumber',
        }));
    });

    // 5️⃣ RV Dewinterizing Guide
    app.get('/rv/rv-dewinterizing-guide', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-dewinterizing-guide-content.html',
            `${BASE_URL}/rv/rv-dewinterizing-guide`,
            'RV Dewinterizing Guide: Sanitizing & Flushing Your System',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Dewinterizing Guide: Sanitizing & Flushing Your System',
            subtitle: 'Flush out antifreeze and sanitize your fresh water tank for the new season.',
            metaDescription: 'Step-by-step RV dewinterizing guide. Flushing antifreeze, bleach ratios for sanitizing, and leak testing. 1,800+ words.',
            canonical: `${BASE_URL}/rv/rv-dewinterizing-guide`,
            contentPartial: '../guides/rv-dewinterizing-guide-content.html',
            breadcrumb: { backHref: '/rv/water-systems', backLabel: 'Water Hub' },
            related: [
                { name: 'Winterizing Checklist', href: '/rv/rv-winterizing-checklist' },
                { name: 'Tank Sanitation Guide', href: '/rv/rv-tank-sanitation-guide' },
            ],
            quickRepairToolsIntro: 'Dewinterizing and sanitizing usually require these supplies.',
            quickRepairTools: [
                { name: 'RV Tank Sanitizer', href: '/rv/rv-tank-sanitation-guide', why: 'Bleach ratios for sanitizing' },
                { name: 'Best RV Water Pumps', href: '/rv/best-rv-water-pump', why: 'Flush system after antifreeze' },
            ],
            clusterNavLinks: WATER_CLUSTER_NAV,
            clusterNavHeadline: 'RV Water Systems Troubleshooting Guides',
            serviceCtaType: 'plumber',
        }));
    });

    // 6️⃣ RV Water Heater Element Replacement
    app.get('/rv/rv-water-heater-element-replacement', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-water-heater-element-replacement-content.html',
            `${BASE_URL}/rv/rv-water-heater-element-replacement`,
            'RV Water Heater Element Replacement: Step-by-Step DIY Guide',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Water Heater Element Replacement: Step-by-Step DIY Guide',
            subtitle: 'No hot water on electric? Replace your element safely in under an hour.',
            metaDescription: 'DIY guide to replacing an RV water heater element. Tool list, safety warnings, and step-by-step instructions for Suburban and Atwood heaters. 1,500+ words.',
            canonical: `${BASE_URL}/rv/rv-water-heater-element-replacement`,
            contentPartial: '../guides/rv-water-heater-element-replacement-content.html',
            breadcrumb: { backHref: '/rv/rv-water-heater-not-working', backLabel: 'Heater Troubleshooting' },
            related: [
                { name: 'Water Heater Not Working', href: '/rv/rv-water-heater-not-working' },
                { name: 'Voltage Issues', href: '/rv/hvac/rv-ac-low-voltage-problems' },
            ],
            quickRepairToolsIntro: 'Element replacement usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test element resistance before replacing' },
                { name: 'Water Heater Not Working', href: '/rv/rv-water-heater-not-working', why: 'Diagnosis guide and element specs' },
            ],
            clusterNavLinks: WATER_CLUSTER_NAV,
            clusterNavHeadline: 'RV Water Systems Troubleshooting Guides',
            serviceCtaType: 'plumber',
        }));
    });

    // 7️⃣ Best RV Water Pump
    app.get('/rv/best-rv-water-pump', async (request, reply) => {
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            title: 'Best RV Water Pump: Silence & Pressure Comparison',
            subtitle: 'Comparing top 12V pumps for flow rate, PSI, and noise reduction.',
            metaDescription: 'Best RV water pump reviews. Comparison of Shurflo vs Seaflo vs Remco. Quietest and most reliable 12V water pumps for boondocking.',
            canonical: `${BASE_URL}/rv/best-rv-water-pump`,
            contentPartial: '../guides/best-rv-water-pump-content.html',
            breadcrumb: { backHref: '/rv/water-systems', backLabel: 'Water Hub' },
            related: [
                { name: 'Water Pump Troubleshooting', href: '/rv/water-pump-not-working' },
                { name: 'Low Water Pressure', href: '/rv/low-water-pressure' },
            ],
            clusterNavLinks: WATER_CLUSTER_NAV,
            clusterNavHeadline: 'RV Water Systems Troubleshooting Guides',
            serviceCtaType: 'plumber',
        }));
    });

    // 8️⃣ RV Black Tank Not Draining — Emergency Funnel
    const blackTankNotDrainingFaqs = [
        { question: 'Why won\'t my black tank drain?', answer: 'Solids buildup from leaving the valve open or dry dumps. Add water, use a tank flush wand, and try again. Never leave the black valve open when hooked to sewer.' },
        { question: 'Can I use household toilet paper in my RV?', answer: 'No. Use RV-specific toilet paper—household paper causes clogs. Never use harsh chemicals that can damage tank sensors or seals.' },
        { question: 'What if the black tank valve is stuck?', answer: 'Try opening/closing gently. Lubricate the cable. If the blade is jammed, you may need a pro to clear or replace the valve.' },
    ];
    app.get('/rv/black-tank-not-draining', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-black-tank-not-draining-authority-master.html',
            `${BASE_URL}/rv/black-tank-not-draining`,
            'RV Black Tank Not Draining: Causes & Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Black Tank Not Draining: Causes & Fixes',
            subtitle: 'Nothing drains? Add water, flush, check valve. Never leave valve open when hooked to sewer.',
            metaDescription: 'RV black tank not draining? Solids buildup, stuck valve, hose blockage. Add water, tank wand, proper slope. Step-by-step troubleshooting.',
            canonical: `${BASE_URL}/rv/black-tank-not-draining`,
            contentPartial: '../guides/rv-black-tank-not-draining-authority-master.html',
            faqs: blackTankNotDrainingFaqs,
            faqSchemaJson: buildFaqSchema(blackTankNotDrainingFaqs),
            breadcrumb: { backHref: '/rv/water-systems', backLabel: 'Water Systems' },
            related: [
                { name: 'RV Sewer & Leveling Setup', href: '/rv/camping/sewer-leveling' },
                { name: 'Water Systems Hub', href: '/rv/water-systems' },
                { name: 'Best RV Sewer Hoses', href: '/rv-parts/best-rv-sewer-hoses' },
            ],
            quickRepairToolsIntro: 'Black tank diagnosis usually requires these tools.',
            quickRepairTools: [
                { name: 'Tank Flush Wand', href: '/rv-parts/best-rv-sewer-hoses', why: 'Flush solids and clear blockage' },
                { name: 'Best RV Sewer Hoses', href: '/rv-parts/best-rv-sewer-hoses', why: 'Proper slope and connection' },
            ],
            clusterNavLinks: WATER_CLUSTER_NAV,
            clusterNavHeadline: 'RV Water Systems Troubleshooting Guides',
            serviceCtaType: 'plumber',
        }));
    });

    // 8a. RV Water Heater Keeps Shutting Off — Flywheel lateral
    const waterHeaterShuttingOffFaqs = [
        { question: 'Why does my propane water heater light then shut off?', answer: 'Usually a dirty flame sensor. The igniter probe detects the flame; carbon buildup blocks detection. Clean the probe tip with steel wool. See <a href="/rv/rv-water-heater-not-working">water heater troubleshooting</a>.' },
        { question: 'Why does my electric water heater keep tripping the ECO?', answer: 'Overheating from sediment buildup or a failing thermostat. Flush the tank and reset the ECO. If it trips again immediately, replace the thermostat or have a pro inspect.' },
        { question: 'Can I bypass the thermal cutoff?', answer: 'No. Thermal cutoffs prevent fires. Bypassing is dangerous. Find and fix the cause—usually sediment or low water level.' },
    ];
    app.get('/rv/rv-water-heater-keeps-shutting-off', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-water-heater-keeps-shutting-off-content.html',
            `${BASE_URL}/rv/rv-water-heater-keeps-shutting-off`,
            'RV Water Heater Keeps Shutting Off: Flame Sensor & ECO Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Water Heater Keeps Shutting Off: Flame Sensor & ECO Fixes',
            subtitle: 'Propane lights then off? Clean flame sensor. Electric trips ECO? Flush tank, reset.',
            metaDescription: 'RV water heater keeps shutting off? Propane flame sensor, ECO reset, sediment. Step-by-step troubleshooting.',
            canonical: `${BASE_URL}/rv/rv-water-heater-keeps-shutting-off`,
            contentPartial: '../guides/unpublished/future-publications/rv-water-heater-keeps-shutting-off-content.html',
            faqs: waterHeaterShuttingOffFaqs,
            faqSchemaJson: buildFaqSchema(waterHeaterShuttingOffFaqs),
            breadcrumb: { backHref: '/rv/rv-water-heater-not-working', backLabel: 'Heater Troubleshooting' },
            related: [
                { name: 'Water Heater Not Working', href: '/rv/rv-water-heater-not-working' },
                { name: 'Water Heater Element Replacement', href: '/rv/rv-water-heater-element-replacement' },
                { name: 'Water Systems Hub', href: '/rv/water-systems' },
            ],
            quickRepairToolsIntro: 'Water heater diagnosis usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test thermostat if needed' },
                { name: 'Water Heater Not Working', href: '/rv/rv-water-heater-not-working', why: 'Full diagnostic flow' },
            ],
            clusterNavLinks: WATER_CLUSTER_NAV,
            clusterNavHeadline: 'RV Water Systems Troubleshooting Guides',
            serviceCtaType: 'plumber',
        }));
    });

    // 8c. RV Toilet Won't Flush — Flywheel lateral
    const toiletWontFlushFaqs = [
        { question: 'Why does my RV toilet have no water when I press the pedal?', answer: 'Usually an empty fresh tank or closed supply valve. Check tank level and the toilet supply valve. See <a href="/rv/water-pump-not-working">water pump troubleshooting</a>.' },
        { question: 'Can I use Drano in my RV toilet?', answer: 'No. Harsh chemicals damage rubber seals and tank sensors. Use enzymatic cleaners or mechanical clearing.' },
        { question: 'Why does my RV toilet run constantly?', answer: 'The ball seal is stuck open. Clean or replace the seal. Debris or a dried-out seal can cause this.' },
    ];
    app.get('/rv/rv-toilet-wont-flush', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-toilet-wont-flush-content.html',
            `${BASE_URL}/rv/rv-toilet-wont-flush`,
            'RV Toilet Won\'t Flush: Water Supply & Ball Seal Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Toilet Won\'t Flush: Water Supply & Ball Seal Fixes',
            subtitle: 'No water? Check supply. Pedal stuck? Ball seal or linkage. Step-by-step.',
            metaDescription: 'RV toilet won\'t flush? Empty tank, ball seal, pedal linkage. Water supply and mechanical fixes.',
            canonical: `${BASE_URL}/rv/rv-toilet-wont-flush`,
            contentPartial: '../guides/unpublished/future-publications/rv-toilet-wont-flush-content.html',
            faqs: toiletWontFlushFaqs,
            faqSchemaJson: buildFaqSchema(toiletWontFlushFaqs),
            breadcrumb: { backHref: '/rv/water-systems', backLabel: 'Water Systems' },
            related: [
                { name: 'Black Tank Not Draining', href: '/rv/black-tank-not-draining' },
                { name: 'Water Pump Not Working', href: '/rv/water-pump-not-working' },
                { name: 'Water Systems Hub', href: '/rv/water-systems' },
            ],
            quickRepairToolsIntro: 'Toilet repair may require these.',
            quickRepairTools: [
                { name: 'Best RV Sewer Hoses', href: '/rv-parts/best-rv-sewer-hoses', why: 'Tank and drain setup' },
                { name: 'Water Pump Troubleshooting', href: '/rv/water-pump-not-working', why: 'Supply diagnosis' },
            ],
            clusterNavLinks: WATER_CLUSTER_NAV,
            clusterNavHeadline: 'RV Water Systems Troubleshooting Guides',
            serviceCtaType: 'plumber',
        }));
    });

    // RV Toilet Smells — 12 Core Pages (per docs/12-CORE-PAGES-AUDIT.md)
    const toiletSmellsFaqs = [
        { question: 'Why does my RV bathroom smell like sewage?', answer: 'Usually a clogged vent, dry toilet seal, or black valve left open when hooked to sewer. Close the valve when not dumping. Check roof vent for blockage. Lubricate or replace the toilet seal.' },
        { question: 'Should I leave the black tank valve open when hooked to sewer?', answer: 'No. Solids stay in the tank and cause odor and clogs. Open only when dumping. Add water before dumping if the tank is low.' },
        { question: 'What toilet paper should I use in an RV?', answer: 'RV-specific toilet paper breaks down faster. Household paper causes clogs and odor buildup. Use RV paper—it\'s worth the small cost.' },
    ];
    app.get('/rv/rv-toilet-smells', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-toilet-smells-content.html',
            `${BASE_URL}/rv/rv-toilet-smells`,
            'RV Toilet Smells: Vent, Seal & Tank Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Toilet Smells: Vent, Seal & Tank Fixes',
            subtitle: 'Sewage odor? Check vent, seal, black valve. Step-by-step fixes.',
            metaDescription: 'RV toilet smells? Clogged vent, dry seal, valve left open. Tank treatment, seal replacement. Step-by-step troubleshooting.',
            canonical: `${BASE_URL}/rv/rv-toilet-smells`,
            contentPartial: '../guides/unpublished/future-publications/rv-toilet-smells-content.html',
            faqs: toiletSmellsFaqs,
            faqSchemaJson: buildFaqSchema(toiletSmellsFaqs),
            breadcrumb: { backHref: '/rv/water-systems', backLabel: 'Water Systems' },
            related: [
                { name: 'Black Tank Not Draining', href: '/rv/black-tank-not-draining' },
                { name: 'RV Toilet Won\'t Flush', href: '/rv/rv-toilet-wont-flush' },
                { name: 'Water Systems Hub', href: '/rv/water-systems' },
            ],
            quickRepairToolsIntro: 'Toilet odor fixes may require these.',
            quickRepairTools: [
                { name: 'Best RV Sewer Hoses', href: '/rv-parts/best-rv-sewer-hoses', why: 'Tank and drain setup' },
            ],
            clusterNavLinks: WATER_CLUSTER_NAV,
            clusterNavHeadline: 'RV Water Systems Troubleshooting Guides',
            serviceCtaType: 'plumber',
        }));
    });

    // 8d. RV Sink Not Draining — Flywheel lateral
    const sinkNotDrainingFaqs = [
        { question: 'Why won\'t my RV sink drain?', answer: 'Usually a full gray tank or clogged P-trap. Dump the gray tank first—sensors are inaccurate. Then clear the P-trap under the sink.' },
        { question: 'Can I use Drano in my RV sink?', answer: 'No. Harsh chemicals damage RV plumbing and seals. Use enzymatic drain cleaners or a drain snake.' },
        { question: 'Why do both kitchen and bathroom sinks drain slowly?', answer: 'Full gray tank or a clog in the main drain line. Dump the tank first. If still slow, snake the main line.' },
    ];
    app.get('/rv/rv-sink-not-draining', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-sink-not-draining-content.html',
            `${BASE_URL}/rv/rv-sink-not-draining`,
            'RV Sink Not Draining: Gray Tank & Clog Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Sink Not Draining: Gray Tank & Clog Fixes',
            subtitle: 'Full gray tank? Clogged P-trap? Dump tank, clear drain. No harsh chemicals.',
            metaDescription: 'RV sink not draining? Full gray tank, P-trap clogged. Dump tank, clear drain. Step-by-step troubleshooting.',
            canonical: `${BASE_URL}/rv/rv-sink-not-draining`,
            contentPartial: '../guides/unpublished/future-publications/rv-sink-not-draining-content.html',
            faqs: sinkNotDrainingFaqs,
            faqSchemaJson: buildFaqSchema(sinkNotDrainingFaqs),
            breadcrumb: { backHref: '/rv/water-systems', backLabel: 'Water Systems' },
            related: [
                { name: 'Black Tank Not Draining', href: '/rv/black-tank-not-draining' },
                { name: 'Low Water Pressure', href: '/rv/low-water-pressure' },
                { name: 'Water Systems Hub', href: '/rv/water-systems' },
            ],
            quickRepairToolsIntro: 'Drain clearing may require these.',
            quickRepairTools: [
                { name: 'Best RV Sewer Hoses', href: '/rv-parts/best-rv-sewer-hoses', why: 'Tank and drain' },
                { name: 'Black Tank Not Draining', href: '/rv/black-tank-not-draining', why: 'Tank dump procedure' },
            ],
            clusterNavLinks: WATER_CLUSTER_NAV,
            clusterNavHeadline: 'RV Water Systems Troubleshooting Guides',
            serviceCtaType: 'plumber',
        }));
    });

    // 8b. RV Water Pressure Regulator — Do You Need One? (canonical /rv/rv-water-pressure-regulator)
    const pressureRegulatorFaqs = [
        { question: 'Do I need an RV water pressure regulator?', answer: 'Yes, when connected to campground (city) water. Campground pressure often exceeds 80–100 PSI; RV plumbing is designed for 40–50 PSI. A regulator limits pressure to protect hoses, fittings, and the water heater.' },
        { question: 'What PSI is safe for RV water?', answer: '40–50 PSI is ideal; 60 PSI is the maximum for most RV plumbing. Over 60 PSI risks burst hoses and damaged fittings.' },
        { question: 'Do I need a regulator when boondocking?', answer: 'No. When using your fresh tank and pump, pressure is controlled by the pump. Regulators are for shore/city water connections.' },
        { question: 'Will a regulator reduce flow?', answer: 'At normal pressures, flow is usually adequate. Very low input pressure may result in weaker output—that\'s a campground issue, not the regulator\'s fault.' },
    ];
    app.get('/rv/rv-water-pressure-regulator', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-water-pressure-regulator-content.html',
            `${BASE_URL}/rv/rv-water-pressure-regulator`,
            'RV Water Pressure Regulator: Do You Need One?',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Water Pressure Regulator: Do You Need One?',
            subtitle: 'Safe water pressure for RVs is 40–50 PSI. Campground pressure often exceeds 80–100 PSI. Types, installation, FMCA reference.',
            metaDescription: 'Safe water pressure for RVs is 40–50 PSI. Campground pressure often exceeds 80–100 PSI. Learn why you need a regulator, types, and installation.',
            canonical: `${BASE_URL}/rv/rv-water-pressure-regulator`,
            contentPartial: '../guides/rv-water-pressure-regulator-content.html',
            checklistCta: checklistCtaWater,
            faqs: pressureRegulatorFaqs,
            faqSchemaJson: buildFaqSchema(pressureRegulatorFaqs),
            breadcrumb: { backHref: '/rv/water-systems', backLabel: 'Water Systems' },
            related: [
                { name: 'Water Hub', href: '/rv/water-systems' },
                { name: 'Low Water Pressure', href: '/rv/low-water-pressure' },
                { name: 'Water Pump Troubleshooting', href: '/rv/water-pump-not-working' },
                { name: 'Winterizing Checklist', href: '/rv/rv-winterizing-checklist' },
                { name: 'Best RV Pressure Regulators', href: '/rv-parts/best-rv-water-pressure-regulators' },
            ],
            quickRepairToolsIntro: 'Pressure regulator setup usually requires these tools.',
            quickRepairTools: [
                { name: 'Best RV Pressure Regulator', href: '/rv/best-rv-pressure-regulator', why: 'Adjustable PSI for high campground pressure' },
                { name: 'Best RV Water Pumps', href: '/rv/best-rv-water-pump', why: 'If using tank water' },
            ],
            clusterNavLinks: WATER_CLUSTER_NAV,
            clusterNavHeadline: 'RV Water Systems Troubleshooting Guides',
            serviceCtaType: 'plumber',
        }));
    });

    // 9️⃣ Best RV Pressure Regulator
    app.get('/rv/best-rv-pressure-regulator', async (request, reply) => {
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            title: 'Best RV Water Pressure Regulator: Adjustable vs Fixed Comparison',
            subtitle: 'Protect your plumbing. Comparing adjustable PSI regulators for high campground pressure.',
            metaDescription: 'Best RV water pressure regulator reviews. Adjustable vs fixed PSI. Protecting your plumbing from high campground voltage.',
            canonical: `${BASE_URL}/rv/best-rv-pressure-regulator`,
            contentPartial: '../guides/best-rv-pressure-regulator-content.html',
            breadcrumb: { backHref: '/rv/water-systems', backLabel: 'Water Hub' },
            related: [
                { name: 'Low Water Pressure', href: '/rv/low-water-pressure' },
                { name: 'Water Setup Checklist', href: '/rv/rv-water-setup-checklist' },
            ],
            clusterNavLinks: WATER_CLUSTER_NAV,
            clusterNavHeadline: 'RV Water Systems Troubleshooting Guides',
            serviceCtaType: 'plumber',
        }));
    });

    // Legacy Redirects
    app.get('/rv/rv-water-pump-troubleshooting', async (_, reply) => {
        return reply.redirect('/rv/water-pump-not-working', 301);
    });
    app.get('/guides/rv-water-pump-troubleshooting', async (_, reply) => {
        return reply.redirect('/rv/water-pump-not-working', 301);
    });
    app.get('/rv/winterizing-guide', async (_, reply) => {
        return reply.redirect('/rv/rv-winterizing-checklist', 301);
    });
    app.get('/guides/how-to-winterize-rv-step-by-step', async (_, reply) => {
        return reply.redirect('/rv/rv-winterizing-checklist', 301);
    });
    app.get('/rv-parts/rv-water-filters', async (_, reply) => {
        return reply.redirect('/rv/water-systems', 301);
    });
    app.get('/rv-parts/rv-pressure-regulators', async (_, reply) => {
        return reply.redirect('/rv/best-rv-pressure-regulator', 301);
    });
    app.get('/rv/rv-water-pressure-regulator-guide', async (_, reply) => {
        return reply.redirect('/rv/rv-water-pressure-regulator', 301);
    });
    app.get('/guides/rv-water-pressure-regulator-guide', async (_, reply) => {
        return reply.redirect('/rv/rv-water-pressure-regulator', 301);
    });
    app.get('/rv/can-high-water-pressure-damage-an-rv', async (_, reply) => {
        return reply.redirect('/rv/low-water-pressure', 301);
    });
    app.get('/guides/can-high-water-pressure-damage-an-rv', async (_, reply) => {
        return reply.redirect('/rv/low-water-pressure', 301);
    });
    app.get('/rv-parts/rv-fresh-water-pumps', async (_, reply) => {
        return reply.redirect('/rv/best-rv-water-pump', 301);
    });
    app.get('/rv/drinking-water-hose-guide', async (_, reply) => {
        return reply.redirect('/rv/water-systems', 301);
    });
    app.get('/rv/water-filter-systems-for-rv', async (_, reply) => {
        return reply.redirect('/rv/water-systems', 301);
    });
    app.get('/rv/rv-water-setup-checklist', async (_, reply) => {
        return reply.redirect('/rv/water-systems', 301);
    });
    app.get('/rv/rv-tank-sanitation-guide', async (_, reply) => {
        return reply.redirect('/rv/rv-dewinterizing-guide', 301);
    });
    app.get('/rv/rv-water-heater-comparison', async (_, reply) => {
        return reply.redirect('/rv/rv-water-heater-not-working', 301);
    });
    app.get('/rv/water/low-pressure-causes', async (_, reply) => {
        return reply.redirect('/rv/low-water-pressure', 301);
    });
    app.get('/rv/water/pump-cycling-causes', async (_, reply) => {
        return reply.redirect('/rv/water-pump-cycling', 301);
    });
    app.get('/rv/water/water-heater-not-lighting', async (_, reply) => {
        return reply.redirect('/rv/rv-water-heater-not-working', 301);
    });
    app.get('/rv/water/fresh-tank-overflow', async (_, reply) => {
        return reply.redirect('/rv/water-systems', 301);
    });
    app.get('/rv/rv-water-pump-runs-but-no-water', async (_, reply) => {
        return reply.redirect('/rv/water-pump-runs-but-no-water', 301);
    });
    app.get('/rv-water-pump-runs-but-no-water', async (_, reply) => {
        return reply.redirect('/rv/water-pump-runs-but-no-water', 301);
    });
    app.get('/guides/rv-water-pump-runs-but-no-water', async (_, reply) => {
        return reply.redirect('/rv/water-pump-runs-but-no-water', 301);
    });
    app.get('/rv/water/city-water-vs-tank-pressure', async (_, reply) => {
        return reply.redirect('/rv/low-water-pressure', 301);
    });
}