import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Image from "next/image";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/features/auth/context/AuthProvider";
import { useAuth } from "@/hooks/use-auth";
import { apiGet } from "@/lib/api";
import { authService } from "@/services/auth-service";
import { useBrandingProfile } from "../useBrandingProfile";
import { getCachedBrandingProfile, setBrandingScope } from "../../services/brandingService";
import type { MeResponse } from "@/types/user";
import type { BrandingApiDto } from "../../types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/en/settings/branding",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  apiDelete: vi.fn(),
  SESSION_EXPIRED_EVENT: "moazez:session-expired",
}));
vi.mock("@/services/auth-service", () => ({
  authService: { getCurrentUser: vi.fn(), logout: vi.fn() },
}));

const schoolA: MeResponse = {
  id: "admin-1", email: "admin@example.test", firstName: "QA", lastName: "Admin",
  userType: "SCHOOL_USER", status: "ACTIVE",
  activeMembership: {
    membershipId: "membership-1", organizationId: "organization-1", schoolId: "school-a",
    roleId: "admin-role", roleKey: "school_admin", permissions: [],
  },
};
const schoolB: MeResponse = {
  ...schoolA,
  activeMembership: { ...schoolA.activeMembership!, schoolId: "school-b" },
};
const profileA: BrandingApiDto = {
  schoolName: "School A", shortName: null, timezone: null, addressLine: null,
  formattedAddress: null, city: null, country: null, footerSignature: null,
  logoUrl: "/school-a.png", latitude: null, longitude: null, mapPlaceLabel: null,
};
const profileB: BrandingApiDto = { ...profileA, schoolName: "School B", logoUrl: "/school-b.png" };

function BrandingProbe() {
  const { refreshCurrentUser, logout } = useAuth();
  const { profile, isLoading } = useBrandingProfile();
  return <>
    <output aria-label="School name">{profile?.schoolName ?? "No school branding"}</output>
    {profile?.logoUrl && <Image alt="School logo" src={profile.logoUrl} width={32} height={32} unoptimized />}
    {isLoading && <span role="status">Loading branding</span>}
    <button onClick={() => void refreshCurrentUser()}>Refresh school</button>
    <button onClick={() => void logout()}>Logout</button>
  </>;
}

describe("branding session integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setBrandingScope(null);
    vi.mocked(authService.getCurrentUser).mockResolvedValue(schoolA);
    vi.mocked(authService.logout).mockResolvedValue(undefined);
    vi.mocked(apiGet).mockResolvedValue(profileA);
  });
  afterEach(() => setBrandingScope(null));

  it("hides the previous school's name and logo until the new branding arrives", async () => {
    const user = userEvent.setup();
    render(<AuthProvider><BrandingProbe /></AuthProvider>);
    await waitFor(() => expect(screen.getByLabelText("School name")).toHaveTextContent("School A"));
    expect(screen.getByAltText("School logo")).toHaveAttribute("src", "/school-a.png");

    vi.mocked(authService.getCurrentUser).mockResolvedValue(schoolB);
    let finishNewBranding!: (profile: BrandingApiDto) => void;
    vi.mocked(apiGet).mockReturnValueOnce(new Promise(resolve => { finishNewBranding = resolve; }));
    await user.click(screen.getByRole("button", { name: "Refresh school" }));
    await waitFor(() => expect(screen.getByText("Loading branding", { exact: true })).toBeInTheDocument());
    expect(screen.getByLabelText("School name")).toHaveTextContent("No school branding");
    expect(screen.queryByAltText("School logo")).not.toBeInTheDocument();
    await act(async () => finishNewBranding(profileB));
    await waitFor(() => expect(screen.getByLabelText("School name")).toHaveTextContent("School B"));
    expect(screen.getByAltText("School logo")).toHaveAttribute("src", "/school-b.png");
  });

  it.each(["logout", "expiry"] as const)("clears visible and cached branding on %s", async reason => {
    render(<AuthProvider><BrandingProbe /></AuthProvider>);
    await waitFor(() => expect(screen.getByLabelText("School name")).toHaveTextContent("School A"));
    if (reason === "logout") await userEvent.click(screen.getByRole("button", { name: "Logout" }));
    else act(() => window.dispatchEvent(new Event("moazez:session-expired")));
    await waitFor(() => expect(screen.getByLabelText("School name")).toHaveTextContent("No school branding"));
    expect(screen.queryByAltText("School logo")).not.toBeInTheDocument();
    expect(getCachedBrandingProfile()).toBeNull();
  });
});
