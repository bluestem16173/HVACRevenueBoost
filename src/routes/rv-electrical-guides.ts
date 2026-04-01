import { FastifyInstance } from 'fastify';
import { buildFaqSchema } from '../utils/faqSchema.js';
import { electricalSystemsPillarConfig } from '../data/pillar-configs/electrical-systems.js';
import { withSchemaConfig } from '../data/schema-config.js';
import { withAuthorityKnowledgeGraph } from '../utils/with-authority-knowledge-graph.js';
import { campgroundVoltageFeederConfig } from '../data/feeder-configs/campground-voltage.js';
import { getMonetizationContext } from '../utils/monetizationHelper.js';
import { getTier1AiSummary, getAiSummaryForAuthorityGuide } from '../services/summaryService.js';
import { getEmergencyPreset } from '../data/emergency-rv-presets.js';

const ELECTRICAL_BASE = 'https://www.decisiongrid.co';

// Electrical Cluster Nav — Crawl accelerator (per DECISIONGRID-5-CLUSTER-OUTPUT)
const ELECTRICAL_CLUSTER_NAV: { name: string; href: string }[] = [
    { name: 'RV Breaker Keeps Tripping', href: '/rv/electrical/breaker-tripping' },
    { name: 'RV Generator Won\'t Start', href: '/rv/electrical/rv-generator-wont-start' },
    { name: 'RV Shore Power Not Working', href: '/rv/electrical/shore-power-troubleshooting' },
    { name: 'RV Converter Not Charging', href: '/rv/electrical/converter-not-charging-battery' },
    { name: 'RV Inverter Troubleshooting', href: '/rv/electrical/inverter-troubleshooting' },
    { name: 'RV Outlets Not Working', href: '/rv/electrical/outlets-not-working' },
    { name: 'RV Microwave Not Working', href: '/rv/rv-microwave-not-working' },
    { name: 'RV Refrigerator Not Cooling', href: '/rv/refrigerator-not-cooling' },
    { name: 'How To Test RV Outlet', href: '/rv/electrical/how-to-test-rv-outlet-with-multimeter' },
    { name: 'Best RV EMS', href: '/rv-parts/best-rv-ems-systems' },
];

