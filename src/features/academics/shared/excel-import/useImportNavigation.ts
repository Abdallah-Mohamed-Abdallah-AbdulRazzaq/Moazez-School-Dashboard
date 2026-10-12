import { useEffect } from "react";
import { useDirtyKey } from "@/hooks/useDirtyKey";
import { useNavigationGuard } from "@/providers/NavigationGuardProvider";

export function useImportNavigation(request: { key: string; questionCount: number }) {
  const { markDirty, clearDirty } = useDirtyKey(request.key);
  const { guardedNavigate } = useNavigationGuard();
  useEffect(() => {
    if (request.questionCount) markDirty();
    else clearDirty();
  }, [request.questionCount, markDirty, clearDirty]);
  return { clearDirty, guardedNavigate };
}
