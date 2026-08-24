import { createWaitlistHandler } from "@/lib/waitlist.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createWaitlistHandler({ env: process.env, fetchImpl: fetch });
