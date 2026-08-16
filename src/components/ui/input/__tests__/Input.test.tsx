import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import Input from "../Input";

const testLocale = vi.hoisted(() => ({ current: "en" }));

vi.mock("next-intl", () => ({
  useLocale: () => testLocale.current,
  useTranslations: (namespace: string) => (key: string) => {
    const messages: Record<string, Record<string, string>> = {
      en: {
        "phoneInput.searchLabel": "Search countries",
        "phoneInput.searchPlaceholder": "Search country or code",
        "phoneInput.invalid": "Enter a valid phone number.",
      },
      ar: {
        "phoneInput.searchLabel": "البحث عن الدول",
        "phoneInput.searchPlaceholder": "ابحث عن دولة أو رمز الاتصال",
        "phoneInput.invalid": "أدخل رقم هاتف صالحًا.",
      },
    };

    return messages[testLocale.current][`${namespace}.${key}`] || key;
  },
}));

afterEach(() => {
  testLocale.current = "en";
});

function PasswordInput() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Input
      label="Password"
      type={isVisible ? "text" : "password"}
      rightIcon={
        <button
          type="button"
          aria-label={isVisible ? "Hide password" : "Show password"}
          onClick={() => setIsVisible((current) => !current)}
        >
          Toggle
        </button>
      }
    />
  );
}

function InternationalPhoneInput({ onPhoneChange }: { onPhoneChange: (phone: string) => void }) {
  const [phone, setPhone] = useState("");

  return (
    <Input
      label="Phone"
      type="tel"
      value={phone}
      onChange={(event) => {
        setPhone(event.target.value);
        onPhoneChange(event.target.value);
      }}
    />
  );
}

describe("Input", () => {
  it("defaults phone inputs to Saudi Arabia", () => {
    render(<Input label="Phone" type="tel" value="" onChange={() => {}} />);

    expect(screen.getByRole("img", { name: "Saudi Arabia flag" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Country code" })).toHaveTextContent("+966");
  });

  it("renders the country menu outside clipping ancestors", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div className="overflow-hidden">
        <Input label="Phone" type="tel" value="" onChange={() => {}} />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Country code" }));

    const countryOption = screen.getByRole("button", {
      name: "Afghanistan +93",
    });
    expect(document.body.contains(countryOption)).toBe(true);
    expect(container.contains(countryOption)).toBe(false);
  });

  it("shows a flagged option for every supported country and territory", async () => {
    const user = userEvent.setup();
    render(<Input label="Phone" type="tel" value="" onChange={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Country code" }));

    expect(screen.getAllByRole("img", { name: "Saudi Arabia flag" })).toHaveLength(2);
    expect(
      within(screen.getByLabelText("Country code options")).getAllByRole("button"),
    ).toHaveLength(245);
  });

  it("includes countries outside the initial regional set", async () => {
    const user = userEvent.setup();
    render(<Input label="Phone" type="tel" value="" onChange={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Country code" }));

    expect(screen.getByRole("button", { name: "Afghanistan +93" })).toBeVisible();
    expect(screen.getByRole("img", { name: "Afghanistan flag" })).toBeVisible();
  });

  it("uses a supported flag asset for Ascension Island", async () => {
    const user = userEvent.setup();
    render(<Input label="Phone" type="tel" value="" onChange={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Country code" }));

    expect(screen.getByRole("img", { name: "Ascension Island flag" })).toHaveAttribute(
      "src",
      expect.stringContaining("sh.png"),
    );
  });

  it("filters countries as the user types in the country search", async () => {
    const user = userEvent.setup();
    render(<Input label="Phone" type="tel" value="" onChange={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Country code" }));
    await user.type(screen.getByRole("textbox", { name: "Search countries" }), "zamb");

    expect(screen.getByRole("button", { name: "Zambia +260" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Afghanistan +93" })).not.toBeInTheDocument();
  });

  it("opens and filters the country menu when typing on the selector", async () => {
    const user = userEvent.setup();
    render(<Input label="Phone" type="tel" value="" onChange={() => {}} />);

    screen.getByRole("button", { name: "Country code" }).focus();
    await user.keyboard("z");

    expect(screen.getByRole("textbox", { name: "Search countries" })).toHaveValue("z");
    expect(screen.getByRole("button", { name: "Zambia +260" })).toBeVisible();
  });

  it("localizes the country search placeholder in Arabic", async () => {
    testLocale.current = "ar";
    const user = userEvent.setup();
    render(<Input label="Phone" type="tel" value="" onChange={() => {}} />);

    await user.click(screen.getByRole("button", { name: "Country code" }));

    expect(screen.getByRole("textbox", { name: "البحث عن الدول" })).toHaveAttribute(
      "placeholder",
      "ابحث عن دولة أو رمز الاتصال",
    );
  });

  it("combines the selected country code with the phone number", async () => {
    const user = userEvent.setup();
    const phoneChanges: string[] = [];

    render(
      <InternationalPhoneInput
        onPhoneChange={(phone) => phoneChanges.push(phone)}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Country code" }));
    await user.click(screen.getByRole("button", { name: "Saudi Arabia +966" }));
    const phoneInput = screen.getByLabelText("Phone");
    await user.type(phoneInput, "501234567");
    await user.tab();

    expect(phoneChanges.at(-1)).toBe("+966501234567");
    expect(phoneInput).toBeValid();
  });

  it("shows the backend-compatible validation error after an invalid phone number loses focus", async () => {
    const user = userEvent.setup();
    render(<InternationalPhoneInput onPhoneChange={() => {}} />);

    const phoneInput = screen.getByLabelText("Phone");
    await user.type(phoneInput, "123");
    await user.tab();

    expect(phoneInput).toBeInvalid();
    expect(screen.getByText("Enter a valid phone number.")).toBeVisible();
  });

  it("allows interactive right icons to receive clicks", async () => {
    const user = userEvent.setup();
    render(<PasswordInput />);

    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));

    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument();
  });
});
