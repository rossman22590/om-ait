import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Agent | Machine',
  description: 'Interactive agent playground powered by Machine',
  openGraph: {
    title: 'Agent Playground | Machine',
    description: 'Interactive agent playground powered by Machine',
    type: 'website',
  },
};

export default function NewAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
