import { isApiError } from "@/lib/api-error";

type Translate = (key: string) => string;

const DELIVERY_ERROR_KEYS: Record<string, string> = {
  "dismissal.delivery.not_ready": "messages.delivery_not_ready",
  "dismissal.delivery.already_delivered": "messages.delivery_already_delivered",
  "dismissal.delivery.pickup_code_required": "messages.pickup_code_required",
  "dismissal.delivery.invalid_pickup_code": "messages.pickup_code_invalid",
  "dismissal.delivery.pickup_code_not_issued": "messages.pickup_code_invalid",
  "dismissal.delivery.pickup_recipient_required": "messages.pickup_recipient_required",
  "dismissal.delivery.invalid_pickup_recipient": "messages.pickup_recipient_invalid",
  "dismissal.delivery.pickup_recipient_expired": "messages.pickup_recipient_expired",
  "dismissal.delivery.pickup_recipient_not_allowed": "messages.pickup_recipient_invalid",
};

export function getNedaaApiErrorMessage(
  error: unknown,
  translate: Translate,
  fallbackKey: string,
): string {
  if (!isApiError(error)) return translate(fallbackKey);
  const deliveryKey = DELIVERY_ERROR_KEYS[error.code];
  if (deliveryKey) return translate(deliveryKey);
  if (error.code.endsWith(".not_found")) return translate("messages.item_not_found");
  if (error.code.includes("invalid_transition") || error.code.includes("terminal")) {
    return translate("messages.request_state_changed");
  }
  if (error.code === "dismissal.waiting.invalid_arrival_status") {
    return translate("messages.arrival_not_ready");
  }
  if (error.code.startsWith("dismissal.escalation.")) {
    return translate("messages.escalation_not_allowed");
  }
  if (error.code.includes("not_allowed") || error.code.includes("forbidden")) {
    return translate("messages.action_not_allowed");
  }
  if (
    error.code.startsWith("dismissal.settings.") ||
    error.code.startsWith("dismissal.gate.") ||
    error.code.startsWith("dismissal.staff_assignment.")
  ) {
    return translate("messages.configuration_invalid");
  }
  if (error.code.startsWith("dismissal.")) {
    return translate("messages.request_input_invalid");
  }
  return translate(fallbackKey);
}
