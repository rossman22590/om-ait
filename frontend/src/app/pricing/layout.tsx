import { Metadata } from "next";
import { Navbar } from "@/components/home/sections/navbar";

export const metadata: Metadata = {
  title: "Pricing | Machine - Autonomous AI Agent",
  description: "Choose the perfect plan for your needs. Machine offers flexible pricing tiers designed for individuals, professionals, and enterprises."
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar />
      {children}
    </main>
  );
}
