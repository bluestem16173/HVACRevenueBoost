export type Component = "compressor" | "evaporator coil" | "condenser" | "thermostat" | "control board" | "blower motor" | "refrigerant line" | "capacitor" | "contactor";

export interface Repair {
  id: string;
  name: string;
  description: string;
  estimatedCost: "low" | "medium" | "high";
  component: Component;
}

export interface Cause {
  id: string;
  name: string;
  explanation: string;
  component: Component;
  repairs: string[]; // IDs of Repairs
}

export interface Symptom {
  id: string;
  name: string;
  description: string;
  causes: string[]; // IDs of Causes
}

export interface City {
  name: string;
  slug: string;
  state: string;
}

export const REPAIRS: Record<string, Repair> = {
  "recharge-refrigerant": {
    id: "recharge-refrigerant",
    name: "Refrigerant Recharge",
    description: "Adding refrigerant to the system to restore cooling performance.",
    estimatedCost: "medium",
    component: "refrigerant line",
  },
  "replace-capacitor": {
    id: "replace-capacitor",
    name: "Start/Run Capacitor Replacement",
    description: "Replacing a failed capacitor that helps the compressor or fan motor start.",
    estimatedCost: "low",
    component: "capacitor",
  },
  "clean-evaporator-coil": {
    id: "clean-evaporator-coil",
    name: "Evaporator Coil Cleaning",
    description: "Removing dust and debris from the indoor coil to improve heat exchange.",
    estimatedCost: "low",
    component: "evaporator coil",
  },
  "replace-blower-motor": {
    id: "replace-blower-motor",
    name: "Blower Motor Replacement",
    description: "Installing a new motor for the indoor air handler unit.",
    estimatedCost: "high",
    component: "blower motor",
  },
  "replace-thermostat": {
    id: "replace-thermostat",
    name: "Thermostat Replacement",
    description: "Upgrading or replacing a faulty wall thermostat.",
    estimatedCost: "low",
    component: "thermostat",
  },
  "replace-compressor": {
    id: "replace-compressor",
    name: "Compressor Replacement",
    description: "Replacing the main pump in the outdoor unit.",
    estimatedCost: "high",
    component: "compressor",
  },
};

export const CAUSES: Record<string, Cause> = {
  "refrigerant-leak": {
    id: "refrigerant-leak",
    name: "Low Refrigerant Levels",
    explanation: "A leak in the refrigerant lines prevents the system from absorbing heat efficiently.",
    component: "refrigerant line",
    repairs: ["recharge-refrigerant"],
  },
  "failed-capacitor": {
    id: "failed-capacitor",
    name: "Blown Start Capacitor",
    explanation: "The capacitor provides the electrical 'kick' needed to start the compressor; without it, the motor won't turn.",
    component: "capacitor",
    repairs: ["replace-capacitor"],
  },
  "dirty-coils": {
    id: "dirty-coils",
    name: "Dirty Evaporator Coils",
    explanation: "Dust buildup on the coils restricts airflow and stops heat absorption.",
    component: "evaporator coil",
    repairs: ["clean-evaporator-coil"],
  },
  "faulty-thermostat": {
    id: "faulty-thermostat",
    name: "Incorrect Thermostat Calibration",
    explanation: "If the thermostat fails to sense the correct temperature, it won't signal the HVAC to run.",
    component: "thermostat",
    repairs: ["replace-thermostat"],
  },
};

export const SYMPTOMS: Symptom[] = [
  {
    id: "ac-blowing-warm-air",
    name: "AC Blowing Warm Air",
    description: "Your air conditioner is running, but the air coming out of the vents is not cold.",
    causes: ["refrigerant-leak", "dirty-coils", "failed-capacitor"],
  },
  {
    id: "ac-not-turning-on",
    name: "AC System Won't Turn On",
    description: "The entire HVAC system is unresponsive when you try to start it.",
    causes: ["faulty-thermostat", "failed-capacitor"],
  },
];

export const CITIES: City[] = [
  { name: "Phoenix", slug: "phoenix", state: "AZ" },
  { name: "Houston", slug: "houston", state: "TX" },
  { name: "Miami", slug: "miami", state: "FL" },
];
