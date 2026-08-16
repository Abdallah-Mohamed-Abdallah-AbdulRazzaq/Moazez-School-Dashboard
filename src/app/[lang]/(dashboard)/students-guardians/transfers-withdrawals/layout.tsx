// FILE: src/app/[lang]/(dashboard)/students-guardians/transfers-withdrawals/layout.tsx

import StudentsGuardiansPermissionGuard from "@/features/students-guardians/shared/components/StudentsGuardiansPermissionGuard";

export default function TransfersWithdrawalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentsGuardiansPermissionGuard permissions={["students.lifecycle.manage"]}>
      <div className="p-4 sm:p-6">{children}</div>
    </StudentsGuardiansPermissionGuard>
  );
}
