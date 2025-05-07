import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shared Conversation',
  description: 'View a shared AI conversation',
  openGraph: {
    title: 'Shared AI Conversation',
    description: 'View a shared AI conversation from Machine',
    images: ['/kortix-logo.png'],
  },
};

export default function ThreadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
