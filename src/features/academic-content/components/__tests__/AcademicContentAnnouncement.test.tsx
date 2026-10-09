import type { ReactNode } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";
import arMessages from "@/messages/ar.json";
import { UnsavedChangesProvider } from "@/providers/UnsavedChangesProvider";
import { NavigationGuardProvider } from "@/providers/NavigationGuardProvider";
import { ProgressBarProvider } from "@/providers/ProgressBarProvider";
import {
  DashboardAnnouncementProvider,
  DashboardAnnouncementSlot,
} from "@/components/layout/DashboardAnnouncementPlacement";
import AcademicContentAnnouncement from "../AcademicContentAnnouncement";

vi.mock("next-intl", async (importOriginal) => importOriginal());

function AnnouncementTestProviders({
  children,
  locale = "en",
}: {
  children: ReactNode;
  locale?: "en" | "ar";
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "ar" ? arMessages : enMessages}
      timeZone="UTC"
    >
      <UnsavedChangesProvider>
        <NavigationGuardProvider>
          <ProgressBarProvider>{children}</ProgressBarProvider>
        </NavigationGuardProvider>
      </UnsavedChangesProvider>
    </NextIntlClientProvider>
  );
}

function PlacementPage({ showContext }: { showContext: boolean }) {
  return (
    <DashboardAnnouncementProvider>
      <header>Navbar</header>
      <AcademicContentAnnouncement userId="user-a" canView />
      {showContext ? (
        <section aria-label="Academic context">
          <p>Year and term selectors</p>
          <DashboardAnnouncementSlot />
        </section>
      ) : null}
      <main>Page content</main>
    </DashboardAnnouncementProvider>
  );
}

describe("Academic Content new-feature announcement", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ["en", "Explore", "Academic Content Hub", "New"],
    ["ar", "استكشف", "مركز المحتوى الأكاديمي", "جديد"],
  ] as const)("offers a localized hub link in %s", (locale, action, title, badge) => {
    render(
      <AnnouncementTestProviders locale={locale}>
        <AcademicContentAnnouncement userId="user-a" canView />
      </AnnouncementTestProviders>,
    );

    const banner = screen.getByRole("region", { name: title });
    expect(within(banner).getByText(badge)).toBeInTheDocument();
    expect(within(banner).getByRole("link", { name: action })).toHaveAttribute(
      "href",
      `/${locale}/academic-content-hub`,
    );
  });

  it("keeps dismissal after remount without hiding it from a different user", () => {
    const announcement = (userId: string) => (
      <AnnouncementTestProviders>
        <AcademicContentAnnouncement key={userId} userId={userId} canView />
      </AnnouncementTestProviders>
    );
    const mounted = render(announcement("user-a"));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss announcement" }));
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    mounted.unmount();

    const remounted = render(announcement("user-a"));
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    remounted.rerender(announcement("user-b"));
    expect(screen.getByRole("region")).toBeInTheDocument();
  });

  it("does not advertise the hub to users without view permission", () => {
    render(
      <AnnouncementTestProviders>
        <AcademicContentAnnouncement userId="user-a" canView={false} />
      </AnnouncementTestProviders>,
    );
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it.each(["getItem", "setItem"] as const)(
    "still closes when browser storage rejects %s",
    (storageMethod) => {
      vi.spyOn(Storage.prototype, storageMethod).mockImplementation(() => {
        throw new DOMException("Storage blocked", "SecurityError");
      });
      render(
        <AnnouncementTestProviders>
          <AcademicContentAnnouncement userId="user-a" canView />
        </AnnouncementTestProviders>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Dismiss announcement" }));
      expect(screen.queryByRole("region")).not.toBeInTheDocument();
    },
  );

  it("places one banner below context and returns below the navbar on other pages", () => {
    const page = (showContext: boolean) => (
      <AnnouncementTestProviders>
        <PlacementPage showContext={showContext} />
      </AnnouncementTestProviders>
    );
    const mounted = render(page(true));
    expect(screen.getAllByRole("region", { name: "Academic Content Hub" })).toHaveLength(1);
    expect(
      within(screen.getByRole("region", { name: "Academic context" })).getByRole(
        "region", { name: "Academic Content Hub" },
      ),
    ).toBeInTheDocument();

    mounted.rerender(page(false));
    expect(screen.getAllByRole("region")).toHaveLength(1);
    expect(screen.getByRole("banner").nextElementSibling).toBe(
      screen.getByRole("region", { name: "Academic Content Hub" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Dismiss announcement" }));
    mounted.rerender(page(true));
    expect(screen.queryByRole("region", { name: "Academic Content Hub" })).not.toBeInTheDocument();
  });
});
