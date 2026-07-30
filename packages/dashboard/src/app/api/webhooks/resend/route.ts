import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
  hashEmailRecipient,
  isSuppressingResendEvent,
  parseResendDeliveryEvent,
  verifyResendWebhook,
} from "@/lib/resend-webhooks";
import { createAdminSupabase } from "@/lib/supabase-server";

const MAX_BODY_BYTES = 256 * 1024;

export async function POST(request: Request) {
  if (!env.RESEND_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook unavailable" }, { status: 503 });
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const payload = await request.text();
  if (Buffer.byteLength(payload, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const id = request.headers.get("svix-id") || "";
  const timestamp = request.headers.get("svix-timestamp") || "";
  const signature = request.headers.get("svix-signature") || "";
  if (
    !id ||
    id.length > 200 ||
    !verifyResendWebhook({
      payload,
      id,
      timestamp,
      signature,
      secret: env.RESEND_WEBHOOK_SECRET,
    })
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const event = parseResendDeliveryEvent(parsed);
  if (!event) {
    return NextResponse.json({ error: "Unsupported event" }, { status: 422 });
  }

  const recipientHashes = (event.data.to || []).map(hashEmailRecipient);
  const admin = await createAdminSupabase();
  const { error: eventError } = await admin.from("email_delivery_events").insert({
    provider_event_id: id,
    event_type: event.type,
    provider_email_id: event.data.email_id || null,
    recipient_hashes: recipientHashes,
    occurred_at: event.created_at,
    reason:
      [event.data.bounce?.type, event.data.bounce?.subType]
        .filter(Boolean)
        .join(": ")
        .slice(0, 180) || null,
  });

  if (eventError && eventError.code !== "23505") {
    return NextResponse.json({ error: "Could not record event" }, { status: 500 });
  }

  if (isSuppressingResendEvent(event.type) && recipientHashes.length > 0) {
    const { error: suppressionError } = await admin.from("email_suppressions").upsert(
      recipientHashes.map((recipientHash) => ({
        recipient_hash: recipientHash,
        reason: event.type,
        provider_event_id: id,
        last_event_at: event.created_at,
      })),
      { onConflict: "recipient_hash" },
    );
    if (suppressionError) {
      return NextResponse.json(
        { error: "Could not record suppression" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ received: true });
}
