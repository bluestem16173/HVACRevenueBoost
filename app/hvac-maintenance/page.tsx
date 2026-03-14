import PillarPage from "@/components/PillarPage";

export const revalidate = 3600;

export default function HVACMaintenancePillar() {
  return (
    <PillarPage
      slug="hvac-maintenance"
      name="HVAC Maintenance"
      description="Preventive maintenance, drain cleaning, filter replacement, and efficiency issues. Water leaks, odors, and high-energy consumption."
    />
  );
}
