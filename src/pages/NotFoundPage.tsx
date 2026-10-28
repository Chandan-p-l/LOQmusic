import { PageHeader } from '@/components/PageHeader';
import { PrefetchLink } from '@/components/PrefetchLink';
import { useRouteMeta } from '@/lib/pageMeta';

export default function NotFoundPage() {
  useRouteMeta({ title: 'Page not found · LOQmusic', description: 'This page doesn’t exist on LOQmusic.', noindex: true });
  return (
    <>
      <PageHeader title="Page not found" />
      <p className="mx-(--body-gutter) my-2 type-title-3 text-secondary">
        This page doesn’t exist. <PrefetchLink to="/home" className="text-key hover:underline">Go to Home</PrefetchLink>
      </p>
    </>
  );
}
