'use client';

import SiteHeader from '@/components/site-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { users } from '@/lib/data';

export default function SettingsPage() {
  const { toast } = useToast();
  const currentUser = users[1]; // Mock current user

  const handleSaveChanges = (section: string) => {
    toast({
      title: 'Changes Saved',
      description: `Your ${section} have been updated.`,
    });
  };

  if (!currentUser) {
    return (
       <div className="flex min-h-screen w-full flex-col">
        <SiteHeader />
        <main className="flex-1 py-12 md:py-16">
          <div className="container px-4 md:px-6">
            <p>Please log in to see your settings.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <h1 className="text-3xl font-bold tracking-tight mb-8 font-headline">
            Settings
          </h1>
          <div className="grid gap-8">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Update your personal information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={currentUser.avatar} />
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Button variant="outline">Change Photo</Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue={currentUser.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={currentUser.email} />
                </div>
                <Button onClick={() => handleSaveChanges('profile settings')}>Save Changes</Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Manage your notification preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h4 className="font-medium">New Video Alerts</h4>
                    <p className="text-sm text-muted-foreground">
                      Get notified when a channel you follow posts a new video.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h4 className="font-medium">Breaking News</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts for major breaking news stories.
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h4 className="font-medium">Weekly Digest</h4>
                    <p className="text-sm text-muted-foreground">
                      A summary of top stories delivered to your inbox weekly.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button onClick={() => handleSaveChanges('notification settings')}>Save Changes</Button>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                  Manage your account settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium">Change Password</h4>
                  <div className="space-y-2 mt-2">
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </div>
                  <Button className="mt-4" onClick={() => handleSaveChanges('password')}>Update Password</Button>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium text-destructive">Delete Account</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Permanently delete your account and all of your content. This action is not reversible.
                  </p>
                  <Button variant="destructive" className="mt-4" onClick={() => handleSaveChanges('account deletion')}>
                    Delete My Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
