import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SubmissionAnswerReviewFields from "../SubmissionAnswerReviewFields";

vi.mock("next-intl", () => ({ useLocale: () => "en", useTranslations: () => (key: string) => key }));

const draft = { awardedPoints: "2", reviewerComment: "Clear", reviewerCommentAr: "واضح" };
const props = () => ({ draft, maxPoints: 3, validation: {}, dirty: true, readOnly: false, saving: false, bulkSaving: false, onChange: vi.fn(), onSave: vi.fn() });

describe("SubmissionAnswerReviewFields", () => {
  it("renders bilingual fields with bounds and saves dirty valid reviews", async () => {
    const user = userEvent.setup(); const onSave = vi.fn();
    render(<SubmissionAnswerReviewFields {...props()} onSave={onSave} />);
    expect(screen.getByRole("spinbutton")).toHaveAttribute("max", "3");
    expect(screen.getByRole("textbox", { name: "reviewCommentEn" })).toHaveAttribute("maxLength", "2000");
    expect(screen.getByRole("textbox", { name: "reviewCommentAr" })).toHaveAttribute("maxLength", "2000");
    await user.click(screen.getByRole("button", { name: "saveReview" }));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("disables editing and save while read-only or another review is saving", () => {
    const { rerender } = render(<SubmissionAnswerReviewFields {...props()} readOnly />);
    expect(screen.getByRole("spinbutton")).toBeDisabled();
    rerender(<SubmissionAnswerReviewFields {...props()} bulkSaving />);
    expect(screen.getByRole("button", { name: "saveReview" })).toBeDisabled();
  });
});
