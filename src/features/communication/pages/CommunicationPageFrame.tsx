interface CommunicationPageFrameProps {
  title: string;
  subtitle: string;
  badge?: string;
}

export default function CommunicationPageFrame({
  title,
  subtitle,
  badge = "Communication",
}: CommunicationPageFrameProps) {
  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-3 inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
          {badge}
        </div>
        <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
