'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, User, Bell, Shield, Palette, Key, Save } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDashboard } from '@/components/dashboard-client-layout';

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
            className="bg-gradient-primary hover:opacity-90 h-9"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
    </div>
  );
}