export default async function rvElectricalGuidesRoutes(app: FastifyInstance) {
    // Flagship pillar — Tier 1 authority template
    app.get('/rv/electrical-systems', async (request, reply) => {
        const monetization = getMonetizationContext('/rv/electrical-systems');
        const maturityLevel = monetization.contentMaturityLevel;
        const config = withSchemaConfig({
            ...electricalSystemsPillarConfig,
            contentPartial: '../pillars/electrical-systems-sections.html',
            faqSchemaJson: buildFaqSchema(electricalSystemsPillarConfig.faqs),
        });
        const url = 'https://www.decisiongrid.co/rv/electrical-systems';
        const title = electricalSystemsPillarConfig.meta.title;
        const forceRefresh =
            (request.query as { refreshSummary?: string }).refreshSummary === '1' &&
            (request.query as { token?: string }).token === process.env.ADMIN_TOKEN;
        const aiSummary = await getTier1AiSummary(
            'pillars/electrical-systems-sections.html',
            url,
            title,
            maturityLevel,
            !!forceRefresh
        );
        return reply.view('layouts/tier1-authority-pillar.html', { ...config, aiSummary, serviceCtaType: 'electrician' });
    });
    // Legacy redirect to flagship
    app.get('/guides/complete-guide-to-rv-electrical-systems', async (_, reply) => {
        return reply.redirect('/rv/electrical-systems', 301);
    });

    // 10 authority pages — all /guides/ redirect to /rv/electrical/ or pillar
    app.get('/guides/rv-converter-vs-inverter-explained', async (_, reply) => {
        return reply.redirect('/rv/electrical-systems', 301);
    });
    app.get('/guides/how-to-upgrade-to-lithium-batteries-in-rv', async (_, reply) => {
        return reply.redirect('/rv/electrical-systems', 301);
    });
    app.get('/guides/rv-solar-panel-sizing-calculator-guide', async (_, reply) => {
        return reply.redirect('/rv/rv-solar-panels-guide', 301);
    });
    app.get('/guides/30-amp-vs-50-amp-rv-electrical-systems', async (_, reply) => {
        return reply.redirect('/rv/electrical/30-amp-vs-50-amp', 301);
    });

    app.get('/rv/electrical/shore-power-troubleshooting', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-shore-power-troubleshooting-content.html',
            'https://www.decisiongrid.co/rv/electrical/shore-power-troubleshooting',
            'RV Shore Power Problems Troubleshooting',
            request
        );
        const faqs = [
            { question: 'Should I bypass my EMS if it keeps tripping?', answer: 'Only if you\'re confident the power is safe (e.g., you\'ve verified voltage and polarity). Bypassing removes protection. Use a basic surge protector as minimum protection if you must.' },
            { question: 'What voltage is too low?', answer: 'Sustained below 108V can damage appliances and the converter. Many EMS units trip around 104–108V. 110–120V is normal.' },
            { question: 'Can a bad extension cord cause problems?', answer: 'Yes. Undersized or damaged extension cords cause voltage drop and overheating. Use an RV-rated cord of proper gauge and length.' },
        ];
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Shore Power Problems Troubleshooting',
            subtitle: 'EMS trips, no power, flickering lights, converter not charging. Check pedestal, cord, and connections.',
            metaDescription: 'Shore power troubleshooting: EMS trips, no power, flickering lights, converter not charging. Check pedestal, cord, and connections.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/shore-power-troubleshooting',
            contentPartial: '../guides/rv-shore-power-troubleshooting-content.html',
            faqs,
            faqSchemaJson: buildFaqSchema(faqs),
            quickRepairToolsIntro: 'Diagnosing shore power issues usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test voltage and polarity at pedestal' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems', why: 'Monitor voltage, block unsafe power' },
                { name: 'Best RV Surge Protectors', href: '/rv-parts/best-rv-surge-protectors', why: 'Basic surge protection with voltage display' },
            ],
            related: [
                { name: 'safe campground voltage', href: '/rv/electrical/campground-voltage' },
                { name: 'RV Electrical Systems Guide', href: '/rv/electrical-systems' },
                { name: 'EMS vs Basic Surge Protectors', href: '/rv/electrical/ems-vs-surge-protectors' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems' },
                { name: 'RV Electrical Checklist', href: '/checklists/rv-electrical' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });
    app.get('/guides/rv-shore-power-problems-troubleshooting', async (_, reply) => {
        return reply.redirect('/rv/electrical/shore-power-troubleshooting', 301);
    });

    app.get('/guides/how-to-test-rv-fuses-and-breakers', async (_, reply) => {
        return reply.redirect('/rv/electrical-systems', 301);
    });

    app.get('/guides/common-rv-battery-drain-causes', async (_, reply) => {
        return reply.redirect('/rv/rv-battery-drain-causes', 301);
    });
    app.get('/rv/battery-not-charging', async (_, reply) => {
        return reply.redirect('/rv/electrical/converter-not-charging-battery', 301);
    });
    app.get('/guides/rv-battery-not-charging', async (_, reply) => {
        return reply.redirect('/rv/electrical/converter-not-charging-battery', 301);
    });

    app.get('/guides/best-rv-battery-monitor-systems', async (_, reply) => {
        return reply.redirect('/rv/electrical-systems', 301);
    });

    app.get('/guides/how-to-wire-rv-inverter-safely', async (_, reply) => {
        return reply.redirect('/rv/rv-inverter-wiring-guide', 301);
    });

    app.get('/guides/rv-electrical-system-diagram-printable', async (_, reply) => {
        return reply.redirect('/rv/electrical-systems', 301);
    });

    const electricalTroubleshootingFaqs = [
        { question: 'RV has no power when plugged in', answer: 'Check pedestal breaker, power cord, RV main breaker. See <a href="/rv/electrical/shore-power-troubleshooting">shore power troubleshooting</a>.' },
        { question: 'Batteries not charging', answer: 'Converter failure, tripped breaker, or loose connection. See <a href="/rv/rv-battery-drain-causes">battery drain</a> and <a href="/rv/electrical-systems">electrical guide</a>.' },
    ];
    app.get('/rv/electrical/troubleshooting', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-electrical-troubleshooting-content.html',
            'https://www.decisiongrid.co/rv/electrical/troubleshooting',
            'RV Electrical Troubleshooting Master Guide',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Electrical Troubleshooting Master Guide',
            subtitle: 'Breakers, voltage, battery, AC, EMS. Links to in-depth guides by symptom.',
            metaDescription: 'RV electrical troubleshooting hub: breakers, voltage, battery, AC, EMS. Links to voltage guide, breaker tripping, battery drain, shore power.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/troubleshooting',
            contentPartial: '../guides/rv-electrical-troubleshooting-content.html',
            faqs: electricalTroubleshootingFaqs,
            faqSchemaJson: buildFaqSchema(electricalTroubleshootingFaqs),
            related: [
                { name: 'RV Breaker Tripping Guide', href: '/rv/electrical/breaker-tripping' },
                { name: 'safe campground voltage', href: '/rv/electrical/campground-voltage' },
                { name: 'RV Battery Drain Overnight', href: '/rv/rv-battery-drain-causes' },
                { name: 'Shore Power Troubleshooting', href: '/rv/electrical/shore-power-troubleshooting' },
                { name: 'EMS vs Basic Surge Protectors', href: '/rv/electrical/ems-vs-surge-protectors' },
                { name: 'RV Electrical Systems Guide', href: '/rv/electrical-systems' },
            ],
            quickRepairToolsIntro: 'Electrical troubleshooting usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test voltage, continuity, and amp draw' },
                { name: 'Best Clamp Meters', href: '/rv-parts/best-clamp-meters', why: 'Measure actual amp draw per circuit' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems', why: 'Monitor voltage, block unsafe power' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });
    app.get('/guides/rv-electrical-troubleshooting', async (_, reply) => {
        return reply.redirect('/rv/electrical/troubleshooting', 301);
    });
    app.get('/guides/rv-electrical-troubleshooting-guide', async (_, reply) => {
        return reply.redirect('/rv/electrical/troubleshooting', 301);
    });

    const breakerTrippingFaqs = [
        { question: 'Why does my RV breaker keep tripping?', answer: 'Overload (too many appliances), short circuit, weak campground pedestal, or bad AC capacitor. Reduce load first; if it still trips, check for shorts or faulty appliances.' },
        { question: 'Can a weak pedestal cause breaker trips?', answer: 'Yes. Low voltage at the pedestal forces appliances to draw more amps. Use an EMS to detect and protect. See <a href="/rv/electrical/campground-voltage">safe campground voltage</a>.' },
        { question: 'Can I run AC and microwave on 30 amp?', answer: 'Often no—that\'s 2,500–3,500W combined. Stagger use or add <a href="/rv/electrical/soft-start">soft-start</a> to AC.' },
        { question: 'Will a surge protector help with breaker trips?', answer: 'An <a href="/rv-parts/best-rv-ems-systems">EMS</a> protects against voltage problems that can cause trips. It won\'t fix overload.' },
    ];
    app.get('/rv/electrical/breaker-tripping', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-breaker-tripping-content.html',
            'https://www.decisiongrid.co/rv/electrical/breaker-tripping',
            'RV Breaker Keeps Tripping: Causes & Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Breaker Keeps Tripping: Causes & Fixes',
            subtitle: 'Overload, short circuit, weak pedestal, bad AC capacitor. Step-by-step diagnosis.',
            metaDescription: 'RV breaker tripping? Overload, short circuit, weak pedestal, bad AC capacitor. Step-by-step diagnosis with RVIA references. When to call a pro.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/breaker-tripping',
            contentPartial: '../guides/rv-breaker-tripping-content.html',
            faqs: breakerTrippingFaqs,
            faqSchemaJson: buildFaqSchema(breakerTrippingFaqs),
            quickRepairToolsIntro: 'Diagnosing breaker trips often requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test voltage and continuity' },
                { name: 'Best Clamp Meters', href: '/rv-parts/best-clamp-meters', why: 'Measure actual amp draw per circuit' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems', why: 'Detect voltage problems that cause trips' },
            ],
            related: [
                { name: 'RV Electrical Systems Guide', href: '/rv/electrical-systems' },
                { name: 'RV Electrical Troubleshooting Master', href: '/rv/electrical/troubleshooting' },
                { name: 'Soft Start Guide', href: '/rv/electrical/soft-start' },
                { name: 'safe campground voltage', href: '/rv/electrical/campground-voltage' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems' },
                { name: 'Best RV Surge Protectors', href: '/rv-parts/best-rv-surge-protectors' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });
    app.get('/guides/rv-breaker-tripping-guide', async (_, reply) => {
        return reply.redirect('/rv/electrical/breaker-tripping', 301);
    });
    app.get('/guides/rv-breaker-keeps-tripping', async (_, reply) => {
        return reply.redirect('/rv/electrical/breaker-tripping', 301);
    });
    // Canonical: /rv/electrical/30-amp-vs-50-amp — authority layout
    const thirtyVsFiftyFaqs = [
        { question: 'Can I plug 30A into 50A?', answer: 'Yes. Use a 30A-to-50A adapter (dogbone). Your 50A RV will be limited to 3,600W—stagger AC, microwave, water heater. Adapters only change plug shape; they don\'t increase power. See <a href="/rv-parts/best-rv-power-adapters">RV power adapters</a>.' },
        { question: 'Can I run AC on 30 amp?', answer: 'Yes. One 13,500 BTU AC typically fits. Avoid running microwave or water heater at the same time. A <a href="/rv/electrical/soft-start">soft-start kit</a> reduces AC surge and makes 30A more forgiving.' },
        { question: 'Can I run two AC units on 30 amp?', answer: 'Usually no, unless using soft-start and careful load management.' },
        { question: 'Is 50 amp more expensive at campgrounds?', answer: 'Sometimes slightly, but not dramatically.' },
        { question: 'Does 50 amp charge batteries faster?', answer: 'Indirectly yes—larger converters are common in 50A rigs.' },
        { question: 'What adapters do I need?', answer: '50A→30A when only 30A pedestals available. 30A→15A for household outlets. See <a href="/rv-parts/best-rv-power-adapters">RV power adapters</a> and <a href="/rv-parts/best-rv-surge-protectors">surge protectors</a>.' },
    ];
    app.get('/rv/electrical/30-amp-vs-50-amp', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/30-amp-vs-50-amp-content.html',
            'https://www.decisiongrid.co/rv/electrical/30-amp-vs-50-amp',
            'RV 30 vs 50 Amp: Complete Power Guide',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV 30 vs 50 Amp: Complete Power Guide',
            subtitle: "What's the Difference — And Which Do You Really Need?",
            metaDescription: "What's the difference between 30 amp and 50 amp RV power? Configuration, wattage, what each can run, plug types, and when upgrading makes sense.",
            canonical: 'https://www.decisiongrid.co/rv/electrical/30-amp-vs-50-amp',
            contentPartial: '../guides/30-amp-vs-50-amp-content.html',
            faqs: thirtyVsFiftyFaqs,
            faqSchemaJson: buildFaqSchema(thirtyVsFiftyFaqs),
            showSafetyDisclaimer: true,
            related: [
                { name: 'RV Electrical Systems Guide', href: '/rv/electrical-systems' },
                { name: 'safe campground voltage', href: '/rv/electrical/campground-voltage' },
                { name: 'EMS vs Basic Surge Protectors', href: '/rv/electrical/ems-vs-surge-protectors' },
                { name: 'Best RV Power Adapters', href: '/rv-parts/best-rv-power-adapters' },
                { name: 'Best RV Surge Protectors', href: '/rv-parts/best-rv-surge-protectors' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems' },
            ],
            quickRepairToolsIntro: 'Load and amp verification usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Verify voltage and amp draw' },
                { name: 'Best RV Power Adapters', href: '/rv-parts/best-rv-power-adapters', why: '30A to 50A adapter when needed' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems', why: 'Monitor voltage under load' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });
    app.get('/rv/30-vs-50-amp-explained', async (_, reply) => {
        return reply.redirect('/rv/electrical/30-amp-vs-50-amp', 301);
    });

    // Canonical: /rv/electrical/rv-surge-protector
    app.get('/rv/electrical/rv-surge-protector', async (_, reply) => {
        return reply.view('rv-surge-protector-guide', {});
    });
    app.get('/guides/rv-surge-protector-guide', async (_, reply) => {
        return reply.redirect('/rv/electrical/rv-surge-protector', 301);
    });

    // Canonical: /rv/electrical/average-campground-voltage-explained
    app.get('/rv/electrical/average-campground-voltage-explained', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/average-campground-voltage-content.html',
            'https://www.decisiongrid.co/rv/electrical/average-campground-voltage-explained',
            'Average Campground Voltage Explained: What to Expect at RV Parks',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'Average Campground Voltage Explained: What to Expect at RV Parks',
            subtitle: '108–132V is safe. Below 108V damages AC and compressors. Typical park voltages, when to worry, EMS protection.',
            metaDescription: 'Average campground voltage explained: what voltage to expect at RV parks, safe range 108–132V, when voltage drops, how to test and protect your rig.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/average-campground-voltage-explained',
            contentPartial: '../guides/average-campground-voltage-content.html',
            faqs: campgroundVoltageFeederConfig.faqs,
            faqSchemaJson: buildFaqSchema(campgroundVoltageFeederConfig.faqs),
            breadcrumb: { backHref: '/rv/electrical-systems', backLabel: 'Electrical Systems' },
            showSafetyDisclaimer: true,
            related: [
                { name: 'RV Electrical Systems Guide', href: '/rv/electrical-systems' },
                { name: 'What Voltage Damages RV AC', href: '/rv/electrical/what-voltage-damages-rv-ac' },
                { name: 'How to Test Pedestal Voltage', href: '/rv/electrical/how-to-test-pedestal-voltage' },
                { name: 'EMS vs Surge Real-World Scenarios', href: '/rv/electrical/ems-vs-surge-real-world-scenarios' },
                { name: '30 vs 50 Amp', href: '/rv/electrical/30-amp-vs-50-amp' },
                { name: 'EMS vs Basic Surge Protectors', href: '/rv/electrical/ems-vs-surge-protectors' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems' },
            ],
            quickRepairToolsIntro: 'Voltage testing and protection usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test voltage at pedestal and under load' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems', why: 'Monitor voltage, block unsafe power' },
                { name: 'Best RV Surge Protectors', href: '/rv-parts/best-rv-surge-protectors', why: 'Basic surge with voltage display' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });
    app.get('/rv/electrical/campground-voltage', async (_, reply) => {
        return reply.redirect('/rv/electrical/average-campground-voltage-explained', 301);
    });

    const commonRvElectricalFailuresFaqs = [
        { question: 'What is the most common RV electrical failure?', answer: 'Low voltage/brownout (~35%) and loose connections (~25%) are the top categories. Use an EMS to protect against low voltage. Inspect pedestal and cord before connecting.' },
        { question: 'Can low voltage damage my RV?', answer: 'Yes. Sustained below 108V damages AC compressors, converters, and electronics. Use an EMS with low-voltage cutoff. See what voltage damages RV AC.' },
        { question: 'Why does my RV breaker keep tripping?', answer: 'Overload (AC + microwave on 30A), loose connections, or weak pedestal. Reduce load first. See RV breaker tripping and load management checklist.' },
    ];

    const rvWireGaugeLoadFaqs = [
        { question: 'What wire gauge for 30 amp RV?', answer: '10 AWG minimum for 30A shore power cord. 14 AWG = 15A, 12 AWG = 20A. See our wire gauge table and shore power cord guide.' },
        { question: 'Can I use a household extension cord for my RV?', answer: 'No. Household cords are undersized. Use RV-rated cord—10 AWG for 30A. See best RV extension cords and shore power cords.' },
        { question: 'Does wire length affect voltage?', answer: 'Yes. Longer wire = more resistance = voltage drop. At 15A, 50 ft of 14 AWG may drop 3–5V. Use heavier gauge for long runs.' },
    ];

    const howToTestRvOutletFaqs = [
        { question: 'How do I test RV outlet voltage with a multimeter?', answer: 'Set multimeter to AC voltage (V~). Measure hot-to-neutral—expect 108–132V. Test at pedestal before connecting, then at inlet. Test under load when possible.' },
        { question: 'What voltage is safe for my RV?', answer: '108–132 volts. Below 108V damages AC; above 132V fries electronics. See what voltage damages RV AC and how to test pedestal voltage.' },
        { question: 'Do I need a multimeter or is EMS enough?', answer: 'EMS with voltage display is easier for routine checks. Multimeter is essential for diagnosing outlet problems and verifying repairs.' },
    ];

    const wattsAmpsCalculatorFaqs = [
        { question: 'How do I convert watts to amps for RV?', answer: 'Amps = Watts ÷ Volts. At 120V, 1,800W = 15A. Use our calculator. See generator sizing and 30 vs 50 amp for load limits.' },
        { question: 'What size generator for 15,000 BTU AC?', answer: '15A × 120V = 1,800W running. Startup surge ~2× = 3,600W. Minimum 3,500W generator. Use our generator estimator. See best generator for 15K BTU AC.' },
        { question: 'Do I need a multimeter to verify RV electrical load?', answer: 'A multimeter verifies voltage at the pedestal and outlet—essential for diagnosing low voltage and load issues. Use our calculator to plan; use a multimeter to verify. See how to test RV outlet with multimeter.' },
        { question: 'Does this calculator replace an electrician?', answer: 'No. This tool assists estimation for planning. Actual wiring and installation require a licensed electrician or RV technician.' },
    ];

    const loadManagementChecklistFaqs = [
        { question: 'Can I run AC and microwave on 30 amp?', answer: 'Often no—that\'s 2,500–3,500W combined. Stagger use or add soft-start to AC. See load management checklist and 30 vs 50 amp guide.' },
        { question: 'What is 30 amp load limit?', answer: '30 amp = 3,600W total. AC alone ~1,500–2,000W running. Stagger AC with microwave and water heater. See our printable checklist.' },
    ];

    const softStartFaqs = [
        { question: 'What does an RV soft start do?', answer: 'Reduces AC compressor startup surge from 2,500–3,500W to ~1,000–1,500W. Lets you run AC on smaller generators and 30 amp.' },
        { question: 'Can I run AC on 30 amp with soft start?', answer: 'Yes. Soft start reduces surge so AC + other loads fit within 3,600W. Still stagger microwave use.' },
        { question: 'Will soft start fix breaker tripping?', answer: 'Often. If trips were from AC surge, yes. If from overload (too many appliances), reduce load too.' },
    ];
    app.get('/rv/electrical/soft-start', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/rv-soft-start-content.html',
            'https://www.decisiongrid.co/rv/electrical/soft-start',
            'RV Soft Start Guide: Run AC on Smaller Generator & 30 Amp',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Soft Start Guide: Run AC on Smaller Generator & 30 Amp',
            subtitle: 'Reduces AC startup surge. Run AC on 30 amp, smaller generator, inverter.',
            metaDescription: 'RV soft start kit: reduces AC startup surge. Run AC on 30 amp, smaller generator, inverter. RVIA, AHAM references.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/soft-start',
            contentPartial: '../guides/unpublished/rv-soft-start-content.html',
            faqs: softStartFaqs,
            faqSchemaJson: buildFaqSchema(softStartFaqs),
            related: [
                { name: 'RV Electrical Systems Guide', href: '/rv/electrical-systems' },
                { name: 'RV Breaker Tripping Guide', href: '/rv/electrical/breaker-tripping' },
                { name: 'Generator Sizing', href: '/rv/electrical/generator-sizing' },
                { name: '30 vs 50 Amp', href: '/rv/electrical/30-amp-vs-50-amp' },
                { name: 'Best RV Generators', href: '/rv-parts/best-rv-generators' },
                { name: 'Best RV Inverters', href: '/rv-parts/best-rv-inverters' },
            ],
            quickRepairToolsIntro: 'Soft start install and verification usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Verify connections and voltage' },
                { name: 'Best RV Surge Protector for AC', href: '/rv/hvac/best-rv-surge-protector-for-ac', why: 'Protect AC after install' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });
    app.get('/guides/rv-soft-start-guide', async (_, reply) => {
        return reply.redirect('/rv/electrical/soft-start', 301);
    });

    // Electrical Calculator: Watts / Amps / Ohms
    app.get('/rv/electrical/watts-amps-ohms-calculator', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/watts-amps-ohms-calculator-content.html',
            'https://www.decisiongrid.co/rv/electrical/watts-amps-ohms-calculator',
            'RV Electrical Load Calculator (Watts, Amps, Ohms & Generator Sizing)',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Electrical Load Calculator (Watts, Amps, Ohms & Generator Sizing)',
            subtitle: 'Convert watts ↔ amps, Ohm\'s Law, generator sizing. Dwell-time booster. Safety-forward.',
            metaDescription: 'RV electrical load calculator: watts to amps, amps to watts, Ohm\'s Law, generator sizing estimator. 30A vs 50A headroom. Size generators for AC. Voltage drop. Safety guidance. No external scripts.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/watts-amps-ohms-calculator',
            contentPartial: '../guides/watts-amps-ohms-calculator-content.html',
            faqs: wattsAmpsCalculatorFaqs,
            faqSchemaJson: buildFaqSchema(wattsAmpsCalculatorFaqs),
            breadcrumb: { backHref: '/rv/electrical-systems', backLabel: 'Electrical Systems' },
            showSafetyDisclaimer: true,
            related: [
                { name: 'Generator Sizing', href: '/rv/electrical/generator-sizing' },
                { name: 'How Many Amps RV AC Uses', href: '/rv/hvac/how-many-amps-does-rv-ac-use' },
                { name: 'Best Generator for 15K BTU AC', href: '/rv/hvac/best-generator-for-15000-btu-rv-ac' },
                { name: 'AC Not Cooling', href: '/rv/hvac/rv-ac-not-cooling' },
                { name: 'RV AC Breaker Tripping', href: '/rv/hvac/rv-ac-breaker-keeps-tripping' },
                { name: 'Best Surge Protector for AC', href: '/rv/hvac/best-rv-surge-protector-for-ac' },
            ],
            quickRepairToolsIntro: 'Load calculation and verification usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Verify voltage under load' },
                { name: 'Best RV Generators', href: '/rv-parts/best-rv-generators', why: 'Compare models for your needs' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems', why: 'Monitor voltage when running on generator' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });

    // Checklist: Load Management
    app.get('/rv/electrical/load-management-checklist', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/load-management-checklist-content.html',
            'https://www.decisiongrid.co/rv/electrical/load-management-checklist',
            'RV Electrical Load Management Checklist',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Electrical Load Management Checklist',
            subtitle: 'Printable checklist. Prevent overload, breaker trips. 30A vs 50A load limits.',
            metaDescription: 'RV electrical load management checklist. Printable. 30 amp vs 50 amp load limits. Stagger AC, microwave, water heater. Prevent breaker trips and voltage damage.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/load-management-checklist',
            contentPartial: '../guides/load-management-checklist-content.html',
            faqs: loadManagementChecklistFaqs,
            faqSchemaJson: buildFaqSchema(loadManagementChecklistFaqs),
            breadcrumb: { backHref: '/rv/electrical-systems', backLabel: 'Electrical Systems' },
            showSafetyDisclaimer: true,
            related: [
                { name: 'AC Emergency Checklist', href: '/rv/hvac/ac-emergency-checklist' },
                { name: 'Seasonal HVAC Checklist', href: '/rv/hvac/seasonal-hvac-checklist' },
                { name: '30 vs 50 Amp', href: '/rv/electrical/30-amp-vs-50-amp' },
                { name: 'Generator Sizing', href: '/rv/electrical/generator-sizing' },
                { name: 'Watts/Amps Calculator', href: '/rv/electrical/watts-amps-ohms-calculator' },
                { name: 'RV Electrical Checklist', href: '/checklists/rv-electrical' },
            ],
            quickRepairToolsIntro: 'Load management and verification usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Verify voltage and amp draw' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems', why: 'Monitor voltage under load' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });

    // Generator Sizing — authority content under /rv/electrical/ (not /rv-parts/)
    const generatorSizingFaqs = [
        { question: 'Will a 2,000W generator run my RV AC?', answer: 'Usually no. A 13,500 BTU AC needs 1,500–2,000W running and 2,500–3,500W surge at startup. A 2,000W generator may trip or fail to start the AC. Plan for at least 3,500W for one AC.' },
        { question: 'How many watts does a 13,500 BTU RV AC need?', answer: 'Typically 1,500–2,000W running and 2,500–3,500W at startup. Check your AC\'s nameplate or manual for exact specs.' },
        { question: 'Is 3,500W enough for a 30A RV?', answer: 'Yes. A 30A rig delivers about 3,600W. A 3,500W generator can run one AC, fridge, lights, and small loads—assuming the surge rating covers AC startup.' },
        { question: 'Do I need more generator at high elevation?', answer: 'Yes. Output drops at altitude. Oversize by 10–15% when camping above 5,000 feet. Thin air reduces engine efficiency.' },
        { question: 'Inverter vs conventional generator for RV?', answer: 'Inverters are quieter and produce cleaner power for electronics. Conventional units deliver more watts for less money but are louder. For AC use, many choose inverter for noise; for heavy loads, conventional can be more economical.' },
        { question: 'Can solar replace a generator?', answer: 'Solar can reduce generator runtime. Use solar for daytime charging and basics; reserve the generator for AC or heavy evening loads. Solar + smaller generator is a common boondocking setup.' },
    ];
    app.get('/rv/electrical/generator-sizing', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/generator-sizing-content.html',
            'https://www.decisiongrid.co/rv/electrical/generator-sizing',
            'What Size Generator Do You Need for an RV?',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'What Size Generator Do You Need for an RV?',
            subtitle: 'Running vs starting watts, 30A vs 50A differences, and how to size for your AC and appliances.',
            metaDescription: 'RV generator sizing: running vs surge watts, 30A vs 50A, AC wattage needs. Size for your heaviest load—usually the AC.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/generator-sizing',
            contentPartial: '../guides/generator-sizing-content.html',
            faqs: generatorSizingFaqs,
            faqSchemaJson: buildFaqSchema(generatorSizingFaqs),
            breadcrumb: { backHref: '/rv/electrical-systems', backLabel: 'Electrical Systems' },
            showSafetyDisclaimer: true,
            related: [
                { name: 'Best RV Generators', href: '/rv-parts/best-rv-generators' },
                { name: 'safe campground voltage', href: '/rv/electrical/campground-voltage' },
                { name: 'RV Electrical Systems Guide', href: '/rv/electrical-systems' },
                { name: '30 vs 50 Amp Explained', href: '/rv/electrical/30-amp-vs-50-amp' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems' },
            ],
            quickRepairToolsIntro: 'Generator sizing and load verification usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Verify voltage under load' },
                { name: 'Best RV Generators', href: '/rv-parts/best-rv-generators', why: 'Compare models for your AC size' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems', why: 'Monitor voltage when running on generator' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });

    // Week 1 feeders — authority template, heavy links to campground-voltage + electrical-systems
    const whatVoltageDamagesAcFaqs = [
        { question: 'What voltage damages RV air conditioners?', answer: 'Sustained voltage below 108V damages RV AC compressors. The motor draws more amps, overheats, and insulation breaks down. See <a href="/rv/electrical/campground-voltage">safe campground voltage</a> and <a href="/rv/electrical-systems">electrical systems guide</a>.' },
        { question: 'Is 105V safe for my RV AC?', answer: 'No. 105V is below the safe range. Shut off AC and high-draw appliances until voltage recovers above 108V. See <a href="/rv/electrical/campground-voltage">safe campground voltage</a>.' },
        { question: 'Will an EMS protect my AC from low voltage?', answer: 'Yes. An EMS cuts power when voltage drops below 108V, protecting the compressor. If your <a href="/rv/hvac/rv-ac-not-blowing-cold">RV AC not blowing cold</a>, low voltage may be the cause. See <a href="/rv/electrical/ems-vs-surge-protectors">EMS vs surge</a> and <a href="/rv/electrical-systems">electrical systems</a>.' },
    ];
    // Alternate slugs → canonical (301)
    app.get('/rv/electrical/what-voltage-damages-rv-air-conditioner', async (_, reply) => {
        return reply.redirect('/rv/electrical/what-voltage-damages-rv-ac', 301);
    });
    app.get('/rv/electrical/test-campground-pedestal-voltage', async (_, reply) => {
        return reply.redirect('/rv/electrical/how-to-test-pedestal-voltage', 301);
    });

    app.get('/rv/electrical/what-voltage-damages-rv-ac', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/soon-to-be-published/what-voltage-damages-rv-ac-content.html',
            'https://www.decisiongrid.co/rv/electrical/what-voltage-damages-rv-ac',
            'What Voltage Damages RV Air Conditioners?',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'What Voltage Damages RV Air Conditioners?',
            subtitle: 'Below 108V damages compressors. How low voltage burns out AC and how to protect your rig.',
            metaDescription: 'What voltage damages RV air conditioners? Below 108V damages compressors. How low voltage burns out AC, EMS protection, safe campground voltage.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/what-voltage-damages-rv-ac',
            contentPartial: '../guides/unpublished/soon-to-be-published/what-voltage-damages-rv-ac-content.html',
            faqs: whatVoltageDamagesAcFaqs,
            faqSchemaJson: buildFaqSchema(whatVoltageDamagesAcFaqs),
            breadcrumb: { backHref: '/rv/electrical-systems', backLabel: 'Electrical Systems' },
            related: [
                { name: 'safe campground voltage', href: '/rv/electrical/campground-voltage' },
                { name: 'RV Electrical Systems Guide', href: '/rv/electrical-systems' },
                { name: 'How to Test Pedestal Voltage', href: '/rv/electrical/how-to-test-pedestal-voltage' },
                { name: 'EMS vs Surge Real-World', href: '/rv/electrical/ems-vs-surge-real-world-scenarios' },
                { name: 'AC Not Blowing Cold', href: '/rv/hvac/rv-ac-not-blowing-cold' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems' },
            ],
            quickRepairToolsIntro: 'Voltage damage diagnosis usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test voltage at pedestal and under load' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems', why: 'Monitor and protect from low voltage' },
                { name: 'Best RV Surge Protectors', href: '/rv-parts/best-rv-surge-protectors', why: 'Basic surge with voltage display' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });

    const howToTestPedestalFaqs = [
        { question: 'How do I test campground pedestal voltage?', answer: 'Use a surge protector or EMS with voltage display, or a multimeter. Check before plugging in and under load. Safe range is 108–132V. See <a href="/rv/electrical/campground-voltage">normal RV park voltage range</a> and <a href="/rv/electrical-systems">electrical systems</a>.' },
        { question: 'What voltage is safe for my RV?', answer: '108–132 volts. Below 108V damages AC; above 132V fries electronics. See <a href="/rv/electrical/campground-voltage">safe campground voltage</a>.' },
        { question: 'Should I check voltage under load?', answer: 'Yes. Voltage can drop when AC runs. If your <a href="/rv/hvac/rv-ac-not-blowing-cold">AC isn\'t cooling</a>, check voltage under load. See <a href="/rv/electrical/campground-voltage">safe campground voltage</a> and <a href="/rv/electrical-systems">electrical guide</a>.' },
    ];
    app.get('/rv/electrical/how-to-test-pedestal-voltage', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/how-to-test-pedestal-voltage-content.html',
            'https://www.decisiongrid.co/rv/electrical/how-to-test-pedestal-voltage',
            'How to Test Campground Pedestal Voltage (Step-by-Step)',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'How to Test Campground Pedestal Voltage (Step-by-Step)',
            subtitle: 'Check voltage before plugging in and under load. Safe range 108–132V.',
            metaDescription: 'How to test campground pedestal voltage: step-by-step with surge protector, EMS, or multimeter. Safe range 108–132V. Protect your RV from low voltage damage.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/how-to-test-pedestal-voltage',
            contentPartial: '../guides/how-to-test-pedestal-voltage-content.html',
            faqs: howToTestPedestalFaqs,
            faqSchemaJson: buildFaqSchema(howToTestPedestalFaqs),
            breadcrumb: { backHref: '/rv/electrical-systems', backLabel: 'Electrical Systems' },
            related: [
                { name: 'safe campground voltage', href: '/rv/electrical/campground-voltage' },
                { name: 'RV Electrical Systems Guide', href: '/rv/electrical-systems' },
                { name: 'What Voltage Damages RV AC', href: '/rv/electrical/what-voltage-damages-rv-ac' },
                { name: 'EMS vs Surge Real-World', href: '/rv/electrical/ems-vs-surge-real-world-scenarios' },
                { name: 'EMS vs Basic Surge Protectors', href: '/rv/electrical/ems-vs-surge-protectors' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems' },
            ],
            quickRepairToolsIntro: 'Pedestal voltage testing usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test voltage at pedestal and under load' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems', why: 'Built-in voltage display and protection' },
                { name: 'Best RV Surge Protectors', href: '/rv-parts/best-rv-surge-protectors', why: 'Basic surge with voltage display' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });

    const emsVsSurgeRealWorldFaqs = [
        { question: 'EMS vs surge protector: when do I need an EMS?', answer: 'When you camp at variable parks, state parks, or full-time. Low voltage is more common than surges. EMS protects against both. See <a href="/rv/electrical/campground-voltage">safe campground voltage</a> and <a href="/rv/electrical-systems">electrical systems</a>.' },
        { question: 'Why does my EMS keep tripping?', answer: 'Voltage is dropping below 108V—often at peak hours. The EMS is protecting you. Reduce load or move sites. See <a href="/rv/electrical/campground-voltage">safe campground voltage</a>.' },
        { question: 'Is a basic surge protector enough?', answer: 'For occasional camping at newer parks, maybe. For full-time or variable parks, EMS is recommended. See <a href="/rv/electrical/campground-voltage">safe campground voltage</a> and <a href="/rv/electrical-systems">electrical guide</a>.' },
    ];
    app.get('/rv/electrical/ems-vs-surge-real-world-scenarios', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/ems-vs-surge-real-world-content.html',
            'https://www.decisiongrid.co/rv/electrical/ems-vs-surge-real-world-scenarios',
            'RV EMS vs Surge Protector: Real-World Scenarios',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV EMS vs Surge Protector: Real-World Scenarios',
            subtitle: 'Peak-hour voltage drops, marginal parks, wiring faults. When each type of protection makes sense.',
            metaDescription: 'RV EMS vs surge protector: real-world scenarios. Peak-hour voltage drops, marginal parks, when EMS pays for itself. Safe campground voltage, electrical systems.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/ems-vs-surge-real-world-scenarios',
            contentPartial: '../guides/ems-vs-surge-real-world-content.html',
            faqs: emsVsSurgeRealWorldFaqs,
            faqSchemaJson: buildFaqSchema(emsVsSurgeRealWorldFaqs),
            breadcrumb: { backHref: '/rv/electrical-systems', backLabel: 'Electrical Systems' },
            related: [
                { name: 'safe campground voltage', href: '/rv/electrical/campground-voltage' },
                { name: 'RV Electrical Systems Guide', href: '/rv/electrical-systems' },
                { name: 'EMS vs Basic Surge Protectors', href: '/rv/electrical/ems-vs-surge-protectors' },
                { name: 'What Voltage Damages RV AC', href: '/rv/electrical/what-voltage-damages-rv-ac' },
                { name: 'How to Test Pedestal Voltage', href: '/rv/electrical/how-to-test-pedestal-voltage' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems' },
            ],
            quickRepairToolsIntro: 'EMS vs surge comparison—these tools help you choose.',
            quickRepairTools: [
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems', why: 'Full voltage monitoring and cutoff' },
                { name: 'Best RV Surge Protectors', href: '/rv-parts/best-rv-surge-protectors', why: 'Basic surge with voltage display' },
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Verify voltage at pedestal' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });

    const batteryDrainFaqs = [
        { question: 'How long should RV batteries last without shore power?', answer: 'Depends on capacity and load. A 100Ah battery may last 1–2 days with moderate use.' },
        { question: 'Will solar stop overnight drain?', answer: 'Solar charges during the day but doesn\'t prevent nighttime consumption.' },
    ];
    app.get('/guides/rv-battery-drains-overnight', async (_, reply) => {
        return reply.redirect('/rv/rv-battery-drain-causes', 301);
    });
    app.get('/rv-battery-drains-overnight', async (_, reply) => {
        return reply.redirect('/rv/rv-battery-drain-causes', 301);
    });
    app.get('/rv/rv-battery-drain-causes', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-battery-drain-causes-content.html',
            'https://www.decisiongrid.co/rv/rv-battery-drain-causes',
            'Why Your RV Battery Drains Overnight (Common Causes & Fixes)',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'Why Your RV Battery Drains Overnight (Common Causes & Fixes)',
            subtitle: "If Your Batteries Die While Parked — Here's What's Really Happening",
            metaDescription: 'RV battery drain causes: parasitic loads, inverter left on, converter failure, bad batteries. How to test, prevent, and fix overnight drain.',
            canonical: 'https://www.decisiongrid.co/rv/rv-battery-drain-causes',
            contentPartial: '../guides/rv-battery-drain-causes-content.html',
            faqs: batteryDrainFaqs,
            faqSchemaJson: buildFaqSchema(batteryDrainFaqs),
            related: [
                { name: 'RV Electrical Systems Guide', href: '/rv/electrical-systems' },
                { name: 'Best RV Battery Monitor Systems', href: '/guides/best-rv-battery-monitor-systems' },
                { name: 'Best RV Lithium Batteries', href: '/rv-parts/best-rv-lithium-batteries' },
                { name: 'How to Upgrade to Lithium Batteries', href: '/guides/how-to-upgrade-to-lithium-batteries-in-rv' },
                { name: 'Best RV Battery Chargers', href: '/rv-parts/best-rv-battery-chargers' },
                { name: 'Best RV Solar Panels', href: '/rv-parts/best-rv-solar-panels' },
            ],
            quickRepairToolsIntro: 'Battery drain diagnosis usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test 12V, parasitic draw, and charging' },
                { name: 'Best RV Battery Monitors', href: '/rv-parts/best-rv-battery-monitors', why: 'Track state of charge and drain' },
                { name: 'Best RV Battery Chargers', href: '/rv-parts/best-rv-battery-chargers', why: 'Recharge after diagnosing drain' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });

    // RV Inverter Troubleshooting (Tier-1)
    const inverterTroubleshootingFaqs = [
        { question: 'Why does my RV inverter beep and shut off?', answer: 'Usually low battery voltage (below 10.5–11V) or overload. The inverter protects the battery by shutting down. Charge the battery and reduce load. Check the inverter manual for alarm codes.' },
        { question: 'Can a modified sine inverter damage my electronics?', answer: 'Yes. Laptops, medical devices, and some motors can be damaged by modified sine. Use a pure sine inverter for sensitive electronics. See <a href="/rv-parts/best-rv-inverters">best RV inverters</a>.' },
        { question: 'Inverter works but outlets are dead—why?', answer: 'Usually the transfer switch. It selects shore vs inverter power. If stuck or faulty, inverter output won\'t reach outlets. See <a href="/rv/electrical/shore-power-troubleshooting">shore power troubleshooting</a>.' },
    ];
    app.get('/rv/electrical/inverter-troubleshooting', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-inverter-troubleshooting-content.html',
            'https://www.decisiongrid.co/rv/electrical/inverter-troubleshooting',
            'RV Inverter Troubleshooting: No Power, Beeping, Overload',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Inverter Troubleshooting: No Power, Beeping, Overload',
            subtitle: 'Inverter not working? Low battery, overload, or transfer switch. Step-by-step diagnosis.',
            metaDescription: 'RV inverter troubleshooting: no 120V output, alarm beeping, overload. Check battery voltage, fuses, connections. When to replace. Step-by-step diagnosis.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/inverter-troubleshooting',
            contentPartial: '../guides/unpublished/future-publications/rv-inverter-troubleshooting-content.html',
            faqs: inverterTroubleshootingFaqs,
            faqSchemaJson: buildFaqSchema(inverterTroubleshootingFaqs),
            breadcrumb: { backHref: '/rv/electrical-systems', backLabel: 'Electrical Systems' },
            related: [
                { name: 'RV Converter Not Charging', href: '/rv/electrical/converter-not-charging-battery' },
                { name: 'RV Inverter Wiring Guide', href: '/rv/rv-inverter-wiring-guide' },
                { name: 'Shore Power Troubleshooting', href: '/rv/electrical/shore-power-troubleshooting' },
                { name: 'RV Battery Drain Causes', href: '/rv/rv-battery-drain-causes' },
                { name: 'Best RV Inverters', href: '/rv-parts/best-rv-inverters' },
            ],
            quickRepairToolsIntro: 'Inverter diagnosis usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test battery voltage, 12V at inverter, 120V output' },
                { name: 'Best RV Inverters', href: '/rv-parts/best-rv-inverters', why: 'Replacement or upgrade to pure sine' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });

    app.get('/rv/rv-inverter-wiring-guide', async (_, reply) => {
        return reply.view('rv-inverter-wiring-guide', {});
    });

    // Data-driven: Common RV Electrical Failures
    app.get('/rv/electrical/common-rv-electrical-failures', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/common-rv-electrical-failures-content.html',
            'https://www.decisiongrid.co/rv/electrical/common-rv-electrical-failures',
            'Common RV Electrical Failures: Data-Based Breakdown',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'Common RV Electrical Failures: Data-Based Breakdown',
            subtitle: 'Low voltage, surge, loose connections, breaker fatigue. Prevention checklist.',
            metaDescription: 'Common RV electrical failures: low voltage (~35%), loose connections (~25%), breaker fatigue (~20%), surge (~20%). Data-based breakdown. Prevention with EMS, load management.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/common-rv-electrical-failures',
            contentPartial: '../guides/common-rv-electrical-failures-content.html',
            faqs: commonRvElectricalFailuresFaqs,
            faqSchemaJson: buildFaqSchema(commonRvElectricalFailuresFaqs),
            breadcrumb: { backHref: '/rv/electrical-systems', backLabel: 'Electrical Systems' },
            showSafetyDisclaimer: true,
            related: [
                { name: 'EMS vs Surge Protector', href: '/rv/electrical/ems-vs-surge-protectors' },
                { name: 'What Voltage Damages RV AC', href: '/rv/electrical/what-voltage-damages-rv-ac' },
                { name: 'How to Test Pedestal Voltage', href: '/rv/electrical/how-to-test-pedestal-voltage' },
                { name: 'Shore Power Troubleshooting', href: '/rv/electrical/shore-power-troubleshooting' },
                { name: 'Watts/Amps Calculator', href: '/rv/electrical/watts-amps-ohms-calculator' },
                { name: 'How to Test RV Outlet with Multimeter', href: '/rv/electrical/how-to-test-rv-outlet-with-multimeter' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });

    // Data-driven: RV Wire Gauge Load Guide
    app.get('/rv/electrical/rv-wire-gauge-load-guide', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-wire-gauge-load-guide-content.html',
            'https://www.decisiongrid.co/rv/electrical/rv-wire-gauge-load-guide',
            'RV Wire Gauge Load Guide: Ampacity by AWG',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Wire Gauge Load Guide: Ampacity by AWG',
            subtitle: 'Wire gauge vs amp capacity. 10 AWG for 30A. Voltage drop. Extension cord safety.',
            metaDescription: 'RV wire gauge load guide: AWG vs ampacity. 14 AWG = 15A, 12 AWG = 20A, 10 AWG = 30A. Voltage drop, extension cord safety. Links to shore power cords, calculator.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/rv-wire-gauge-load-guide',
            contentPartial: '../guides/rv-wire-gauge-load-guide-content.html',
            faqs: rvWireGaugeLoadFaqs,
            faqSchemaJson: buildFaqSchema(rvWireGaugeLoadFaqs),
            breadcrumb: { backHref: '/rv/electrical-systems', backLabel: 'Electrical Systems' },
            showSafetyDisclaimer: true,
            related: [
                { name: 'Common RV Electrical Failures', href: '/rv/electrical/common-rv-electrical-failures' },
                { name: 'Watts/Amps Calculator', href: '/rv/electrical/watts-amps-ohms-calculator' },
                { name: 'How to Test RV Outlet with Multimeter', href: '/rv/electrical/how-to-test-rv-outlet-with-multimeter' },
                { name: 'Best RV Shore Power Cords', href: '/rv-parts/best-rv-shore-power-cords' },
                { name: 'Best RV Extension Cords', href: '/rv-parts/best-rv-extension-cords' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });

    // RV Generator Won't Start — 12 Core Pages (per docs/12-CORE-PAGES-AUDIT.md)
    const generatorWontStartFaqs = [
        { question: 'Why won\'t my RV generator start?', answer: 'Top causes: stale fuel, low oil (safety shutdown), dead battery. Check fuel first—gas older than 30–60 days causes hard starts. Add fresh fuel, check oil level, charge battery. See <a href="/rv/electrical/rv-generator-wont-start">RV generator won\'t start</a>.' },
        { question: 'Generator cranks but won\'t fire—why?', answer: 'Usually stale fuel or clogged carburetor. Drain old gas, refill with fresh fuel. Carburetor jets clog from varnish when gas sits. Add fuel stabilizer when storing.' },
        { question: 'Generator starts then dies immediately?', answer: 'Low-oil shutdown. Most generators have a sensor that kills the engine if oil is low. Check the dipstick and add oil to the correct level.' },
    ];
    app.get('/rv/electrical/rv-generator-wont-start', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-generator-wont-start-authority-master.html',
            'https://www.decisiongrid.co/rv/electrical/rv-generator-wont-start',
            'RV Generator Won\'t Start: Fuel, Oil & Battery Troubleshooting',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Generator Won\'t Start: Fuel, Oil & Battery Troubleshooting',
            subtitle: 'No crank? No fire? Check fuel, oil, battery. Step-by-step diagnosis.',
            metaDescription: 'RV generator won\'t start? Stale fuel, low oil, dead battery. Step-by-step troubleshooting. Carburetor, spark plug, manual override.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/rv-generator-wont-start',
            contentPartial: '../guides/rv-generator-wont-start-authority-master.html',
            faqs: generatorWontStartFaqs,
            faqSchemaJson: buildFaqSchema(generatorWontStartFaqs),
            breadcrumb: { backHref: '/rv/electrical-systems', backLabel: 'Electrical Systems' },
            showSafetyDisclaimer: true,
            related: [
                { name: 'Generator Runs But No Power', href: '/rv/electrical/generator-starts-but-no-power' },
                { name: 'Generator Sizing', href: '/rv/electrical/generator-sizing' },
                { name: 'Shore Power Troubleshooting', href: '/rv/electrical/shore-power-troubleshooting' },
                { name: 'RV Breaker Keeps Tripping', href: '/rv/electrical/breaker-tripping' },
                { name: 'Best RV Generators', href: '/rv-parts/best-rv-generators' },
            ],
            quickRepairToolsIntro: 'Generator diagnosis usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test battery voltage' },
                { name: 'Best RV Generators', href: '/rv-parts/best-rv-generators', why: 'Replacement if generator has failed' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
            emergencyPage: getEmergencyPreset(`${ELECTRICAL_BASE}/rv/electrical/rv-generator-wont-start`),
        }));
    });

    // RV Generator Starts But No Power — Emergency Funnel
    const generatorStartsNoPowerFaqs = [
        { question: 'Generator runs but no power in RV—why?', answer: 'Usually the transfer switch, RV main breaker, or GFCI. The transfer switch selects shore vs generator. If it\'s stuck or faulty, generator power won\'t reach the panel. Check cord connection, main breaker, and GFCI outlets.' },
        { question: 'What is a transfer switch?', answer: 'It selects between shore power and generator. When you start the generator, it should switch to gen power. A failed relay or stuck contact leaves you without power even though the generator is producing it.' },
        { question: 'Can I test generator output with a multimeter?', answer: 'Yes. Set to AC voltage, measure at the generator receptacle—expect 108–132V. Then test at the RV inlet. See <a href="/rv/electrical/how-to-test-rv-outlet-with-multimeter">how to test RV outlet with multimeter</a>.' },
    ];
    app.get('/rv/electrical/generator-starts-but-no-power', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-generator-starts-but-no-power-content.html',
            'https://www.decisiongrid.co/rv/electrical/generator-starts-but-no-power',
            'RV Generator Starts But No Power: Troubleshooting Guide',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Generator Starts But No Power: Troubleshooting Guide',
            subtitle: 'Generator runs but outlets dead? Transfer switch, breaker, GFCI. Step-by-step diagnosis.',
            metaDescription: 'RV generator runs but no power? Transfer switch, main breaker, GFCI. Step-by-step troubleshooting. Tools and replacement parts.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/generator-starts-but-no-power',
            contentPartial: '../guides/rv-generator-starts-but-no-power-content.html',
            faqs: generatorStartsNoPowerFaqs,
            faqSchemaJson: buildFaqSchema(generatorStartsNoPowerFaqs),
            breadcrumb: { backHref: '/rv/electrical-systems', backLabel: 'Electrical Systems' },
            showSafetyDisclaimer: true,
            related: [
                { name: 'Shore Power Troubleshooting', href: '/rv/electrical/shore-power-troubleshooting' },
                { name: 'Generator Sizing', href: '/rv/electrical/generator-sizing' },
                { name: 'RV Electrical Systems Guide', href: '/rv/electrical-systems' },
                { name: 'How to Test RV Outlet with Multimeter', href: '/rv/electrical/how-to-test-rv-outlet-with-multimeter' },
                { name: 'Best RV Generators', href: '/rv-parts/best-rv-generators' },
                { name: 'Best RV Surge Protectors', href: '/rv-parts/best-rv-surge-protectors' },
            ],
            quickRepairToolsIntro: 'Generator power diagnosis usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test voltage at generator receptacle and RV inlet' },
                { name: 'Best RV Generators', href: '/rv-parts/best-rv-generators', why: 'Replacement if generator has failed' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems', why: 'Verify power quality from generator' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });

    // RV Converter Not Charging Battery — Emergency Funnel
    const converterNotChargingFaqs = [
        { question: 'Why isn\'t my RV battery charging when plugged in?', answer: 'Check the converter breaker first. The converter turns 120V into 12V to charge batteries. If the breaker is on and you still have no charge, the converter may have failed. See <a href="/rv/electrical/shore-power-troubleshooting">shore power troubleshooting</a>.' },
        { question: 'Do I need a special converter for lithium batteries?', answer: 'Yes. Lithium batteries require a lithium-compatible converter. Standard converters use a different charging profile and can damage or undercharge lithium. See <a href="/rv-parts/best-rv-lithium-batteries">best RV lithium batteries</a>.' },
        { question: 'Can a surge damage my converter?', answer: 'Yes. Converters are vulnerable to voltage spikes. Use an EMS or surge protector. See <a href="/rv-parts/best-rv-ems-systems">best RV EMS systems</a>.' },
    ];
    app.get('/rv/electrical/converter-not-charging-battery', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-converter-not-charging-battery-authority-master.html',
            'https://www.decisiongrid.co/rv/electrical/converter-not-charging-battery',
            'RV Converter Not Charging Battery: Causes & Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Converter Not Charging Battery: Causes & Fixes',
            subtitle: 'Plugged in but batteries don\'t charge? Converter breaker, shore power, lithium compatibility.',
            metaDescription: 'RV converter not charging battery? Check breaker, shore power, converter failure. Lithium-compatible converters. Step-by-step troubleshooting.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/converter-not-charging-battery',
            contentPartial: '../guides/rv-converter-not-charging-battery-authority-master.html',
            faqs: converterNotChargingFaqs,
            faqSchemaJson: buildFaqSchema(converterNotChargingFaqs),
            breadcrumb: { backHref: '/rv/electrical-systems', backLabel: 'Electrical Systems' },
            quickRepairToolsIntro: 'Converter and battery diagnosis usually requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test 12V at converter output' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems', why: 'Protect converter from voltage spikes' },
                { name: 'Best RV Battery Chargers', href: '/rv-parts/best-rv-battery-chargers', why: 'External charging if converter fails' },
            ],
            related: [
                { name: 'Shore Power Troubleshooting', href: '/rv/electrical/shore-power-troubleshooting' },
                { name: 'RV Battery Drain Causes', href: '/rv/rv-battery-drain-causes' },
                { name: 'RV Electrical Systems Guide', href: '/rv/electrical-systems' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems' },
                { name: 'Best RV Battery Chargers', href: '/rv-parts/best-rv-battery-chargers' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
            emergencyPage: getEmergencyPreset(`${ELECTRICAL_BASE}/rv/electrical/converter-not-charging-battery`),
        }));
    });

    // RV Microwave Not Working — Flywheel lateral
    const microwaveNotWorkingFaqs = [
        { question: 'Why does my RV microwave have no power?', answer: 'Usually a tripped GFCI or breaker. Reset the GFCI (often in bathroom or kitchen) and the microwave breaker. One GFCI protects downstream outlets.' },
        { question: 'Can I run my microwave and AC on 30 amp?', answer: 'Often no—that\'s 2,500–3,500W combined. Stagger use or add a soft-start to the AC. See <a href="/rv/electrical/load-management-checklist">load management checklist</a>.' },
        { question: 'Why does my microwave run but not heat?', answer: 'The magnetron has likely failed. Replacement is rarely cost-effective—replace the microwave unit.' },
    ];
    app.get('/rv/rv-microwave-not-working', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-microwave-not-working-content.html',
            'https://www.decisiongrid.co/rv/rv-microwave-not-working',
            'RV Microwave Not Working: Breaker, GFCI & Load Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Microwave Not Working: Breaker, GFCI & Load Fixes',
            subtitle: 'No power? Reset GFCI and breaker. Trips when running? Stagger AC and microwave.',
            metaDescription: 'RV microwave not working? Breaker, GFCI, overload. 30 amp load limits. Step-by-step troubleshooting.',
            canonical: 'https://www.decisiongrid.co/rv/rv-microwave-not-working',
            contentPartial: '../guides/unpublished/future-publications/rv-microwave-not-working-content.html',
            faqs: microwaveNotWorkingFaqs,
            faqSchemaJson: buildFaqSchema(microwaveNotWorkingFaqs),
            breadcrumb: { backHref: '/rv/electrical-systems', backLabel: 'Electrical Systems' },
            quickRepairToolsIntro: 'Microwave diagnosis may require these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test outlet voltage' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems', why: 'Protect from voltage issues' },
            ],
            related: [
                { name: 'RV Breaker Keeps Tripping', href: '/rv/electrical/breaker-tripping' },
                { name: 'Shore Power Troubleshooting', href: '/rv/electrical/shore-power-troubleshooting' },
                { name: 'Load Management Checklist', href: '/rv/electrical/load-management-checklist' },
                { name: 'RV Electrical Systems Guide', href: '/rv/electrical-systems' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });

    // RV Refrigerator Not Cooling — Emergency Funnel
    const refrigeratorNotCoolingFaqs = [
        { question: 'Why does my RV fridge work on propane but not electric?', answer: 'The heating element or 120V circuit has failed. Check the converter/breaker, then test the heating element with a multimeter. See <a href="/rv/electrical/shore-power-troubleshooting">shore power troubleshooting</a>.' },
        { question: 'Does my RV fridge need to be level?', answer: 'Yes. RV absorption fridges must be level (±3°) to work. Off-level is one of the most common causes of "fridge not cooling."' },
        { question: 'What causes an RV fridge to run constantly?', answer: 'A failed thermistor (temperature sensor) causes the fridge to run constantly or not at all. Replacement is moderate DIY; cooling unit repair is pro-only.' },
    ];
    app.get('/rv/refrigerator-not-cooling', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-refrigerator-not-cooling-authority-master.html',
            'https://www.decisiongrid.co/rv/refrigerator-not-cooling',
            'RV Refrigerator Not Cooling: Troubleshooting Guide',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Refrigerator Not Cooling: Troubleshooting Guide',
            subtitle: 'Works on propane but not electric? Level, thermistor, heating element. Step-by-step diagnosis.',
            metaDescription: 'RV refrigerator not cooling? Level, heating element, thermistor. Works on propane but not electric? Step-by-step troubleshooting.',
            canonical: 'https://www.decisiongrid.co/rv/refrigerator-not-cooling',
            contentPartial: '../guides/rv-refrigerator-not-cooling-authority-master.html',
            faqs: refrigeratorNotCoolingFaqs,
            faqSchemaJson: buildFaqSchema(refrigeratorNotCoolingFaqs),
            breadcrumb: { backHref: '/rv/electrical-systems', backLabel: 'Electrical Systems' },
            quickRepairToolsIntro: 'RV fridge electrical diagnosis often requires these tools.',
            quickRepairTools: [
                { name: 'Best Multimeter for RV', href: '/rv-parts/best-multimeters-for-rv', why: 'Test heating element and 12V' },
                { name: 'Best RV EMS Systems', href: '/rv-parts/best-rv-ems-systems', why: 'Verify power quality to fridge' },
            ],
            related: [
                { name: 'Shore Power Troubleshooting', href: '/rv/electrical/shore-power-troubleshooting' },
                { name: 'RV Electrical Systems Guide', href: '/rv/electrical-systems' },
                { name: 'RV Water Systems', href: '/rv/water-systems' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
            emergencyPage: getEmergencyPreset(`${ELECTRICAL_BASE}/rv/refrigerator-not-cooling`),
        }));
    });

    // ——— Electrical Cluster: Future Publications (from cluster generator) ———

    // RV Outlets Not Working (Tier-1)
    const outletsNotWorkingFaqs = [
        { question: 'Why do some outlets work and others don\'t?', answer: 'Usually a tripped GFCI. One GFCI protects all outlets wired downstream. Reset the GFCI (usually in bathroom or kitchen) first.' },
        { question: 'Where is the GFCI in my RV?', answer: 'Often in the bathroom or kitchen—the first outlet in the circuit. Look for RESET and TEST buttons.' },
        { question: 'Can I replace an RV outlet myself?', answer: 'Yes, if you\'re comfortable with 120V. Turn off the breaker, verify no power with a tester, then replace. Match the outlet type (standard vs GFCI).' },
    ];
    app.get('/rv/electrical/outlets-not-working', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/rv-outlets-not-working-authority-master.html',
            'https://www.decisiongrid.co/rv/electrical/outlets-not-working',
            'RV Outlets Not Working: GFCI, Breaker & Outlet Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Outlets Not Working: GFCI, Breaker & Outlet Fixes',
            subtitle: 'Some outlets dead? Reset GFCI first. Step-by-step diagnosis.',
            metaDescription: 'RV outlets not working? Reset GFCI, check branch breaker, replace outlet. Step-by-step troubleshooting for dead 120V outlets.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/outlets-not-working',
            contentPartial: '../guides/rv-outlets-not-working-authority-master.html',
            faqs: outletsNotWorkingFaqs,
            faqSchemaJson: buildFaqSchema(outletsNotWorkingFaqs),
            breadcrumb: { backHref: '/rv/electrical-systems', backLabel: 'Electrical Systems' },
            related: [
                { name: 'Shore Power Troubleshooting', href: '/rv/electrical/shore-power-troubleshooting' },
                { name: 'RV Breaker Tripping', href: '/rv/electrical/breaker-tripping' },
                { name: 'RV Ground Fault Problems', href: '/rv/electrical/ground-fault-problems' },
                { name: 'How to Test RV Outlet', href: '/rv/electrical/how-to-test-rv-outlet-with-multimeter' },
                { name: 'Best RV Surge Protectors', href: '/rv-parts/best-rv-surge-protectors' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
            emergencyPage: getEmergencyPreset(`${ELECTRICAL_BASE}/rv/electrical/outlets-not-working`),
        }));
    });

    // Testing RV Breakers (Supporting)
    app.get('/rv/electrical/testing-rv-breakers', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/testing-rv-breakers-content.html',
            'https://www.decisiongrid.co/rv/electrical/testing-rv-breakers',
            'Testing RV Breakers: Voltage, Continuity & When to Replace',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'Testing RV Breakers: Voltage, Continuity & When to Replace',
            subtitle: 'How to test breakers with a multimeter. Voltage, continuity, when to replace.',
            metaDescription: 'How to test RV breakers: voltage at load side, continuity test, when to replace. Step-by-step with multimeter.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/testing-rv-breakers',
            contentPartial: '../guides/unpublished/future-publications/testing-rv-breakers-content.html',
            faqs: [],
            faqSchemaJson: buildFaqSchema([]),
            breadcrumb: { backHref: '/rv/electrical-systems', backLabel: 'Electrical Systems' },
            related: [
                { name: 'RV Breaker Tripping', href: '/rv/electrical/breaker-tripping' },
                { name: 'RV Outlets Not Working', href: '/rv/electrical/outlets-not-working' },
                { name: 'Best Multimeters for RV', href: '/rv-parts/best-multimeters-for-rv' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });

    // RV Ground Fault Problems (Supporting)
    app.get('/rv/electrical/ground-fault-problems', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/unpublished/future-publications/rv-ground-fault-problems-content.html',
            'https://www.decisiongrid.co/rv/electrical/ground-fault-problems',
            'RV Ground Fault Problems: GFCI Tripping & Fixes',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'RV Ground Fault Problems: GFCI Tripping & Fixes',
            subtitle: 'GFCI keeps tripping? Moisture, damaged cord, faulty appliance. Step-by-step diagnosis.',
            metaDescription: 'RV ground fault problems: why GFCI trips, moisture, damaged cords, faulty appliances. Troubleshooting and when to call a pro.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/ground-fault-problems',
            contentPartial: '../guides/unpublished/future-publications/rv-ground-fault-problems-content.html',
            faqs: [],
            faqSchemaJson: buildFaqSchema([]),
            breadcrumb: { backHref: '/rv/electrical-systems', backLabel: 'Electrical Systems' },
            related: [
                { name: 'RV Outlets Not Working', href: '/rv/electrical/outlets-not-working' },
                { name: 'RV Breaker Tripping', href: '/rv/electrical/breaker-tripping' },
                { name: 'Shore Power Troubleshooting', href: '/rv/electrical/shore-power-troubleshooting' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });

    // How to Test RV Outlet with Multimeter
    app.get('/rv/electrical/how-to-test-rv-outlet-with-multimeter', async (request, reply) => {
        const aiSummary = await getAiSummaryForAuthorityGuide(
            '../guides/how-to-test-rv-outlet-with-multimeter-content.html',
            'https://www.decisiongrid.co/rv/electrical/how-to-test-rv-outlet-with-multimeter',
            'How to Test RV Outlet with Multimeter',
            request
        );
        return reply.view('layouts/authority-guide.html', withAuthorityKnowledgeGraph({
            aiSummary,
            title: 'How to Test RV Outlet with Multimeter',
            subtitle: 'Step-by-step. Voltage, polarity, ground. Safe range 108–132V.',
            metaDescription: 'How to test RV outlet with multimeter: step-by-step. AC voltage, hot-neutral, polarity, ground. Safe range 108–132V. Link to calculator and voltage guides.',
            canonical: 'https://www.decisiongrid.co/rv/electrical/how-to-test-rv-outlet-with-multimeter',
            contentPartial: '../guides/how-to-test-rv-outlet-with-multimeter-content.html',
            faqs: howToTestRvOutletFaqs,
            faqSchemaJson: buildFaqSchema(howToTestRvOutletFaqs),
            breadcrumb: { backHref: '/rv/electrical-systems', backLabel: 'Electrical Systems' },
            showSafetyDisclaimer: true,
            related: [
                { name: 'How to Test Pedestal Voltage', href: '/rv/electrical/how-to-test-pedestal-voltage' },
                { name: 'What Voltage Damages RV AC', href: '/rv/electrical/what-voltage-damages-rv-ac' },
                { name: 'Watts/Amps Calculator', href: '/rv/electrical/watts-amps-ohms-calculator' },
                { name: 'Best Surge Protector for AC', href: '/rv/hvac/best-rv-surge-protector-for-ac' },
                { name: 'Shore Power Troubleshooting', href: '/rv/electrical/shore-power-troubleshooting' },
                { name: 'Common RV Electrical Failures', href: '/rv/electrical/common-rv-electrical-failures' },
            ],
            clusterNavLinks: ELECTRICAL_CLUSTER_NAV,
            clusterNavHeadline: 'RV Electrical Troubleshooting Guides',
            serviceCtaType: 'electrician',
        }));
    });
}