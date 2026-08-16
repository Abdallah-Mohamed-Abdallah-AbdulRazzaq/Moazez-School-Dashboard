import { ToastProvider } from "@/components/ui/toast/Toast";
import { AuthBrandPanel } from "@/features/auth/components/AuthBrandPanel";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";

export default function ChangePasswordPage() {
  const currentYear = new Date().getFullYear();

  return (
    <ToastProvider>
      <AuthLayout brandPanel={<AuthBrandPanel />}>
        <ChangePasswordForm currentYear={currentYear} />
      </AuthLayout>
    </ToastProvider>
  );
}
