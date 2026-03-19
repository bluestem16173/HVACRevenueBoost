const fs = require('fs');
let content = fs.readFileSync('templates/symptom-page.tsx', 'utf8');

const newMatrixStartStr = '{/* Monetization Scaled Repair Difficulty Matrix */}';
const newMatrixEndStr = '{/* 1. DIY VS PRO — STATIC chart: Only air filter is DIY; all others Pro (same on every page) */}';
const oldMatrixStartStr = '{/* 6. ESTIMATED COST / REPAIR DIFFICULTY MATRIX — synced with pillar breakdown, cost only per item */}';
const oldMatrixEndStr = '{/* 11. PARTS LIKELY INVOLVED — always 4 slots, DB rule-based + affiliate-ready */}';

let newMatrixStart = content.indexOf(newMatrixStartStr);
let newMatrixEnd = content.indexOf(newMatrixEndStr);
let newMatrixChunk = content.substring(newMatrixStart, newMatrixEnd);

content = content.replace(newMatrixChunk, '');

let oldMatrixStart = content.indexOf(oldMatrixStartStr);
let oldMatrixEnd = content.indexOf(oldMatrixEndStr);
let oldMatrixChunk = content.substring(oldMatrixStart, oldMatrixEnd);

content = content.replace(oldMatrixChunk, newMatrixChunk);

content = content.replace(
  'Mechanical: "Compressor, evaporator/condenser coils, and thermostat failures cause reduced cooling. Compressor short-cycle or locked rotor indicates electrical or mechanical failure. Thermostat calibration drift causes overcooling or short cycles. Field note: Compressor replacement is major; verify refrigerant circuit integrity first.",',
  'Mechanical: scalingData?.mechanicalFieldNote || "Compressor, evaporator/condenser coils, and thermostat failures cause reduced cooling. Compressor short-cycle or locked rotor indicates electrical or mechanical failure. Thermostat calibration drift causes overcooling or short cycles. Field note: Compressor replacement is major; verify refrigerant circuit integrity first.",'
);

fs.writeFileSync('templates/symptom-page.tsx', content, 'utf8');
console.log('Successfully remapped matrix chunks and Mechanical field note.');
