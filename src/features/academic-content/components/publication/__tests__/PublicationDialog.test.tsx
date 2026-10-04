import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PublicationDialog from "../PublicationDialog";

vi.mock("@/components/ui/input/DateTimePicker", () => ({
  default: ({
    disabled,
    error,
    helperText,
    label,
    onChange,
    value,
  }: {
    disabled?: boolean;
    error?: string;
    helperText?: string;
    label?: string;
    onChange?: (value: Date | null) => void;
    value?: Date | null;
  }) => (
    <label>
      {label}
      <input
        aria-label={label}
        disabled={disabled}
        type="datetime-local"
        value={value ? value.toISOString().slice(0, 16) : ""}
        onChange={(event) =>
          onChange?.(
            event.target.value ? new Date(`${event.target.value}:00.000Z`) : null,
          )
        }
      />
      {error ? <span>{error}</span> : null}
      {helperText ? <span>{helperText}</span> : null}
    </label>
  ),
}));

describe("PublicationDialog", () => {
  it("submits publish-now with omitted timing represented as nulls", () => {
    const onSubmit = vi.fn();
    render(
      <PublicationDialog
        isOpen
        mode="now"
        contentType="GENERAL_RESOURCE"
        isMutating={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Start publishing" }));

    expect(onSubmit).toHaveBeenCalledWith({
      mode: "now",
      publishAt: null,
      visibleFrom: null,
      visibleUntil: null,
    });
  });

  it("requires a future publication time for scheduling", () => {
    render(
      <PublicationDialog
        isOpen
        mode="schedule"
        contentType="GENERAL_RESOURCE"
        isMutating={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Publication time")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Schedule publication" }));
    expect(screen.getByText("Choose a future publication time.")).toBeInTheDocument();
  });

  it("submits a scheduled draft while leaving optional visibility dates empty", () => {
    const onSubmit = vi.fn();
    render(
      <PublicationDialog
        isOpen
        mode="schedule"
        contentType="GENERAL_RESOURCE"
        isMutating={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Publication time"), {
      target: { value: "2100-10-06T10:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Schedule publication" }));

    expect(onSubmit).toHaveBeenCalledWith({
      mode: "schedule",
      publishAt: new Date("2100-10-06T10:00:00.000Z"),
      visibleFrom: null,
      visibleUntil: null,
    });
  });

  it("blocks invalid visibility ordering", () => {
    const onSubmit = vi.fn();
    render(
      <PublicationDialog
        isOpen
        mode="schedule"
        contentType="GENERAL_RESOURCE"
        isMutating={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("Publication time"), {
      target: { value: "2100-10-06T10:00" },
    });
    fireEvent.change(screen.getByLabelText("Visible from"), {
      target: { value: "2100-10-06T09:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Schedule publication" }));

    expect(screen.getByText("Visibility cannot begin before publication.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows the online-session default and locks dismissal while mutating", () => {
    const onClose = vi.fn();
    render(
      <PublicationDialog
        isOpen
        mode="now"
        contentType="ONLINE_SESSION"
        isMutating
        onClose={onClose}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText(/use the online session end time/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start publishing" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Close modal" })).toBeNull();
  });
});
