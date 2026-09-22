"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FloatingPathsBackground } from "@/components/ui/floating-paths";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black relative overflow-hidden">
      {/* Animated floating paths background */}
      <FloatingPathsBackground position={-0.5} className="absolute inset-0">
        <div />
      </FloatingPathsBackground>

      {/* Dark gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-sky-500/[0.02] via-transparent to-sky-500/[0.02] pointer-events-none" />

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3 mb-4">
            <Image
              src="/verity-logo.png"
              alt="VERITY"
              width={56}
              height={56}
              className="rounded-xl"
              priority
            />
            <div>
              <span className="text-2xl font-bold text-white tracking-tight">VERITY</span>
              <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-mono -mt-0.5">Evidence Engine</p>
            </div>
          </Link>
          <p className="text-white/40 text-sm">Sign in to your research workspace</p>
        </div>

        <Card className="bg-white/[0.03] border-white/[0.08] backdrop-blur-xl shadow-[0_8px_60px_-15px_rgba(0,0,0,0.8)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-white text-lg">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/60 text-sm">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-sky-500/50 focus:ring-sky-500/20"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/60 text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-sky-500/50 focus:ring-sky-500/20"
                    required
                    minLength={8}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-white/20 font-mono">
                  <Shield className="w-3 h-3" />
                  <span>256-bit encrypted</span>
                </div>
                <Link
                  href="/reset-password"
                  className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-sky-500 hover:bg-sky-400 text-black font-semibold py-5 shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-white/30 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
