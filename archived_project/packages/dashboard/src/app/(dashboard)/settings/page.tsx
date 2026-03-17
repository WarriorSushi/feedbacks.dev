'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, User, Bell, Shield, Palette, Key, Save, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDashboard } from '@/components/dashboard-client-layout';
import { ThemeSelector } from '@/components/theme-selector';

export default function SettingsPage() {
  const { user } = useDashboard();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    weeklyReports: false,
    darkMode: false,
    publicProfile: false
  });
  const { toast } = useToast();
  const [antiSpam, setAntiSpam] = useState<{ defaultProvider?: 'turnstile'|'hcaptcha'|'none'; turnstileSiteKey?: string; hcaptchaSiteKey?: string }>({ defaultProvider: 'none' });

  // Load defaults
  useState(() => {
    (async () => {
      try { const r = await fetch('/api/settings/anti-spam'); if (r.ok) { const j = await r.json(); setAntiSpam({ defaultProvider: j.defaultProvider || 'none', turnstileSiteKey: j.turnstileSiteKey || '', hcaptchaSiteKey: j.hcaptchaSiteKey || '' }); } } catch {}
    })();
  });


  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="p-6 lg:p-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
            <Settings className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account preferences and application settings.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:gap-6 sm:grid-cols-2">
          {/* Theme Customization */}
          <Card className="hover-lift sm:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-accent" />
                <CardTitle className="text-lg">Theme Customization</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Personalize your dashboard with beautiful color themes.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ThemeSelector />
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-accent" />
                <CardTitle className="text-lg">Profile Information</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Update your personal information and account details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm">Full Name</Label>
                <Input 
                  id="fullName" 
                  defaultValue={user.user_metadata?.full_name || ''} 
                  placeholder="Enter your full name"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  defaultValue={user.email || ''} 
                  disabled 
                  className="bg-muted h-9"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed from this interface.
                </p>
              </div>
          </CardContent>
        </Card>

        {/* Anti-spam defaults */}
        <Card className="hover-lift sm:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <CardTitle className="text-lg">Anti‑spam Defaults</CardTitle>
            </div>
            <CardDescription className="text-sm">Set default captcha site keys to reuse across projects (public site keys only).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Default Provider</Label>
                <select className="border rounded h-9 px-2" value={antiSpam.defaultProvider || 'none'} onChange={(e)=>setAntiSpam(v=>({ ...v, defaultProvider: e.target.value as any }))}>
                  <option value="none">None</option>
                  <option value="turnstile">Cloudflare Turnstile</option>
                  <option value="hcaptcha">hCaptcha</option>
                </select>
              </div>
              <div className="space-y-1.5 md:col-span-1">
                <Label className="text-sm">Turnstile Site Key</Label>
                <Input value={antiSpam.turnstileSiteKey || ''} onChange={(e)=>setAntiSpam(v=>({ ...v, turnstileSiteKey: e.target.value }))} placeholder="0xAAAA..." className="h-9" />
              </div>
              <div className="space-y-1.5 md:col-span-1">
                <Label className="text-sm">hCaptcha Site Key</Label>
                <Input value={antiSpam.hcaptchaSiteKey || ''} onChange={(e)=>setAntiSpam(v=>({ ...v, hcaptchaSiteKey: e.target.value }))} placeholder="10000000-ffff-ffff-ffff-000000000001" className="h-9" />
              </div>
            </div>
            <div>
              <Button size="sm" onClick={async ()=>{ try { const r = await fetch('/api/settings/anti-spam', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ defaultProvider: antiSpam.defaultProvider, turnstileSiteKey: antiSpam.turnstileSiteKey, hcaptchaSiteKey: antiSpam.hcaptchaSiteKey }) }); if (!r.ok) throw new Error(); toast({ title:'Saved', description:'Defaults updated' }); } catch { toast({ title:'Error', description:'Failed to save', variant:'destructive' }); } }}>Save Defaults</Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-accent" />
                <CardTitle className="text-lg">Notifications</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Control how and when you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <Label className="text-sm">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Receive notifications about new feedback
                  </p>
                </div>
                <Switch 
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked: boolean) => 
                    setSettings(prev => ({ ...prev, emailNotifications: checked }))
                  }
                  className="ml-3 flex-shrink-0"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <Label className="text-sm">Weekly Reports</Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Get weekly summaries of your feedback data
                  </p>
                </div>
                <Switch 
                  checked={settings.weeklyReports}
                  onCheckedChange={(checked: boolean) => 
                    setSettings(prev => ({ ...prev, weeklyReports: checked }))
                  }
                  className="ml-3 flex-shrink-0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" />
                <CardTitle className="text-lg">Privacy & Security</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Control your privacy settings and data sharing preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <Label className="text-sm">Public Profile</Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Make your profile visible to other users
                  </p>
                </div>
                <Switch 
                  checked={settings.publicProfile}
                  onCheckedChange={(checked: boolean) => 
                    setSettings(prev => ({ ...prev, publicProfile: checked }))
                  }
                  className="ml-3 flex-shrink-0"
                />
              </div>
            </CardContent>
          </Card>

          {/* API Settings */}
          <Card className="hover-lift">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-accent" />
                <CardTitle className="text-lg">API Access</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Manage your API keys and integration settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">API Rate Limits</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Requests/hour:</span>
                    <span className="ml-2 font-mono">1,000</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current usage:</span>
                    <span className="ml-2 font-mono text-accent">45/1,000</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full h-9 text-sm">
                Generate New API Key
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={handleSaveSettings} 
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 h-9"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
    </div>
  );
}
