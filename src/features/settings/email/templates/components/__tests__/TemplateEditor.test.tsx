import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TemplateEditor, { type TemplateEditorValues } from "../TemplateEditor";

const values: TemplateEditorValues = {
  subject: "Welcome",
  preheader: "",
  title: "",
  subtitle: "",
  bodyHtml: "<p>Hello</p>",
  bodyText: "Hello",
  footerHtml: "",
  supportEmail: "",
  supportPhone: "",
  website: "",
  facebook: "",
  instagram: "",
  x: "",
  isActive: true,
};

const labels = {
  subject: "Subject",
  preheader: "Preheader",
  title: "Title",
  subtitle: "Subtitle",
  bodyHtml: "Body HTML",
  bodyText: "Body text",
  footerHtml: "Footer HTML",
  supportEmail: "Support email",
  supportPhone: "Support phone",
  website: "Website",
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  isActive: "Active",
  allowedVariables: "Allowed variables",
  noVariables: "No variables",
  credentialSafety: "Credential safety",
  htmlTab: "HTML",
  textTab: "Plain text",
  variableHelp: "Insert into the active editor.",
  insertVariable: "Insert {variable}",
};

describe("TemplateEditor", () => {
  it("switches between HTML and plain text without rendering both editors", async () => {
    const user = userEvent.setup();
    render(
      <TemplateEditor
        values={values}
        canManage
        allowedVariables={[]}
        onChange={vi.fn()}
        labels={labels}
      />,
    );

    expect(screen.getByRole("textbox", { name: "Body HTML" })).toBeVisible();
    expect(
      screen.queryByRole("textbox", { name: "Body text" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Plain text" }));

    expect(screen.getByRole("textbox", { name: "Body text" })).toBeVisible();
    expect(
      screen.queryByRole("textbox", { name: "Body HTML" }),
    ).not.toBeInTheDocument();
  });

  it("inserts an allowed variable into the active body editor", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TemplateEditor
        values={values}
        canManage
        allowedVariables={["school.name"]}
        onChange={onChange}
        labels={labels}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Insert {{school.name}}" }),
    );
    expect(onChange).toHaveBeenCalledWith(
      "bodyHtml",
      "<p>Hello</p> {{school.name}}",
    );

    await user.click(screen.getByRole("tab", { name: "Plain text" }));
    await user.click(
      screen.getByRole("button", { name: "Insert {{school.name}}" }),
    );
    expect(onChange).toHaveBeenLastCalledWith(
      "bodyText",
      "Hello {{school.name}}",
    );
  });
});
