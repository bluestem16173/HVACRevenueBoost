/**
 * Conditional diagrams for symptom pages: AC Cycle, Heat Pump, RV
 * Used when symptom context requires system-specific visualization.
 */
import fs from "fs";
import path from "path";

const outDir = path.join(process.cwd(), "public", "images");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const acCycleSvg = `
<svg width="600" height="280" viewBox="0 0 600 280" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="300" y="24" text-anchor="middle" font-size="14" font-weight="bold">AC Cooling Cycle</text>
  <rect x="80" y="50" width="120" height="60" rx="10" fill="#DBEAFE" stroke="#3B82F6"/>
  <text x="140" y="80" text-anchor="middle" font-size="11">Evaporator</text>
  <text x="140" y="98" text-anchor="middle" font-size="9" fill="#6B7280">Absorbs heat</text>
  <rect x="400" y="50" width="120" height="60" rx="10" fill="#FEE2E2" stroke="#EF4444"/>
  <text x="460" y="80" text-anchor="middle" font-size="11">Condenser</text>
  <text x="460" y="98" text-anchor="middle" font-size="9" fill="#6B7280">Releases heat</text>
  <path d="M 200 80 L 380 80" stroke="#6B7280" stroke-width="2" fill="none"/>
  <polygon points="370,75 380,80 370,85" fill="#6B7280"/>
  <path d="M 400 110 L 200 110" stroke="#059669" stroke-width="2" stroke-dasharray="4 4" fill="none"/>
  <polygon points="210,105 200,110 210,115" fill="#059669"/>
  <text x="300" y="135" text-anchor="middle" font-size="10" fill="#6B7280">Refrigerant flow</text>
  <rect x="200" y="170" width="200" height="50" rx="8" fill="#F3F4F6" stroke="#9CA3AF"/>
  <text x="300" y="200" text-anchor="middle" font-size="11">Compressor + Metering</text>
</svg>
`;

const heatPumpSvg = `
<svg width="600" height="280" viewBox="0 0 600 280" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="300" y="24" text-anchor="middle" font-size="14" font-weight="bold">Heat Pump (Reversible)</text>
  <rect x="80" y="50" width="120" height="60" rx="10" fill="#DBEAFE" stroke="#3B82F6"/>
  <text x="140" y="80" text-anchor="middle" font-size="11">Indoor Coil</text>
  <text x="140" y="98" text-anchor="middle" font-size="9" fill="#6B7280">Heat / Cool</text>
  <rect x="400" y="50" width="120" height="60" rx="10" fill="#FEE2E2" stroke="#EF4444"/>
  <text x="460" y="80" text-anchor="middle" font-size="11">Outdoor Coil</text>
  <text x="460" y="98" text-anchor="middle" font-size="9" fill="#6B7280">Reversing valve</text>
  <path d="M 200 80 L 380 80" stroke="#6B7280" stroke-width="2" fill="none"/>
  <polygon points="370,75 380,80 370,85" fill="#6B7280"/>
  <path d="M 400 110 L 200 110" stroke="#059669" stroke-width="2" stroke-dasharray="4 4" fill="none"/>
  <polygon points="210,105 200,110 210,115" fill="#059669"/>
  <rect x="250" y="140" width="100" height="40" rx="8" fill="#FEF3C7" stroke="#F59E0B"/>
  <text x="300" y="165" text-anchor="middle" font-size="10" font-weight="bold">Reversing</text>
  <text x="300" y="178" text-anchor="middle" font-size="9">Valve</text>
  <rect x="200" y="200" width="200" height="50" rx="8" fill="#F3F4F6" stroke="#9CA3AF"/>
  <text x="300" y="230" text-anchor="middle" font-size="11">Cool ↔ Heat mode switch</text>
</svg>
`;

const rvSvg = `
<svg width="600" height="280" viewBox="0 0 600 280" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  <text x="300" y="24" text-anchor="middle" font-size="14" font-weight="bold">RV AC System</text>
  <rect x="100" y="50" width="140" height="70" rx="10" fill="#DBEAFE" stroke="#3B82F6"/>
  <text x="170" y="85" text-anchor="middle" font-size="11">Roof Unit</text>
  <text x="170" y="105" text-anchor="middle" font-size="9" fill="#6B7280">Condenser + Evap</text>
  <rect x="360" y="50" width="140" height="70" rx="10" fill="#F3F4F6" stroke="#9CA3AF"/>
  <text x="430" y="85" text-anchor="middle" font-size="11">Thermostat</text>
  <text x="430" y="105" text-anchor="middle" font-size="9" fill="#6B7280">12V / 120V</text>
  <path d="M 240 85 L 350 85" stroke="#6B7280" stroke-width="2" fill="none"/>
  <polygon points="340,80 350,85 340,90" fill="#6B7280"/>
  <rect x="180" y="150" width="240" height="50" rx="8" fill="#FEF3C7" stroke="#F59E0B"/>
  <text x="300" y="178" text-anchor="middle" font-size="11">Compact roof-mount design</text>
  <text x="300" y="195" text-anchor="middle" font-size="9" fill="#6B7280">Limited ductwork</text>
</svg>
`;

fs.writeFileSync(path.join(outDir, "ac-cycle-diagram.svg"), acCycleSvg.trim());
fs.writeFileSync(path.join(outDir, "heat-pump-diagram.svg"), heatPumpSvg.trim());
fs.writeFileSync(path.join(outDir, "rv-ac-diagram.svg"), rvSvg.trim());

console.log("✅ Conditional diagrams generated:", outDir);
