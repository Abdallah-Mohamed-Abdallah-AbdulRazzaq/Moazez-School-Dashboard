import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RoomsView from "@/features/academics/rooms/components/RoomsView";
import type { Room } from "@/features/academics/timetable/types/timetable";

const roomsServiceMocks = vi.hoisted(() => ({
  createRoom: vi.fn(),
  deleteRoom: vi.fn(),
  fetchRooms: vi.fn(),
  updateRoom: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  showToast: vi.fn(),
}));

const permissionMocks = vi.hoisted(() => ({
  permissions: new Set<string>(),
}));

const intlMocks = vi.hoisted(() => ({
  translate: (key: string) => key,
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => intlMocks.translate,
}));

vi.mock(
  "@/features/academics/rooms/services/roomsService",
  () => roomsServiceMocks,
);

vi.mock("@/components/ui/toast/Toast", () => ({
  useToast: () => ({
    showToast: toastMocks.showToast,
  }),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) =>
      permissionMocks.permissions.has(permission),
  }),
}));

const rooms: Room[] = [
  {
    id: "room-active",
    schoolId: "school-1",
    name: "Science Lab",
    nameAr: "معمل العلوم",
    nameEn: "Science Lab",
    capacity: 24,
    building: "Block A",
    floor: "1",
    isActive: true,
  },
  {
    id: "room-inactive",
    schoolId: "school-1",
    name: "Art Studio",
    nameAr: "استوديو الفن",
    nameEn: "Art Studio",
    capacity: null,
    building: "Block B",
    floor: "2",
    isActive: false,
  },
];

function renderRoomsView(options: { isReadOnly?: boolean } = {}) {
  return render(
    <RoomsView
      schoolId="school-1"
      academicYearId="year-1"
      termId="term-1"
      isReadOnly={options.isReadOnly ?? false}
    />,
  );
}

async function expectRoomsLoaded() {
  expect(await screen.findByText("Science Lab")).toBeInTheDocument();
  expect(screen.getByText("Art Studio")).toBeInTheDocument();
}

describe("RoomsView", () => {
  beforeEach(() => {
    Object.values(roomsServiceMocks).forEach((mock) => mock.mockReset());
    toastMocks.showToast.mockReset();
    permissionMocks.permissions = new Set([
      "academics.structure.view",
      "academics.structure.manage",
    ]);
    roomsServiceMocks.fetchRooms.mockResolvedValue(rooms);
  });

  it("displays rooms loaded from the service", async () => {
    renderRoomsView();

    await expectRoomsLoaded();

    expect(roomsServiceMocks.fetchRooms).toHaveBeenCalledWith("school-1");
  });

  it("filters rooms by search, status, building, and floor", async () => {
    const user = userEvent.setup();
    renderRoomsView();

    await expectRoomsLoaded();

    await user.type(screen.getByPlaceholderText("searchPlaceholder"), "studio");
    expect(screen.queryByText("Science Lab")).not.toBeInTheDocument();
    expect(screen.getByText("Art Studio")).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("searchPlaceholder"));
    await user.click(screen.getByText("allStatuses"));
    await user.click(screen.getByRole("button", { name: "active" }));
    expect(screen.getByText("Science Lab")).toBeInTheDocument();
    expect(screen.queryByText("Art Studio")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "status" }));
    await user.click(screen.getByRole("button", { name: "allStatuses" }));
    await user.click(screen.getByText("allBuildings"));
    await user.click(screen.getByRole("button", { name: "Block B" }));
    expect(screen.queryByText("Science Lab")).not.toBeInTheDocument();
    expect(screen.getByText("Art Studio")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "building" }));
    await user.click(screen.getByRole("button", { name: "allBuildings" }));
    await user.click(screen.getByText("allFloors"));
    const floorOneOptions = screen.getAllByRole("button", { name: "1" });
    await user.click(floorOneOptions[floorOneOptions.length - 1]);
    expect(screen.getByText("Science Lab")).toBeInTheDocument();
    expect(screen.queryByText("Art Studio")).not.toBeInTheDocument();
  });

  it("disables create, edit, and delete actions in read-only mode", async () => {
    renderRoomsView({ isReadOnly: true });

    await expectRoomsLoaded();

    expect(screen.getByRole("button", { name: "addRoom" })).toBeDisabled();
    expect(screen.getAllByRole("button", { name: "edit" })[0]).toBeDisabled();
    expect(screen.getAllByRole("button", { name: "delete" })[0]).toBeDisabled();
  });

  it("hides management actions when the user lacks manage permission", async () => {
    permissionMocks.permissions = new Set(["academics.structure.view"]);
    renderRoomsView();

    await expectRoomsLoaded();

    expect(
      screen.queryByRole("button", { name: "addRoom" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "edit" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "delete" }),
    ).not.toBeInTheDocument();
  });

  it("does not load rooms when the user lacks view permission", () => {
    permissionMocks.permissions = new Set([]);
    renderRoomsView();

    expect(screen.getByRole("heading", { name: "title" })).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
    expect(roomsServiceMocks.fetchRooms).not.toHaveBeenCalled();
  });

  it("shows an empty state with a create action when no rooms exist", async () => {
    roomsServiceMocks.fetchRooms.mockResolvedValue([]);
    renderRoomsView();

    expect(await screen.findByText("no_rooms.title")).toBeInTheDocument();
    expect(screen.getByText("no_rooms.description")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "no_rooms.cta" }),
    ).toBeEnabled();
  });

  it("shows load errors and allows retry", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    roomsServiceMocks.fetchRooms
      .mockRejectedValueOnce({ error: { message: "Localized backend failure" } })
      .mockResolvedValueOnce(rooms);
    try {
      renderRoomsView();

      await waitFor(() => {
        expect(toastMocks.showToast).toHaveBeenCalledWith(
          "Localized backend failure",
          "error",
        );
      });
      await user.click(await screen.findByRole("button", { name: "retry" }));

      await waitFor(() => {
        expect(screen.getByText("Science Lab")).toBeInTheDocument();
      });
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("deletes rooms through the supported rooms endpoint action", async () => {
    const user = userEvent.setup();
    roomsServiceMocks.deleteRoom.mockResolvedValue(undefined);
    renderRoomsView();

    const scienceRow = (await screen.findByText("Science Lab")).closest("tr");
    expect(scienceRow).not.toBeNull();
    await user.click(
      within(scienceRow as HTMLTableRowElement).getByRole("button", {
        name: "delete",
      }),
    );
    await user.click(screen.getAllByRole("button", { name: "delete" }).at(-1)!);

    await waitFor(() => {
      expect(roomsServiceMocks.deleteRoom).toHaveBeenCalledWith("room-active");
    });
  });
});
