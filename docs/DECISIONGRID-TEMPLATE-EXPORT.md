# HVAC Diagnostic Page — Full Template Export for DecisionGrid

Copy everything below into DecisionGrid. Includes colors, CSS, structure, and full HTML.

---

## QUICK COPY — Paste this into DecisionGrid first

```
HVAC Diagnostic Page Template — Brand & Layout

COLORS:
- hvac-navy: #0a192f (header, H1, primary text)
- hvac-blue: #1e3a8a (links, CTAs)
- hvac-gold: #d4af37 (badge, step numbers, accent CTA)

SECTION ORDER (locked):
1. Hero (badge + H1 + intro)
2. Most Common Cause (sky-50 box)
3. Why This Happens (slate-100 box) — technical explanation
4. TOC (In This Guide)
5. CTAs (Diagnose | Get Repair)
6. Flowchart
7. Causes at a Glance (table)
8. Troubleshoot/DIY (numbered steps, gold circles)
9. Interactive Diagnostic Tree (clickable cause cards)
10. Common Causes & Fixes (each repair has DIY difficulty meter)
11. Narrow Your Diagnosis | Related Problems
12. Typical Repair Costs
13. Signs It Might Be More Serious (amber box)
14. Quick Repair Toolkit (Tool | Why You Need It)
15. Common Mistakes
16. Prevention Tips
17. When to Call (red box)
18. Continue Troubleshooting (4–5 links max)
19. Get Local HVAC Repair Help (navy CTA)
20. FAQ

DIY METER: rookie=green, moderate=amber, advanced=orange, professional-only=red
```

---

## 1. COLOR PALETTE

```css
/* HVAC Brand Colors — add to your stylesheet or :root */
:root {
  --hvac-navy: #0a192f;
  --hvac-blue: #1e3a8a;
  --hvac-gold: #d4af37;
  --hvac-blue-hover: #1d4ed8;  /* blue-700 for buttons */
}

/* Tailwind equivalents */
/* hvac-navy  = #0a192f  (header, primary text, borders) */
/* hvac-blue  = #1e3a8a  (links, accents, CTA buttons) */
/* hvac-gold  = #d4af37  (badge, accent buttons, highlights) */
```

| Token | Hex | Usage |
|-------|-----|-------|
| `hvac-navy` | `#0a192f` | Header bg, H1, section titles, primary buttons |
| `hvac-blue` | `#1e3a8a` | Links, accent text, secondary CTAs |
| `hvac-gold` | `#d4af37` | Logo badge, numbered step circles, CTA button (gold on navy) |

### Supporting Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `slate-50` | `#f8fafc` | Page background |
| `slate-100` | `#f1f5f9` | TOC bg, table headers |
| `slate-200` | `#e2e8f0` | Borders |
| `slate-700` | `#334155` | Body text |
| `slate-900` | `#0f172a` | Footer bg |
| `sky-50` | `#f0f9ff` | Most Common Cause box |
| `sky-200` | `#bae6fd` | Most Common Cause border |
| `blue-50` | `#eff6ff` | Badge background |
| `blue-100` | `#dbeafe` | Badge border, Verified Repair Path border |
| `amber-50` | `#fffbeb` | Signs warning box |
| `amber-200` | `#fde68a` | Signs warning border |
| `amber-900` | `#78350f` | Signs warning text |
| `red-50` | `#fef2f2` | When to Call box |
| `red-200` | `#fecaca` | When to Call border |
| `red-600` | `#dc2626` | When to Call button |
| `red-900` | `#7f1d1d` | When to Call text |
| `green-500` | `#22c55e` | DIY easy meter |
| `green-600` | `#16a34a` | Checkmark, prevention bullets |
| `amber-500` | `#f59e0b` | DIY moderate meter |
| `orange-500` | `#f97316` | DIY advanced meter |
| `red-500` | `#ef4444` | DIY professional-only meter |

---

## 2. TAILWIND CONFIG (if using Tailwind)

```javascript
// Add to tailwind.config theme.extend.colors
hvac: {
  navy: '#0a192f',
  blue: '#1e3a8a',
  gold: '#d4af37',
}
```

---

## 3. PLAIN CSS (if NOT using Tailwind)

