"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle2, Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FloatingPathsBackground } from "@/components/ui/floating-paths";
import { createClient } from "@/lib/supabase";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordStrength = password.length >= 12 ? "Strong" : password.length >= 8 ? "Good" : password.length > 0 ? "Weak" : "";
  const strengthColor = password.length >= 12 ? "text-emerald-400" : password.length >= 8 ? "text-sky-400" : "text-amber-400";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black relative overflow-hidden">
        <FloatingPathsBackground position={0.5} className="absolute inset-0">
          <div />
        </FloatingPathsBackground>
        <motion.div
          className="w-full max-w-md text-center relative z-10"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">Check your email</h2>
          <p className="text-white/40 mb-8">
            We sent a confirmation link to <strong className="text-white/70">{email}</strong>.
            <br />
            Click the link to activate your account.
          </p>
          <Link href="/login">
            <Button className="bg-sky-500 hover:bg-sky-400 text-black font-semibold shadow-[0_0_20px_rgba(56,189,248,0.2)]">
              Go to Sign In
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black relative overflow-hidden">
      {/* Animated floating paths background */}
      <FloatingPathsBackground position={0.5} className="absolute inset-0">
        <div />
      </FloatingPathsBackground>

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
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
          <p className="text-white/40 text-sm">Create your research account</p>
        </div>

        <Card className="bg-white/[0.03] border-white/[0.08] backdrop-blur-xl shadow-[0_8px_60px_-15px_rgba(0,0,0,0.8)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-white text-lg">Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white/60 text-sm">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-white/30" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-sky-500/50 focus:ring-sky-500/20"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

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
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-sky-500/50 focus:ring-sky-500/20"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordStrength && (
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 w-8 rounded-full transition-all ${
                            password.length >= 8 && i <= (password.length >= 12 ? 3 : password.length >= 8 ? 2 : 1)
                              ? password.length >= 12
                                ? "bg-emerald-400"
                                : "bg-sky-400"
                              : "bg-white/10"
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-[11px] font-mono ${strengthColor}`}>{passwordStrength}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-white/20 font-mono">
                <Shield className="w-3 h-3" />
                <span>End-to-end encrypted · SOC 2 compliant</span>
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
                Create Account
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-white/30 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
