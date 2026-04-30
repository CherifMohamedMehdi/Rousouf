/**
 * RelatedDocuments — up to 5 related cards, grouped by organization or by
 * a shared theme. Shown in a sidebar rail below the main content.
 */
import type { Document } from '@/types/directus';
import ResultCard from '@/components/search/ResultCard';

interface Props {
  heading: string;
  items: Document[];
}

export default function RelatedDocuments({ heading, items }: Props) {
  if (!items.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-brand-blue">{heading}</h2>
      <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((doc) => (
          <li key={doc.id}>
            <ResultCard document={doc} variant="compact" />
          </li>
        ))}
      </ul>
    </section>
  );
}
