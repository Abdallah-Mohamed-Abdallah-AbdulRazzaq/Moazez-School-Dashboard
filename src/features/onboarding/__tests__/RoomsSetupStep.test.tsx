import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoom } from "@/features/academics/rooms/services/roomsService";
import { RoomsSetupStep } from "../components/steps/RoomsSetupStep";

const roomPayload = {
  nameAr: "غرفة 1",
  nameEn: "Room 1",
  capacity: 30,
  floor: "1",
  building: "A",
  isActive: true,
};

vi.mock("@/features/academics/rooms/components/RoomDialog", () => ({
  default: (props: unknown) => {
    const roomProps = props as {
      open: boolean;
      onSave(payload: typeof roomPayload): Promise<void>;
    };
    return roomProps.open ? (
      <button onClick={() => void roomProps.onSave(roomPayload)} type="button">
        Save room dialog
      </button>
    ) : null;
  },
}));

vi.mock("@/features/academics/rooms/services/roomsService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/academics/rooms/services/roomsService")>()),
  createRoom: vi.fn(),
}));

const copy = {
  summary: "Create rooms for timetable and allocations.",
  createRoom: "Create room",
  missingSchool: "No school selected",
  saveFailed: "Could not create room",
};

describe("RoomsSetupStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the RoomDialog payload to createRoom and refreshes rooms", async () => {
    const user = userEvent.setup();
    const refreshStep = vi.fn();
    vi.mocked(createRoom).mockResolvedValue({ id: "room-1", schoolId: "school-1", ...roomPayload });

    render(<RoomsSetupStep copy={copy} refreshStep={refreshStep} schoolId="school-1" />);

    await user.click(screen.getByRole("button", { name: "Create room" }));
    await user.click(screen.getByRole("button", { name: "Save room dialog" }));

    expect(createRoom).toHaveBeenCalledWith("school-1", roomPayload);
    await waitFor(() => expect(refreshStep).toHaveBeenCalledWith("rooms"));
  });

  it("does not render the create action when school id is missing", () => {
    render(<RoomsSetupStep copy={copy} refreshStep={vi.fn()} schoolId="" />);

    expect(screen.getByText("No school selected")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Create room" })).not.toBeInTheDocument();
  });
});
