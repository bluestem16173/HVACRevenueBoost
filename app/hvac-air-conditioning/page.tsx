import PillarPage from "@/components/PillarPage";

export const revalidate = 3600;

export default function HVACAirConditioningPillar() {
  return (
    <PillarPage
      slug="hvac-air-conditioning"
      name="HVAC Air Conditioning"
      description="Central air conditioning systems, heat pumps, and cooling diagnostics. Common AC problems, repair pathways, and technician verification procedures."
    />
  );
}
