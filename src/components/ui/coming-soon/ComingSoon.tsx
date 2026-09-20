import type { LucideIcon } from "lucide-react";
import { useId } from "react";

export interface ComingSoonProps {
  badge: string;
  description: string;
  featureLabels?: {
    audience: string;
    createdBy: string;
  };
  features?: readonly ComingSoonFeature[];
  featuresTitle?: string;
  icon: LucideIcon;
  title: string;
}

export interface ComingSoonFeature {
  audience: string;
  createdBy: string;
  description: string;
  icon: LucideIcon;
  title: string;
}

export function ComingSoon({
  badge,
  description,
  featureLabels,
  features,
  featuresTitle,
  icon: Icon,
  title,
}: ComingSoonProps) {
  const headingId = useId();
  const featuresHeadingId = useId();
  const upcomingFeatures = features ?? [];
  const hasFeatures = upcomingFeatures.length > 0;

  return (
    <section
      aria-labelledby={headingId}
      className="relative isolate flex min-h-[calc(100dvh-10rem)] items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white px-5 py-12 shadow-sm sm:px-8"
    >
      <div
        aria-hidden="true"
        className="absolute -left-24 top-8 size-56 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-20 bottom-0 size-64 rounded-full bg-cyan-100/70 blur-3xl"
      />
      <div className="relative w-full">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-[#017b91] text-white shadow-lg shadow-primary/20 ring-8 ring-primary/5">
            <Icon aria-hidden="true" className="size-10" />
          </div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            {badge}
          </p>
          <h1
            id={headingId}
            className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-600">
            {description}
          </p>
          <div className="mx-auto mt-8 h-1.5 w-28 overflow-hidden rounded-full bg-primary/10">
            <div className="h-full rounded-full bg-primary" />
          </div>
        </div>
        {hasFeatures && featureLabels && featuresTitle ? (
          <section
            aria-labelledby={featuresHeadingId}
            className="mx-auto mt-12 max-w-5xl"
          >
            <h2
              id={featuresHeadingId}
              className="text-center text-xl font-bold text-slate-900 sm:text-2xl"
            >
              {featuresTitle}
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingFeatures.map((feature) => {
                const FeatureIcon = feature.icon;

                return (
                  <article
                    key={feature.title}
                    className="rounded-2xl border border-slate-200 bg-white/80 p-5 text-start shadow-sm"
                  >
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FeatureIcon aria-hidden="true" className="size-5" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-slate-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {feature.description}
                    </p>
                    <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs">
                      <div>
                        <dt className="font-semibold text-slate-500">
                          {featureLabels.createdBy}
                        </dt>
                        <dd className="mt-0.5 font-medium text-slate-700">
                          {feature.createdBy}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500">
                          {featureLabels.audience}
                        </dt>
                        <dd className="mt-0.5 font-medium text-slate-700">
                          {feature.audience}
                        </dd>
                      </div>
                    </dl>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}

export default ComingSoon;
