import "dotenv/config";
import React from 'react';
import SymptomPage from '../app/diagnose/[symptom]/page';

async function main() {
  const result = await SymptomPage({ params: { symptom: 'ac-not-cooling' } });
  
  // Inspect the top-level element type and props returned by the server component
  console.log("COMPONENT RENDER RESULT:");
  console.log("Type:", result.type);
  if (result.props && result.props.style) {
     console.log("Style:", result.props.style);
  } else {
     console.log("It did not return a styled div.");
  }

  // Look for GoldStandardPage or SymptomPageTemplate in the element
  if (result.type && result.type.name === 'SymptomPageTemplate') {
     console.log("RETURNED LEGACY SymptomPageTemplate!");
  }

  process.exit(0);
}

main().catch(console.error);
