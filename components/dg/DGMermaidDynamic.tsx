"use client";

import dynamic from "next/dynamic";
import type { DGMermaidProps } from "@/components/dg/DGMermaid";

const DGMermaid = dynamic<DGMermaidProps>(() => import("@/components/dg/DGMermaid"), {
  ssr: false,
});

export { DGMermaid };
