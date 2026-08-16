import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { XpPolicy } from "../../types";
import XpPolicyForm from "../XpPolicyForm";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("../ReinforcementTaskTargetSelector", () => ({
  default: ({
    value,
  }: {
    value: { scopeType: string; scopeId: string }[];
  }) => (
    <div>
      {value.map((target) => (
        <span key={`${target.scopeType}:${target.scopeId}`}>
          {target.scopeType}:{target.scopeId}
        </span>
      ))}
    </div>
  ),
}));

const policy: XpPolicy = {
  id: "policy-1",
  academicYearId: "year-1",
  termId: "term-1",
  scopeType: "section",
  scopeKey: "section-1",
  dailyCap: 100,
  weeklyCap: 2000,
  cooldownMinutes: 20,
  allowedReasons: ["leadership", "helpful"],
  startsAt: "2026-06-29T00:00:00.000Z",
  endsAt: "2026-06-30T00:00:00.000Z",
  isActive: true,
  isDefault: false,
  createdAt: "2026-06-30T03:15:18.804Z",
  updatedAt: "2026-06-30T04:02:08.326Z",
};

describe("XpPolicyForm", () => {
  it("prefills edit data and submits the full policy payload", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <XpPolicyForm
        mode="edit"
        initialPolicy={policy}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("section:section-1")).toBeInTheDocument();
    expect(screen.getByLabelText("xp.dailyCap")).toHaveValue(100);
    expect(screen.getByLabelText("xp.weeklyCap")).toHaveValue(2000);
    expect(screen.getByLabelText("xp.cooldownMinutes")).toHaveValue(20);
    expect(screen.getByLabelText("xp.startsAt")).toHaveValue("2026-06-29");
    expect(screen.getByLabelText("xp.endsAt")).toHaveValue("2026-06-30");
    expect(screen.getByLabelText("xp.allowedReasons")).toHaveValue(
      "leadership\nhelpful",
    );

    await user.clear(screen.getByLabelText("xp.weeklyCap"));
    await user.type(screen.getByLabelText("xp.weeklyCap"), "2500");
    await user.click(screen.getByRole("button", { name: "actions.update" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "section",
        scopeId: "section-1",
        dailyCap: 100,
        weeklyCap: 2500,
        cooldownMinutes: 20,
        allowedReasons: ["leadership", "helpful"],
        startsAt: "2026-06-29",
        endsAt: "2026-06-30",
        isActive: true,
      }),
    );
  });
});
