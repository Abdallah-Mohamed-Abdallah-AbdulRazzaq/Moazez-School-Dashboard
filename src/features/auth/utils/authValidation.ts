export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface ValidationMessages {
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  passwordMinLength: string;
}

export type LoginFormErrors = Partial<
  Record<keyof Pick<LoginFormValues, "email" | "password">, string>
>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function validateLoginField(
  field: "email" | "password",
  value: string,
  messages: ValidationMessages,
) {
  const trimmedValue = value.trim();

  if (field === "email") {
    if (!trimmedValue) {
      return messages.emailRequired;
    }

    if (!EMAIL_PATTERN.test(trimmedValue)) {
      return messages.emailInvalid;
    }

    return undefined;
  }

  if (!trimmedValue) {
    return messages.passwordRequired;
  }

  if (trimmedValue.length < MIN_PASSWORD_LENGTH) {
    return messages.passwordMinLength;
  }

  return undefined;
}

export function validateLoginValues(
  values: LoginFormValues,
  messages: ValidationMessages,
): LoginFormErrors {
  const errors: LoginFormErrors = {};

  const emailError = validateLoginField("email", values.email, messages);
  if (emailError) {
    errors.email = emailError;
  }

  const passwordError = validateLoginField("password", values.password, messages);
  if (passwordError) {
    errors.password = passwordError;
  }

  return errors;
}
