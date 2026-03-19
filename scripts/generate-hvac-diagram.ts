import fs from "fs";
import path from "path";

const svg = `
<svg width="1000" height="560" viewBox="0 0 1000 560" xmlns="http://www.w3.org/2000/svg">

  <!-- Background -->
  <rect width="100%" height="100%" fill="white"/>

  <!-- Top Diamond -->
  <polygon points="500,60 560,100 500,140 440,100"
    fill="#F9FAFB" stroke="#E5E7EB" stroke-width="2"/>
  <text x="500" y="105" text-anchor="middle" font-size="14" font-weight="bold">
    HVAC Problem
  </text>

  <!-- Arrows Down to Split -->
  <line x1="500" y1="140" x2="500" y2="180" stroke="#9CA3AF" stroke-width="2"/>
  <line x1="500" y1="180" x2="300" y2="210" stroke="#9CA3AF" stroke-width="2"/>
  <line x1="500" y1="180" x2="700" y2="210" stroke="#9CA3AF" stroke-width="2"/>

  <!-- Group Labels -->
  <text x="300" y="210" text-anchor="middle" font-size="13" font-weight="bold" fill="#059669">
    DIY-Friendly Systems
  </text>
  <text x="700" y="210" text-anchor="middle" font-size="13" font-weight="bold" fill="#DC2626">
    Professional Required Systems
  </text>

  <!-- LEFT GROUP (DIY) - Structural + Mechanical -->
  <rect x="200" y="240" width="200" height="80" rx="10"
    fill="#ECFDF5" stroke="#A7F3D0" stroke-width="2"/>
  <text x="300" y="270" text-anchor="middle" font-weight="bold">Structural</text>
  <text x="300" y="295" text-anchor="middle" font-size="12">Airflow / Ducting</text>

  <rect x="200" y="340" width="200" height="80" rx="10"
    fill="#ECFDF5" stroke="#A7F3D0" stroke-width="2"/>
  <text x="300" y="370" text-anchor="middle" font-weight="bold">Mechanical</text>
  <text x="300" y="395" text-anchor="middle" font-size="12">Components</text>

  <!-- RIGHT GROUP (PRO) - Electrical + Chemical -->
  <rect x="600" y="240" width="200" height="80" rx="10"
    fill="#FEF2F2" stroke="#FCA5A5" stroke-width="2"/>
  <text x="700" y="270" text-anchor="middle" font-weight="bold">Electrical</text>
  <text x="700" y="295" text-anchor="middle" font-size="12">Power / Controls</text>

  <rect x="600" y="340" width="200" height="80" rx="10"
    fill="#FEF2F2" stroke="#FCA5A5" stroke-width="2"/>
  <text x="700" y="370" text-anchor="middle" font-weight="bold">Chemical</text>
  <text x="700" y="395" text-anchor="middle" font-size="12">Refrigerant</text>

  <!-- Arrows Down to Decision -->
  <line x1="300" y1="420" x2="300" y2="450" stroke="#9CA3AF" stroke-width="2"/>
  <line x1="700" y1="420" x2="700" y2="450" stroke="#9CA3AF" stroke-width="2"/>
  <line x1="300" y1="450" x2="500" y2="480" stroke="#9CA3AF" stroke-width="2"/>
  <line x1="700" y1="450" x2="500" y2="480" stroke="#9CA3AF" stroke-width="2"/>

  <!-- Decision Boxes -->
  <rect x="350" y="450" width="300" height="60" rx="10"
    fill="#1F2937" stroke="#374151" stroke-width="2"/>
  <text x="500" y="485" text-anchor="middle" font-weight="bold" fill="white" font-size="14">
    Get Local HVAC Quotes
  </text>

</svg>
`;

const outDir = path.join(process.cwd(), "public", "images");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outPath = path.join(outDir, "hvac-system-flow.svg");
fs.writeFileSync(outPath, svg.trim());

console.log("✅ Diagram generated:", outPath);
