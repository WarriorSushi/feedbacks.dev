'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Loader2, Mail } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

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
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const handleSaveProfile = async () => {
    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName },
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
      toast({
        title: 'Failed to save profile',
        description: error?.message || settingsResult.error?.message || 'Please try again.',
        variant: 'destructive',
      })
      return
    }
    toast({ title: 'Profile saved' })
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
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

      toast({ title: 'Account deleted' })
      window.location.href = '/auth'
    } catch (error) {
      toast({
        title: 'Failed to delete account',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
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
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-email">Email</Label>
            <Input id="settings-email" value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-name">Display Name</Label>
            <Input
              id="settings-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notifications</CardTitle>
          <CardDescription>
            Project workflow routing and account email notifications are separate surfaces.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3 rounded-lg border bg-muted/10 p-4">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border"
                checked={emailNotifications}
                onChange={(event) => setEmailNotifications(event.target.checked)}
              />
              <span>
                <span className="block font-medium text-foreground">Email me when new feedback arrives</span>
                <span className="text-muted-foreground">
                  Immediate owner alerts for newly submitted feedback. Off by default.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border"
                checked={dailyDigest}
                onChange={(event) => setDailyDigest(event.target.checked)}
              />
              <span>
                <span className="block font-medium text-foreground">Send a daily feedback digest</span>
                <span className="text-muted-foreground">
                  A once-per-day summary of new feedback across your projects.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border"
                checked={webhookFailureEmails}
                onChange={(event) => setWebhookFailureEmails(event.target.checked)}
                disabled={!emailNotifications}
              />
              <span>
                <span className="block font-medium text-foreground">Email me when an integration is auto-disabled</span>
                <span className="text-muted-foreground">
                  Sends an alert if repeated webhook failures disable an endpoint.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border"
                checked={billingFailureEmails}
                onChange={(event) => setBillingFailureEmails(event.target.checked)}
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
              <Button variant="outline" size="sm">Open project integrations</Button>
            </Link>
            <Link href="/billing">
              <Button variant="ghost" size="sm">Open billing</Button>
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            Project workflow routing stays in project integrations. Account email alerts live here.
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <Button
                key={t}
                variant={theme === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-lg">Account</CardTitle>
          <CardDescription>
            Delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">This permanently deletes your projects, feedback, boards, and settings.</p>
                <p className="text-muted-foreground">
                  If you are on Pro, cancel or downgrade the paid plan from Billing before deleting this account.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="delete-confirmation">Type your email address to confirm</Label>
            <Input
              id="delete-confirmation"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              placeholder={email || 'you@example.com'}
            />
          </div>
          <Button
            variant="destructive"
            disabled={deleting || deleteConfirmation !== email}
            onClick={handleDeleteAccount}
          >
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
