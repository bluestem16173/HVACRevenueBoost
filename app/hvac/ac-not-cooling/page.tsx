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
            Step-by-step diagnostic guide to locate the problem when your unit runs without producing cold air.
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
          <p>An AC that runs but fails to cool your home is one of the most common—and frustrating—HVAC issues. It wastes energy, increases your utility bills, and leaves your home uncomfortable. Before calling a professional, understanding the failure modes can save you time and money.</p>
          <ul>
            <li><strong>Airflow Restriction:</strong> The system is struggling to pull in or blow out enough air.</li>
            <li><strong>Refrigerant Issue:</strong> The vital fluid that moves heat is low or leaking.</li>
            <li><strong>Mechanical/Electrical Failure:</strong> A component like a capacitor, compressor, or fan motor has failed.</li>
            <li><strong>Thermostat Problem:</strong> The system isn't getting the right signals to cool.</li>
          </ul>

          <div className="my-10 bg-slate-50 dark:bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h2 id="decision-tree" className="!mt-0 !border-0 text-2xl font-bold">Quick decision tree</h2>
            <p className="text-slate-600 dark:text-slate-400">Follow these quick checks to isolate the most likely cause of your AC not cooling.</p>
            <ol className="space-y-4 font-medium" type="A">
              <li><strong>Is there air blowing from the vents?</strong>
                <ul className="mt-2 font-normal text-slate-600 dark:text-slate-400">
                  <li><em>Yes, but it's warm:</em> Check thermostat settings, outdoor condenser, and refrigerant levels.</li>
                  <li><em>No, or very weakly:</em> Check the air filter, indoor blower motor, and look for frozen evaporator coils.</li>
                </ul>
              </li>
              <li className="pt-2"><strong>Is the outside unit (condenser) running?</strong>
                <ul className="mt-2 font-normal text-slate-600 dark:text-slate-400">
                  <li><em>Yes:</em> The fan is spinning, but listen for the compressor hum. If the compressor isn't running, it could be a bad capacitor.</li>
                  <li><em>No:</em> Check the breaker panel, disconnect switch, and thermostat wiring.</li>
                </ul>
              </li>
            </ol>
          </div>

          <h2 id="system-explanation">How the system works</h2>
          <p>Your air conditioner doesn't "create" cold air; it removes heat from the inside of your home and transfers it outside. The indoor evaporator coil absorbs heat via refrigerant, while the blower fan circulates the cooled air. The heated refrigerant travels to the outdoor condenser unit, where the compressor pressurizes it, and the condenser coil and fan release the heat into the outside air. Any disruption in airflow or refrigerant flow will result in the AC not cooling effectively.</p>

          <h2 id="top-causes">Top causes</h2>
          <ol className="space-y-3 pl-6">
            <li><strong>Dirty Air Filter:</strong> The #1 cause of restricted airflow, leading to frozen coils and poor cooling.</li>
            <li><strong>Incorrect Thermostat Settings:</strong> Set to "Fan ON" instead of "AUTO", or accidentally set to "HEAT".</li>
            <li><strong>Blocked Outdoor Condenser:</strong> Leaves, debris, or dirt smothering the outdoor coil.</li>
            <li><strong>Failed Capacitor:</strong> A small electrical part that gives the compressor the jolt it needs to start.</li>
            <li><strong>Low Refrigerant (Leak):</strong> Refrigerant doesn't just get "used up"; a low charge means there is a leak in the system.</li>
            <li><strong>Frozen Evaporator Coil:</strong> Caused by low airflow or low refrigerant, preventing heat absorption.</li>
          </ol>

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
                  <td>Replace dual run capacitor</td>
                  <td className="font-mono text-sm">$150 - $350</td>
                </tr>
                <tr>
                  <td>Warm air, frost on refrigerant lines</td>
                  <td>Leak search and refrigerant recharge</td>
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
          <p className="text-sm text-slate-500 italic mt-2">Note: Prices are estimates based on national averages and can vary.</p>

          <h3>Replace vs repair</h3>
          <p>Consider replacing the entire system if it is older than 10-15 years, requires expensive refrigerant (like R-22) that is phased out, or if the repair cost (like a failed compressor) exceeds 50% of the cost of a new system. If the fix is a simple capacitor, contactor, or filter, always opt for repair.</p>

          <h3 className="bg-slate-100 dark:bg-slate-800 inline-block px-4 py-2 rounded-lg text-lg border border-slate-200 dark:border-slate-700">Bench procedure: Capacitor Replacement</h3>
          <p>If you have identified a failed capacitor (often bulging at the top) and are comfortable working with high voltage, here is the general procedure.</p>
          <ul className="space-y-2">
            <li>Turn off power at the breaker panel <strong>AND</strong> pull the outdoor disconnect at the unit.</li>
            <li>Verify zero voltage with a multimeter.</li>
            <li>Short the capacitor terminals with an insulated screwdriver to discharge stored energy.</li>
            <li>Note the wiring arrangement (take a picture).</li>
            <li>Remove the old capacitor and install the new one with matching MFD and Voltage ratings.</li>
            <li>Reconnect the wires and restore power.</li>
          </ul>
          
          <div className="my-8 p-6 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 rounded-r-xl">
            <div className="flex items-start gap-4">
              <span className="text-2xl mt-1">🔧</span>
              <div>
                <strong className="block text-amber-900 dark:text-amber-500 mb-1">Field Insight</strong>
                <p className="m-0 text-amber-800 dark:text-amber-200 leading-relaxed text-base">Never assume the power is off just because the thermostat is off. The outdoor disconnect must be pulled, and always test with a meter. Capacitors can hold a lethal charge even when power is removed.</p>
              </div>
            </div>
          </div>

          <h3>Preventative maintenance</h3>
          <ul>
            <li>Change your 1-inch air filters every 30-90 days during cooling season.</li>
            <li>Keep the outdoor condenser unit clear of debris (at least 2 feet of clearance on all sides).</li>
            <li>Gently wash the outdoor coils with a garden hose once a year (do not use a pressure washer).</li>
            <li>Schedule an annual professional tune-up before the heat of summer.</li>
          </ul>

          <div className="bg-hvac-blue/5 border border-hvac-blue/20 rounded-2xl p-8 my-12 text-center shadow-sm">
            <h3 className="!mt-0 text-2xl font-bold text-hvac-navy dark:text-white mb-2">Still blowing warm air?</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-lg mx-auto">Give your AC a break and let an expert find the leak. Avoid further damage to your compressor by getting a professional diagnostic.</p>
            <Link href="#local-professionals-cta" className="inline-block bg-hvac-blue hover:bg-hvac-blue/90 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              Find HVAC Professionals Near Me
            </Link>
          </div>

          <h2 id="final-cta">When to stop DIY</h2>
          <p>If you've checked the filter, verified the thermostat settings, and confirmed the breakers are on, it's usually time to call a pro. Do not attempt to add refrigerant yourself or tamper with the sealed refrigeration circuit, as this requires specialized tools and EPA certifications. If you suspect a refrigerant leak or compressor failure, stop the DIY and seek professional help.</p>

        </div>
      </div>
    </div>
  );
}
