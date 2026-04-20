import "dotenv/config";
import DiagnoseCatchAllPage from "../app/diagnose/[...slug]/page";

async function run() {
  console.log("Starting render...");
  try {
    const slug = "repair-or-replace-not-cooling-on-generator";
    const result = await DiagnoseCatchAllPage({ params: { slug: slug.split("/").filter(Boolean) } });
    console.log('Render complete! Got result type:', typeof result);
  } catch (err) {
    console.error('Render threw an error:', err);
  }
  process.exit(0);
}

run().catch(console.error);
