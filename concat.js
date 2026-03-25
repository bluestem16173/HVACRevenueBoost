const fs = require('fs');
const p1 = fs.readFileSync('c:/Users/anedo/Desktop/HVAC/HVACRevenueBoostWeb/templates/symptom-page.tsx', 'utf8');
const p2 = fs.readFileSync('c:/Users/anedo/Desktop/HVAC/HVACRevenueBoostWeb/templates/symptom-page-part2.tsx', 'utf8');
const p3 = fs.readFileSync('c:/Users/anedo/Desktop/HVAC/HVACRevenueBoostWeb/templates/symptom-page-part3.tsx', 'utf8');
const p4 = fs.readFileSync('c:/Users/anedo/Desktop/HVAC/HVACRevenueBoostWeb/templates/symptom-page-part4.tsx', 'utf8');

fs.writeFileSync('c:/Users/anedo/Desktop/HVAC/HVACRevenueBoostWeb/templates/symptom-page.tsx', p1 + p2 + p3 + p4);

fs.unlinkSync('c:/Users/anedo/Desktop/HVAC/HVACRevenueBoostWeb/templates/symptom-page-part2.tsx');
fs.unlinkSync('c:/Users/anedo/Desktop/HVAC/HVACRevenueBoostWeb/templates/symptom-page-part3.tsx');
fs.unlinkSync('c:/Users/anedo/Desktop/HVAC/HVACRevenueBoostWeb/templates/symptom-page-part4.tsx');
console.log('Concatenated successfully');
