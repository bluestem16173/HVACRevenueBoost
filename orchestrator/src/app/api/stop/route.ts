import { exec } from 'child_process';
import { NextResponse } from 'next/server';

export async function GET() {
  if (process.platform === 'win32') {
    // Windows requires wmic to terminate specifically by command line to avoid killing the dev server
    exec('wmic process where "commandline like \'%worker%\' and name=\'node.exe\'" call terminate');
  } else {
    // Unix fallback
    exec('pkill -f worker');
  }
  
  return NextResponse.json({ stopped: true });
}
