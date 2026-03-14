import PillarPage from "@/components/PillarPage";

export const revalidate = 3600;

export default function HVACHeatingSystemsPillar() {
  return (
    <PillarPage
      slug="hvac-heating-systems"
      name="HVAC Heating Systems"
      description="Gas furnaces, heat pumps in heating mode, and electric heat. Heating failure diagnostics, ignition issues, and repair guides."
    />
  );
}
