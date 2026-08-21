'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/ui/workspace-shell'
import { AlertTriangle, Loader2, Mail } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'
import { FieldError, FormErrorSummary } from '@/components/ui/field-error'
import { ProductFeedbackPanel } from '@/components/product-feedback-panel'
import { persistSharedAppearance } from '@/lib/appearance'
import { PrivacyChoicesButton } from '@/components/privacy-choices-button'

export default function SettingsPage() {
  const supabase = React.useMemo(() => createClient(), [])
  const { theme, setTheme } = useTheme()

  const [email, setEmail] = React.useState('')
  const [displayName, setDisplayName] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [emailNotifications, setEmailNotifications] = React.useState(false)
  const [dailyDigest, setDailyDigest] = React.useState(false)
  const [webhookFailureEmails, setWebhookFailureEmails] = React.useState(true)
  const [billingFailureEmails, setBillingFailureEmails] = React.useState(true)
  const [deleting, setDeleting] = React.useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = React.useState('')
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = React.useState('')
  const [nameError, setNameError] = React.useState('')
  const [deleteError, setDeleteError] = React.useState('')
  const savedValues = React.useRef('')

  const currentValues = JSON.stringify({
    displayName: displayName.trim(),
    emailNotifications,
    dailyDigest,
    webhookFailureEmails,
    billingFailureEmails,
  })
  const hasUnsavedChanges = !loading && currentValues !== savedValues.current

  React.useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || '')
        setDisplayName(user.user_metadata?.full_name || '')
        const { data: settings } = await supabase
          .from('user_settings')
          .select('notification_settings')
          .eq('user_id', user.id)
          .maybeSingle()

        const notificationSettings = settings?.notification_settings as {
          email?: boolean
          dailyDigest?: boolean
          webhookFailures?: boolean
          billingFailures?: boolean
        } | undefined
        setEmailNotifications(notificationSettings?.email === true)
        setDailyDigest(notificationSettings?.dailyDigest === true)
        setWebhookFailureEmails(notificationSettings?.webhookFailures !== false)
        setBillingFailureEmails(notificationSettings?.billingFailures !== false)
        savedValues.current = JSON.stringify({
          displayName: (user.user_metadata?.full_name || '').trim(),
          emailNotifications: notificationSettings?.email === true,
          dailyDigest: notificationSettings?.dailyDigest === true,
          webhookFailureEmails: notificationSettings?.webhookFailures !== false,
          billingFailureEmails: notificationSettings?.billingFailures !== false,
        })
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const handleSaveProfile = async () => {
    setSaveError('')
    setNameError('')
    if (!displayName.trim()) {
      const message = 'Enter a display name.'
      setNameError(message)
      setSaveError('Review the highlighted profile field.')
      setSaveState('error')
      return
    }
    setSaving(true)
    setSaveState('saving')
    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName.trim() },
    })
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const settingsResult = user
      ? await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            notification_settings: {
              email: emailNotifications,
              emailAddress: email || null,
              dailyDigest,
              webhookFailures: webhookFailureEmails,
              billingFailures: billingFailureEmails,
            },
            updated_at: new Date().toISOString(),
          })
      : { error: null }
    setSaving(false)
    if (error || settingsResult.error) {
      const message = error?.message || settingsResult.error?.message || 'Account settings could not be saved. Check your connection and try again.'
      setSaveError(message)
      if (error) setNameError(message)
      setSaveState('error')
      return
    }
    savedValues.current = currentValues
    setSaveState('saved')
    toast({ title: 'Profile saved' })
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to delete account')
      }

      await supabase.auth.signOut()
      toast({ title: payload.pending ? 'Account deletion queued' : 'Account deleted', description: payload.message })
      window.location.href = '/auth'
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'The account could not be deleted. Check your connection and try again.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-9 w-28" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-64" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-16" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader eyebrow="Account" title="Settings" description="Manage your profile, alerts, privacy, appearance, and account." />

      <div className="divide-y overflow-hidden rounded-lg border bg-card shadow-sm">
        <section className="grid gap-6 p-5 sm:p-6 md:grid-cols-[150px_minmax(0,1fr)]">
          <div>
            <h2 className="font-semibold">Profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">How your account appears.</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-email">Email</Label>
              <Input id="settings-email" value={email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-name">Display name</Label>
              <Input
                id="settings-name"
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setSaveState('idle'); setNameError(''); setSaveError('') }}
                placeholder="Your name"
                maxLength={80}
                aria-invalid={Boolean(nameError)}
                aria-describedby={nameError ? 'settings-name-error' : undefined}
              />
              <FieldError id="settings-name-error">{nameError}</FieldError>
            </div>
            <FormErrorSummary>{saveError}</FormErrorSummary>
            <Button onClick={handleSaveProfile} disabled={saving || !hasUnsavedChanges}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save account settings
            </Button>
            <p
              role={saveState === 'error' ? 'alert' : 'status'}
              aria-live="polite"
              className={saveState === 'error' ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}
            >
              {saveState === 'saving'
                ? 'Saving changes…'
                : saveState === 'saved'
                  ? 'All changes saved.'
                  : saveState === 'error'
                    ? 'Changes were not saved. Review the error and retry.'
                    : hasUnsavedChanges
                      ? 'You have unsaved changes.'
                      : 'No unsaved changes.'}
            </p>
          </div>
        </section>

        <ProductFeedbackPanel />

        <section className="grid gap-6 p-5 sm:p-6 md:grid-cols-[150px_minmax(0,1fr)]">
          <div>
            <h2 className="font-semibold">Notifications</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose which account alerts reach your email.</p>
          </div>
          <div className="space-y-3">
            <div className="divide-y border-y bg-surface-raised/60">
              <label className="flex min-h-14 items-start gap-3 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border accent-primary"
                  checked={emailNotifications}
                  onChange={(event) => { setEmailNotifications(event.target.checked); setSaveState('idle') }}
                />
                <span>
                  <span className="block font-medium text-foreground">Email me when new feedback arrives</span>
                  <span className="text-muted-foreground">
                    Immediate owner alerts for newly submitted feedback. Off by default.
                  </span>
                </span>
              </label>
              <label className="flex min-h-14 items-start gap-3 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border accent-primary"
                  checked={dailyDigest}
                  onChange={(event) => { setDailyDigest(event.target.checked); setSaveState('idle') }}
                />
                <span>
                  <span className="block font-medium text-foreground">Send a daily feedback digest</span>
                  <span className="text-muted-foreground">
                    A once-per-day summary of new feedback across your projects.
                  </span>
                </span>
              </label>
              <label className="flex min-h-14 items-start gap-3 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border accent-primary"
                  checked={webhookFailureEmails}
                  onChange={(event) => { setWebhookFailureEmails(event.target.checked); setSaveState('idle') }}
                  disabled={!emailNotifications}
                />
                <span>
                  <span className="block font-medium text-foreground">Email me when an integration is auto-disabled</span>
                  <span className="text-muted-foreground">
                    Sends an alert if repeated webhook failures disable an endpoint.
                  </span>
                </span>
              </label>
              <label className="flex min-h-14 items-start gap-3 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border accent-primary"
                  checked={billingFailureEmails}
                  onChange={(event) => { setBillingFailureEmails(event.target.checked); setSaveState('idle') }}
                />
                <span>
                  <span className="block font-medium text-foreground">Email me when billing needs attention</span>
                  <span className="text-muted-foreground">
                    Sends a direct alert when Dodo reports a failed recurring payment.
                  </span>
                </span>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/projects">
                <Button variant="outline" size="sm">Choose a project</Button>
              </Link>
              <Link href="/billing">
                <Button variant="ghost" size="sm">View billing</Button>
              </Link>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              Slack, Discord, GitHub, and webhooks are set up inside each project.
            </div>
          </div>
        </section>

        <section className="grid gap-6 p-5 sm:p-6 md:grid-cols-[150px_minmax(0,1fr)]">
          <div>
            <h2 className="font-semibold">Privacy</h2>
            <p className="mt-1 text-sm text-muted-foreground">Control optional advertising measurement.</p>
          </div>
          <div className="space-y-3">
            <p className="text-sm leading-6 text-muted-foreground">
              Necessary sign-in and security cookies stay active. Optional Google, Meta, and Reddit measurement remains off unless you allow it.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <PrivacyChoicesButton className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent" />
              <Button variant="ghost" size="sm" asChild><Link href="/privacy">Read the privacy policy</Link></Button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 p-5 sm:p-6 md:grid-cols-[150px_minmax(0,1fr)]">
          <div>
            <h2 className="font-semibold">Appearance</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose the calm light UI, focused dark UI, Windows 98, or your device preference.</p>
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Appearance">
            {([
              ['light', 'Light'],
              ['dark', 'Dark'],
              ['windows98', 'Windows 98'],
              ['system', 'Device'],
            ] as const).map(([value, label]) => (
              <Button
                key={value}
                role="radio"
                aria-checked={theme === value}
                variant={theme === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  persistSharedAppearance(value)
                  setTheme(value)
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-lg border border-destructive/35 bg-card shadow-sm">
        <div className="border-b border-destructive/25 bg-destructive/[0.045] px-5 py-4 sm:px-6">
          <h2 className="font-semibold">Delete account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Permanently remove your account and all associated data.</p>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          <div className="border-y border-destructive/30 bg-destructive/5 px-4 py-4 text-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">This permanently deletes your projects, feedback, private media, public boards, integrations, API keys, updates, and account settings.</p>
                <p className="text-muted-foreground">
                  Queued delivery jobs are discarded, public links stop working, and this cannot be undone. Export anything you need first. If you are on Pro, cancel or downgrade from Billing before deletion.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="delete-confirmation">Type your email address to confirm</Label>
            <Input
              id="delete-confirmation"
              value={deleteConfirmation}
              onChange={(event) => { setDeleteConfirmation(event.target.value); setDeleteError('') }}
              placeholder={email || 'you@example.com'}
              aria-invalid={Boolean(deleteError)}
              aria-describedby={deleteError ? 'delete-account-error' : undefined}
            />
            <FieldError id="delete-account-error">{deleteError}</FieldError>
          </div>
          <Button
            variant="destructive"
            disabled={deleting || deleteConfirmation !== email}
            onClick={handleDeleteAccount}
          >
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete account
          </Button>
        </div>
      </section>
    </div>
  )
}
