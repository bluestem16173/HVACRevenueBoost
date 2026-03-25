import { DiagnosticData } from "@/types/diagnostic";
import AISummary from "./AISummary";
import SystemFlow from "./SystemFlow";
import CausesTable from "./CausesTable";
import DiagnosticFlow from "./DiagnosticFlow";
import DeepDive from "./DeepDive";

export default function GoldStandardPage({
  data,
}: {
  data: DiagnosticData;
}) {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <AISummary data={data.ai_summary} />

      <SystemFlow chart={data.system_flow} />

      <CausesTable causes={data.causes} />

      <DiagnosticFlow chart={data.diagnostic_flow} />

      <DeepDive causes={data.deep_causes} />
    </div>
  );
}
