"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function IntegrationDeliveryLog({
  deliveries,
  resendingId,
  onResend,
}: {
  deliveries: WebhookDeliveryLog[];
  resendingId: string | null;
  onResend: (deliveryId: string) => void;
}) {
  if (deliveries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
        Deliveries will appear here after a live feedback event or a manual
        test send.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deliveries.map((delivery) => (
        <div
          key={delivery.id}
          data-delivery-id={delivery.id}
          data-delivery-kind={delivery.kind}
          className="rounded-lg border p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    delivery.status === "success" ? "secondary" : "destructive"
                  }
                >
                  {delivery.status === "success" ? "Delivered" : "Failed"}
                </Badge>
                <Badge variant="outline" className="uppercase">
                  {delivery.kind}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {delivery.event}
                </span>
              </div>
              <p className="break-all text-sm font-medium">{delivery.url}</p>
              <p className="text-xs text-muted-foreground">
                {formatTimestamp(delivery.created_at)}
                {delivery.status_code
                  ? ` · HTTP ${delivery.status_code}`
                  : ""}
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
            <div className="mt-3 rounded-md bg-muted/20 p-3 text-xs text-muted-foreground">
              {delivery.response_body.slice(0, 240)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
