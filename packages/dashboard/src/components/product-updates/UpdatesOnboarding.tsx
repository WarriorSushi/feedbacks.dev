"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { generateInstallSnippets } from "@feedbacks/shared";
import { Bot, CheckCircle2, Code2, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

type ModuleState = { feedback: boolean; updates: boolean };
type EmbedState = "not_detected" | "connected" | "stale";
type Choice = "updates" | "feedback" | "both";
type Method = "AI assistant" | "Script tag" | "React" | "Vue";

const choiceModules: Record<Choice, ModuleState> = {
  updates: { feedback: false, updates: true },
  feedback: { feedback: true, updates: false },
  both: { feedback: true, updates: true },
};

export function UpdatesOnboarding({
  projectId,
  projectKey,
  modules,
  embedState,
  onRefresh,
}: {
  projectId: string;
  projectKey: string;
  modules: ModuleState;
  embedState: EmbedState;
  onRefresh: () => Promise<void>;
}) {
  const router = useRouter();
  const [choice, setChoice] = React.useState<Choice>("updates");
  const [method, setMethod] = React.useState<Method>("AI assistant");
  const [saving, setSaving] = React.useState(false);
  const [polling, setPolling] = React.useState(false);
  const [currentEmbedState, setCurrentEmbedState] = React.useState(embedState);

  const record = React.useCallback(
    (event: string) => {
      void fetch(`/api/projects/${projectId}/activation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
      }).catch(() => undefined);
    },
    [projectId],
  );

  React.useEffect(() => {
    record("updates_setup_started");
  }, [record]);
  React.useEffect(() => {
    setCurrentEmbedState(embedState);
  }, [embedState]);
  React.useEffect(() => {
    if (currentEmbedState === "connected") record("updates_embed_verified");
  }, [currentEmbedState, record]);
  React.useEffect(() => {
    if (currentEmbedState === "connected" && modules.updates)
      router.replace(`/projects/${projectId}/updates/new`);
  }, [currentEmbedState, modules.updates, projectId, router]);

  const checkConnection = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/embed-status`, {
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(data?.error || "Unable to check the embed connection.");
      const nextState = data?.state as EmbedState;
      if (["not_detected", "connected", "stale"].includes(nextState))
        setCurrentEmbedState(nextState);
      return nextState === "connected";
    } catch (error) {
      toast({
        title: "Could not check the connection",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [projectId]);

  React.useEffect(() => {
    if (!modules.updates || currentEmbedState === "connected") return;
    let attempts = 0;
    let cancelled = false;
    let timer: number | null = null;
    const poll = async () => {
      if (cancelled || attempts >= 6) {
        setPolling(false);
        return;
      }
      attempts += 1;
      setPolling(true);
      const connected = await checkConnection();
      if (!cancelled && !connected && attempts < 6)
        timer = window.setTimeout(poll, 10_000);
      else if (!cancelled) setPolling(false);
    };
    timer = window.setTimeout(poll, 10_000);
    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [checkConnection, currentEmbedState, modules.updates]);

  const saveModules = async (next: ModuleState): Promise<boolean> => {
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/modules`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(data?.error || "Unable to update products.");
      await onRefresh();
      return true;
    } catch (error) {
      toast({
        title: "Could not save product choice",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const activate = async () => {
    if (await saveModules({ ...modules, updates: true }))
      record("updates_activated");
  };
  const startSetup = async () => {
    if (!(await saveModules(choiceModules[choice]))) return;
    if (choice === "feedback") router.push(`/projects/${projectId}/install`);
  };

  if (currentEmbedState === "connected" && !modules.updates) {
    return (
      <ConnectionState
        title="Your shared embed is connected"
        description="Turn on product updates for users remotely. Your existing installation does not need a code change."
        action="Activate updates for users"
        onAction={activate}
        busy={saving}
      />
    );
  }

  if (modules.updates && currentEmbedState === "connected") return null;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="rounded-lg border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <p className="text-xs font-semibold text-primary">
          Updates for your users
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.035em]">
          Show what changed inside your product
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Publish a focused “What’s new” popup for your users. This is where you
          announce improvements to your product, not changes to the
          feedbacks.dev website.
        </p>
      </section>

      <section className="space-y-5 rounded-lg border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <Step title="Choose what the shared embed should do" />
        <div className="grid gap-3 sm:grid-cols-3">
          <ChoiceButton
            active={choice === "updates"}
            title="Show updates only"
            description="Announce improvements without a feedback launcher."
            onClick={() => setChoice("updates")}
          />
          <ChoiceButton
            active={choice === "feedback"}
            title="Collect feedback only"
            description="Listen to users without publishing announcements."
            onClick={() => setChoice("feedback")}
          />
          <ChoiceButton
            active={choice === "both"}
            title="Collect + close the loop"
            description="Use one embed for both user experiences."
            onClick={() => setChoice("both")}
          />
        </div>
        <Button onClick={() => void startSetup()} disabled={saving}>
          {saving
            ? "Saving…"
            : choice === "feedback"
              ? "Continue to install"
              : "Set up updates for users"}
        </Button>
      </section>

      {modules.updates && (
        <section className="space-y-5 rounded-lg border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
          <Step title="Install the shared embed" />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Installation method">
            {(["AI assistant", "Script tag", "React", "Vue"] as Method[]).map(
              (item) => (
                <Button
                  key={item}
                  variant={method === item ? "secondary" : "outline"}
                  size="sm"
                  aria-pressed={method === item}
                  onClick={() => {
                    setMethod(item);
                    record("updates_install_method_selected");
                  }}
                >
                  {item === "AI assistant" && (
                    <Bot className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {item}
                </Button>
              ),
            )}
          </div>
          <InstallInstructions
            method={method}
            projectKey={projectKey}
            choice={choice}
          />
          <div className="border-t pt-5">
            <Step title="Verify the connection" />
            <p className="mt-2 text-sm text-muted-foreground">
              {polling
                ? "Checking for your embed for up to one minute…"
                : currentEmbedState === "stale"
                  ? "The last connection is stale. Load the page with the embed again, then check."
                  : "Add the embed to your app and load that page once. We will detect it automatically."}
            </p>
            <Button
              className="mt-3"
              variant="outline"
              onClick={() => void checkConnection()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Check connection
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function ConnectionState({
  title,
  description,
  action,
  onAction,
  busy,
}: {
  title: string;
  description: string;
  action: string;
  onAction: () => void;
  busy: boolean;
}) {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="p-6">
        <CheckCircle2 className="h-6 w-6 text-primary" />
        <h2 className="mt-4 text-xl font-semibold">{title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        <Button className="mt-5" onClick={onAction} disabled={busy}>
          {busy ? "Activating…" : action}
        </Button>
      </CardContent>
    </Card>
  );
}

function Step({ title }: { title: string }) {
  return <h3 className="font-semibold">{title}</h3>;
}
function ChoiceButton({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-28 rounded-lg border p-4 text-left transition-colors ${active ? "border-primary bg-primary/[0.06]" : "border-border bg-[oklch(var(--surface-raised))] hover:bg-muted/30"}`}
    >
      <span className="block font-medium">{title}</span>
      <span className="mt-1 block text-sm leading-5 text-muted-foreground">
        {description}
      </span>
    </button>
  );
}

function InstallInstructions({
  method,
  projectKey,
  choice,
}: {
  method: Method;
  projectKey: string;
  choice: Choice;
}) {
  const origin =
    typeof window === "undefined" ? undefined : window.location.origin;
  const snippets = generateInstallSnippets({ projectKey, appOrigin: origin });
  const snippet =
    method === "Script tag"
      ? snippets.find((item) => item.label === "Website")
      : snippets.find((item) => item.label === method);
  const websiteSnippet =
    snippets.find((item) => item.label === "Website")?.code || "";
  const productLabel =
    choice === "both"
      ? "feedback collection and user-facing product updates"
      : choice === "updates"
        ? "user-facing product updates only"
        : "feedback collection only";
  const prompt = `Install the feedbacks.dev embed in this app. Use the browser-safe project key ${projectKey}. Enable ${productLabel}. Place the embed in the app shell so it loads once, preserve the existing design and dependencies, and do not add any private server key. Use this verified browser embed as the source of truth:\n\n${websiteSnippet}\n\nAfter installing, load a page and confirm the embed is detected in feedbacks.dev.`;
  const content = method === "AI assistant" ? prompt : snippet?.code || "";
  return (
    <CodeSample
      title={
        method === "AI assistant"
          ? "Give this to your AI coding assistant"
          : `${method} instructions`
      }
      content={content}
    />
  );
}

function CodeSample({ title, content }: { title: string; content: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({
        title: "Clipboard access was blocked",
        description: "Select the text in the code block and copy it manually.",
        variant: "destructive",
      });
    }
  };
  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Code2 className="h-4 w-4" />
          {title}
        </span>
        <Button size="sm" variant="ghost" onClick={() => void copy()}>
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          Copy
        </Button>
      </div>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap p-3 text-xs leading-5">
        <code>{content}</code>
      </pre>
    </div>
  );
}
