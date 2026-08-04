'use client'

export function ProductUpdateVisibilityToggle({
  enabled,
  onChange,
  disabled = false,
  compact = false,
  pending = false,
}: {
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
  compact?: boolean
  pending?: boolean
}) {
  const stateLabel = enabled ? 'Shown to users' : 'Hidden from users'

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        data-state={enabled ? 'checked' : 'unchecked'}
        aria-checked={enabled}
        aria-label={`${stateLabel}. Toggle release-note visibility.`}
        title={stateLabel}
        disabled={disabled}
        aria-busy={pending}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
          enabled ? 'border-primary bg-primary' : 'border-foreground/20 bg-muted'
        }`}
      >
        <span
          aria-hidden="true"
          className={`flex h-4 w-4 items-center justify-center rounded-full bg-background shadow-sm transition-transform ${
            enabled ? 'translate-x-[1.35rem]' : 'translate-x-1'
          }`}
        >
          {pending ? <span className="h-2.5 w-2.5 animate-spin rounded-full border border-foreground/25 border-t-foreground/80" /> : null}
        </span>
      </button>
      {!compact && (
        <span className="text-xs font-medium text-muted-foreground">{stateLabel}</span>
      )}
    </div>
  )
}
