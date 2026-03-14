import PillarPage from "@/components/PillarPage";

export const revalidate = 3600;

export default function HVACThermostatsControlsPillar() {
  return (
    <PillarPage
      slug="hvac-thermostats-controls"
      name="HVAC Thermostats & Controls"
      description="Thermostat calibration, display issues, and control board diagnostics. System not responding to thermostat settings."
    />
  );
}
