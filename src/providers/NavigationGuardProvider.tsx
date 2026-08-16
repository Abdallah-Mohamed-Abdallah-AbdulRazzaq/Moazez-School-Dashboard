"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { useUnsavedChanges } from "./UnsavedChangesProvider";
import Modal from "@/components/ui/modal/Modal";
import { useTranslations } from "next-intl";

interface NavigationGuardContextType {
  guardedNavigate: (action: () => void) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextType | undefined>(
  undefined
);

export function NavigationGuardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isDirty, resetAll } = useUnsavedChanges();
  const pathname = usePathname();
  const t = useTranslations("common");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  // Track if we're in the middle of handling a popstate event
  const isHandlingPopState = useRef(false);
  const lastPathname = useRef(pathname);

  // beforeunload handler for browser refresh/close
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // popstate handler for browser back/forward navigation
  useEffect(() => {
    if (!isDirty) {
      lastPathname.current = pathname;
      return;
    }

    const handlePopState = (e: PopStateEvent) => {
      // If we're already handling a popstate, don't recurse
      if (isHandlingPopState.current) return;
      
      isHandlingPopState.current = true;

      // User clicked back/forward with unsaved changes
      // Push the current state back to prevent navigation
      window.history.pushState(null, "", lastPathname.current);
      
      // Show confirmation dialog
      setPendingAction(() => () => {
        // If user confirms, reset dirty state and navigate
        resetAll();
        isHandlingPopState.current = false;
        
        // Navigate to the intended location
        // We need to go back/forward to the original destination
        const direction = e.state?.direction || 'back';
        if (direction === 'forward') {
          window.history.forward();
        } else {
          window.history.back();
        }
      });
      setIsDialogOpen(true);
      
      // Reset the flag after a short delay
      setTimeout(() => {
        isHandlingPopState.current = false;
      }, 100);
    };

    window.addEventListener("popstate", handlePopState);
    
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isDirty, resetAll, pathname]);

  // Update last pathname when it changes and we're not dirty
  useEffect(() => {
    if (!isDirty) {
      lastPathname.current = pathname;
    }
  }, [pathname, isDirty]);

  const guardedNavigate = useCallback(
    (action: () => void) => {
      if (!isDirty) {
        // No unsaved changes, proceed immediately
        action();
      } else {
        // Has unsaved changes, show confirm dialog
        setPendingAction(() => action);
        setIsDialogOpen(true);
      }
    },
    [isDirty]
  );

  const handleStay = () => {
    setIsDialogOpen(false);
    setPendingAction(null);
    isHandlingPopState.current = false;
  };

  const handleLeave = () => {
    setIsDialogOpen(false);
    if (pendingAction) {
      // Reset dirty state before navigating
      resetAll();
      pendingAction();
    }
    setPendingAction(null);
  };

  return (
    <NavigationGuardContext.Provider value={{ guardedNavigate }}>
      {children}
      
      <Modal
        isOpen={isDialogOpen}
        onClose={handleStay}
        title={t("unsavedChangesTitle")}
        size="sm"
        closeOnOverlayClick={false}
        closeOnEscape={true}
        footer={
          <>
            <button
              onClick={handleStay}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t("stay")}
            </button>
            <button
              onClick={handleLeave}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              {t("leave")}
            </button>
          </>
        }
      >
        <p className="text-gray-600">{t("unsavedChangesBody")}</p>
      </Modal>
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  const context = useContext(NavigationGuardContext);
  if (!context) {
    throw new Error(
      "useNavigationGuard must be used within NavigationGuardProvider"
    );
  }
  return context;
}
