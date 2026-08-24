export type PaymentStatus = "idle" | "confirmation-pending";
export function normalizeProductUrl(value: string): string | null;
export function requestPaymentConfirmation(current: PaymentStatus): PaymentStatus;
