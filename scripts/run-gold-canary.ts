import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import OpenAI from "openai";
import fs from "fs";
import { GOLD_STANDARD_CANARY_PROMPT } from "../lib/prompt-schema-router";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function runCanary() {
  console.log("🚀 Running Gold Standard Canary Test (6 pages)...");
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: GOLD_STANDARD_CANARY_PROMPT 
        },
        {
          role: "user",
          content: "Generate the canary test batch for a residential HVAC system. Focus on an AC Not Cooling scenario and its related components, causes, and repairs."
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 4000
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("Empty response from AI");
    }

    const payload = JSON.parse(content.replace(/^\s*```json/i, "").replace(/```\s*$/i, "").trim());
    
    let pages = [];
    if (Array.isArray(payload)) {
      pages = payload;
    } else if (payload.pages && Array.isArray(payload.pages)) {
      pages = payload.pages;
    } else {
      // It might be { "systemPage": {...}, "symptomPage": {...} }
      pages = Object.values(payload);
    }
    
    const outputPath = "canary-gold-standard-output.json";
    fs.writeFileSync(outputPath, JSON.stringify(pages, null, 2));
    
    console.log(`✅ Successfully generated ${Array.isArray(pages) ? pages.length : 'unknown'} pages!`);
    console.log(`📄 View the results in: ${outputPath}`);
    
  } catch (error) {
    console.error("❌ Canary generation failed:", error);
  }
}

runCanary();
