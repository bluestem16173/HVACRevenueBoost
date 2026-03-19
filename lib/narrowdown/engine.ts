export type NarrowDownStep = {
  question: string;
  yes: string;   // next step OR diagnosis
  no: string;    // next step OR diagnosis
};

export type NarrowDownEngine = {
  entry: string;
  steps: Record<string, NarrowDownStep>;
};

export function validateTree(engine: NarrowDownEngine) {
  if (!engine.entry) return false;

  const keys = Object.keys(engine.steps);

  for (const key of keys) {
    const step = engine.steps[key];

    if (!step.question || !step.yes || !step.no) {
      return false;
    }
  }

  return true;
}

export function runNarrowDown(engine: NarrowDownEngine) {
  const path = [];
  let current = engine.entry;

  let safety = 0;

  // Render the whole tree as a flat array for the UI component interactive builder
  while (current && safety < 10) {
    const step = engine.steps[current];
    if (!step) break;

    path.push({
      id: current,
      question: step.question,
      yes: step.yes,
      no: step.no
    });

    current = step.yes;
    safety++;
  }

  return path;
}
