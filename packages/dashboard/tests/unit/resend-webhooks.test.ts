import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

async function loadModule() {
  return import(
    new URL("../../src/lib/resend-webhooks.ts", import.meta.url).href
  );
}

test("Resend signature verification accepts current valid payloads and rejects replays", async () => {
  const { verifyResendWebhook } = await loadModule();
  const secretBytes = Buffer.from("test-signing-secret");
  const secret = `whsec_${secretBytes.toString("base64")}`;
  const id = "evt_123";
  const timestamp = "1800000000";
  const payload = '{"type":"email.bounced"}';
  const signature = createHmac("sha256", secretBytes)
    .update(`${id}.${timestamp}.${payload}`)
    .digest("base64");

  assert.equal(
    verifyResendWebhook({
      payload,
      id,
      timestamp,
      signature: `v1,${signature}`,
      secret,
      nowSeconds: 1800000000,
    }),
    true,
  );
  assert.equal(
    verifyResendWebhook({
      payload,
      id,
      timestamp,
      signature: `v1,${signature}`,
      secret,
      nowSeconds: 1800000601,
    }),
    false,
  );
});

test("Resend event parsing bounds recipients and hashes addresses consistently", async () => {
  const { hashEmailRecipient, parseResendDeliveryEvent } = await loadModule();
  const event = parseResendDeliveryEvent({
    type: "email.bounced",
    created_at: "2026-07-30T12:00:00.000Z",
    data: {
      email_id: "email_123",
      to: ["Owner@Example.com"],
      bounce: { type: "Permanent", subType: "Suppressed" },
    },
  });

  assert.equal(event?.type, "email.bounced");
  assert.equal(
    hashEmailRecipient(" Owner@Example.com "),
    hashEmailRecipient("owner@example.com"),
  );
  assert.equal(
    parseResendDeliveryEvent({
      type: "email.bounced",
      created_at: "bad",
      data: { to: [] },
    }),
    null,
  );
});
