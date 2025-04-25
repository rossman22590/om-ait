import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Conversation | AI Tutor Machine",
  description: "Interactive agent conversation powered by AI Tutor Machine",
  openGraph: {
    title: "Agent Conversation | AI Tutor Machine",
    description: "Interactive agent conversation powered by AI Tutor Machine",
    type: "website",
  },
};

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 