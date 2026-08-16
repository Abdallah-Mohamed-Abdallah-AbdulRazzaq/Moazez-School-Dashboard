import MainLoader from "@/components/ui/loaders/MainLoader";

/**
 * Reusable page loading component for App Router loading.tsx files
 * Uses the main loader with consistent full-screen layout
 */
export default function PageLoading() {
  return <MainLoader />;
}
