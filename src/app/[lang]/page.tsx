import { redirect } from "next/navigation";

export default async function Home({params}: {params: {lang: string}}) {
  const locale = params.lang
  redirect(`/${locale}/dashboard`);
}
