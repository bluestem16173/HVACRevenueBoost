import sql from "@/lib/db";

async function main() {
  console.log("🌞 Running Morning Approval Routine...");
  try {
    const result = await sql`
      UPDATE pages 
      SET quality_status = 'approved' 
      WHERE status = 'published' 
      AND content_html IS NOT NULL
      RETURNING slug;
    `;
    console.log(`✅ Approved ${result.length} clean pages.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Approval failed:", error);
    process.exit(1);
  }
}

main();
