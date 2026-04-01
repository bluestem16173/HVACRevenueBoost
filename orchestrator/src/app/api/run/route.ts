import { NextResponse } from 'next/server';
import { exec } from 'child_process';

export async function POST(req: Request) {
  const { project, batchSize, maxCost } = await req.json();

  // 🔒 HARD GUARDS
  if (batchSize > 100) {
    return NextResponse.json({ error: 'Batch too large (max 100)' });
  }

  if (batchSize <= 0) {
    return NextResponse.json({ error: 'Invalid batch size' });
  }

  const estimatedCost = batchSize * 0.02;

  if (estimatedCost > maxCost) {
    return NextResponse.json({
      error: `Estimated cost $${estimatedCost.toFixed(2)} exceeds limit`,
    });
  }

  try {
    // 🔥 RUN WORKER
    await new Promise((resolve, reject) => {
      // NOTE: Executing in parent directory '..' because the Next app is in 'orchestrator' subfolder
      exec(`npm run worker:run -- --limit ${batchSize}`, { cwd: '..' }, (err, stdout) => {
        if (err) reject(err);
        resolve(stdout);
      });
    });

    // 🧪 MOCK RESULTS FOR NOW (replace with real DB fetch)
    const urls = Array.from({ length: batchSize }).map(
      (_, i) => `/generated/page-${i}`
    );

    return NextResponse.json({
      success: true,
      urls,
      cost: estimatedCost,
      completed: batchSize,
    });

  } catch (err) {
    return NextResponse.json({
      error: 'Worker failed to execute',
    });
  }
}