```css
/* HVAC Diagnostic Template — Standalone CSS */
.hvac-header {
  background-color: #0a192f;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  position: sticky;
  top: 0;
  z-index: 50;
}

.hvac-badge {
  background-color: #eff6ff;
  color: #1e3a8a;
  font-size: 0.875rem;
  font-weight: 700;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid #dbeafe;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.hvac-h1 {
  font-size: 2.25rem;
  font-weight: 900;
  color: #0a192f;
  line-height: 1.2;
}

.hvac-most-common {
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-top: 1.5rem;
}

.hvac-why-this-happens {
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-top: 1.5rem;
}

.hvac-toc {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-top: 2rem;
}

.hvac-toc-title {
  font-size: 0.875rem;
  font-weight: 900;
  color: #0a192f;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 1rem;
}

.hvac-link {
  color: #1e3a8a;
  font-weight: 600;
}

.hvac-link:hover {
  text-decoration: underline;
}

.hvac-cta-primary {
  background-color: #1e3a8a;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.875rem;
}

.hvac-cta-primary:hover {
  background-color: #1d4ed8;
}

.hvac-cta-outline {
  background-color: white;
  color: #0a192f;
  border: 2px solid #0a192f;
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.875rem;
}

.hvac-cta-outline:hover {
  background-color: #f8fafc;
}

.hvac-section-title {
  font-size: 1.5rem;
  font-weight: 900;
  color: #0a192f;
  margin-bottom: 1rem;
}

.hvac-section-slate {
  background-color: #f1f5f9;
  padding: 2rem;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
}

.hvac-step-num {
  background-color: #d4af37;
  color: #0a192f;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 900;
}

.hvac-warning-amber {
  background-color: #fffbeb;
  border: 2px solid #fde68a;
  border-radius: 1rem;
  padding: 2rem;
}

.hvac-warning-amber h2 {
  color: #78350f;
  font-weight: 900;
}

.hvac-warning-red {
  background-color: #fef2f2;
  border: 2px solid #fecaca;
  border-radius: 1rem;
  padding: 2rem;
}

.hvac-warning-red h2 {
  color: #7f1d1d;
  font-weight: 900;
}

.hvac-cta-navy {
  background-color: #0a192f;
  color: white;
  padding: 2.5rem;
  border-radius: 1.5rem;
  text-align: center;
}

.hvac-cta-gold {
  background-color: #d4af37;
  color: #0a192f;
  padding: 1.25rem 2.5rem;
  border-radius: 1rem;
  font-weight: 900;
  text-transform: uppercase;
  font-size: 1.125rem;
}

.hvac-cta-gold:hover {
  background-color: #eab308;
}

/* DIY Difficulty Meter */
.hvac-diy-meter {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.hvac-diy-bar {
  height: 6px;
  background-color: #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
  display: flex;
}

.hvac-diy-bar-fill-easy { background-color: #22c55e; }
.hvac-diy-bar-fill-moderate { background-color: #f59e0b; }
.hvac-diy-bar-fill-advanced { background-color: #f97316; }
.hvac-diy-bar-fill-pro { background-color: #ef4444; }

/* Cost badges */
.hvac-cost-low {
  background-color: #dcfce7;
  color: #15803d;
  border: 1px solid #86efac;
}

.hvac-cost-medium {
  background-color: #fef9c3;
  color: #a16207;
  border: 1px solid #fde047;
}

.hvac-cost-high {
  background-color: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}
```

---

## 4. SECTION ORDER & ANCHOR IDS

| # | Section | ID |
|---|---------|-----|
| 1 | Hero (badge, H1, intro) | — |
| 2 | Most Common Cause | — |
| 3 | Why This Happens | `#why-this-happens` |
| 4 | In This Guide (TOC) | — |
| 5 | Action CTAs | — |
| 6 | Diagnostic Flowchart | `#flowchart` |
| 7 | Causes at a Glance | `#causes-at-glance` |
| 8 | Troubleshoot / DIY | `#troubleshoot-diy` |
| 9 | Interactive Diagnostic Tree | `#diagnostics` |
| 10 | Common Causes & Fixes | `#common-causes` |
| 11 | Narrow / Related | — |
| 12 | Typical Repair Costs | `#cost` |
| 13 | Signs It Might Be More Serious | — |
| 14 | Quick Repair Toolkit | — |
| 15 | Common Mistakes | `#common-mistakes` |
| 16 | Prevention Tips | `#prevention` |
| 17 | When to Call | `#when-to-call` |
| 18 | Continue Troubleshooting | — |
| 19 | Get Local HVAC Repair Help | `#get-quote` |
| 20 | FAQ | `#faq` |

