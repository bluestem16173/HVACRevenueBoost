import PillarPage from "@/components/PillarPage";

export const revalidate = 3600;

export default function HVACAirflowDuctworkPillar() {
  return (
    <PillarPage
      slug="hvac-airflow-ductwork"
      name="HVAC Airflow & Ductwork"
      description="Airflow restrictions, duct leaks, blower issues, and ventilation problems. Diagnostic procedures for uneven cooling and airflow."
    />
  );
}
