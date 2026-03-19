/**
 * HVAC Physical System Diagram — Thermostat → Indoor/Outdoor → Ductwork
 * Used by SystemOverviewBlock for trust-building, SEO, and diagnostic context.
 * Layout: Thermostat | Indoor Unit (Furnace + Coil) | Outdoor Unit (Condenser) | Ductwork
 */
import fs from "fs";
import path from "path";

const svg = `
<svg width="800" height="520" viewBox="0 0 800 520" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  
  <!-- Thermostat (top center) -->
  <rect x="340" y="20" width="120" height="50" rx="8" fill="#F3F4F6" stroke="#9CA3AF" stroke-width="2"/>
  <text x="400" y="50" text-anchor="middle" font-size="12" font-weight="bold">Thermostat</text>
  <text x="400" y="65" text-anchor="middle" font-size="10" fill="#6B7280">Signals system on/off</text>
  
  <!-- Down arrow from thermostat -->
  <line x1="400" y1="70" x2="400" y2="100" stroke="#9CA3AF" stroke-width="2"/>
  <polygon points="400,95 395,85 405,85" fill="#9CA3AF"/>
  
  <!-- Split to Indoor | Outdoor -->
  <line x1="400" y1="100" x2="250" y2="140" stroke="#9CA3AF" stroke-width="2"/>
  <line x1="400" y1="100" x2="550" y2="140" stroke="#9CA3AF" stroke-width="2"/>
  
  <!-- Indoor Unit (Furnace + Evaporator Coil) - left -->
  <rect x="120" y="150" width="260" height="100" rx="10" fill="#DBEAFE" stroke="#3B82F6" stroke-width="2"/>
  <text x="250" y="180" text-anchor="middle" font-size="13" font-weight="bold">Indoor Unit</text>
  <text x="250" y="200" text-anchor="middle" font-size="11">Furnace / Air Handler</text>
  <text x="250" y="220" text-anchor="middle" font-size="10" fill="#1D4ED8">Evaporator Coil</text>
  <text x="250" y="238" text-anchor="middle" font-size="9" fill="#6B7280">Heats or cools air via blower</text>
  
  <!-- Outdoor Unit (Condenser) - right -->
  <rect x="420" y="150" width="260" height="100" rx="10" fill="#FEE2E2" stroke="#EF4444" stroke-width="2"/>
  <text x="550" y="180" text-anchor="middle" font-size="13" font-weight="bold">Outdoor Unit</text>
  <text x="550" y="200" text-anchor="middle" font-size="11">Condenser</text>
  <text x="550" y="220" text-anchor="middle" font-size="10" fill="#B91C1C">Releases or absorbs heat</text>
  <text x="550" y="238" text-anchor="middle" font-size="9" fill="#6B7280">Refrigerant lines connect</text>
  
  <!-- Refrigerant lines (dashed between units) -->
  <line x1="380" y1="200" x2="420" y2="200" stroke="#6B7280" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="400" y="195" text-anchor="middle" font-size="9" fill="#6B7280">Refrigerant</text>
  
  <!-- Airflow arrows down -->
  <line x1="250" y1="250" x2="250" y2="310" stroke="#059669" stroke-width="2"/>
  <polygon points="250,305 245,295 255,295" fill="#059669"/>
  <text x="270" y="285" font-size="9" fill="#059669">Supply</text>
  
  <line x1="550" y1="250" x2="550" y2="310" stroke="#059669" stroke-width="2"/>
  <polygon points="550,305 545,295 555,295" fill="#059669"/>
  
  <!-- Ductwork + Rooms (bottom) -->
  <rect x="80" y="320" width="640" height="120" rx="10" fill="#F9FAFB" stroke="#E5E7EB" stroke-width="2"/>
  <text x="400" y="350" text-anchor="middle" font-size="14" font-weight="bold">Ductwork + Rooms</text>
  <text x="400" y="375" text-anchor="middle" font-size="11" fill="#6B7280">Supply Air → Rooms | Return Air ←</text>
  <line x1="200" y1="390" x2="600" y2="390" stroke="#D1D5DB" stroke-width="1"/>
  <text x="250" y="415" text-anchor="middle" font-size="10" fill="#059669">Supply Air (cool/heat)</text>
  <text x="550" y="415" text-anchor="middle" font-size="10" fill="#6B7280">Return Air</text>
</svg>
`;

const outDir = path.join(process.cwd(), "public", "images");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outPath = path.join(outDir, "hvac-system-diagram.svg");
fs.writeFileSync(outPath, svg.trim());

console.log("✅ Physical system diagram generated:", outPath);