---

## 5. TOC ANCHOR LIST (for AI generator)

```
#why-this-happens
#troubleshoot-diy
#diagnostics
#causes-at-glance
#common-causes
#cost
#common-mistakes
#prevention
#when-to-call
#get-quote
#faq
```

---

## 6. DIY DIFFICULTY LABELS & COLORS

| Level | Label | Bar Color |
|-------|-------|------------|
| rookie | Beginner-friendly | `#22c55e` (green) |
| moderate | Moderate skill | `#f59e0b` (amber) |
| advanced | Advanced DIY | `#f97316` (orange) |
| professional-only | Leave to professionals | `#ef4444` (red) |

---

## 7. FULL HTML TEMPLATE

See `public/mockup-diagnostic-page.html` in this repo — or use the HTML below. Replace `{{variable}}` placeholders with your content.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{symptom_name}} — LOCKED Template</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            hvac: { navy: '#0a192f', blue: '#1e3a8a', gold: '#d4af37' }
          }
        }
      }
    }
  </script>
</head>
<body class="bg-slate-50 text-slate-900">
  <header class="bg-hvac-navy text-white py-4 shadow-lg sticky top-0 z-50">
    <div class="container mx-auto px-4 flex justify-between items-center">
      <span class="text-2xl font-black tracking-tighter flex gap-2">
        <span class="bg-hvac-gold text-hvac-navy px-2 py-1 rounded">HVAC</span>
        <span>DIAGNOSTIC</span>
      </span>
      <nav class="hidden md:flex gap-6 font-medium">
        <a href="#" class="hover:text-hvac-gold">HVAC Systems</a>
        <a href="#" class="hover:text-hvac-gold">Diagnostics</a>
        <a href="#" class="hover:text-hvac-gold">Repair Guides</a>
      </nav>
    </div>
  </header>

  <main class="container mx-auto px-4 py-12 max-w-4xl">
    <nav class="text-sm text-gray-500 mb-8">
      <a href="#" class="hover:text-hvac-blue">Home</a>
      <span class="mx-2">/</span>
      <a href="#" class="hover:text-hvac-blue">HVAC Systems</a>
      <span class="mx-2">/</span>
      <a href="#" class="hover:text-hvac-blue">Air Conditioning</a>
      <span class="mx-2">/</span>
      <a href="#" class="hover:text-hvac-blue">{{parent_cluster}}</a>
      <span class="mx-2">/</span>
      <span class="text-gray-900 font-medium">{{symptom_name}}</span>
    </nav>

    <!-- Hero -->
    <section class="mb-12">
      <div class="flex items-center gap-2 mb-4 text-sm font-bold text-hvac-blue bg-blue-50/50 w-fit px-3 py-1.5 rounded-full border border-blue-100">
        <span class="text-green-600">✔</span> Reviewed by Certified HVAC Technicians
      </div>
      <h1 class="text-4xl md:text-5xl font-black text-hvac-navy leading-tight">
        {{symptom_name}}: Professional HVAC Diagnostic Guide
      </h1>
      <p class="mt-4 text-lg font-medium text-slate-700">{{intro}}</p>

      <!-- Most Common Cause -->
      <div class="mt-6 p-6 bg-sky-50 border border-sky-200 rounded-xl">
        <p class="m-0 text-slate-800 font-medium leading-relaxed">
          <strong class="text-slate-900">{{most_common_cause}}</strong> {{most_common_explanation}}
        </p>
      </div>

      <!-- Why This Happens -->
      <div class="mt-6 p-6 bg-slate-100 border border-slate-200 rounded-xl" id="why-this-happens">
        <h3 class="text-sm font-black text-hvac-navy uppercase tracking-widest mb-3 m-0">Why This Happens</h3>
        <p class="m-0 text-slate-700 leading-relaxed">{{why_this_happens}}</p>
      </div>

      <!-- TOC -->
      <div class="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
        <h3 class="text-sm font-black text-hvac-navy uppercase tracking-widest mb-4 m-0">In This Guide</h3>
        <ul class="grid sm:grid-cols-2 gap-2 list-none p-0 m-0 text-sm">
          <li><a href="#why-this-happens" class="text-hvac-blue hover:underline">Why This Happens</a></li>
          <li><a href="#troubleshoot-diy" class="text-hvac-blue hover:underline">Troubleshoot / DIY</a></li>
          <li><a href="#diagnostics" class="text-hvac-blue hover:underline">Interactive Diagnostic Tree</a></li>
          <li><a href="#causes-at-glance" class="text-hvac-blue hover:underline">Causes at a Glance</a></li>
          <li><a href="#common-causes" class="text-hvac-blue hover:underline">Common Causes & Fixes</a></li>
          <li><a href="#cost" class="text-hvac-blue hover:underline">Typical Repair Costs</a></li>
          <li><a href="#common-mistakes" class="text-hvac-blue hover:underline">Common Mistakes</a></li>
          <li><a href="#prevention" class="text-hvac-blue hover:underline">Prevention Tips</a></li>
          <li><a href="#when-to-call" class="text-hvac-blue hover:underline">When to Call a Pro</a></li>
          <li><a href="#get-quote" class="text-hvac-blue hover:underline">Get Local Repair Help</a></li>
          <li><a href="#faq" class="text-hvac-blue hover:underline">FAQ</a></li>
        </ul>
      </div>

      <div class="mt-8 flex flex-col sm:flex-row gap-4">
        <a href="#diagnostics" class="flex-1 bg-white border-2 border-hvac-navy text-hvac-navy hover:bg-slate-50 text-center py-4 rounded-xl font-black uppercase tracking-widest text-sm">Diagnose the Problem ↓</a>
        <button class="flex-1 bg-hvac-blue hover:bg-blue-700 text-white text-center py-4 rounded-xl font-black uppercase tracking-widest text-sm">Get Local HVAC Repair →</button>
      </div>
    </section>

    <!-- Flowchart -->
    <section class="mb-12 p-8 bg-white rounded-xl border border-slate-200" id="flowchart">
      <h2 class="text-xl font-black text-hvac-navy mb-4">Diagnostic Flowchart</h2>
      <div class="bg-slate-100 rounded-lg p-6 text-center text-slate-500">{{mermaid_or_placeholder}}</div>
    </section>

    <!-- Causes at a Glance -->
    <section class="mb-12" id="causes-at-glance">
      <h2 class="text-2xl font-black text-hvac-navy mb-4">Causes at a Glance</h2>
      <div class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full text-sm text-left">
          <thead class="bg-slate-100 border-b border-slate-200">
            <tr>
              <th class="p-4 font-bold">Problem</th>
              <th class="p-4 font-bold">Likely Cause</th>
              <th class="p-4 font-bold">Detailed Guide</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">{{causes_table_rows}}</tbody>
        </table>
      </div>
    </section>

    <!-- Troubleshoot / DIY -->
    <section class="mb-12 bg-slate-50 p-8 rounded-2xl border border-slate-200" id="troubleshoot-diy">
      <h2 class="text-2xl font-black text-hvac-navy mb-6 flex items-center gap-2"><span>⚡</span> Troubleshoot / DIY</h2>
      <p class="text-slate-600 mb-6">{{troubleshoot_intro}}</p>
      <ol class="grid md:grid-cols-2 gap-4 list-none p-0 m-0 mb-8">{{troubleshoot_steps}}</ol>
      <div class="pt-6 border-t border-slate-200 flex justify-between items-center">
        <p class="font-bold m-0">Still having the problem?</p>
        <button class="bg-hvac-navy text-white px-6 py-3 rounded-xl font-black text-sm uppercase">Get Local HVAC Help →</button>
      </div>
    </section>

    <!-- Interactive Diagnostic Tree -->
    <section class="mb-12 bg-white p-8 rounded-2xl border border-slate-200" id="diagnostics">
      <h3 class="text-2xl font-black text-hvac-navy mb-6 flex items-center gap-3">
        <span class="bg-hvac-blue text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">?</span>
        Interactive Diagnostic Tree
      </h3>
      <p class="text-lg font-medium text-slate-700 mb-6">Which of these specifically describes your {{symptom_name_lower}} experience?</p>
      <div class="grid sm:grid-cols-2 gap-3">{{diagnostic_tree_cards}}</div>
    </section>

    <!-- Common Causes & Fixes -->
    <section class="mb-12" id="common-causes">
      <h2 class="text-3xl font-black mb-6">Common Causes & Possible Fixes</h2>
      <div class="space-y-8">{{common_causes_with_diy_meter}}</div>
    </section>

    <!-- Narrow / Related -->
    <section class="mb-12">
      <div class="grid md:grid-cols-2 gap-8">
        <div>
          <h3 class="text-lg font-black text-hvac-navy mb-2">Narrow Your Diagnosis</h3>
          <p class="text-sm text-slate-600 mb-4">These conditions help you pinpoint the exact issue. Each links to a focused diagnostic.</p>
          <div class="flex flex-wrap gap-2">{{narrow_links}}</div>
        </div>
        <div>
          <h3 class="text-lg font-black text-hvac-navy mb-2">Related Problems</h3>
          <p class="text-sm text-slate-600 mb-4">These symptoms share causes but lead to different diagnostic flows.</p>
          <div class="flex flex-wrap gap-2">{{related_links}}</div>
        </div>
      </div>
    </section>

    <!-- Cost -->
    <section class="mb-12" id="cost">
      <h2 class="text-3xl font-black mb-6">Typical Repair Costs</h2>
      <div class="rounded-xl border border-slate-200 overflow-hidden">
        <table class="w-full text-sm text-left">
          <thead class="bg-slate-100 border-b border-slate-200">
            <tr><th class="p-4 font-bold">Repair</th><th class="p-4 font-bold text-right">Typical Cost</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-100">{{repair_costs_rows}}</tbody>
        </table>
      </div>
    </section>

    <!-- Signs -->
    <section class="mb-12">
      <div class="bg-amber-50 p-8 rounded-2xl border-2 border-amber-200">
        <h2 class="text-2xl font-black text-amber-900 mb-4">Signs It Might Be More Serious—or Work Seems Too Complicated</h2>
        <p class="text-amber-900 font-medium m-0">HVAC systems use expensive components, regulated chemicals (refrigerants), high-voltage electricity, and in furnaces, gas lines. Repairs are not necessarily DIY-friendly.</p>
      </div>
    </section>

    <!-- Toolkit -->
    <section class="mb-12 bg-slate-50 p-8 rounded-2xl border border-slate-200">
      <h2 class="text-2xl font-black mb-2">Quick Repair Toolkit</h2>
      <p class="text-gray-600 mb-6">Diagnosis and repair usually require these tools. Filter and drain fixes are owner-doable; electrical and refrigerant work require a pro.</p>
      <div class="rounded-xl border border-slate-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-100 border-b border-slate-200">
            <tr><th class="p-4 font-bold text-left">Tool</th><th class="p-4 font-bold text-left">Why You Need It</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-100">{{toolkit_rows}}</tbody>
        </table>
      </div>
    </section>

    <!-- Common Mistakes -->
    <section class="mb-12" id="common-mistakes">
      <h2 class="text-2xl font-black text-hvac-navy mb-4">Common Mistakes</h2>
      <ul class="space-y-3 list-none p-0">{{common_mistakes_list}}</ul>
    </section>

    <!-- Prevention -->
    <section class="mb-12" id="prevention">
      <h2 class="text-2xl font-black text-hvac-navy mb-4">Prevention Tips</h2>
      <ul class="grid md:grid-cols-2 gap-3 list-none p-0">{{prevention_list}}</ul>
    </section>

    <!-- When to Call -->
    <section class="mb-12 bg-red-50 p-8 rounded-2xl border-2 border-red-200" id="when-to-call">
      <h2 class="text-2xl font-black text-red-900 mb-4">When to Call an HVAC Technician</h2>
      <ul class="mt-6 space-y-3 list-none p-0">{{when_to_call_list}}</ul>
      <button class="mt-8 bg-red-600 hover:bg-red-700 text-white font-black px-8 py-4 rounded-xl uppercase text-sm">Find Local HVAC Repair →</button>
    </section>

    <!-- Continue Troubleshooting (4–5 links max) -->
    <section class="mb-12">
      <h2 class="text-xl font-black text-hvac-navy mb-4">Continue Troubleshooting</h2>
      <p class="text-sm text-slate-600 mb-4">Related diagnostic guides and technical deep-dives.</p>
      <div class="flex flex-wrap gap-3">{{continue_troubleshooting_links}}</div>
    </section>

    <!-- Get Help CTA -->
    <section class="mb-16 bg-hvac-navy text-white p-10 rounded-3xl text-center" id="get-quote">
      <h2 class="text-3xl font-black m-0 mb-6">Get Local HVAC Repair Help</h2>
      <p class="text-slate-300 text-lg mb-8">Don't let {{symptom_name_lower}} turn into a catastrophic compressor failure.</p>
      <button class="bg-hvac-gold hover:bg-yellow-500 text-hvac-navy font-black px-10 py-5 rounded-2xl uppercase text-lg">Request Repair Quote</button>
    </section>

    <!-- FAQ -->
    <section class="mb-16" id="faq">
      <h2 class="text-3xl font-black mb-8">Frequently Asked Questions</h2>
      <div class="space-y-4">{{faq_items}}</div>
    </section>
  </main>

  <footer class="bg-slate-900 text-slate-400 py-12 mt-20 border-t border-slate-800">
    <div class="container mx-auto px-4 text-center text-xs">© HVAC Revenue Boost. All rights reserved.</div>
  </footer>
