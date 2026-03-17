'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewProjectPage() {
  const [name, setName] = React.useState('')
  const [domain, setDomain] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const apiKey = `fb_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`

    const { data, error: err } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        domain: domain.trim() || null,
        owner_user_id: user!.id,
        api_key: apiKey,
        webhooks: {},
        settings: {},
      })
      .select()
      .single()

    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      router.push(`/projects/${data.id}?created=1`)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>New Project</CardTitle>
          <CardDescription>
            Create a project to start collecting feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="My App"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Domain (optional)</Label>
              <Input
                id="domain"
                placeholder="myapp.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
