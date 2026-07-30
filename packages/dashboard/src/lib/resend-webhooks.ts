import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

export type ResendDeliveryEvent = {
  type:
    | "email.bounced"
    | "email.complained"
    | "email.delivered"
    | "email.delivery_delayed"
    | "email.failed"
    | "email.sent"
    | "email.suppressed";
  created_at: string;
  data: {
    email_id?: string;
    to?: string[];
    bounce?: {
      type?: string;
      subType?: string;
    };
  };
};

function decodeSigningSecret(secret: string) {
  const encoded = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  return Buffer.from(encoded, "base64");
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function verifyResendWebhook({
  payload,
  id,
  timestamp,
  signature,
  secret,
  nowSeconds = Math.floor(Date.now() / 1000),
}: {
  payload: string;
  id: string;
  timestamp: string;
  signature: string;
  secret: string;
  nowSeconds?: number;
}) {
  const timestampSeconds = Number(timestamp);
  if (
    !Number.isInteger(timestampSeconds) ||
    Math.abs(nowSeconds - timestampSeconds) > MAX_WEBHOOK_AGE_SECONDS
  ) {
    return false;
  }

  const expected = createHmac("sha256", decodeSigningSecret(secret))
    .update(`${id}.${timestamp}.${payload}`)
    .digest("base64");

  return signature
    .split(" ")
    .map((candidate) => candidate.trim())
    .some((candidate) => {
      const [version, value] = candidate.split(",", 2);
      return version === "v1" && Boolean(value) && constantTimeEqual(value, expected);
    });
}

export function hashEmailRecipient(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export function isSuppressingResendEvent(type: ResendDeliveryEvent["type"]) {
  return (
    type === "email.bounced" ||
    type === "email.complained" ||
    type === "email.suppressed"
  );
}

export function parseResendDeliveryEvent(value: unknown): ResendDeliveryEvent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const event = value as Record<string, unknown>;
  const supported = new Set<ResendDeliveryEvent["type"]>([
    "email.bounced",
    "email.complained",
    "email.delivered",
    "email.delivery_delayed",
    "email.failed",
    "email.sent",
    "email.suppressed",
  ]);
  if (typeof event.type !== "string" || !supported.has(event.type as ResendDeliveryEvent["type"])) {
    return null;
  }
  if (
    typeof event.created_at !== "string" ||
    !Number.isFinite(Date.parse(event.created_at)) ||
    !event.data ||
    typeof event.data !== "object" ||
    Array.isArray(event.data)
  ) {
    return null;
  }

  const data = event.data as Record<string, unknown>;
  if (
    data.to !== undefined &&
    (!Array.isArray(data.to) ||
      data.to.length > 50 ||
      data.to.some((recipient) => typeof recipient !== "string" || recipient.length > 320))
  ) {
    return null;
  }

  return {
    type: event.type as ResendDeliveryEvent["type"],
    created_at: event.created_at,
    data: {
      email_id: typeof data.email_id === "string" ? data.email_id.slice(0, 160) : undefined,
      to: data.to as string[] | undefined,
      bounce:
        data.bounce && typeof data.bounce === "object" && !Array.isArray(data.bounce)
          ? {
              type:
                typeof (data.bounce as Record<string, unknown>).type === "string"
                  ? String((data.bounce as Record<string, unknown>).type).slice(0, 80)
                  : undefined,
              subType:
                typeof (data.bounce as Record<string, unknown>).subType === "string"
                  ? String((data.bounce as Record<string, unknown>).subType).slice(0, 80)
                  : undefined,
            }
          : undefined,
    },
  };
}
