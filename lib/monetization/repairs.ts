export type RepairItem = {
  cause: string;
  repair: string;
  cost_low: number;
  cost_high: number;
  difficulty: "easy" | "moderate" | "pro";
  urgency: "low" | "medium" | "high";
};

export const AC_NOT_COOLING_REPAIRS: RepairItem[] = [
  {
    cause: "Dirty air filter",
    repair: "Replace air filter",
    cost_low: 10,
    cost_high: 40,
    difficulty: "easy",
    urgency: "low"
  },
  {
    cause: "Bad capacitor",
    repair: "Replace capacitor",
    cost_low: 120,
    cost_high: 350,
    difficulty: "moderate",
    urgency: "medium"
  },
  {
    cause: "Low refrigerant",
    repair: "Recharge refrigerant",
    cost_low: 200,
    cost_high: 600,
    difficulty: "pro",
    urgency: "high"
  },
  {
    cause: "Failed compessor",
    repair: "Replace compressor",
    cost_low: 1200,
    cost_high: 2800,
    difficulty: "pro",
    urgency: "high"
  }
];

export const NO_AIRFLOW_REPAIRS: RepairItem[] = [
  {
    cause: "Clogged return filter",
    repair: "Replace filter",
    cost_low: 10,
    cost_high: 40,
    difficulty: "easy",
    urgency: "medium"
  },
  {
    cause: "Bad blower capacitor",
    repair: "Replace motor capacitor",
    cost_low: 120,
    cost_high: 250,
    difficulty: "moderate",
    urgency: "high"
  },
  {
    cause: "Failed blower motor",
    repair: "Replace indoor blower",
    cost_low: 400,
    cost_high: 1200,
    difficulty: "pro",
    urgency: "high"
  }
];

export const POWER_ISSUE_REPAIRS: RepairItem[] = [
  {
    cause: "Dead thermostat batteries",
    repair: "Replace AAA/AA batteries",
    cost_low: 5,
    cost_high: 15,
    difficulty: "easy",
    urgency: "medium"
  },
  {
    cause: "Tripped system breaker",
    repair: "Reset breaker at panel",
    cost_low: 0,
    cost_high: 0,
    difficulty: "easy",
    urgency: "low"
  },
  {
    cause: "Blown low voltage fuse",
    repair: "Replace 3A blade fuse on board",
    cost_low: 75,
    cost_high: 150,
    difficulty: "moderate",
    urgency: "high"
  },
  {
    cause: "Failed contactor",
    repair: "Replace compressor contactor",
    cost_low: 150,
    cost_high: 300,
    difficulty: "pro",
    urgency: "high"
  }
];

export const DEFAULT_REPAIRS: RepairItem[] = [
  {
    cause: "Minor maintenance issue",
    repair: "Basic tune-up / cleaning",
    cost_low: 80,
    cost_high: 150,
    difficulty: "easy",
    urgency: "low"
  },
  {
    cause: "Component failure",
    repair: "Replace failed part",
    cost_low: 150,
    cost_high: 450,
    difficulty: "pro",
    urgency: "medium"
  },
  {
    cause: "System breakdown",
    repair: "Major repair or replacement",
    cost_low: 800,
    cost_high: 4000,
    difficulty: "pro",
    urgency: "high"
  }
];
