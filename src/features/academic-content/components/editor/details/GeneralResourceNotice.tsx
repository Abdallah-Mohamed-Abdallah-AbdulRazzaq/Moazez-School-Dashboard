export default function GeneralResourceNotice() {
  return (
    <section id="details" aria-labelledby="details-heading" className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 id="details-heading" className="text-lg font-semibold text-gray-900">General resource</h2>
      <p className="mt-2 text-sm text-gray-600">
        General resources have no type-specific detail payload. Use basic information,
        targets, files, links, and tags to complete this resource.
      </p>
    </section>
  );
}
