import "dotenv/config";
import sql from '../lib/db';
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateUpdatedContent(slug: string, title: string): Promise<string> {
   console.log(`🤖 Prompting AI for HTML content: ${slug}`);
   
   const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
         { 
            role: "system", 
            content: "You are a 30-year veteran HVAC diagnostic technician and technical writer."
         },
         {
            role: "user",
            content: `You are rewriting an HVAC diagnostic page for an existing production site.

CRITICAL:

* Keep compatibility with the site’s existing structure.
* Do NOT add a new modal, form, popup, or CTA system.
* Do NOT include LeadCard markup, modal markup, form markup, inline JS, or button code.
* The site already handles CTA / lead card behavior elsewhere.
* Return ONLY the article body HTML content.

Your output must be substantial, detailed, and long-form.
Minimum target: 1,200 words of visible body content.
Do not pad with fluff. Use dense, useful diagnostic content.

Write the article for this slug and title:

* slug: ${slug}
* title: ${title}

Use this exact structure in HTML:

1. <h1>${title}</h1>

2. <h2>30-Second Diagnosis</h2>

* 4 to 6 bullet points
* likely causes in ranked order
* what to check first
* when it is urgent

3. <h2>What’s Actually Happening</h2>

* 2 to 4 substantial paragraphs
* explain mechanical/electrical cause clearly
* technician tone

4. <h2>Quick Checks You Can Do First</h2>

* 5 to 7 bullets
* practical, safe homeowner checks

5. <h2>Step-by-Step Diagnostic Flow</h2>

* numbered steps
* if X, check Y, then conclude Z
* at least 6 steps

6. <h2>Most Common Causes</h2>

For each cause, include:

* <h3>Cause name</h3>
* what it is
* why it causes this symptom
* relative likelihood
* typical repair range

Include at least 5 causes.

7. <h2>Repair vs Replace</h2>

* 2 to 4 paragraphs
* when repair makes sense
* when replacement makes sense
* mention age / compressor / refrigerant / cost logic

8. <h2>Typical Repair Cost Range</h2>

* minor
* moderate
* major
* replacement crossover point

9. <h2>When to Stop DIY</h2>

* clear safety boundary
* 4 to 6 bullets

10. <h2>Related HVAC Issues</h2>

* list 4 to 6 internal links as normal anchor tags

STYLE:

* technical, authoritative, decisive
* no generic fluff
* no “this could be many things” filler
* no markdown
* no code fences
* no modal/form/button HTML
* no site chrome
* no footer/header
* no duplicate sections

Return clean HTML only.`
         }
      ],
      temperature: 0.3
   });

   let raw = response.choices[0]?.message.content || "";
   return raw.replace(/^```html/i, "").replace(/```$/i, "").trim();
}

async function runRegenBatch(limit = 5) {
  console.log("🚀 Starting Minimal Regen Batch...");
  
  // Adapted from db.query('...', [...]) to neon serverless tagged templates
  const pages = await sql`
    SELECT id, slug, title
    FROM pages
    WHERE quality_status = 'needs_regen'
    LIMIT ${limit}
  ` as { id: number, slug: string, title: string }[];

  console.log(`Found ${pages.length} pages needing regen.`);

  for (const page of pages) {
    if (page.slug.includes('canary') || page.slug.includes('test')) {
      continue;
    }

    try {
      console.log('🔄 Regenerating:', page.slug);

      // 👉 CALL YOUR AI PROMPT HERE
      const newHtml = await generateUpdatedContent(page.slug, page.title);

      if (!newHtml || newHtml.length < 1000) {
        console.log('❌ Failed content length check:', page.slug);
        continue;
      }

      await sql`
        UPDATE pages
        SET content_html = ${newHtml},
            quality_status = 'approved',
            updated_at = NOW()
        WHERE id = ${page.id}
      `;

      console.log('✅ Updated:', page.slug);

    } catch (err) {
      console.error('⚠️ Error on page:', page.slug, err);

      await sql`
        UPDATE pages
        SET quality_status = 'needs_regen'
        WHERE id = ${page.id}
      `;
    }
  }
}

// Allow execution natively via command line
if (require.main === module) {
   runRegenBatch().then(() => {
      console.log("🏁 runRegenBatch complete.");
      process.exit(0);
   }).catch(e => {
      console.error(e);
      process.exit(1);
   });
}

export default runRegenBatch;
