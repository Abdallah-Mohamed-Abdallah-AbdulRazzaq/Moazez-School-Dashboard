"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import GlobalMessageNotifications from "@/features/communication/components/GlobalMessageNotifications";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useBrandingProfile } from "@/features/settings/hooks/useBrandingProfile";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function SideBarTopNav({ children }: LayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { user } = useAuth();
  const { profile: brandingProfile } = useBrandingProfile();

  // Hide sidebar/topnav on conversation pages (full-screen chat)
  const isFullScreenChat = pathname.includes("/communication/conversations");

  // Detect if current locale is RTL
  const isRTL = locale === "ar";
  const userName =
    user === null
      ? "Ahmed Mostafa"
      : `${user.firstName} ${user.lastName}`.trim();
  const userRole = user?.activeMembership?.roleKey ?? user?.userType;
  const schoolName = brandingProfile?.schoolName?.trim() || t("school_name");
  const shortSchoolName = brandingProfile?.shortName?.trim() || schoolName;

  // Set initial sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleToggle = () => {
      setIsSidebarOpen((prev) => !prev);
    };
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  // Full-screen mode for conversations — collapse sidebar (expandable) and hide topnav
  if (isFullScreenChat) {
    return (
      <div className="h-[100dvh] overflow-x-clip bg-gray-50">
        <GlobalMessageNotifications />
        <Sidebar
          onSelect={() => {}}
          schoolName={schoolName}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isRTL={isRTL}
        />
        <div
          className={`flex h-[100dvh] flex-col transition-all duration-300 ${isRTL ? (isSidebarOpen ? "lg:mr-[260px]" : "lg:mr-20") : isSidebarOpen ? "lg:ml-[260px]" : "lg:ml-20"}`}
        >
          <div className="bg-background h-full min-h-0">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-gray-50">
      <GlobalMessageNotifications />
      <Sidebar
        onSelect={() => {}}
        schoolName={schoolName}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isRTL={isRTL}
      />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isRTL ? (isSidebarOpen ? "lg:mr-[260px]" : "lg:mr-20") : isSidebarOpen ? "lg:ml-[260px]" : "lg:ml-20"}`}
      >
        <TopNav
          userName={userName}
          userRole={userRole}
          schoolName={shortSchoolName}
          onSearchChange={(value) => console.log("Search:", value)}
          onProfileClick={() => console.log("Profile clicked")}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
        <div className="bg-background min-h-[calc(100vh-89px)]">{children}</div>
      </div>
    </div>
  );
}
