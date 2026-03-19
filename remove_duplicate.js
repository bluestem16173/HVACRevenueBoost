const fs = require('fs');
let content = fs.readFileSync('templates/symptom-page.tsx', 'utf8');

const targetStr = '<div className="grid md:grid-cols-2 gap-8">\n            <div>\n              <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Narrow Your Diagnosis</h2>';

if (!content.includes('Narrow Your Diagnosis')) {
  console.log('Could not find Narrow Your Diagnosis');
  process.exit(1);
}

// Find the section 22
const startMarker = '{/* 22. NARROW YOUR DIAGNOSIS + RELATED PROBLEMS — 1-2 environments, 1-2 conditions */}';
let startIndex = content.indexOf(startMarker);
if (startIndex !== -1) {
  let endIndex = content.indexOf('</section>', startIndex) + '</section>'.length;
  if (endIndex > startIndex) {
    let sectionText = content.substring(startIndex, endIndex);
    
    // We want to replace the two-column grid with a single column containing only "Related Problems"
    // So we'll just extract the Related Problems div.
    let relIndex = sectionText.indexOf('<div>\\n              <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Related Problems</h2>');
    if (relIndex === -1) {
        relIndex = sectionText.indexOf('<div>\n              <h2 className="text-2xl font-black text-hvac-navy dark:text-white mb-4">Related Problems</h2>');
    }
    
    if (relIndex !== -1) {
        // extract the div
        let endRelIndex = sectionText.indexOf('</div>\n          </div>', relIndex);
        if (endRelIndex !== -1) {
            let newSection = 
`{/* 22. RELATED PROBLEMS */}
        <section className="mb-16">
            ` + sectionText.substring(relIndex, endRelIndex + '</div>'.length).trim() + `
        </section>`;
        
            content = content.substring(0, startIndex) + newSection + content.substring(endIndex);
            fs.writeFileSync('templates/symptom-page.tsx', content, 'utf8');
            console.log('Successfully replaced Section 22 with just Related Problems.');
            process.exit(0);
        }
    }
    console.log("Could not find related problems index bounds");
  }
}
