import "dotenv/config";
import { renderHvacTwoSegment } from "../lib/programmatic-pages/catchAllDbRoutes";

async function main() {
  const result = await renderHvacTwoSegment("ac-not-cooling");

  console.log("COMPONENT RENDER RESULT:");
  console.log("Type:", (result as any)?.type);
  if ((result as any)?.props?.style) {
    console.log("Style:", (result as any).props.style);
  } else {
    console.log("It did not return a styled div.");
  }

  if ((result as any)?.type?.name === "SymptomPageTemplate") {
    console.log("RETURNED LEGACY SymptomPageTemplate!");
  }

  process.exit(0);
}

main().catch(console.error);
