/**
 * Canonical kebab symptom segments for trade hubs / nav / sibling pools (`/{vertical}/{slug}/...`).
 */

/** High-intent HVAC problem pillars (`/hvac/{slug}/...`). */
export const HVAC = [
  "ac-not-cooling",
  "ac-blowing-warm-air",
  "ac-running-but-not-cooling",
  "no-cold-air",
  "weak-airflow",
  "uneven-cooling",
  "ac-not-turning-on",
  "ac-freezing-up",
  "high-energy-bills",
  "thermostat-not-working",
  "ac-making-noise",
  "system-short-cycling",
  "refrigerant-leak-signs",
  "capacitor-failure",
] as const;

export const ELECTRICAL = [
  "power-out-in-one-room",
  "partial-power-loss",
  "whole-house-power-out",
  "lights-flickering",
  "outlet-not-working",
  "outlet-sparking",
  "light-switch-not-working",
  "dead-outlet",
  "breaker-keeps-tripping",
  "panel-overheating",
  "circuit-overloaded",
  "breaker-wont-reset",
  "burning-smell-from-electrical",
  "buzzing-sound-in-walls",
  "exposed-wiring",
  "faulty-wiring",
] as const;

export const PLUMBING = [
  "no-hot-water",
  "water-heater-leaking",
  "not-enough-hot-water",
  "strange-noises-from-tank",
  "pipe-leaking-under-sink",
  "water-leak-in-wall",
  "ceiling-water-leak",
  "faucet-dripping",
  "toilet-leaking-at-base",
  "drain-clogged",
  "shower-drain-backing-up",
  "main-sewer-line-clogged",
  "slow-draining-sink",
  "gurgling-drains",
  "low-water-pressure",
  "no-water-in-house",
  "uneven-water-pressure",
  "water-pressure-drops-suddenly",
  "toilet-keeps-running",
  "garbage-disposal-not-working",
  "dishwasher-not-draining",
  "sink-not-draining",
] as const;
