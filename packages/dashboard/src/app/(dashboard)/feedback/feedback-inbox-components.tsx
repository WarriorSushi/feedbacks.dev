"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bug,
  CircleHelp,
  Inbox,
  Lightbulb,
  MessageSquare,
  Search,
  Smile,
  Star,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isFeedbackUnread } from "@/lib/feedback-read-state";
import type { Feedback, FeedbackType } from "@/lib/types";
import {
  cn,
  formatRelativeTime,
  getStatusColor,
  statusConfig,
  truncate,
} from "@/lib/utils";

const typeIcons = {
  bug: Bug,
  idea: Lightbulb,
  praise: Smile,
  question: CircleHelp,
  other: MessageSquare,
};

export function FeedbackTypeIcon({
  type,
  className,
}: {
  type?: FeedbackType | string | null;
  className?: string;
}) {
  const Icon =
    typeIcons[(type || "other") as keyof typeof typeIcons] || MessageSquare;
  return <Icon className={cn("h-4 w-4", className)} />;
}

export function FeedbackFilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1 rounded-md border px-3 py-1 text-[11px] font-medium transition-colors",
        "min-h-11 flex-shrink-0 snap-start md:min-h-8",
        active
          ? "border-primary/30 bg-surface-selected text-foreground"
          : "border-transparent bg-surface-raised text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function FeedbackInboxRow({
  fb,
  selected,
  active,
  onToggle,
  tourTarget = false,
}: {
  fb: Feedback;
  selected: boolean;
  active: boolean;
  onToggle: () => void;
  tourTarget?: boolean;
}) {
  const isUnread = isFeedbackUnread(fb);
  const source = getFeedbackSource(fb);
  const [firstLine, ...otherLines] = fb.message.split("\n").filter(Boolean);
  const preview = otherLines.join(" ");

  return (
    <div
      data-tour={tourTarget ? "inbox-first-item" : undefined}
      data-feedback-row-id={fb.id}
      className={cn(
        "group relative flex items-start gap-3 border-b px-4 py-3.5 transition-colors last:border-b-0",
        isUnread
          ? "bg-surface-selected/45 hover:bg-surface-selected/65"
          : "hover:bg-surface-raised/55",
        selected && "bg-accent/60",
        active && "ring-2 ring-inset ring-ring/60",
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border accent-primary"
        aria-label="Select item"
        onClick={(event) => event.stopPropagation()}
      />

      <Link
        href={`/feedback/${fb.id}`}
        className="flex min-w-0 flex-1 items-start gap-2.5"
      >
        <span
          aria-hidden="true"
          className={cn(
            "mt-2 h-2 w-2 shrink-0 rounded-full transition-colors",
            isUnread
              ? "bg-primary shadow-[0_0_0_3px_oklch(var(--primary)/0.12)]"
              : "bg-transparent",
          )}
        />
        <FeedbackTypeIcon
          type={fb.type}
          className="mt-0.5 shrink-0 text-muted-foreground"
        />

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[13px] leading-relaxed",
              isUnread
                ? "font-medium text-foreground"
                : "text-foreground/75 group-hover:text-foreground",
            )}
          >
            {isUnread && <span className="sr-only">Unread feedback: </span>}
            {truncate(firstLine || fb.message, 96)}
          </p>
          {preview && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {truncate(preview, 120)}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn(
                "flex items-center gap-1 text-[11px]",
                getStatusColor(fb.status),
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  statusConfig[fb.status]?.dot || "bg-zinc-400",
                )}
              />
              {statusConfig[fb.status]?.label || fb.status}
            </span>
            <span className="text-[10px] text-muted-foreground/30">·</span>
            <span className="text-[11px] text-muted-foreground">{source}</span>
            {fb.projects && (
              <>
                <span className="text-[10px] text-muted-foreground/30">·</span>
                <span className="text-[11px] text-muted-foreground">
                  {fb.projects.name}
                </span>
              </>
            )}
            {fb.tags && fb.tags.length > 0 && (
              <>
                <span className="text-[10px] text-muted-foreground/30">·</span>
                <span className="hidden flex-wrap items-center gap-1 sm:flex">
                  {fb.tags.slice(0, 2).map((tagValue) => (
                    <Badge
                      key={tagValue}
                      variant="outline"
                      className="h-4 px-1.5 text-[10px]"
                    >
                      {tagValue}
                    </Badge>
                  ))}
                </span>
              </>
            )}
            <span className="text-[10px] text-muted-foreground/30">·</span>
            <span className="text-[11px] text-muted-foreground">
              {formatRelativeTime(fb.created_at)}
            </span>
          </div>
        </div>

        {fb.rating && (
          <div className="flex shrink-0 items-center gap-px self-start pt-1">
            {Array.from({ length: 5 }, (_, index) => (
              <Star
                key={index}
                className={cn(
                  "h-2.5 w-2.5",
                  index < fb.rating!
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/12",
                )}
              />
            ))}
          </div>
        )}
      </Link>
    </div>
  );
}

function getFeedbackSource(feedback: Feedback) {
  const metadataSource =
    typeof feedback.metadata?.source === "string"
      ? feedback.metadata.source.toLowerCase()
      : "";
  if (feedback.is_public) return "Public board";
  if (feedback.agent_name) return "Agent";
  if (metadataSource === "mcp") return "MCP";
  if (metadataSource === "api") return "API";
  return "Widget";
}

export function FeedbackInboxEmptyState({
  hasFilters,
  hasProjects,
  onClear,
}: {
  hasFilters: boolean;
  hasProjects: boolean;
  onClear: () => void;
}) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Search className="h-10 w-10 text-muted-foreground/40" />
        <p className="mt-4 text-sm font-medium">No results found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Try adjusting or clearing your filters.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 h-10 gap-1.5 text-xs"
          onClick={onClear}
        >
          <X className="h-3 w-3" />
          Clear all filters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Inbox className="h-10 w-10 text-muted-foreground/40" />
      <p className="mt-4 text-sm font-medium">
        {hasProjects
          ? "Your inbox is empty"
          : "No feedback path is installed yet"}
      </p>
      <p className="mt-1.5 max-w-[260px] text-xs leading-relaxed text-muted-foreground">
        {hasProjects
          ? "Open a project, finish Setup, then send one test from your site. New feedback will appear here with page and browser context."
          : "Create one project first. Then choose the form style, install the code, and send one test."}
      </p>
      <Link href={hasProjects ? "/projects" : "/projects/new"} className="mt-4">
        <Button variant="outline" size="sm" className="h-10 gap-1.5 text-xs">
          <Inbox className="h-3.5 w-3.5" />
          {hasProjects ? "Open projects" : "Create project"}
        </Button>
      </Link>
    </div>
  );
}
