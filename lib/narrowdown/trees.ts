import { NarrowDownEngine } from "./engine";

export const AC_NOT_COOLING_TREE: NarrowDownEngine = {
  entry: "power_check",
  steps: {
    power_check: {
      question: "Is the system turning on at all?",
      yes: "airflow_check",
      no: "power_issue"
    },
    airflow_check: {
      question: "Is air coming from the vents?",
      yes: "temperature_check",
      no: "fan_issue"
    },
    temperature_check: {
      question: "Is the air warm instead of cool?",
      yes: "refrigerant_or_compressor",
      no: "intermittent_issue"
    },
    power_issue: {
      question: "Check breaker, thermostat, or wiring",
      yes: "diagnosis_complete",
      no: "call_tech"
    },
    fan_issue: {
      question: "Blower motor or capacitor may have failed",
      yes: "diagnosis_complete",
      no: "call_tech"
    },
    refrigerant_or_compressor: {
      question: "Likely refrigerant issue or compressor failure",
      yes: "call_tech",
      no: "call_tech"
    },
    intermittent_issue: {
      question: "System may be short cycling or sensor-related",
      yes: "call_tech",
      no: "call_tech"
    }
  }
};

export const AIRFLOW_TREE: NarrowDownEngine = {
  entry: "filter_check",
  steps: {
    filter_check: {
      question: "Is the air filter noticeably dirty or clogged?",
      yes: "replace_filter",
      no: "blower_check"
    },
    replace_filter: {
      question: "Does airflow improve after removing the filter for 5 mins?",
      yes: "diagnosis_complete",
      no: "blower_check"
    },
    blower_check: {
      question: "Can you hear the indoor blower motor running?",
      yes: "duct_check",
      no: "electrical_issue"
    },
    duct_check: {
      question: "Are there partially closed vents or objects blocking returns?",
      yes: "open_vents",
      no: "call_tech"
    },
    open_vents: {
      question: "Did opening vents and clearing returns restore airflow?",
      yes: "diagnosis_complete",
      no: "call_tech"
    },
    electrical_issue: {
      question: "Likely a failed capacitor, blower motor, or control board.",
      yes: "call_tech",
      no: "call_tech"
    }
  }
};

export const POWER_TREE: NarrowDownEngine = {
  entry: "thermostat_check",
  steps: {
    thermostat_check: {
      question: "Is the thermostat screen completely blank?",
      yes: "battery_check",
      no: "sys_breaker_check"
    },
    battery_check: {
      question: "Did replacing the batteries turn the screen on?",
      yes: "mode_check",
      no: "sys_breaker_check"
    },
    mode_check: {
      question: "Is it set to cool/heat and fan to auto?",
      yes: "wait_delay",
      no: "set_mode"
    },
    set_mode: {
      question: "Did adjusting the thermostat settings start the system?",
      yes: "diagnosis_complete",
      no: "call_tech"
    },
    sys_breaker_check: {
      question: "Is the HVAC breaker tripped in the electrical panel?",
      yes: "reset_breaker",
      no: "disconnect_check"
    },
    reset_breaker: {
      question: "Did the system start immediately after resetting (once)?",
      yes: "diagnosis_complete",
      no: "monitor_trip"
    },
    monitor_trip: {
      question: "Did the breaker trip again immediately? (Do NOT reset twice)",
      yes: "call_tech",
      no: "diagnosis_complete"
    },
    wait_delay: {
      question: "Did system start after the 5-minute safety delay?",
      yes: "diagnosis_complete",
      no: "call_tech"
    },
    disconnect_check: {
      question: "Likely a blown service disconnect fuse, bad contactor, or dead transformer.",
      yes: "call_tech",
      no: "call_tech"
    }
  }
};
