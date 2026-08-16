import { AuthBrandPanel } from "@/features/auth/components/AuthBrandPanel";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  const currentYear = new Date().getFullYear();

  return (
    <AuthLayout brandPanel={<AuthBrandPanel />}>
      <LoginForm currentYear={currentYear} />
    </AuthLayout>
  );
}
