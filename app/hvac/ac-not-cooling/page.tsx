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
            <strong>AC running but not cooling</strong> is not a random failure. It points to a predictable breakdown in
            airflow, refrigerant balance, electrical control, or compressor operation. Misread the symptom and a minor
            airflow or control issue becomes system strain, compressor overload, coil damage, and full-system loss.
            Refrigerant is not consumed in normal operation—low charge equals a leak—and running in this condition forces
            the compressor outside its design limits. This means you treat the call as a diagnostic sort, not a comfort
            tweak.
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
            Classify the fault before you spend money. Each pattern below is what it is, what it does to operation, and
            what it costs if the system keeps running under it. At this point, you are mapping minor complaints to
            system strain, compressor stress, system damage, and high-cost failure—because that is the real ladder when
            cooling collapses under load.
          </p>
          <ul>
            <li>
              <strong>Airflow Restriction:</strong> The return path is choked—dirty filter, failed blower, collapsed
              duct, or blocked coil face. That kills heat transfer at the evaporator, drives coil ice, then compressor
              stress as airflow collapses. If this continues, you convert a maintenance item into flood risk, blower
              overload, and compressor damage.
            </li>
            <li>
              <strong>Refrigerant Issue:</strong> Refrigerant is not consumed in normal operation—low charge equals a
              leak. Wrong charge starves capacity, creates pressure imbalance, and forces the compressor outside its
              design limits while the stat still demands cooling. Running in this condition forces the compressor
              outside those limits under sustained demand. If this continues, running low damages the compressor, then you
              are pricing compressor replacement, not a top-off.
            </li>
            <li>
              <strong>Mechanical/Electrical Failure:</strong> Failed start components, contactors, motors, or
              compressor lockout stop one stage of the assembly from doing work under load. The symptom is warm supply
              air with hardware that still looks &quot;on.&quot; This means partial operation is on the table until
              start behavior is proven. If this continues, control circuit stress and repeated start attempts stack into
              compressor damage and nuisance callbacks.
            </li>
            <li>
              <strong>Thermostat Problem:</strong> Wrong mode, wrong setpoint, bad sensor, or wiring error sends a bad
              call for cooling. The equipment follows a bad command and looks broken. This is where homeowners burn
              runtime while a real charge or airflow fault keeps hammering the compressor. If this continues, you burn
              runtime, miss the real fault, and still leave charge or airflow failures unaddressed.
            </li>
          </ul>

          <div className="my-10 bg-slate-50 dark:bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h2 id="decision-tree" className="!mt-0 !border-0 text-2xl font-bold">Quick decision tree</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Split vent delivery from outdoor assembly behavior: airflow versus charge versus compressor-side. Verify
              power and controls before you call the system dead. At this point, you are sorting symptom patterns into
              one failure bucket so the next move is obvious.
            </p>
            <ol className="space-y-4 font-medium" type="A">
              <li><strong>Is there air blowing from the vents?</strong>
                <ul className="mt-2 font-normal text-slate-600 dark:text-slate-400">
                  <li>
                    <em>Yes, but it&apos;s warm:</em> This pattern indicates refrigerant loss (refrigerant is not
                    consumed—low charge equals leak), condenser rejection failure, or compressor-side failure—not a
                    comfort tweak. This means you move past simple stat checks and treat the pattern as charge,
                    condenser rejection, or compressor-side until a licensed tech disproves it.
                  </li>
                  <li>
                    <em>No, or very weakly:</em> This pattern indicates airflow restriction, indoor blower failure, or a
                    frozen evaporator coil starving the duct system. This is where coil freeze feeds compressor stress
                    if the unit keeps running.
                  </li>
                </ul>
              </li>
              <li className="pt-2"><strong>Is the outside unit (condenser) running?</strong>
                <ul className="mt-2 font-normal text-slate-600 dark:text-slate-400">
                  <li>
                    <em>Yes:</em> This pattern indicates partial outdoor operation: fan motion without reliable
                    compressor work still reads as warm supply air. This means you confirm compressor start and
                    pressures—pressure imbalance from low charge stays on the table until a tech proves otherwise.
                  </li>
                  <li>
                    <em>No:</em> This pattern indicates loss of power or control to the outdoor section before you
                    assume a destroyed compressor. This means you clear breaker, disconnect, and low-voltage control
                    faults first, then reassess compressor start behavior.
                  </li>
                </ul>
              </li>
            </ol>
          </div>

          <h2 id="system-explanation">How the system works</h2>
          <p>
            Air conditioners do not create cold air; they move heat. The indoor coil and blower pull heat off the
            return air stream; the compressor and outdoor coil reject that heat outside. When airflow drops, refrigerant
            charge is wrong (low charge still equals a leak—refrigerant is not consumed in normal operation), or
            electrical components fail under load, the system can continue running while cooling performance
            collapses—often with normal-looking fans and a homeowner reading that as &quot;still on.&quot; Running in
            this condition forces the compressor outside its design limits. That is why this problem must be isolated by
            failure path, not guesswork.
          </p>

          <h2 id="top-causes">Top causes</h2>
          <p>
            These are the usual suspects because each one starts small and ends expensive: minor restriction or control
            error becomes system strain, compressor stress, system damage, and a multi-thousand-dollar failure path when
            the unit keeps running under fault.
          </p>
          <ol className="space-y-3 pl-6">
            <li>
              <strong>Dirty Air Filter:</strong> Cause: loaded filter on the return. Effect: choked airflow, weak heat
              pickup at the coil. If ignored: coil freeze, then compressor stress, then system damage from sustained
              low-airflow operation.
            </li>
            <li>
              <strong>Incorrect Thermostat Settings:</strong> Cause: fan-only call, heat mode, or wrong setpoint.
              Effect: equipment runs without a real cooling demand satisfied. If ignored: wasted runtime, masked charge
              or airflow faults, and a house that still drifts hot while the bill climbs.
            </li>
            <li>
              <strong>Blocked Outdoor Condenser:</strong> Cause: packed fins, debris, or coil blanket. Effect: heat
              cannot reject, head pressure climbs. If ignored: safeties trip, compressor stress rises, and you risk
              accelerated compressor wear from chronic high-head operation.
            </li>
            <li>
              <strong>Failed Capacitor:</strong> Cause: weak or open start cap on the outdoor or indoor motor circuit.
              Effect: fan spins without reliable compressor torque—a partial-operation trap. If ignored: failed starts
              stack compressor stress and control circuit stress until the compressor is damaged.
            </li>
            <li>
              <strong>Low Refrigerant (Leak):</strong> Cause: breach in the sealed system—refrigerant is not consumed,
              so low charge equals leak. Effect: capacity drops, pressures go unstable, running low damages the
              compressor. If ignored: running in this condition forces the compressor outside its design limits until it
              fails.
            </li>
            <li>
              <strong>Frozen Evaporator Coil:</strong> Cause: low airflow or wrong charge ices the coil. Effect: ice
              insulates the coil from the airstream, cooling output goes to zero. If ignored: flood risk, blower
              overload, compressor stress, and water damage while the stat still calls for cooling.
            </li>
          </ol>

          <p>
            Most major AC failures do not start as major problems—they become major because the system continues running
            under fault.
          </p>

          <p className="text-slate-600 dark:text-slate-400 mt-6 mb-2">
            Delay or continued operation under fault increases final cost. The table below shows typical repair paths from
            common symptom patterns—compressor damage risk rises while the system runs faulted, and a leak left unrepaired
            repeats pressure imbalance and stacks repeat service cost. Low charge equals a leak; refrigerant is not
            consumed in normal operation; running in this condition forces the compressor outside its design limits. At
            this point, the invoice stops being about convenience and starts being about equipment survival.
          </p>
          <div className="overflow-x-auto mt-8 mb-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th>Symptom pattern</th>
                  <th>Common fix</th>
                  <th>Typical cost (USD)</th>
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
                    Replace dual run capacitor (address soon—repeated failed starts increase compressor stress and
                    control circuit stress)
                  </td>
                  <td className="font-mono text-sm">$150 - $350</td>
                </tr>
                <tr>
                  <td>Warm air, frost on refrigerant lines</td>
                  <td>
                    Leak search, repair leak source, then recharge—refrigerant is not consumed in normal operation, so
                    low charge still equals leak; recharging without sealing the leak escalates cost, repeats pressure
                    imbalance, and forces the compressor outside its design limits
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
            Repair stays on the table for minor components and contained faults: filter and airflow corrections,
            thermostat mistakes, isolated condenser cleaning, contactor or capacitor replacement by a licensed tech,
            and other bounded electrical or airflow work. Replace when the compressor is failing, refrigerant leaks keep
            returning, R-22 economics make recharge irrational, equipment age is high, or a single repair approaches
            roughly half the installed cost of a new system. In high-demand climates, delaying replacement on a failing
            system increases total lifecycle cost. What starts as a minor repair can become a multi-thousand-dollar
            failure when the system continues running under fault—running in this condition forces the compressor
            outside its design limits until the math breaks. At that point, you price total ownership, not one ticket.
          </p>

          <h3 className="bg-slate-100 dark:bg-slate-800 inline-block px-4 py-2 rounded-lg text-lg border border-slate-200 dark:border-slate-700">
            Capacitor and electrical-start components
          </h3>
          <p>
            Capacitor and other electrical-start components carry stored energy, miswiring risk, and misread symptoms.
            Opening the wrong enclosure turns a control fault into electrical hazard and equipment damage. If the
            pattern points to capacitor, contactor, or compressor-start failure, this is where homeowner troubleshooting
            stops. Call a licensed tech—field misreads here buy compressor damage, not savings.
          </p>

          <div className="my-8 p-6 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 rounded-r-xl">
            <div className="flex items-start gap-4">
              <span className="text-2xl mt-1">🔧</span>
              <div>
                <strong className="block text-amber-900 dark:text-amber-500 mb-1">Field Insight</strong>
                <p className="m-0 text-amber-800 dark:text-amber-200 leading-relaxed text-base">
                  Fan running does not equal system working—partial operation is a daily field pattern. The outdoor fan
                  spins, the house still gets warm supply air, and the homeowner reads motion as proof. Underneath,
                  compressor is not starting, pressure imbalance from low charge (low charge equals leak; refrigerant is
                  not consumed) is starving the circuit, or airflow already froze the coil. Running in this condition
                  forces the compressor outside its design limits. This is how minor complaints turn into compressor
                  failures.
                </p>
              </div>
            </div>
          </div>

          <h3>Preventative maintenance</h3>
          <p>
            Maintenance is not a comfort perk—it is load and pressure control. Dirty filters and blocked coils raise
            system load, choke airflow, and push head pressure. This is where small losses become frozen coils,
            compressor stress, and repeat breakdowns. This means you maintain airflow paths and coil cleanliness so the
            compressor never fights the house and the weather at the same time.
          </p>
          <ul>
            <li>Change your 1-inch air filters every 30-90 days during cooling season.</li>
            <li>Keep the outdoor condenser unit clear of debris (at least 2 feet of clearance on all sides).</li>
            <li>Gently wash the outdoor coils with a garden hose once a year (do not use a pressure washer).</li>
            <li>Schedule an annual professional tune-up before the heat of summer.</li>
          </ul>

          <p>
            If airflow, thermostat, and power are confirmed and the system still is not cooling, the fault is no longer
            superficial. Continuing to run the system is what turns a manageable repair into a major failure.
          </p>

          <div className="not-prose bg-hvac-blue/5 border border-hvac-blue/20 rounded-2xl p-8 my-12 text-center shadow-sm">
            <h3 className="!mt-0 text-2xl font-bold text-hvac-navy dark:text-white mb-2">Avoid a $2000 repair bill</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-lg mx-auto">
              What starts as a minor repair can become a multi-thousand-dollar failure when the system continues running
              under fault. If basic checks did not resolve the issue, continued operation will increase damage. Get the
              system evaluated before a minor fault becomes a major repair—running with wrong charge or collapsed airflow
              still forces the compressor outside its design limits, and low charge still equals leak.
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
            cooling correctly, <strong>Stop.</strong> Do not keep running the equipment to &quot;see if it clears.&quot;
            Refrigerant work, start components, compressor faults, and repeated freeze-ups are past homeowner DIY
            scope. Continuing to run the system or opening sealed refrigeration and high-voltage enclosures drives system
            damage, triggers warranty void where unqualified work is involved, creates electrical hazard and injury
            risk, creates refrigerant exposure risk, and under the wrong conditions can lead to serious injury or death.
            Professional diagnosis is not optional—it is the safe next step.
          </p>

        </div>
      </div>
    </div>
  );
}
