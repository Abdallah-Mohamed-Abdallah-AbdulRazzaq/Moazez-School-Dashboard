// FILE: src/app/[lang]/(dashboard)/students-guardians/transfers-withdrawals/page.tsx

import { redirect } from "next/navigation";

export default async function TransfersWithdrawalsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Redirect to transfers tab by default
  redirect(
    `/${lang}/students-guardians/transfers-withdrawals/transfers`,
  );
}
