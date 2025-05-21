import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agent Conversation | Machine',
  description: 'Interactive agent conversation powered by Kortix Suna',
  openGraph: {
    title: 'Agent Conversation | Machine',
    description: 'Interactive agent conversation powered by Kortix Suna',
    type: 'website',
  },
};

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
