export const WAITLIST_MAX_BODY_BYTES: number;
export const WAITLIST_MIN_BID_CENTS: number;
export const WAITLIST_MAX_BID_CENTS: number;

export type WaitlistSignup = {
  email: string;
  productUrl: string;
  bidCents: number;
  consent: true;
};

export type WaitlistConfig = {
  supabaseUrl: string;
  serviceRoleKey: string;
  legalControllerName: string;
  legalContactEmail: string;
  rateLimitSecret: string;
};

export class WaitlistBodyTooLargeError extends Error {}

export function isJsonContentType(value: string | null | undefined): boolean;
export function contentLengthExceedsLimit(value: string | null | undefined, limit?: number): boolean;
export function readBodyWithLimit(body: ReadableStream<Uint8Array> | null, limit?: number): Promise<string>;
export function normalizeWaitlistEmail(value: unknown): string | null;
export function normalizeWaitlistProductUrl(value: unknown): string | null;
export function validateWaitlistPayload(input: unknown):
  | { ok: false; errors: Record<string, string> }
  | { ok: true; honeypot: true }
  | { ok: true; honeypot: false; value: WaitlistSignup };
export function getWaitlistConfig(env: Record<string, string | undefined> | undefined): WaitlistConfig | null;
export function getWaitlistRequestAddress(headers: Headers): string;
export function createWaitlistFingerprint(address: string, secret: string): string;
export function upsertWaitlistSignup(options: {
  signup: WaitlistSignup;
  fingerprint: string;
  config: WaitlistConfig;
  fetchImpl: typeof fetch;
}): Promise<{ ok: boolean; rateLimited: boolean; upstreamStatus: number | null }>;
export function createWaitlistHandler(options: {
  env: Record<string, string | undefined>;
  fetchImpl: typeof fetch;
}): (request: Request) => Promise<Response>;
