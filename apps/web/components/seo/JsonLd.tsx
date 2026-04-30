/**
 * Renders a schema.org JSON-LD <script>. Accepts any serializable object
 * (see lib/seo/jsonLd.ts for our builders).
 */
export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
