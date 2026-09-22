"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FloatingPathsBackground } from "@/components/ui/floating-paths";
import { auth } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await auth.signIn(email, password);
      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Please verify and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    setDemoLoading(true);
    try {
      await auth.signIn("researcher@verity.ai", "verity-research-2026");
      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to initialize demo session.");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <Card className="bg-white/[0.04] border-white/[0.08] backdrop-blur-2xl shadow-[0_8px_60px_-15px_rgba(0,0,0,0.8)]">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-center text-white text-base sm:text-lg font-semibold">Welcome Back</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400 text-xs py-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-white/70 text-xs sm:text-sm">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-white/30" />
              <Input
                id="email"
                type="email"
                placeholder="researcher@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-sky-500/50 focus:ring-sky-500/20 text-sm h-10"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-white/70 text-xs sm:text-sm">Password</Label>
              <Link
                href="/reset-password"
                className="text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-white/30" />
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-sky-500/50 focus:ring-sky-500/20 text-sm h-10"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-sky-500 hover:bg-sky-400 text-black font-semibold h-11 text-sm shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all"
            disabled={loading || demoLoading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            Sign In
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/[0.08]" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono">
            <span className="bg-black/80 px-2 text-white/40">Or quick access</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleDemoLogin}
          disabled={loading || demoLoading}
          className="w-full border-white/10 hover:bg-white/[0.06] text-white/80 h-10 text-xs gap-2"
        >
          {demoLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          )}
          Instant Demo Access
        </Button>

        <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-white/30 font-mono">
          <Shield className="w-3 h-3 text-sky-400/60" />
          <span>Grounded Evidence Infrastructure</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12 bg-black relative overflow-hidden">
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
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2 mb-3">
            <Image
              src="/logo.png"
              alt="VERITY"
              width={52}
              height={52}
              className="rounded-xl object-contain shadow-[0_0_25px_rgba(56,189,248,0.25)]"
              priority
            />
            <div>
              <span className="text-2xl font-bold text-white tracking-tight">VERITY</span>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-mono -mt-0.5">Evidence Engine</p>
            </div>
          </Link>
          <p className="text-white/50 text-xs sm:text-sm">Sign in to your research workspace</p>
        </div>

        <Suspense fallback={
          <div className="p-8 text-center text-white/40 text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading sign in...
          </div>
        }>
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs sm:text-sm text-white/40 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
