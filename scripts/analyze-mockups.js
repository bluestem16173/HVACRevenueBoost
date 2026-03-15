const fs = require('fs');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const openai = new OpenAI();

async function analyze() {
  const img1 = fs.readFileSync('C:\\Users\\anedo\\.gemini\\antigravity\\brain\\79d0af1d-4686-4428-bb26-7ae2b2dbd569\\media__1773537385377.png').toString('base64');
  const img2 = fs.readFileSync('C:\\Users\\anedo\\.gemini\\antigravity\\brain\\79d0af1d-4686-4428-bb26-7ae2b2dbd569\\media__1773537401139.png').toString('base64');
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Describe the UI layout, color scheme, typography, card styles, buttons, and specific sections of these two HVAC diagnostic page mockup images in extreme detail. Compare them against a basic white/slate tailwind prose layout. Identify what makes these mockups 'gold and high converting' (e.g. bold colors, specific gradients, icons, dense data layouts, borders)." },
          { type: "image_url", image_url: { url: `data:image/png;base64,${img1}` } },
          { type: "image_url", image_url: { url: `data:image/png;base64,${img2}` } }
        ],
      },
    ],
  });
  console.log(response.choices[0].message.content);
}
analyze().catch(console.error);
