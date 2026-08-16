import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { HeroJourneyMission } from "../../types";
import HeroJourneyMissionActions from "../HeroJourneyMissionActions";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mission = {
  id: "mission-1",
  status: "draft",
} as HeroJourneyMission;

describe("HeroJourneyMissionActions", () => {
  it("renders mission actions and routes clicks to the selected mission", () => {
    const callbacks = {
      onEdit: vi.fn(),
      onDelete: vi.fn(),
      onPublish: vi.fn(),
      onArchive: vi.fn(),
    };

    render(
      <HeroJourneyMissionActions
        mission={mission}
        canManage
        isPublishing={false}
        deletingMissionId={null}
        {...callbacks}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "actions.edit" }));
    fireEvent.click(screen.getByRole("button", { name: "actions.delete" }));
    fireEvent.click(screen.getByRole("button", { name: "actions.publish" }));

    expect(callbacks.onEdit).toHaveBeenCalledWith("mission-1");
    expect(callbacks.onDelete).toHaveBeenCalledWith("mission-1");
    expect(callbacks.onPublish).toHaveBeenCalledWith("mission-1");
  });

  it("routes the archive action for a published mission", () => {
    const onArchive = vi.fn();

    render(
      <HeroJourneyMissionActions
        mission={{ ...mission, status: "published" }}
        canManage
        isPublishing={false}
        deletingMissionId={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onPublish={vi.fn()}
        onArchive={onArchive}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "actions.archive" }));

    expect(onArchive).toHaveBeenCalledWith("mission-1");
  });

  it("applies draft and loading-state rules", () => {
    render(
      <HeroJourneyMissionActions
        mission={{ ...mission, status: "draft" }}
        canManage
        isPublishing
        deletingMissionId="mission-1"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onPublish={vi.fn()}
        onArchive={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "actions.edit" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "actions.delete" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "actions.publish" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "actions.archive" })).toBeDisabled();
  });

  it("does not render controls without manage permission or a mission", () => {
    const { rerender } = render(
      <HeroJourneyMissionActions
        mission={mission}
        canManage={false}
        isPublishing={false}
        deletingMissionId={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onPublish={vi.fn()}
        onArchive={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(
      <HeroJourneyMissionActions
        mission={null}
        canManage
        isPublishing={false}
        deletingMissionId={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onPublish={vi.fn()}
        onArchive={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("supports icon-only controls with accessible labels", () => {
    render(
      <HeroJourneyMissionActions
        mission={mission}
        canManage
        isPublishing={false}
        deletingMissionId={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onPublish={vi.fn()}
        onArchive={vi.fn()}
        iconOnly
      />,
    );

    const editButton = screen.getByRole("button", { name: "actions.edit" });
    expect(editButton).toHaveAttribute("title", "actions.edit");
    expect(editButton).not.toHaveTextContent("actions.edit");
  });
});
