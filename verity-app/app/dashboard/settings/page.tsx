"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, User, Mail, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUser(session.user);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return <div className="min-h-screen bg-background p-6"><div className="max-w-3xl mx-auto space-y-6"><Skeleton className="h-48" /><Skeleton className="h-48" /></div></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-lg z-40">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link href="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="font-semibold">Settings</span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <Card className="glass">
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />Account</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="mt-1" />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input value={user?.user_metadata?.full_name || ""} disabled className="mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />Security</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Switch disabled />
            </div>
            <Separator />
            <Link href="/reset-password">
              <Button variant="outline" size="sm">Change Password</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="glass border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sign Out</p>
                <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
