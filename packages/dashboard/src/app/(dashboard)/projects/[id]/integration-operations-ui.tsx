"use client";

import { Loader2, Mail, RefreshCw, Webhook as WebhookIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getEmailDeliveryPresentation,
  mergeDeliveryHistory,
  type EmailDeliveryLog,
} from "@/lib/delivery-history";
import type {
  FeedbackType,
  GitHubEndpoint,
  WebhookEndpoint,
} from "@/lib/types";
import type { WebhookDeliveryLog } from "@/lib/webhook-config";

const FEEDBACK_TYPES: readonly FeedbackType[] = [
  "bug",
  "idea",
  "praise",
  "question",
];

function formatTimestamp(value: string | null) {
  if (!value) return "No deliveries yet";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function IntegrationEndpointRulesEditor({
  endpoint,
  onChange,
}: {
  endpoint: WebhookEndpoint | GitHubEndpoint;
  onChange: (next: WebhookEndpoint | GitHubEndpoint) => void;
}) {
  const rules = endpoint.rules || {};

  const toggleType = (type: FeedbackType) => {
    const nextTypes = rules.types?.includes(type)
      ? (rules.types || []).filter((entry) => entry !== type)
      : [...(rules.types || []), type];
    onChange({
      ...endpoint,
      rules: {
        ...rules,
        types: nextTypes.length > 0 ? nextTypes : undefined,
      },
    });
  };

  return (
    <div className="space-y-3 rounded-lg border bg-muted/10 p-3">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Delivery timing
          </label>
          <select
            aria-label="Delivery timing"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={endpoint.delivery || "immediate"}
            onChange={(event) =>
              onChange({
                ...endpoint,
                delivery: event.target.value as "immediate" | "digest",
              })
            }
          >
            <option value="immediate">Immediate</option>
            <option value="digest">Daily digest</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Payload format
          </label>
          <select
            aria-label="Payload format"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={endpoint.format || "full"}
            onChange={(event) =>
              onChange({
                ...endpoint,
                format: event.target.value as "compact" | "full",
              })
            }
          >
            <option value="full">Full payload</option>
            <option value="compact">Compact payload</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Max rating
          </label>
          <Input
            aria-label="Maximum rating"
            type="number"
            min={1}
            max={5}
            placeholder="Any"
            value={endpoint.rules?.ratingMax ?? ""}
            onChange={(event) => {
              const value = event.target.value
                ? Number(event.target.value)
                : undefined;
              onChange({
                ...endpoint,
                rules: { ...rules, ratingMax: value },
              });
            }}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Tags must include
          </label>
          <Input
            aria-label="Required tags"
            placeholder="billing, auth"
            value={endpoint.rules?.tagsInclude?.join(", ") || ""}
            onChange={(event) => {
              const tags = event.target.value
                .split(",")
                .map((entry) => entry.trim())
                .filter(Boolean);
              onChange({
                ...endpoint,
                rules: {
                  ...rules,
                  tagsInclude: tags.length > 0 ? tags : undefined,
                },
              });
            }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Only send these feedback types
        </label>
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_TYPES.map((type) => (
            <label
              key={type}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
            >
              <input
                type="checkbox"
                checked={rules.types?.includes(type) || false}
                onChange={() => toggleType(type)}
                className="h-3.5 w-3.5 rounded border"
              />
              <span className="capitalize">{type}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export function IntegrationDeliveryHistory({
  deliveries,
  emailDeliveries,
  resendingId,
  onResend,
}: {
  deliveries: WebhookDeliveryLog[];
  emailDeliveries: EmailDeliveryLog[];
  resendingId: string | null;
  onResend: (deliveryId: string) => void;
}) {
  const history = mergeDeliveryHistory(deliveries, emailDeliveries);

  if (history.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
        Email activity for your account and webhook deliveries for this project
        will appear here.
      </div>
    );
  }

  return (
    <div className="divide-y border-y">
      {history.map((item) => {
        if (item.channel === "email") {
          const presentation = getEmailDeliveryPresentation(item.email.event_type);
          const badgeVariant = presentation.tone === "danger"
            ? "destructive"
            : presentation.tone === "success"
              ? "secondary"
              : "outline";

          return (
            <div key={item.id} data-delivery-channel="email" className="px-4 py-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={badgeVariant}>{presentation.label}</Badge>
                  <Badge variant="outline" className="gap-1.5 uppercase">
                    <Mail className="h-3 w-3" aria-hidden="true" />
                    Email
                  </Badge>
                  <span className="text-xs text-muted-foreground">{item.email.event_type}</span>
                </div>
                <p className="text-sm font-medium">Email notification to your account</p>
                <p className="break-all text-xs text-muted-foreground">
                  {formatTimestamp(item.email.occurred_at)}
                  {item.email.provider_email_id ? ` · Provider ID ${item.email.provider_email_id}` : ""}
                </p>
                {item.email.reason && (
                  <p className="bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    {item.email.reason}
                  </p>
                )}
              </div>
            </div>
          );
        }

        const delivery = item.webhook;
        return (
          <div
            key={item.id}
            data-delivery-id={delivery.id}
            data-delivery-channel="webhook"
            data-delivery-kind={delivery.kind}
            className="px-4 py-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={delivery.status === "success" ? "secondary" : "destructive"}>
                    {delivery.status === "success" ? "Delivered" : "Failed"}
                  </Badge>
                  <Badge variant="outline" className="gap-1.5 uppercase">
                    <WebhookIcon className="h-3 w-3" aria-hidden="true" />
                    {delivery.kind}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{delivery.event}</span>
                </div>
                <p className="break-all text-sm font-medium">{delivery.url}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimestamp(delivery.created_at)}
                  {delivery.status_code ? ` · HTTP ${delivery.status_code}` : ""}
                  {delivery.attempt
                    ? ` · ${delivery.attempt} attempt${delivery.attempt === 1 ? "" : "s"}`
                    : ""}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onResend(delivery.id)}
                disabled={resendingId === delivery.id}
              >
                {resendingId === delivery.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Resend
              </Button>
            </div>

            {delivery.response_body && (
              <div className="mt-3 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                {delivery.response_body.slice(0, 240)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
