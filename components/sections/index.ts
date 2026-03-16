/**
 * Section Registry — Modular Layout System
 * ---------------------------------------
 * Maps section keys to components for dynamic rendering.
 * @see docs/MASTER-PROMPT-CANARY.md
 */

import type React from "react";
import HeroSection from "./HeroSection";
import TechnicianSummary from "./TechnicianSummary";
import FastAnswer from "./FastAnswer";
import MostCommonFix from "./MostCommonFix";
import DiagnosticFlow from "./DiagnosticFlow";
import GuidedFilters from "./GuidedFilters";
import Causes from "./Causes";
import Repairs from "./Repairs";
import RepairMatrix from "./RepairMatrix";
import Tools from "./Tools";
import Components from "./Components";
import Costs from "./Costs";
import Insights from "./Insights";
import Warnings from "./Warnings";
import Mistakes from "./Mistakes";
import EnvironmentalFactors from "./EnvironmentalFactors";
import Prevention from "./Prevention";
import CTA from "./CTA";
import FAQ from "./FAQ";
import InternalLinks from "./InternalLinks";

export const SECTION_MAP: Record<string, React.ComponentType<{ data: any; symptomName?: string }>> = {
  hero: HeroSection,
  technician_summary: TechnicianSummary,
  fast_answer: FastAnswer,
  most_common_fix: MostCommonFix,
  diagnostic_flow: DiagnosticFlow,
  guided_filters: GuidedFilters,
  causes: Causes,
  repairs: Repairs,
  repair_matrix: RepairMatrix,
  tools: Tools,
  components: Components,
  costs: Costs,
  insights: Insights,
  warnings: Warnings,
  mistakes: Mistakes,
  environmental_factors: EnvironmentalFactors,
  prevention: Prevention,
  cta: CTA,
  faq: FAQ,
  internal_links: InternalLinks,
};
