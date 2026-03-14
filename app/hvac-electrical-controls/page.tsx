import PillarPage from "@/components/PillarPage";

export const revalidate = 3600;

export default function HVACElectricalControlsPillar() {
  return (
    <PillarPage
      slug="hvac-electrical-controls"
      name="HVAC Electrical & Controls"
      description="Capacitors, contactors, circuit breakers, and electrical fault diagnostics. Technician testing procedures for power and control issues."
    />
  );
}
