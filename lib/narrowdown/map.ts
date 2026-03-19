import { AC_NOT_COOLING_TREE, AIRFLOW_TREE, POWER_TREE } from "./trees";

export const TREE_MAP: Record<string, any> = {
  "ac-not-cooling": AC_NOT_COOLING_TREE,
  "no-airflow": AIRFLOW_TREE,
  "weak-airflow": AIRFLOW_TREE,
  "hvac-not-turning-on": POWER_TREE,
  "ac-system-not-turning-on": POWER_TREE,
  "ac-not-blowing-cold-air": AC_NOT_COOLING_TREE,
  "central-ac-not-cooling": AC_NOT_COOLING_TREE,
};

export const DEFAULT_TREE = AC_NOT_COOLING_TREE;
