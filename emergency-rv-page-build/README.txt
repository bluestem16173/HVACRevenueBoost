Emergency RV "page build" export — DecisionGrid
================================================

WHAT THIS IS
------------
This bundle contains the code added/updated for the emergency symptom pattern:
  - Emergency banner + 3 checks
  - "Fix in 60 seconds" block
  - "Most common fix" + cost/difficulty/time
  - Monetization strip (HVAC Revenue Boost where leadStyle=hvac; local pros for service/plumber)

FILES IN THIS FOLDER
--------------------
emergency-rv-presets.ts          — All canonical presets + getEmergencyPreset()
emergency-rv-pattern.html        — EJS partial (rendered above AI summary)
rv-service-cta.html             — CTA section id rv-service-area-lead-capture
authority-guide.html             — Layout: emergency CSS + include partial after hero
tier1-authority-pillar.html      — Same for tier-1 pillars
rv-heating-cooling-guides.ts    — Routes: emergencyPage + getEmergencyPreset()
rv-electrical-guides.ts
rv-water-systems-guides.ts

NOT INCLUDED (separate authority bodies)
----------------------------------------
The *-authority-master.html partials for each symptom (e.g. rv-ac-blowing-warm-air-authority-master.html)
live under views/guides/ — copy those separately if you need full page HTML.

ZIP
---
The repo root also has: emergency-rv-page-build.zip (this folder + README, compressed).

RESTORE
-------
Merge files back into the same paths under your DecisionGrid repo root.
