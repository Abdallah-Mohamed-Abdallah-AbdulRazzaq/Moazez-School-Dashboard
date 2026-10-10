import { redirect } from "next/navigation";

interface AcademicContentPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AcademicContentPage({
  params,
  searchParams,
}: AcademicContentPageProps) {
  const [{ lang }, filters] = await Promise.all([params, searchParams]);
  const query = new URLSearchParams();
  for (const [key, values] of Object.entries(filters)) {
    for (const value of Array.isArray(values) ? values : [values]) {
      if (value !== undefined) query.append(key, value);
    }
  }
  const suffix = query.size ? `?${query.toString()}` : "";
  redirect(`/${lang}/academic-content-hub/library${suffix}`);
}
