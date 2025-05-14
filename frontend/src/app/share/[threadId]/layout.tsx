import { Metadata } from 'next';
import { getThread, getProject } from '@/lib/api-server';

export async function generateMetadata({ params }): Promise<Metadata> {
  const { threadId } = await params;
  const fallbackMetaData = {
    title: 'Shared Conversation | Machine',
    description: 'Replay this Agent conversation on Machine',
    openGraph: {
      title: 'Shared Conversation | Machine',
      description: 'Replay this Agent conversation on Machine',
      images: [`${process.env.NEXT_PUBLIC_URL}/share-page/meta.png`],
    },
  };


  try {
    const threadData = await getThread(threadId);
    const projectData = await getProject(threadData.project_id);

    if (!threadData || !projectData) {
      return fallbackMetaData;
    }

    const isDevelopment =
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_ENV_MODE === 'LOCAL' ||
      process.env.NEXT_PUBLIC_ENV_MODE === 'local';

      const title = projectData.name || 'Shared Conversation | Machine';
      const description = projectData.description || 'Replay this Agent conversation on Machine';
      const ogImage = isDevelopment
        ? `${process.env.NEXT_PUBLIC_URL}/share-page/meta.png`
        : `${process.env.NEXT_PUBLIC_URL}/api/share-page/og-image?title=${projectData.name}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [ogImage],
      },
      twitter: {
        title,
        description,
        images: ogImage,
        creator: '@kortixai',
        card: 'summary_large_image',
      },
    };
  } catch (error) {
    return fallbackMetaData;
  }
}

export default async function ThreadLayout({ children }) {
  return <>{children}</>;
}
