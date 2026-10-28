import { PrefetchLink } from '@/components/PrefetchLink';
import { ChartTable } from '@/components/loq/ChartTable';
import { SectionHead } from '@/components/loq/ui';
import { browseHref } from '@/components/music/links';
import { Shelves } from '@/components/music/ShelfView';
import { LoadError } from '@/components/music/States';
import { useCategories, useExplore } from '@/data/music/queries';
import { NewSkeleton } from '@/skeletons/PageSkeletons';
import { GLOBAL_CHART, useChart } from './HomePage';

/** Mood and genre chips, as glossy pills in each category's own colour. */
function MoodChips() {
  const categories = useCategories();
  const all = categories.data?.flatMap((g) => g.categories).slice(0, 24) ?? [];
  if (!all.length) return null;
  return (
    <section className="mt-8">
      <SectionHead over="Find your" title="Mood" to="/browse-all" />
      <div className="mx-(--body-gutter) flex flex-wrap gap-2.5">
        {all.map((c) => (
          <PrefetchLink
            key={`${c.link.browseId}-${c.link.params}`}
            to={browseHref(c.link)}
            className="rounded-full border border-[#ffffff26] px-4 py-2 type-[700_13px/16px] text-white shadow-[inset_0_1px_0_#fff5,0_3px_0_#0006,0_8px_16px_#0005] transition-transform active:translate-y-0.5"
            style={{ background: `linear-gradient(180deg,#ffffff30,#ffffff00 60%), color-mix(in srgb, ${c.color} 62%, #120d1d)` }}
          >
            {c.title}
          </PrefetchLink>
        ))}
      </div>
    </section>
  );
}

/** Discover: moods, the global chart, then YouTube Music's Explore. */
export default function DiscoverPage() {
  const explore = useExplore();
  const chart = useChart();
  const source = { title: 'Global Top 50', type: 'playlist' as const, id: GLOBAL_CHART };
  return (
    <div className="pt-8 max-sm:pt-4">
      <header className="mx-(--body-gutter)">
        <p className="type-[600_14px/18px] text-secondary">What’s hot right now</p>
        <h1 className="type-[800_34px/40px] tracking-[-0.02em]">Discover</h1>
      </header>
      <MoodChips />
      {chart.data && (
        <section className="mt-10">
          <SectionHead over="Charts" title="Global Top 50" to={`/playlist/${GLOBAL_CHART}`} />
          <ChartTable tracks={chart.data.tracks.slice(0, 15)} source={source} />
        </section>
      )}
      {explore.isError ? (
        <LoadError error={explore.error} onRetry={() => void explore.refetch()} />
      ) : !explore.data ? (
        <NewSkeleton />
      ) : (
        <Shelves shelves={explore.data} />
      )}
    </div>
  );
}