</body>
</html>
```

---

## 8. REPAIR CARD WITH DIY METER (reusable block)

```html
<div class="border-b border-slate-100 pb-8">
  <h3 class="text-xl font-bold text-hvac-navy">{{cause_name}}</h3>
  <p class="mt-2 text-gray-600 italic">{{cause_explanation}}</p>
  <div class="mt-6 bg-blue-50/30 p-5 rounded-xl border border-blue-100">
    <span class="text-xs font-black uppercase text-hvac-blue bg-white px-3 py-1 rounded">Verified Repair Path</span>
    <div class="mt-4 p-4 bg-white rounded-lg border flex flex-col gap-3">
      <div class="flex justify-between items-start">
        <span class="font-bold">{{repair_name}}</span>
        <span class="text-xs font-black uppercase px-3 py-1.5 rounded {{cost_class}}">{{cost_range}}</span>
      </div>
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">DIY level</span>
          <div class="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
            <div class="flex-1 {{diy_bar_color}}"></div>
            <div class="flex-1 bg-slate-200"></div>
            <div class="flex-1 bg-slate-200"></div>
            <div class="flex-1 bg-slate-200"></div>
          </div>
        </div>
        <span class="text-[10px] font-medium text-slate-600">{{diy_label}}</span>
        {{#if safety_warning}}<p class="text-[10px] text-amber-700 font-medium">⚠ {{safety_warning}}</p>{{/if}}
      </div>
    </div>
  </div>
</div>
```

Cost classes: `bg-green-100 text-green-700 border-green-200` | `bg-yellow-100 text-yellow-700 border-yellow-200` | `bg-red-100 text-red-700 border-red-200`

DIY bar: `bg-green-500` | `bg-amber-500` | `bg-orange-500` | `bg-red-500`

---

## 9. TROUBLESHOOT STEP ITEM

```html
<li class="flex items-center gap-3 font-medium">
  <span class="bg-hvac-gold text-hvac-navy w-6 h-6 rounded-full flex items-center justify-center text-sm font-black">{{step_num}}</span>
  {{step_text}}
</li>
```

---

## 10. DIAGNOSTIC TREE CARD

```html
<div class="p-4 rounded-xl border-2 border-slate-100 hover:border-hvac-blue cursor-pointer">{{cause_name}}</div>
```

---

## 11. NARROW / RELATED PILL

```html
<a href="{{url}}" class="text-xs font-bold bg-slate-100 px-3 py-1.5 rounded text-hvac-blue hover:bg-hvac-blue hover:text-white">{{label}}</a>
```

---

## 12. COMMON MISTAKE ITEM

```html
<li class="flex items-start gap-3 text-sm">
  <span class="text-red-500 font-black">✗</span>
  <span>{{mistake_text}}</span>
</li>
```

---

## 13. PREVENTION ITEM

```html
<li class="flex items-start gap-2 text-sm">
  <span class="text-green-600 font-bold">•</span>
  {{prevention_text}}
</li>
```

---

## 14. FAQ ITEM

```html
<div class="bg-white border border-slate-200 p-6 rounded-xl">
  <h3 class="text-lg font-bold text-hvac-navy m-0">{{question}}</h3>
  <p class="text-gray-600 mt-3 m-0">{{answer}}</p>
</div>
```

---

*End of export. Use `public/mockup-diagnostic-page.html` for a live reference.*
