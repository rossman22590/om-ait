import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Keys | Machine',
  description: 'Manage your API keys for programmatic access to Machine',
  openGraph: {
    title: 'API Keys | Machine',
    description: 'Manage your API keys for programmatic access to Machine',
    type: 'website',
  },
};

export default async function APIKeysLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
