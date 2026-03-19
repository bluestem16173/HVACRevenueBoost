import { 
  AC_NOT_COOLING_REPAIRS, 
  NO_AIRFLOW_REPAIRS, 
  POWER_ISSUE_REPAIRS, 
  DEFAULT_REPAIRS 
} from "./repairs";

export const REPAIR_MAP: Record<string, typeof AC_NOT_COOLING_REPAIRS> = {
  "ac-not-cooling": AC_NOT_COOLING_REPAIRS,
  "no-airflow": NO_AIRFLOW_REPAIRS,
  "weak-airflow": NO_AIRFLOW_REPAIRS,
  "hvac-not-turning-on": POWER_ISSUE_REPAIRS,
  "ac-system-not-turning-on": POWER_ISSUE_REPAIRS,
  "ac-not-blowing-cold-air": AC_NOT_COOLING_REPAIRS,
  "central-ac-not-cooling": AC_NOT_COOLING_REPAIRS,
};

export const FALLBACK_REPAIRS = DEFAULT_REPAIRS;
