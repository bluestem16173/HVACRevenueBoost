import React from 'react';
import Link from 'next/link';

export default function AcNotCoolingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <nav className="text-sm text-gray-500 mb-8 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Link href="/" className="hover:text-hvac-blue transition-colors">Home</Link>
          <span className="text-slate-300">/</span>
          <Link href="/hvac" className="hover:text-hvac-blue transition-colors">HVAC Guides</Link>
          <span className="text-slate-300">/</span>
          <span className="text-gray-900 dark:text-white font-medium">AC Not Cooling</span>
        </nav>
        
        <section className="mb-12">
          <div className="inline-block bg-hvac-blue/10 text-hvac-blue text-xs font-black px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
            Diagnostic Guide
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-hvac-navy dark:text-white leading-tight">
            AC Running But Not Cooling
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
            Field-style read on why the equipment runs without delivering cooling, how to separate failure paths, and
            where homeowner checks end.
          </p>
        </section>

        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none 
            prose-headings:text-hvac-navy dark:prose-headings:text-white 
            prose-h2:border-b prose-h2:pb-3 prose-h2:mt-12 prose-h2:border-slate-200 dark:prose-h2:border-slate-800
            prose-a:text-hvac-blue hover:prose-a:text-blue-700
            prose-strong:text-hvac-navy dark:prose-strong:text-white
            prose-ul:list-disc prose-ol:list-decimal
            prose-table:border prose-table:border-slate-200 dark:prose-table:border-slate-800
            prose-th:bg-slate-50 dark:prose-th:bg-slate-800/50 prose-th:p-4
            prose-td:p-4 prose-td:border-t prose-td:border-slate-200 dark:prose-td:border-slate-800">
          
          <h2 id="hero-overview">Problem overview</h2>
          <p>
            An AC that runs without cooling is not a random failure. It usually points to a predictable breakdown in
            airflow, refrigerant balance, electrical control, or compressor operation. If misread, a minor performance
            issue can escalate into coil freeze-up, compressor strain, or major system damage.
          </p>
          <ul>
            <li>
              <strong>Airflow Restriction:</strong> Reduced heat transfer across the coil, elevated freeze risk, and
              added compressor load when the system keeps running against a blocked or weak air path.
            </li>
            <li>
              <strong>Refrigerant Issue:</strong> Low cooling capacity, unstable pressures, and compressor exposure when
              charge stays wrong while the unit is commanded to cool.
            </li>
            <li>
              <strong>Mechanical/Electrical Failure:</strong> Startup failure, fan or compressor interruption, and
              hard-stop conditions where one stage of the outdoor or indoor assembly is no longer doing its job under
              load.
            </li>
            <li>
              <strong>Thermostat Problem:</strong> Incorrect call for cooling, false system behavior, or a control-side
              fault that makes the equipment look broken when the stat mode, setpoint, or sensor input is wrong for a
              cooling demand.
            </li>
          </ul>

          <div className="my-10 bg-slate-50 dark:bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h2 id="decision-tree" className="!mt-0 !border-0 text-2xl font-bold">Quick decision tree</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Use vent airflow and outdoor activity to split the problem into airflow versus charge versus
              compressor-side failure—then verify power and controls before you assume a dead system.
            </p>
            <ol className="space-y-4 font-medium" type="A">
              <li><strong>Is there air blowing from the vents?</strong>
                <ul className="mt-2 font-normal text-slate-600 dark:text-slate-400">
                  <li>
                    <em>Yes, but it&apos;s warm:</em> This pattern typically points to refrigerant loss, condenser
                    rejection problems, or compressor-side failure—not a thermostat comfort tweak.
                  </li>
                  <li>
                    <em>No, or very weakly:</em> This pattern usually indicates airflow restriction, indoor blower
                    failure, or a frozen evaporator coil starving the duct system.
                  </li>
                </ul>
              </li>
              <li className="pt-2"><strong>Is the outside unit (condenser) running?</strong>
                <ul className="mt-2 font-normal text-slate-600 dark:text-slate-400">
                  <li>
                    <em>Yes:</em> Fan rotation alone does not prove cooling. Confirm compressor operation and stable
                    pressures; a running fan with a dead or weak compressor still presents as warm supply air.
                  </li>
                  <li>
                    <em>No:</em> Start at the breaker, disconnect, and control-side faults before you assume full
                    equipment failure—the unit is often electrically dead before it is mechanically destroyed.
                  </li>
                </ul>
              </li>
            </ol>
          </div>

          <h2 id="system-explanation">How the system works</h2>
          <p>
            Air conditioners do not create cold air; they move heat. The indoor coil and blower pull heat off the
            return air stream; the compressor and outdoor coil reject that heat outside. When airflow drops, refrigerant
            charge is wrong, or electrical components fail under load, the system can continue running while cooling
            performance collapses—often with normal-looking fans and a quiet homeowner assumption that “it’s still on.”
            That is why &quot;running but not cooling&quot; has to be isolated by failure path, not guesswork.
          </p>

          <h2 id="top-causes">Top causes</h2>
          <ol className="space-y-3 pl-6">
            <li>
              <strong>Dirty Air Filter:</strong> A loaded filter chokes return air. Ignore it and you starve the coil of
              heat transfer, invite evaporator freeze, and run the compressor into a low-airflow, high-stress condition.
            </li>
            <li>
              <strong>Incorrect Thermostat Settings:</strong> Fan-only operation or a heat call when you expect cooling
              keeps equipment active without real refrigeration work—wasting runtime while the house drifts warm.
            </li>
            <li>
              <strong>Blocked Outdoor Condenser:</strong> Packed fins and debris kill heat rejection. The system keeps
              commanding cooling; head pressure climbs until safeties trip or internal damage accelerates.
            </li>
            <li>
              <strong>Failed Capacitor:</strong> A weak start cap leaves the fan spinning while the compressor never
              reliably comes under load—a partial-operation trap that reads “outside unit is on” with warm supply air.
              Repeated failed starts add mechanical and electrical stress.
            </li>
            <li>
              <strong>Low Refrigerant (Leak):</strong> Charge does not “disappear” without a breach. Running chronically
              low reduces capacity, throws off pressures, and invites compressor damage when liquid floodback or
              overheating follows ignored leaks.
            </li>
            <li>
              <strong>Frozen Evaporator Coil:</strong> Ice insulates the coil from the airstream. Keep running and you
              compound flood risk, blower strain, and eventual water damage while cooling stays at zero.
            </li>
          </ol>

          <p className="text-slate-600 dark:text-slate-400 mt-6 mb-2">
            These are typical repair paths based on common symptom patterns. Delay, misdiagnosis, or continued operation
            under fault can push the final cost significantly higher than the bands shown.
          </p>
          <div className="overflow-x-auto mt-8 mb-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th>Symptom pattern</th>
                  <th>Common fix</th>
                  <th>Cost band (USD)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>No airflow from vents, AC running</td>
                  <td>Replace air filter, thaw coils</td>
                  <td className="font-mono text-sm">$10 - $25</td>
                </tr>
                <tr>
                  <td>Warm air, outdoor fan running but no compressor hum</td>
                  <td>
                    Replace dual run capacitor (address soon—repeated failed starts increase compressor and control
                    damage risk)
                  </td>
                  <td className="font-mono text-sm">$150 - $350</td>
                </tr>
                <tr>
                  <td>Warm air, frost on refrigerant lines</td>
                  <td>
                    Leak search, repair leak source, then recharge (recharging without fixing the leak escalates cost
                    and repeats the failure)
                  </td>
                  <td className="font-mono text-sm">$400 - $1,200+</td>
                </tr>
                <tr>
                  <td>Outside unit not turning on at all</td>
                  <td>Reset breaker / check disconnect box</td>
                  <td className="font-mono text-sm">$0 - $150</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-slate-500 italic mt-2">
            Note: Dollar ranges are directional benchmarks, not quotes. Final invoices swing with access, parts
            availability, refrigerant type, and how long the system was run while faulted.
          </p>

          <h3>Replace vs repair</h3>
          <p>
            Repair usually stays on the table for filter-related airflow fixes, thermostat mistakes, isolated condenser
            cleaning, contactor or capacitor replacement performed by a licensed tech, and other contained electrical
            or airflow corrections. Replacement becomes the stronger play when the compressor is failing, major
            refrigerant leaks keep returning, R-22 economics make recharge irrational, equipment age is high, or a
            single repair approaches roughly half the installed cost of a new system. In hot, high-demand climates,
            delaying a replacement decision on a failing system often turns a manageable repair into repeated breakdown
            expense.
          </p>

          <h3 className="bg-slate-100 dark:bg-slate-800 inline-block px-4 py-2 rounded-lg text-lg border border-slate-200 dark:border-slate-700">
            Capacitor and electrical-start components
          </h3>
          <p>
            Capacitor and other electrical-start components are not recommended DIY repairs. Even with power
            disconnected, stored electrical charge and miswiring risk can cause equipment damage, electrical shock, or
            dangerous misdiagnosis. If the symptom pattern points to capacitor, contactor, or compressor-start failure,
            this is typically where homeowner troubleshooting stops.
          </p>

          <div className="my-8 p-6 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 rounded-r-xl">
            <div className="flex items-start gap-4">
              <span className="text-2xl mt-1">🔧</span>
              <div>
                <strong className="block text-amber-900 dark:text-amber-500 mb-1">Field Insight</strong>
                <p className="m-0 text-amber-800 dark:text-amber-200 leading-relaxed text-base">
                  Homeowners often assume that if the outdoor fan runs, the system is functioning. In reality, partial
                  operation is common. A unit can spin the fan, circulate air, and still fail to cool because the
                  compressor is not starting, refrigerant pressure is unstable, or airflow has already pushed the coil
                  into freeze conditions. In the field, continued operation under low airflow or low charge is how minor
                  complaints turn into compressor failures.
                </p>
              </div>
            </div>
          </div>

          <h3>Preventative maintenance</h3>
          <p>
            Routine maintenance is less about comfort and more about preventing escalation. Dirty filters, blocked coils,
            and ignored airflow issues are how small performance losses become frozen coils, high head pressure, and
            premature component failure.
          </p>
          <ul>
            <li>Change your 1-inch air filters every 30-90 days during cooling season.</li>
            <li>Keep the outdoor condenser unit clear of debris (at least 2 feet of clearance on all sides).</li>
            <li>Gently wash the outdoor coils with a garden hose once a year (do not use a pressure washer).</li>
            <li>Schedule an annual professional tune-up before the heat of summer.</li>
          </ul>

          <div className="not-prose bg-hvac-blue/5 border border-hvac-blue/20 rounded-2xl p-8 my-12 text-center shadow-sm">
            <h3 className="!mt-0 text-2xl font-bold text-hvac-navy dark:text-white mb-2">Avoid a $2000 repair bill</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-lg mx-auto">
              Running an AC that is no longer cooling properly can turn a small airflow or charge issue into compressor
              damage. If the system is still running but performance has dropped, early diagnosis is usually the cheapest
              point of intervention. If cooling performance has dropped and basic checks did not resolve it, continued
              operation can make the failure more expensive—get the system diagnosed before a minor fault becomes a
              major repair.
            </p>
            <Link
              href="/request-service"
              className="inline-block max-w-xl mx-auto bg-hvac-navy hover:bg-hvac-navy/90 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 text-base leading-snug no-underline"
            >
              Call for immediate AC repair/Get Same Day Service
            </Link>
          </div>

          <h2 id="final-cta">When to stop DIY</h2>
          <p>
            If you have already checked the filter, thermostat settings, and breakers, and the system still is not
            cooling correctly, <strong>Stop.</strong> Refrigerant problems, capacitor and start failures, compressor
            faults, and repeated freeze-ups are no longer basic DIY checks. Continuing to run the equipment or opening
            sealed refrigeration and high-voltage enclosures drives system damage, voids manufacturer warranties where
            unqualified work is involved, creates electrical injury and refrigerant exposure hazards, and under the
            wrong conditions can lead to serious injury or death. At that point, professional diagnosis is not
            optional—it is the safe next step.
          </p>

        </div>
      </div>
    </div>
  );
}
