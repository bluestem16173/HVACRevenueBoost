import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | HVAC Revenue Boost",
  description: "Get HVAC help now. Connect with local HVAC technicians and service providers today.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
